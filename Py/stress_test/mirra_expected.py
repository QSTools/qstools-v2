"""
Mirra v6.0 stress test - INDEPENDENT expected values, layer 1.

Written from CALCULATION_MAP_v6_0.txt (sections 1-6) and the trace node formula
texts, NOT by importing or porting the app's JavaScript. Statutory constants
(NZ break rules, KiwiSaver 3.5%, ESCT bands) are taken from the law as the app
records it; they are inputs, not formulas.

Layer 1 covers: Opening Hours, Labour (per person and totals), Assets
(interest and hours), General Overheads total, Cost Summary, Business Summary
and Revenue/COGS. Cost Allocation, Rate Builder and Business Outcome are later
layers.

Every function takes plain recipe-shaped dicts, so the same code is used by the
generator (to build the bottom-up P&L) and by the comparison step.
"""

from datetime import date

# ---------------------------------------------------------------- constants
WEEKS_PER_YEAR = 52
DEFAULT_ASSET_WEEKS = 48
EMPLOYER_KIWISAVER_RATE = 0.035          # from 1 April 2026
ESCT_BANDS = [(18720, 0.105), (64200, 0.175), (93720, 0.30), (216000, 0.33), (float("inf"), 0.39)]


def nz_paid_rest_minutes(day_hours):
    """Employment Relations Act ss 69ZD-69ZE: paid 10 min rest breaks."""
    def one(period):
        if period < 2:
            return 0
        if period <= 4:
            return 10
        if period <= 6:
            return 10
        return 20
    if day_hours <= 0:
        return 0
    total = one(min(day_hours, 8))
    if day_hours > 8:
        total += nz_paid_rest_minutes(day_hours - 8)
    return total


def esct_rate(base):
    for limit, rate in ESCT_BANDS:
        if base <= limit:
            return rate
    return ESCT_BANDS[-1][1]


# ---------------------------------------------------------------- opening hours (calc map s2)
def _hm(t):
    h, m = t.split(":")
    return int(h) * 60 + int(m)


def opening_hours(oh):
    days = oh["weekdays_open"]
    daily = (_hm(oh["close_time"]) - _hm(oh["open_time"]) - oh.get("break_minutes", 0)) / 60
    weekly = daily * len(days)
    annual_weeks = WEEKS_PER_YEAR - oh.get("seasonal_shutdown_weeks", 0)
    annual = weekly * annual_weeks
    net = annual - oh.get("public_holiday_days", 0) * daily
    return {"daily_open_hours": daily, "weekly_open_hours": weekly,
            "annual_open_weeks": annual_weeks, "net_annual_open_hours": net}


# ---------------------------------------------------------------- labour (calc map s3)
def labour_person(p):
    hpw = p["hours_per_week"]
    dpw = p["days_per_week"]
    rate = float(p["labour_rate"])
    paid = hpw * WEEKS_PER_YEAR
    daily = hpw / dpw if dpw else 0
    leave = (p["annual_leave_weeks"] * hpw
             + (p["public_holiday_days"] + p["sick_days"] + p["bereavement_days"] + p["family_violence_days"]) * daily)
    worked_days = (paid - leave) / daily if daily else 0
    breaks = worked_days * nz_paid_rest_minutes(daily) / 60
    non_prod_paid = leave + breaks
    productive_hours = (paid - non_prod_paid) * p["productivity_percent"] / 100
    is_productive = p["labour_class"] == "productive"
    gross = rate * paid
    ks = gross * EMPLOYER_KIWISAVER_RATE if p.get("employee_kiwisaver_enabled", True) else 0
    esct = ks * esct_rate(gross + ks) if p.get("employee_kiwisaver_enabled", True) else 0
    acc = gross * p["acc_rate"] / 100 if p.get("acc_enabled", True) else 0
    total = gross + ks + esct + acc
    return {
        "paid_hours": paid, "leave_hours": leave, "break_hours": breaks,
        "productive_hours": productive_hours,
        "recovery_hours": productive_hours if is_productive else 0,
        "gross_wages": gross, "employer_kiwisaver": ks, "esct": esct, "acc": acc,
        "total_labour_cost": total, "is_productive": is_productive,
    }


def expand_staff(recipe):
    """One dict per person: recipe row x headcount, with labour defaults applied."""
    people = []
    for row in recipe["staff"]:
        for i in range(row["headcount"]):
            p = dict(recipe["labour_defaults"])
            p.update({k: v for k, v in row.items() if k not in ("headcount",)})
            p["copy_index"] = i + 1
            people.append(p)
    return people


def labour_totals(people):
    rows = [labour_person(p) for p in people]
    by_type = {}
    for p, r in zip(people, rows):
        t = by_type.setdefault(p["staff_type_id"], {"hours": 0.0, "cost": 0.0, "count": 0, "productive": r["is_productive"]})
        t["hours"] += r["recovery_hours"] if r["is_productive"] else 0
        t["cost"] += r["total_labour_cost"]
        t["count"] += 1
    return {
        "people": rows,
        "total_people_cost_annual": sum(r["total_labour_cost"] for r in rows),
        "total_productive_output": sum(r["recovery_hours"] for r in rows),
        "gross_wages": sum(r["gross_wages"] for r in rows),
        "employer_kiwisaver": sum(r["employer_kiwisaver"] for r in rows),
        "esct": sum(r["esct"] for r in rows),
        "acc": sum(r["acc"] for r in rows),
        "by_staff_type": by_type,
    }


# ---------------------------------------------------------------- assets (calc map s5)
def asset_interest(a, as_of):
    price = a.get("purchase_price", 0) or 0
    rate = a.get("interest_rate", 0) or 0
    term = a.get("finance_term_years", 0) or 0
    if a.get("finance_paid_off") or not (price > 0 and rate > 0 and term > 0):
        return 0.0
    start = date.fromisoformat(a["finance_start_date"])
    elapsed = max(0, (as_of - start).days)
    progress = min(1.0, max(0.0, elapsed / (term * 365.25)))
    return price * (1 - progress) * rate / 100


def asset_expected(a, as_of, opening):
    weeks_override = a.get("annual_weeks_override")
    if weeks_override:
        weeks, source = weeks_override, "asset_override"
    elif opening and opening.get("annual_open_weeks"):
        weeks, source = opening["annual_open_weeks"], "opening_hours"
    else:
        weeks, source = DEFAULT_ASSET_WEEKS, "default_48"
    productive = a["asset_type"] == "productive"
    weekly = a.get("utilisation_hours_per_week", 40 if productive else 0) or 0
    hours = weekly * weeks if productive else 0
    interest = asset_interest(a, as_of)
    return {"asset_interest_annual": interest, "running_cost_annual": 0.0,
            "total_asset_cost_annual": interest, "utilisation_hours_annual": hours,
            "annual_weeks_used": weeks, "annual_weeks_source": source,
            "required_asset_recovery_rate": interest / hours if hours else 0.0}


def expand_assets(recipe):
    out = []
    for a in recipe["assets"]:
        for i in range(a.get("count", 1)):
            b = dict(a)
            b["copy_index"] = i + 1
            out.append(b)
    return out


# ---------------------------------------------------------------- general overheads (calc map s4)
def general_overheads(pnl_lines, assets_interest_total):
    """pnl_lines: generator P&L lines. Flagged interest rows are reduced by their
    share of the Assets interest total, floored at 0 (BO-7)."""
    go = [l for l in pnl_lines if l["category"] == "general_overheads"]
    flagged = [l for l in go if l.get("interest_treatment") == "contains_asset_finance_interest"]
    flagged_total = sum(float(l["amount"]) for l in flagged)
    total = 0.0
    for l in go:
        amt = float(l["amount"])
        if l in flagged and flagged_total > 0:
            amt = max(amt - amt / flagged_total * assets_interest_total, 0)
        total += amt
    # UNVERIFIED RULE (generalOverheadDefinitions.js, read not run): vehicle running
    # rows with no manual split auto-balance into an asset-related pool.
    asset_pool = sum(float(l["amount"]) for l in go if l.get("review_subcategory") == "vehicle_running_costs")
    return {"total_general_overheads": total, "total_asset_overhead_pool_amount": asset_pool}


# ---------------------------------------------------------------- layer 1 roll-up
def layer1(recipe, pnl_lines, as_of):
    oh = opening_hours(recipe["opening_hours"])
    people = expand_staff(recipe)
    lab = labour_totals(people)
    assets = [asset_expected(a, as_of, oh) for a in expand_assets(recipe)]
    asset_cost = sum(a["total_asset_cost_annual"] for a in assets)
    allocated_pool = 0.0           # Scenario A assigns no asset pools to assets
    go = general_overheads(pnl_lines, asset_cost)
    business_overheads = max(go["total_general_overheads"] - allocated_pool, 0)
    burden = lab["total_people_cost_annual"] + asset_cost + allocated_pool + business_overheads
    revenue = sum(float(l["amount"]) for l in pnl_lines if l["category"] == "revenue")
    cogs = sum(float(l["amount"]) for l in pnl_lines if l["category"] == "cogs")
    rec_hours = lab["total_productive_output"]
    nodes = {
        "labour.total_people_cost_annual": lab["total_people_cost_annual"],
        "labour.total_productive_output": rec_hours,
        "assets.total_asset_cost_annual": asset_cost,
        "assets.total_allocated_asset_overhead_cost_annual": allocated_pool,
        "assets.total_asset_recovery_cost_annual": asset_cost + allocated_pool,
        "general_overheads.total_general_overheads": go["total_general_overheads"],
        "general_overheads.total_asset_overhead_pool_amount": go["total_asset_overhead_pool_amount"],
        "cost_summary.total_people_cost_annual": lab["total_people_cost_annual"],
        "cost_summary.total_asset_cost_annual": asset_cost + allocated_pool,
        "cost_summary.total_business_overheads": business_overheads,
        "cost_summary.total_cost_burden": burden,
        "cost_summary.total_productive_output": rec_hours,
        "cost_summary.total_recovery_hours": rec_hours,
        "business_summary.total_cost_burden": burden,
        "business_summary.activity_driver_value": rec_hours,
        "business_summary.total_productive_output": rec_hours,
        "business_summary.required_recovery_per_driver": burden / rec_hours if rec_hours else 0,
        "revenue_cogs.total_revenue": revenue,
        "revenue_cogs.total_direct_costs": cogs,
        "revenue_cogs.margin_pool": revenue - cogs,
    }
    return {"as_of": as_of.isoformat(), "opening_hours": oh, "labour": lab,
            "assets": assets, "general_overheads": go, "nodes": nodes}


# ---------------------------------------------------------------- billed revenue (calc map s9.1, s9.3, update 2026-10-09)
def billed_revenue(recipe, as_of, charge_out):
    """What the recipe's rates bill for the hours the business really has, before materials.
    Asset-driven group: covered hours = min(required asset hours, assigned labour hours);
      required = SUM of asset hours if sequential, else MAX.
      labour revenue = covered x labour mix rate (sum(rate x hours) / sum(hours)).
      asset revenue  = machine rate x own asset hours x min(1, covered / required)  (per-asset calculator, machine only).
    Labour-driven group: each type's assigned hours x its charge-out rate.
    Non-productive types bill nothing."""
    oh = opening_hours(recipe["opening_hours"])
    people = expand_staff(recipe)
    pool = labour_totals(people)["by_staff_type"]
    asset_spec = {a["ref"]: a for a in recipe["assets"]}
    groups = []
    total = 0.0
    for g in recipe["groups"]:
        lab = [(t, pool[t]["hours"] * pct / 100) for t, pct in g["labour"] if pool[t]["productive"]]
        lab_hours = sum(h for _, h in lab)
        lab_charge = sum(charge_out.get(t, 0) * h for t, h in lab)
        assets = []
        for ref, pct in g["assets"]:
            a = asset_spec[ref]
            if a["asset_type"] != "productive":
                continue
            e = asset_expected(a, as_of, oh)
            for _ in range(a.get("count", 1)):
                assets.append((a, e["utilisation_hours_annual"] * pct / 100))
        if g["recovery_hour_source"] == "asset_hours" and assets:
            hrs = [h for _, h in assets]
            required = sum(hrs) if g.get("asset_run_pattern") == "sequential" else max(hrs)
            covered = min(required, lab_hours) if lab_hours > 0 else 0
            mix = lab_charge / lab_hours if lab_hours else 0
            labour_rev = covered * mix
            share = min(1.0, covered / required) if required else 0
            asset_rev = sum(a["machine_rate"] * h * share for a, h in assets)
        else:
            required = covered = lab_hours
            labour_rev, asset_rev = lab_charge, 0.0
        row = {"ref": g["ref"], "labour_hours": lab_hours, "required_asset_hours": required,
               "covered_hours": covered, "labour_revenue": labour_rev, "asset_revenue": asset_rev,
               "modelled_revenue": labour_rev + asset_rev, "has_assets": bool(assets)}
        if g["recovery_hour_source"] == "asset_hours" and assets:
            # Capacity coverage gap (calc map s9.9) and idle labour (D4), display-only figures.
            lab_cost = sum(pool[t]["cost"] * pct / 100 for t, pct in g["labour"] if pool[t]["productive"])
            gap = required - lab_hours
            idle = lab_hours - required if (g.get("labour_tied_to_asset") and lab_hours > required) else 0.0
            idle_cost = idle * lab_cost / lab_hours if lab_hours else 0.0
            if gap > 0:
                missing = 1 - covered / required
                gap_dollars = sum(a["machine_rate"] * h * missing for a, h in assets) + mix * (required - covered)
            elif gap < 0 and idle > 0:
                gap_dollars = idle_cost
            else:
                gap_dollars = None
            row.update({"capacity_gap_hours": gap, "idle_labour_hours": idle, "idle_labour_cost": idle_cost,
                        "capacity_gap_dollars": gap_dollars})
        groups.append(row)
        total += labour_rev + asset_rev
    return {"total": total, "groups": groups}
