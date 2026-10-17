"""
Mirra v6.0 stress test - recipe scaling (R2 step 2a, owner decision H2).

  scale_recipe(recipe, staff_total)  -> a new recipe with the same shape at a different headcount

Rules (owner decision H2, 2026-10-18):
  - The business grows by ADDING STAFF (and assets in the same proportion), not by cloning groups.
  - The app stores a labour assignment as a WHOLE-number percent of a staff type's pool. Where a split is uneven,
    the percents are rounded to whole numbers that sum to the type's original total (for example 34, 33, 33).
  - The scaled recipe holds exactly the stored values, so generate_business.py (the seed) and mirra_expected*.py
    (the expected values) read the same numbers and cannot drift apart.

Method for each staff type with new headcount N:
  1. people per group = largest-remainder apportionment of N across the groups, weighted by the base percents
  2. percent per group = people / N x 100 (may be fractional)
  3. stored percent = largest-remainder rounding of those to whole numbers summing to the type's base total
When the scale is an exact multiple of the base (10 -> 100 -> 1,000) the percents come out identical to the base.
"""

import copy


def apportion(weights, total):
    """Largest-remainder split of an integer `total` across `weights` (>= 0). Returns ints summing to total.
    Ties are broken by position, so the result is deterministic."""
    s = float(sum(weights))
    if s <= 0:
        raise ValueError("weights must have a positive sum")
    raw = [w / s * total for w in weights]
    out = [int(x) for x in raw]
    left = int(round(total)) - sum(out)
    order = sorted(range(len(weights)), key=lambda i: (-(raw[i] - out[i]), i))
    for i in order[:left]:
        out[i] += 1
    return out


def _scaled_counts(counts, new_total):
    """Integer counts summing to new_total, each at least 1, in proportion to `counts`."""
    n = len(counts)
    if new_total < n:
        raise ValueError(f"staff_total {new_total} is below the number of recipe rows ({n}); every row needs one person")
    out = apportion(counts, new_total)
    for i in range(n):                      # a row must keep at least one person: take it from the largest row
        while out[i] < 1:
            j = max(range(n), key=lambda k: out[k])
            out[j] -= 1
            out[i] += 1
    return out


def scale_recipe(recipe, staff_total, assets="scale"):
    if assets not in ("scale", "fixed"):
        raise ValueError('assets must be "scale" or "fixed"')
    base_staff = sum(r["headcount"] for r in recipe["staff"])
    if staff_total == base_staff:
        return recipe
    r = copy.deepcopy(recipe)
    factor = staff_total / base_staff

    # ---- staff headcounts
    new_counts = _scaled_counts([row["headcount"] for row in r["staff"]], staff_total)
    old_by_type, new_by_type = {}, {}
    for row, n in zip(r["staff"], new_counts):
        old_by_type[row["staff_type_id"]] = row["headcount"]
        new_by_type[row["staff_type_id"]] = n
        row["headcount"] = n

    # ---- assets in the same proportion (copies of each asset, at least one)
    base_assets = sum(a.get("count", 1) for a in r["assets"])
    if assets == "scale":
        new_assets = _scaled_counts([a.get("count", 1) for a in r["assets"]], max(len(r["assets"]), round(base_assets * factor)))
    else:  # "fixed": staff grow, the asset list stays as the recipe has it
        new_assets = [a.get("count", 1) for a in r["assets"]]
    for a, n in zip(r["assets"], new_assets):
        a["count"] = n

    # ---- repeated copies of an asset in one group must ADD their hours, or the group stops scaling.
    # "together" takes the MAX of the group's asset hours (calc map s9.3), so ten excavators would count as one.
    # "sequential" takes the SUM, which keeps every group quantity at exactly factor x the base.
    copies = {a["ref"]: a.get("count", 1) for a in r["assets"]}
    pattern_changes = []
    for g in r["groups"]:
        if sum(copies[ref] for ref, _p in g["assets"]) > 1 and g.get("asset_run_pattern") != "sequential":
            g["asset_run_pattern"] = "sequential"
            pattern_changes.append(g["ref"])

    # ---- labour percents: whole numbers, summing to each type's base total
    drift = []
    for t in new_by_type:
        refs = [(gi, li) for gi, g in enumerate(r["groups"]) for li, (tt, _p) in enumerate(g["labour"]) if tt == t]
        if not refs:
            continue
        base_pcts = [r["groups"][gi]["labour"][li][1] for gi, li in refs]
        type_total = sum(base_pcts)
        n = new_by_type[t]
        people_pool = round(type_total / 100 * n)          # people the groups use between them
        people = apportion(base_pcts, people_pool)
        exact = [p / n * 100 for p in people]
        stored = apportion(exact, int(round(type_total)))
        for (gi, li), pct, ex in zip(refs, stored, exact):
            r["groups"][gi]["labour"][li] = [t, pct]
            drift.append((r["groups"][gi]["ref"], t, ex, pct))

    r["recipe_id"] = f'{recipe["recipe_id"]}_n{staff_total}' + ("" if assets == "scale" else "_fixedassets")
    r["label"] = f'{recipe["label"]} (scaled to {staff_total} staff)'
    r["scaling"] = {
        "base_recipe_id": recipe["recipe_id"], "base_staff": base_staff, "staff_total": staff_total,
        "factor": factor, "run_pattern_set_to_sequential": pattern_changes, "assets_mode": assets, "assets_total": sum(new_assets),
        "max_percent_rounding": max((abs(ex - pct) for _g, _t, ex, pct in drift), default=0.0),
        "rounded_groups": [f"{g} {t}: {ex:.3f} -> {pct}" for g, t, ex, pct in drift if abs(ex - pct) > 1e-9],
    }
    return r


def load_recipe(path, staff_total=None, assets="scale"):
    import json
    recipe = json.load(open(path, encoding="utf-8"))
    return scale_recipe(recipe, staff_total, assets) if staff_total else recipe
