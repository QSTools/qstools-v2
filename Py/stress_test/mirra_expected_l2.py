"""
Mirra v6.0 stress test - INDEPENDENT expected values, layer 2.

Written from CALCULATION_MAP_v6_0.txt sections 7, 8 and 9 (and the trace-node formula texts for
node meaning), NOT by importing or porting the app's JavaScript. Layer 1 (mirra_expected.py) supplies
staff-type pools, asset costs and the cost summary; this file adds:

  Cost Allocation   group rows, overhead pool and its split across groups (map s7)
  Overhead split    labour/asset split of each group's overhead; Rate Builder per-staff-type overhead (s8, s9.2)
  Business Outcome  per-source labour and asset rows, true cost, materials (s9.1-9.3)
  Non-productive    pure-support pooling and spread (s9.4)
  Cascades          View A (s9.5) and View B (s9.6) real-capacity, outer and inner passes

Assumptions the map does not settle are listed in ASSUMPTIONS and written into the expected file, so
a mismatch can be read as "the app does something the map does not say" rather than silently patched.
Everything is a plain function of the recipe, so a second business is a new recipe file.

Not covered here (later): assumed-capacity / Best Case nodes, Business Modelling start rows, the
Rate Builder "all productive" row (map CM-2 RB-1b: a different basis).
"""

ASSUMPTIONS = [
    "A-1  Cost Allocation overhead pool = Cost Summary total_business_overheads (map s6/s7: overhead_absorbed_cost). "
    "Support-asset cost that is not assigned reaches the groups only through the F-4 spread (A-7).",
    "A-2  group_recovery_hours when asset hours drive: MIN(required_asset_hours, labour hours) if any labour is assigned "
    "(map s7, CM-9); with no labour assigned the MAX of the asset hours (the map does not say; not exercised by Scenario A).",
    "A-3  Business Outcome asset-row overhead share uses SUM of the group's asset-row hours as the denominator "
    "(map s9.2 says 'group asset hours'; Cost Allocation's own assigned_asset_hours is the MAX, which would over-allocate). "
    "Settled by Scenario A group G02 (two assets, sequential).",
    "A-4  The inner (per-source) cascade starts from each row's net profit LESS its non-productive share, and its shortfall is "
    "the group's outer deduction (naive group profit - final group profit). Map s9.5 says 'same two phases inside each group'.",
    "A-5  Cascade boundary nodes (real_capacity_a/b.cascade) are read as the shortfall each cascade absorbs. Inferred from the "
    "snapshot (0 and 0.01), not stated by the map.",
    "A-6  View A materials: revenue = real revenue - labour modelled - asset modelled (residual); true cost = COGS + max(business "
    "overheads - overhead assigned to groups, 0); profit floored at 0. View B materials is a peer at COGS x (1 + markup). "
    "Row modelled revenue is floored at 0 (CONFIRMED live 2026-10-17, misaligned A; owner decision F-5); the shortfall uses "
    "the unfloored residual.",
    "A-7  F-4 (owner decision 2026-10-25, built): support-asset cost not assigned to any working unit (total support-asset cost "
    "less the cost assigned across groups) is spread EVENLY across every group row and added to that group's non-productive asset "
    "cost. So Cost Allocation total = Cost Summary burden whenever every productive asset is assigned. An unassigned PRODUCTIVE "
    "asset is a blocking flag in the app, not spread; recipes must assign every productive asset.",
]


# ------------------------------------------------------------------ small helpers
def _cascade(items, shortfall):
    """Two-phase absorption of a shortfall (map s9.5).
    items: list of (key, naive_profit, revenue). Returns {key: final_profit}.
    Phase 1: each profitable item gives up profit pro-rata: factor = min(shortfall, sum of positive profit) / that sum.
    Phase 2: whatever is left is spread across ALL items by revenue share (equal if no revenue)."""
    shortfall = max(0.0, shortfall)
    pos = sum(max(n, 0.0) for _, n, _ in items)
    factor = min(shortfall, pos) / pos if pos > 0 else 0.0
    after1 = {k: n - factor * max(n, 0.0) for k, n, _ in items}
    left = shortfall - factor * pos
    rev_total = sum(r for _, _, r in items)
    out = {}
    for k, _, r in items:
        w = (r / rev_total) if rev_total > 0 else (1.0 / len(items) if items else 0.0)
        out[k] = after1[k] - left * w
    return out


def _split_overhead(overhead, labour_cost, asset_cost):
    """Map s9.2 / s8: labour pool = overhead x labour cost / (labour + asset cost); asset pool = the rest."""
    denom = labour_cost + asset_cost
    lab = overhead * labour_cost / denom if denom > 0 else overhead
    return lab, overhead - lab


# ------------------------------------------------------------------ main
def layer2(recipe, as_of, l1, charge_out, ids):
    """
    recipe     the recipe dict
    l1         mirra_expected.layer1(...) result (labour totals, per-asset expected, nodes)
    charge_out {staff_type_id: charge-out rate} (generator output)
    ids        {"group": {ref: id}, "asset": {ref: [id, ...]}}
    Returns {"nodes": {...}, "raw_checks": [...], "tolerances": {...}, "detail": {...}}
    """
    import mirra_expected as mx

    nodes, tol, raw, detail = {}, {}, [], {}
    pool_by_type = l1["labour"]["by_staff_type"]            # hours (productive only), cost, productive
    n = l1["nodes"]
    real_revenue = n["revenue_cogs.total_revenue"]
    cogs = n["revenue_cogs.total_direct_costs"]
    business_overheads = n["cost_summary.total_business_overheads"]
    markup = recipe["pnl"]["materials_markup_percent"] / 100
    policy = recipe.get("non_productive_policy", "charge_to_self")

    # ---- assets, in generator order, with the ids the seed gave them
    asset_specs = {a["ref"]: a for a in recipe["assets"]}
    per_asset = {}                                          # ref -> list of dicts (one per copy)
    flat_assets = mx.expand_assets(recipe)
    for a, e in zip(flat_assets, l1["assets"]):
        per_asset.setdefault(a["ref"], []).append({
            "id": ids["asset"][a["ref"]][a["copy_index"] - 1], "ref": a["ref"], "productive": a["asset_type"] == "productive",
            "cost": e["total_asset_cost_annual"], "hours": e["utilisation_hours_annual"], "machine_rate": a.get("machine_rate", 0)})
    for refs in per_asset.values():
        for a in refs:
            nodes[f'cost_allocation.asset.{a["id"]}'] = a["cost"]
    for t, p in pool_by_type.items():
        if p["productive"]:
            nodes[f"cost_allocation.labour_type.{t}"] = p["cost"]

    # ---- 1. group rows (Cost Allocation, map s7)
    rows = []
    for g in recipe["groups"]:
        labs = [(t, pct, pool_by_type[t]) for t, pct in g["labour"]]
        prod = [(t, pool_by_type[t]["hours"] * pct / 100, pool_by_type[t]["cost"] * pct / 100) for t, pct, _ in labs if pool_by_type[t]["productive"]]
        nonprod_labour_cost = sum(pool_by_type[t]["cost"] * pct / 100 for t, pct, _ in labs if not pool_by_type[t]["productive"])
        assets, nonprod_asset_cost = [], 0.0
        for ref, pct in g["assets"]:
            for a in per_asset[ref]:
                if a["productive"]:
                    assets.append({**a, "h": a["hours"] * pct / 100, "c": a["cost"] * pct / 100})
                else:
                    nonprod_asset_cost += a["cost"] * pct / 100
        lab_hours = sum(h for _, h, _ in prod)
        lab_cost = sum(c for _, _, c in prod)
        asset_burden = sum(a["c"] for a in assets)
        asset_hours_max = max((a["h"] for a in assets), default=0.0)
        sequential = g.get("asset_run_pattern") == "sequential"
        required = (sum(a["h"] for a in assets) if sequential else asset_hours_max)
        asset_driven = g["recovery_hour_source"] == "asset_hours" and bool(assets)
        if asset_driven:
            recovery = min(required, lab_hours) if lab_hours > 0 else asset_hours_max           # A-2
        else:
            recovery = lab_hours
        tied = bool(g.get("labour_tied_to_asset"))
        rows.append({"ref": g["ref"], "gid": ids["group"][g["ref"]], "prod_labour": prod, "lab_hours": lab_hours, "lab_cost": lab_cost,
                     "assets": assets, "asset_burden": asset_burden, "asset_hours_max": asset_hours_max, "required": required,
                     "asset_driven": asset_driven, "recovery": recovery, "np_labour": nonprod_labour_cost, "np_asset": nonprod_asset_cost,
                     "tied": tied})

    # F-4 spread (A-7): unassigned support-asset cost, split evenly across all group rows
    total_support_cost = sum(a["cost"] for refs in per_asset.values() for a in refs if not a["productive"])
    assigned_support_cost = sum(r["np_asset"] for r in rows)
    unassigned_support = max(0.0, total_support_cost - assigned_support_cost)
    spread_each = unassigned_support / len(rows) if (rows and unassigned_support > 0.005) else 0.0
    for r in rows:
        r["np_asset_spread"] = spread_each
        r["np_asset"] += spread_each

    # overhead pool and its distribution (map s7: recovered hours, else labour cost, else asset burden, else equal)
    pool = business_overheads                                                                  # A-1
    nodes["cost_allocation.overhead_pool"] = pool
    if any(r["recovery"] > 0 for r in rows):
        basis = [r["recovery"] for r in rows]
    elif any(r["lab_cost"] > 0 for r in rows):
        basis = [r["lab_cost"] for r in rows]
    elif any(r["asset_burden"] > 0 for r in rows):
        basis = [r["asset_burden"] for r in rows]
    else:
        basis = [1.0 for _ in rows]
    total_basis = sum(basis)
    for r, b in zip(rows, basis):
        r["overhead"] = pool * b / total_basis if total_basis else 0.0
        r["total_cost"] = r["lab_cost"] + r["asset_burden"] + r["overhead"] + r["np_labour"] + r["np_asset"]
        r["cost_per_hour"] = r["total_cost"] / r["recovery"] if r["recovery"] > 0 else 0.0
        r["gap_hours_ca"] = max(0.0, r["required"] - r["lab_hours"]) if r["asset_driven"] else 0.0
        r["idle_hours"] = (r["lab_hours"] - r["required"]) if (r["tied"] and r["asset_driven"] and r["lab_hours"] > r["required"]) else 0.0
        nodes[f'cost_allocation.group.{r["gid"]}.total_group_cost'] = r["total_cost"]
        nodes[f'cost_allocation.group.{r["gid"]}.group_cost_per_hour'] = r["cost_per_hour"]
        tol[f'cost_allocation.group.{r["gid"]}.group_cost_per_hour'] = 0.005
        rec = r["recovery"]
        checks = {"assigned_labour_cost": r["lab_cost"], "assigned_labour_hours": r["lab_hours"],
                  "assigned_asset_burden": r["asset_burden"], "assigned_asset_hours": r["asset_hours_max"],
                  "assigned_non_productive_labour_cost": r["np_labour"], "assigned_non_productive_asset_cost": r["np_asset"],
                  "assigned_overhead_amount": r["overhead"], "total_group_cost": r["total_cost"],
                  "group_recovery_hours": rec, "required_asset_hours": r["required"],
                  "labour_coverage_gap_hours": r["gap_hours_ca"], "group_cost_per_hour": r["cost_per_hour"]}
        rates = {"labour_recovery_rate": r["lab_cost"] / rec if rec > 0 else 0.0,
                 "asset_recovery_rate": r["asset_burden"] / rec if rec > 0 else 0.0,
                 "overhead_recovery_rate": r["overhead"] / rec if rec > 0 else 0.0}
        for field, v in checks.items():
            raw.append({"path": ["operational_group_cost_rows", {"group_id": r["gid"]}, field], "expected": v,
                        "tol": 0.005 if field == "group_cost_per_hour" else None, "label": f'{r["ref"]}.{field}'})
        for field, v in rates.items():
            raw.append({"path": ["operational_group_cost_rows", {"group_id": r["gid"]}, field], "expected": v, "tol": 0.005,
                        "label": f'{r["ref"]}.{field}'})
    raw.append({"path": ["overhead_pool", "available_overhead_cost"], "expected": pool, "tol": None, "label": "overhead_pool.available"})
    raw.append({"path": ["total_grouped_operating_cost"], "expected": sum(r["total_cost"] for r in rows), "tol": None,
                "label": "total_grouped_operating_cost"})

    # ---- 2. overhead split inside each group, and Rate Builder per staff type (map s8 RB-1, s9.2)
    for r in rows:
        r["lab_pool"], r["asset_pool"] = _split_overhead(r["overhead"], r["lab_cost"], r["asset_burden"])
    rb = {}
    for r in rows:
        for t, h, c in r["prod_labour"]:
            share = r["lab_pool"] * h / r["lab_hours"] if r["lab_hours"] > 0 else 0.0
            d = rb.setdefault(t, {"hours": 0.0, "cost": 0.0, "overhead": 0.0, "groups": {}})
            d["hours"] += h; d["cost"] += c; d["overhead"] += share
            d["groups"][r["gid"]] = (h, c, share)
    # Dollar amounts below use the default rule max($1, 0.01%): owner decision F-6 (2026-10-18), cents at scale are not
    # a concern. Rates per hour keep their tight tolerances.
    for t, d in rb.items():
        cost_rate = pool_by_type[t]["cost"] / pool_by_type[t]["hours"]
        oh_rate = d["overhead"] / d["hours"] if d["hours"] else 0.0
        nodes[f"rate_builder.labour_rate.{t}"] = cost_rate + oh_rate
        tol[f"rate_builder.labour_rate.{t}"] = 0.011
        raw.append({"path": ["rate_builder_labour_recovery_rows", {"staff_type_id": t}, "assigned_overhead_amount"], "expected": d["overhead"], "tol": None, "label": f"RB {t} overhead $"})
        raw.append({"path": ["rate_builder_labour_recovery_rows", {"staff_type_id": t}, "assigned_labour_cost"], "expected": d["cost"], "tol": None, "label": f"RB {t} labour cost"})
        raw.append({"path": ["rate_builder_labour_recovery_rows", {"staff_type_id": t}, "allocated_business_overhead_recovery_rate"], "expected": oh_rate, "tol": 0.006, "label": f"RB {t} overhead $/h"})
        for gid, (h, c, share) in d["groups"].items():
            raw.append({"path": ["rate_builder_labour_recovery_rows", {"staff_type_id": t}, "source_group_rows", {"group_id": gid}, "assigned_overhead_amount"],
                        "expected": share, "tol": None, "label": f"RB {t} in {gid[:8]}"})

    # ---- 3. Business Outcome per-source rows (map s9.1-9.3)
    for r in rows:
        r["covered"] = (min(r["required"], r["lab_hours"]) if r["lab_hours"] > 0 else 0.0) if r["asset_driven"] else r["recovery"]
        r["productive_group"] = (r["lab_cost"] > 0 or r["asset_burden"] > 0)
        r["src"] = []                                       # one dict per labour row / asset row
        if not r["productive_group"]:
            continue
        for t, h, c in r["prod_labour"]:
            rev_hours = r["covered"] * h / r["lab_hours"] if r["asset_driven"] and r["lab_hours"] > 0 else h
            oh = r["lab_pool"] * h / r["lab_hours"] if r["lab_hours"] > 0 else 0.0
            modelled = charge_out.get(t, 0) * rev_hours
            true_cost = c + oh
            r["src"].append({"kind": "labour", "key": t, "id": f'business_outcome.labour_source.{r["gid"]}.{t}', "modelled": modelled,
                             "true_cost": true_cost, "net": modelled - true_cost, "overhead": oh, "hours": rev_hours})
        asset_hours_sum = sum(a["h"] for a in r["assets"])
        for a in r["assets"]:
            oh = r["asset_pool"] * a["h"] / asset_hours_sum if asset_hours_sum > 0 else 0.0            # A-3
            take = min(1.0, r["covered"] / r["required"]) if r["required"] > 0 else 0.0
            modelled = a["machine_rate"] * a["h"] * take
            true_cost = a["c"] + oh
            r["src"].append({"kind": "asset", "key": a["id"], "id": f'business_outcome.asset_source.{r["gid"]}.{a["id"]}', "modelled": modelled,
                             "true_cost": true_cost, "net": modelled - true_cost, "overhead": oh, "hours": a["h"]})
        r["modelled"] = sum(s["modelled"] for s in r["src"])
        r["net"] = sum(s["net"] for s in r["src"])
        r["true_cost"] = sum(s["true_cost"] for s in r["src"])
        nodes[f'business_outcome.group.{r["gid"]}.modelled_revenue'] = r["modelled"]
        nodes[f'business_outcome.group.{r["gid"]}.net_profit'] = r["net"]
        for s in r["src"]:
            nodes[f'{s["id"]}.modelled_revenue'] = s["modelled"]
            nodes[f'{s["id"]}.net_profit'] = s["net"]

    productive_rows = [r for r in rows if r["productive_group"]]
    labour_modelled = sum(s["modelled"] for r in productive_rows for s in r["src"] if s["kind"] == "labour")
    asset_modelled = sum(s["modelled"] for r in productive_rows for s in r["src"] if s["kind"] == "asset")

    # materials (A-6)
    residual_overhead = business_overheads - sum(r["overhead"] for r in rows)
    mat_true = cogs + max(residual_overhead, 0.0)
    mat_a_revenue = real_revenue - labour_modelled - asset_modelled
    mat_b_revenue = cogs * (1 + markup)
    # The ROW shows revenue floored at 0 (materials can't go negative; owner 2026-10-17, F-5). The View A shortfall
    # below still uses the unfloored residual, so labour/asset over-claim is pushed onto the groups.
    nodes["business_outcome.materials.modelled_revenue"] = max(mat_a_revenue, 0.0)
    nodes["business_outcome.materials.net_profit"] = max(mat_a_revenue, 0.0) - mat_true
    nodes["business_outcome.materials.view_b_net_profit"] = mat_b_revenue - mat_true

    # ---- 4. non-productive distribution (map s9.4)
    own_np = {r["gid"]: r["np_labour"] + r["np_asset"] for r in rows}
    pure_support = [r for r in rows if not r["productive_group"]]
    mixed_pooled = [r for r in productive_rows if policy == "spread_as_overhead" and own_np[r["gid"]] > 0]
    np_pool = sum(own_np[r["gid"]] for r in pure_support) + sum(own_np[r["gid"]] for r in mixed_pooled)
    recipients = productive_rows
    if any(r["recovery"] > 0 for r in recipients):
        w = {r["gid"]: r["recovery"] for r in recipients}
    elif any(r["lab_cost"] > 0 for r in recipients):
        w = {r["gid"]: r["lab_cost"] for r in recipients}
    else:
        w = {r["gid"]: r["asset_burden"] for r in recipients}
    w_total = sum(w.values())
    for r in productive_rows:
        spread = np_pool * w[r["gid"]] / w_total if w_total > 0 else 0.0
        keep = 0.0 if r in mixed_pooled else own_np[r["gid"]]                                  # charge_to_self keeps its own
        r["np_cost"] = spread + keep
        nodes[f'business_outcome.group.{r["gid"]}.non_productive_cost'] = r["np_cost"]
    nodes["business_outcome.non_productive_distribution.pool"] = np_pool
    for r in pure_support:
        nodes[f'business_outcome.non_productive_distribution.pure_support.{r["gid"]}'] = own_np[r["gid"]]

    # ---- 5. View A real-capacity cascade (map s9.5) and View B (s9.6)
    def inner(group, final_group):
        """Row-level pass (A-4). Returns {row id: final profit}."""
        mod = group["modelled"]
        out = {}
        for s in group["src"]:
            s["np_share"] = group["np_cost"] * s["modelled"] / mod if mod > 0 else group["np_cost"] / len(group["src"])
        items = [(s["id"], s["net"] - s["np_share"], s["modelled"]) for s in group["src"]]
        naive_group = sum(x for _, x, _ in items)
        return _cascade(items, naive_group - final_group)

    outer_items = []
    for r in productive_rows:
        r["naive"] = r["modelled"] - (r["true_cost"] + r["np_cost"])
        outer_items.append((r["gid"], r["naive"], r["modelled"]))

    # View A
    shortfall_a = max(0.0, mat_true - mat_a_revenue)
    final_a = _cascade(outer_items, shortfall_a)
    nodes["business_outcome.real_capacity_a.cascade"] = shortfall_a
    for r in productive_rows:
        nodes[f'business_outcome.group.{r["gid"]}.real_capacity_net_profit'] = final_a[r["gid"]]
        for sid, v in inner(r, final_a[r["gid"]]).items():
            nodes[f"{sid}.real_capacity_net_profit"] = v
    nodes["business_outcome.materials.real_capacity_net_profit"] = max(mat_a_revenue, mat_true) - mat_true

    # View B: materials is a peer, shortfall is global
    modelled_all = sum(r["modelled"] for r in productive_rows) + mat_b_revenue
    shortfall_b = max(0.0, modelled_all - real_revenue)
    surplus_b = max(0.0, real_revenue - modelled_all)
    items_b = outer_items + [("materials", mat_b_revenue - mat_true, mat_b_revenue)]
    final_b = _cascade(items_b, shortfall_b)
    nodes["business_outcome.real_capacity_b.cascade"] = shortfall_b
    for r in productive_rows:
        nodes[f'business_outcome.group.{r["gid"]}.view_b_real_capacity_net_profit'] = final_b[r["gid"]]
        for sid, v in inner(r, final_b[r["gid"]]).items():
            nodes[f"{sid}.view_b_real_capacity_net_profit"] = v
    nodes["business_outcome.materials.view_b_real_capacity_net_profit"] = final_b["materials"]

    detail = {
        "overhead_pool": pool, "residual_overhead": residual_overhead, "materials_true_cost": mat_true,
        "materials_view_a_revenue": mat_a_revenue, "materials_view_b_revenue": mat_b_revenue,
        "shortfall_view_a": shortfall_a, "shortfall_view_b": shortfall_b, "surplus_view_b": surplus_b,
        "non_productive_pool": np_pool, "assumptions": ASSUMPTIONS, "groups": {},
        "f4_unassigned_support_asset_cost": unassigned_support, "f4_spread_per_group": spread_each,
    }
    for r in rows:
        detail["groups"][r["ref"]] = {
            "recovery_hours": r["recovery"], "overhead": r["overhead"], "labour_pool": r["lab_pool"],
            "asset_pool": r["asset_pool"], "total_group_cost": r["total_cost"], "np_cost": r.get("np_cost"),
            "rows": [{"id": s["id"], "true_cost": s["true_cost"], "overhead_share": s["overhead"],
                      "modelled": s["modelled"], "net": s["net"]} for s in r["src"]]}
    return {"nodes": nodes, "raw_checks": raw, "tolerances": tol, "detail": detail}
