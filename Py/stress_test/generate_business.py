"""
Mirra v6.0 stress test - synthetic business generator.

  python generate_business.py recipes/scenario_a.json --as-of 2026-10-17 --out <folder>

Reads a recipe (about ten decisions), builds the whole business deterministically
and writes three files into --out:
  seed_<id>.json        localStorage seed for the isolated instance (:3004 only)
  expected_<id>.json    independent expected values (mirra_expected.py), keyed by trace node id
  review_<id>.xlsx      readable record of what was built, for the owner to check

Same recipe + same --as-of = byte-identical output (IDs are uuid5 of the refs).
--as-of matters because asset interest is dated to the day the app runs (calc map s5).

Storage shapes follow STORAGE_KEY_REGISTER_S0_2026-10-17.txt. Hazards honoured:
  H3  no assigned_hours / assigned_cost on assignment rows
  H4  active assignment rows only
  H8  seed is loaded with the loader script, which clears and reloads
"""

import argparse
import json
import math
import os
import uuid
from datetime import date

import mirra_expected as mx

NS = uuid.UUID("7d1c3a52-1f0e-4b5e-9a57-0c1d6f2e9a11")
STAFF_TYPE_NAMES = {
    "owner_director": "Owner / Director", "manager": "Manager",
    "supervisor_team_lead": "Supervisor / Team Lead",
    "senior_operator_staff": "Senior Operator / Senior Staff",
    "operator_delivery_staff": "Operator / Delivery Staff", "junior_trainee": "Junior / Trainee",
    "admin_support": "Administration / Support", "sales_customer_support": "Sales / Customer Support",
    "finance_accounts": "Finance / Accounts", "other_review_required": "Other / Review required",
}
DIRECT_COST_CATEGORIES = [
    ("materials", "Materials"), ("subcontract_labour", "Subcontract labour"),
    ("subcontracting_general", "Subcontracting - General"), ("hired_equipment_plant", "Hired equipment / plant"),
    ("freight_cartage", "Freight / cartage"), ("waste_tipping", "Waste / tipping"),
    ("direct_consumables", "Direct consumables"), ("other_direct_costs", "Other direct costs"),
    ("review_required", "Review required"),
]
DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]


def uid(recipe_id, *parts):
    return str(uuid.uuid5(NS, "|".join([recipe_id, *map(str, parts)])))


def r2(x):
    return round(float(x) + 0.0, 2)


def build(recipe, as_of):
    rid = recipe["recipe_id"]
    ts = f"{as_of.isoformat()}T00:00:00.000Z"
    keys = {}

    # -------- business setup, revenue/cogs, policies
    keys["qs_tools_business_setup_v1"] = {
        "business_name": recipe["label"], "business_type": recipe["business_type"],
        "setup_completed": True, "created_at": ts, "updated_at": ts}
    keys["qs_tools_revenue_cogs_state_v2"] = {
        "commercial_driver_mode": "hours_based", "units_sold_annual": 0,
        "unit_driver_rows": [{"id": "unit-driver-1", "unit_label": "Primary unit", "unit_type": "each",
                              "revenue_share_percent": 100, "average_sale_rate_per_unit": 0, "estimated_units_annual": 0}],
        "created_at": ts, "updated_at": ts}
    keys["qstools_business_outcome_non_productive_policy_v1"] = {
        "mixed_unit_non_productive_policy": recipe.get("non_productive_policy", "charge_to_self")}
    keys["qs_tools_business_modelling_levers_v1"] = {"version": 1, "levers": {}}
    keys["qstools_rate_builder_materials_markup_v1"] = {
        "materials_markup_percent": recipe["pnl"]["materials_markup_percent"]}

    # -------- opening hours
    oh = recipe["opening_hours"]
    keys["mirra_opening_hours_state_v4"] = {
        "opening_hours_profile_id": "default_opening_hours_profile",
        "opening_hours_profile_name": "Default Opening Hours", "profile_version": 1,
        "effective_from": "", "is_active": True,
        "standard_week_days": [{
            "day_id": d, "day_name": d.capitalize(), "is_open": d in oh["weekdays_open"],
            "open_time": oh["open_time"] if d in oh["weekdays_open"] else "",
            "close_time": oh["close_time"] if d in oh["weekdays_open"] else "",
            "break_minutes": oh.get("break_minutes", 0) if d in oh["weekdays_open"] else 0} for d in DAYS],
        "seasonal_shutdown_weeks": oh.get("seasonal_shutdown_weeks", 0),
        "public_holiday_days": oh.get("public_holiday_days", 0),
        "additional_closed_days": [], "calendar_notes": "", "created_at": ts, "updated_at": ts}

    # -------- staff (one profile per person, no names)
    people = mx.expand_staff(recipe)
    profiles = []
    for p in people:
        sid = uid(rid, "staff", p["ref"], p["copy_index"])
        productive = p["labour_class"] == "productive"
        data = {
            "staff_id": sid, "staff_name": f'{p["ref"]}-{p["copy_index"]:03d}',
            "staff_role": STAFF_TYPE_NAMES[p["staff_type_id"]],
            "staff_type_id": p["staff_type_id"], "staff_type_name": STAFF_TYPE_NAMES[p["staff_type_id"]],
            "labour_class": p["labour_class"], "contributes_to_recovery_hours": productive,
            "hours_per_week": p["hours_per_week"], "days_per_week": p["days_per_week"],
            "labour_rate": p["labour_rate"], "charge_out_rate": 0,
            "productivity_percent": p["productivity_percent"], "margin_target_percent": 20,
            "annual_leave_weeks": p["annual_leave_weeks"], "public_holiday_days": p["public_holiday_days"],
            "sick_days": p["sick_days"], "bereavement_days": p["bereavement_days"],
            "family_violence_days": p["family_violence_days"],
            "employee_kiwisaver_enabled": p["employee_kiwisaver_enabled"],
            "acc_enabled": p["acc_enabled"], "acc_bic_code": "", "acc_bic_description": "",
            "acc_cu_code": "", "acc_cu_description": "", "acc_rate": p["acc_rate"],
            "acc_manual_override_enabled": False, "acc_manual_rate": 0,
            "effective_from": ts, "change_reason": "", "notes": f"stress test {rid}",
        }
        profiles.append({"profile_id": sid, "staff_id": sid, "profile_version": 1, "effective_from": ts,
                         "is_active": True, "created_at": ts, "updated_at": ts, "change_reason": "",
                         "notes": f"stress test {rid}", "data": data})
    keys["qs_tools_labour_profiles_v1"] = profiles
    keys["qs_tools_labour_staff_types_v1"] = []

    # charge-out per staff type (productive types only)
    mult, step = recipe["charge_out_multiplier"], recipe.get("charge_out_round_to", 1)
    charge_out = {}
    for row in recipe["staff"]:
        if row["labour_class"] == "productive":
            charge_out[row["staff_type_id"]] = max(charge_out.get(row["staff_type_id"], 0),
                                                   step * round(row["labour_rate"] * mult / step))
    keys["qstools_rate_builder_labour_source_rates_v1"] = charge_out

    # -------- assets
    oh_exp = mx.opening_hours(oh)
    asset_list = mx.expand_assets(recipe)
    saved_assets = []
    asset_ids = {}
    for a in asset_list:
        aid = uid(rid, "asset", a["ref"], a["copy_index"])
        asset_ids.setdefault(a["ref"], []).append(aid)
        productive = a["asset_type"] == "productive"
        weekly = a.get("utilisation_hours_per_week", 40 if productive else 0) if productive else 0
        rec = {
            "asset_id": aid, "owner_scope_id": "", "asset_name": f'{a["ref"]}-{a["copy_index"]:03d} {a["label"]}',
            "asset_type": a["asset_type"], "scheduled_hours_per_week": weekly, "downtime_hours_per_week": 0,
            "utilisation_hours_per_week": weekly, "utilisation_hours_annual": 0,
            "purchase_price": a.get("purchase_price", 0), "linked_register_asset_number": "",
            "purchase_price_locked": False, "estimated_annual_depreciation": None,
            "include_depreciation_in_cost": False, "interest_rate": a.get("interest_rate", 0),
            "finance_start_date": a.get("finance_start_date", ""), "finance_term_years": a.get("finance_term_years", 0),
            "finance_paid_off": bool(a.get("finance_paid_off", False)), "finance_paid_off_date": "",
            "early_payoff_amount": 0, "early_payoff_notes": "", "finance_term_extended": False,
            "original_finance_end_date": "", "revised_finance_end_date": "", "revised_term_months": 0,
            "extension_reason": "",
            # Running costs stay 0: the app hard-codes asset running cost to 0 (A1); they are in the P&L instead.
            "maintenance_cost_monthly": 0, "fuel_cost_monthly": 0, "registration_cost_monthly": 0,
            "other_running_cost_monthly": 0, "assets_benchmark_total": 0, "no_active_assets_confirmed": False,
            "profile_version": 1, "effective_from": ts, "is_active": True, "is_retired": False,
            "created_at": ts, "updated_at": ts, "change_reason": "", "notes": f"stress test {rid}",
            "asset_annual_weeks_override": a.get("annual_weeks_override") or 0,
            "asset_overhead_pool_assignments": {
                "asset_fuel_pool": 0, "asset_insurance_pool": 0, "asset_repairs_maintenance_pool": 0,
                "asset_registration_compliance_pool": 0, "asset_consumables_pool": 0,
                "asset_finance_interest_pool": 0},
        }
        saved_assets.append(rec)
    keys["qs_tools_saved_assets"] = saved_assets
    keys["qs_tools_asset_state"] = dict(saved_assets[0]) if saved_assets else {}

    # -------- cost allocation
    type_class = {r["staff_type_id"]: r["labour_class"] for r in recipe["staff"]}
    type_count = {}
    for p in people:
        type_count[p["staff_type_id"]] = type_count.get(p["staff_type_id"], 0) + 1
    groups, lab_assign, asset_assign = [], [], []
    group_ids = {}
    for order, g in enumerate(recipe["groups"], 1):
        gid = uid(rid, "group", g["ref"])
        group_ids[g["ref"]] = gid
        groups.append({
            "group_id": gid, "division_id": "main_operations", "group_name": f'{g["ref"]} {g["label"]}',
            "group_description": "", "required_asset_ids": [], "required_staff_ids": [], "required_staff_count": 0,
            "is_active": True, "sort_order": order, "created_at": ts, "updated_at": ts,
            "group_recovery_hour_source": g["recovery_hour_source"],
            "asset_run_pattern": "sequential" if g.get("asset_run_pattern") == "sequential" else "",
            "labour_tied_to_asset": bool(g.get("labour_tied_to_asset", False))})
        for t, pct in g["labour"]:
            if pct != int(pct):
                raise ValueError(f"{g['ref']} {t}: {pct}% is not a whole number (app rounds, register H2)")
            productive = type_class[t] == "productive"
            aid_ = uid(rid, "labour_assign", g["ref"], t)
            lab_assign.append({
                "assignment_id": aid_, "labour_group_assignment_id": aid_, "group_id": gid,
                "staff_type_id": t, "labour_type_id": t, "labour_type_key": t,
                "labour_type_label": STAFF_TYPE_NAMES[t], "labour_class": "productive" if productive else "support",
                "is_productive": productive, "contributes_to_recovery_hours": productive,
                "assigned_staff_count": type_count[t], "assignment_percent": int(pct),
                "is_active": True, "created_at": ts, "updated_at": ts})
        for ref, pct in g["assets"]:
            for i, asset_id in enumerate(asset_ids[ref], 1):
                asset_assign.append({
                    "assignment_id": uid(rid, "asset_assign", g["ref"], ref, i), "group_id": gid,
                    "asset_id": asset_id, "assignment_percent": int(pct), "is_active": True,
                    "created_at": ts, "updated_at": ts})
    keys["qs_tools_cost_allocation_v2_1"] = {
        "active_allocation_profile_id": uid(rid, "allocation"), "allocation_profile_name": recipe["label"],
        "effective_from": ts,
        "divisions": [{"division_id": "main_operations", "division_name": "Main Operations",
                       "division_description": "Default operating division", "is_active": True, "sort_order": 1,
                       "created_at": ts, "updated_at": ts}],
        "asset_labour_links": [], "operational_groups": groups,
        "labour_group_assignments": lab_assign, "asset_group_assignments": asset_assign,
        "overhead_group_assignments": [], "external_delivery_enabled": False, "external_delivery_note": ""}

    # -------- rate builder: one machine-only calculator per productive asset (Path B)
    calcs = []
    for g in recipe["groups"]:
        for ref, _pct in g["assets"]:
            spec = next(a for a in recipe["assets"] if a["ref"] == ref)
            if spec["asset_type"] != "productive":
                continue
            for i, asset_id in enumerate(asset_ids[ref], 1):
                cid = uid(rid, "calc", g["ref"], ref, i)
                calcs.append({"id": cid, "name": f'{g["ref"]} - {ref}-{i:03d} {spec["label"]} calculator',
                              "linked_cost_allocation_group_id": group_ids[g["ref"]], "linked_asset_id": asset_id,
                              "lines": [{"id": uid(rid, "line", cid), "name": f'{spec["label"]} hire', "unit": "hr",
                                         "rate": spec["machine_rate"], "quantity": 1, "is_output_driver": True}]})
    keys["qs_tools_rate_builder_calculators_v1"] = calcs

    # -------- P&L, built bottom-up from the independent labour and asset figures
    lab = mx.labour_totals(people)
    interest_total = sum(mx.asset_interest(a, as_of) for a in asset_list)
    pnl = recipe["pnl"]
    labour_pnl = lab["gross_wages"] + lab["employer_kiwisaver"] + (lab["esct"] if pnl["kiwisaver_line_includes_esct"] else 0) + lab["acc"]
    basis = pnl.get("revenue_basis", "billed_from_rates")
    billed = mx.billed_revenue(recipe, as_of, charge_out)
    if basis == "billed_from_rates":
        # Revenue built from the inputs: rates x real hours, plus materials sold at the markup.
        # Materials COGS is a share of revenue, so solve R = billed + COGS x (1 + markup), COGS = m x R.
        m = pnl["materials_percent_of_revenue"] / 100
        markup = pnl["materials_markup_percent"] / 100
        revenue = billed["total"] / (1 - m * (1 + markup)) * pnl.get("billing_realisation_percent", 100) / 100
    else:  # "target_margin": the earlier method, kept for the misaligned scenario
        free = 1 - (pnl["target_net_margin_percent"] + pnl["materials_percent_of_revenue"] + pnl["overhead_percent_of_revenue"]) / 100
        revenue = (labour_pnl + interest_total) / free
    weights_total = sum(w for _, _, w in pnl["overhead_lines"])

    def line(name, amount, section, category, sub="", dcc="", interest="not_reviewed"):
        return {"pnl_line_id": uid(rid, "pnl", name), "line_name": name, "amount": r2(amount),
                "section": section, "category": category, "interest_treatment": interest,
                "review_subcategory": sub, "direct_cost_category_id": dcc,
                "source_type": "stress_test", "import_source": "stress_test"}

    lines = [line("Sales", revenue, "trading_income", "revenue"),
             line("Materials", revenue * pnl["materials_percent_of_revenue"] / 100, "cost_of_sales", "cogs", "", "materials"),
             line("Salary & Wages", lab["gross_wages"], "operating_expenses", "labour", "salary_wages"),
             line("KiwiSaver Employer Contributions",
                  lab["employer_kiwisaver"] + (lab["esct"] if pnl["kiwisaver_line_includes_esct"] else 0),
                  "operating_expenses", "labour", "employer_kiwisaver"),
             line("ACC Levy", lab["acc"], "operating_expenses", "labour", "employer_acc")]
    for name, sub, w in pnl["overhead_lines"]:
        lines.append(line(name, revenue * pnl["overhead_percent_of_revenue"] / 100 * w / weights_total,
                          "operating_expenses", "general_overheads", sub))
    if interest_total > 0:
        lines.append(line(pnl["interest_line_label"], interest_total, "operating_expenses", "general_overheads",
                          "finance_interest", interest="contains_asset_finance_interest"))
    keys["qs_tools_profit_and_loss_state"] = {
        "financial_year": int(recipe["financial_year"]), "period_month": "", "pnl_lines": lines,
        "direct_cost_categories": [{"category_id": c, "category_name": n, "is_default": True, "is_active": True,
                                    "created_at": ts, "updated_at": ts} for c, n in DIRECT_COST_CATEGORIES]}

    expected = mx.layer1(recipe, lines, as_of)
    expected["charge_out_by_staff_type"] = charge_out
    expected["billed_revenue"] = billed
    # Layer 2 (first part): Business Outcome group modelled revenue, capacity gap and idle, keyed by trace node id.
    for row in billed["groups"]:
        gid = group_ids[row["ref"]]
        if row["modelled_revenue"] > 0:
            expected["nodes"][f"business_outcome.group.{gid}.modelled_revenue"] = row["modelled_revenue"]
        if "capacity_gap_hours" in row:
            expected["nodes"][f"business_outcome.group.{gid}.capacity_gap_hours"] = row["capacity_gap_hours"]
            expected["nodes"][f"cost_allocation.group.{gid}.idle_labour_hours"] = row["idle_labour_hours"]
            expected["nodes"][f"cost_allocation.group.{gid}.idle_labour_cost"] = row["idle_labour_cost"]
            if row["capacity_gap_dollars"] is not None:
                expected["nodes"][f"business_outcome.group.{gid}.capacity_gap_dollars"] = row["capacity_gap_dollars"]
    expected["group_names"] = {group_ids[g["ref"]]: f'{g["ref"]} {g["label"]}' for g in recipe["groups"]}
    expected["pnl_summary"] = {
        "revenue_basis": basis, "billed_from_rates": r2(billed["total"]),
        "revenue": r2(revenue), "labour_lines": r2(labour_pnl), "asset_interest": r2(interest_total),
        "net_profit": r2(sum(l["amount"] for l in lines if l["category"] == "revenue")
                         - sum(l["amount"] for l in lines if l["category"] != "revenue"))}
    seed = {"meta": {"recipe_id": rid, "label": recipe["label"], "as_of": as_of.isoformat(),
                     "generator": "generate_business.py", "key_count": len(keys),
                     "people": len(people), "assets": len(asset_list), "groups": len(groups)},
            "keys": keys}
    return seed, expected, people, asset_list


def write_review(path, recipe, seed, expected, people, asset_list):
    from openpyxl import Workbook
    from openpyxl.styles import Font, PatternFill, Alignment
    wb = Workbook()
    H = Font(name="Arial", bold=True, color="FFFFFF"); HF = PatternFill("solid", fgColor="1F3864")
    N = Font(name="Arial", size=10)

    def sheet(title, header, rows, widths):
        ws = wb.create_sheet(title)
        ws.append(header)
        for c in ws[1]:
            c.font, c.fill, c.alignment = H, HF, Alignment(wrap_text=True)
        for r in rows:
            ws.append(r)
        for row in ws.iter_rows(min_row=2):
            for c in row:
                c.font = N
                if isinstance(c.value, float):
                    c.number_format = '#,##0.00'
        for i, w in enumerate(widths, 1):
            ws.column_dimensions[chr(64 + i)].width = w
        ws.freeze_panes = "A2"
        return ws

    s = wb.active; s.title = "Summary"
    s["A1"] = recipe["label"]; s["A1"].font = Font(name="Arial", bold=True, size=13)
    s["A2"] = f'As of {seed["meta"]["as_of"]}. Values are computed by mirra_expected.py (independent of the app). Read-only record - change the recipe, not this file.'
    s["A2"].font = Font(name="Arial", italic=True, size=9)
    s.append([]); s.append(["Trace node", "Expected value"])
    for c in s[4]:
        c.font, c.fill = H, HF
    for k, v in expected["nodes"].items():
        s.append([k, round(v, 2)])
    s.append([]); s.append(["P&L summary", ""])
    for k, v in expected["pnl_summary"].items():
        s.append([k, v])
    s.append([]); s.append(["Charge-out per staff type", ""])
    for k, v in expected["charge_out_by_staff_type"].items():
        s.append([k, v])
    for row in s.iter_rows(min_row=5):
        for c in row:
            if c.font != H:
                c.font = N
            if isinstance(c.value, (int, float)):
                c.number_format = '#,##0.00'
    s.column_dimensions["A"].width = 58; s.column_dimensions["B"].width = 18

    lab_rows = expected["labour"]["people"]
    sheet("Staff", ["Name (ref)", "Staff type", "Class", "Rate $/hr", "Hours/wk", "Paid hrs", "Leave hrs", "Break hrs",
                    "Productive hrs", "Gross wages", "KiwiSaver", "ESCT", "ACC", "Total cost"],
          [[f'{p["ref"]}-{p["copy_index"]:03d}', p["staff_type_id"], p["labour_class"], p["labour_rate"], p["hours_per_week"],
            r["paid_hours"], round(r["leave_hours"], 2), round(r["break_hours"], 2), round(r["productive_hours"], 4),
            r["gross_wages"], round(r["employer_kiwisaver"], 2), round(r["esct"], 2), round(r["acc"], 2), round(r["total_labour_cost"], 2)]
           for p, r in zip(people, lab_rows)], [12, 26, 15, 10, 9, 10, 10, 10, 13, 13, 11, 10, 10, 13])
    sheet("Assets", ["Name (ref)", "Type", "Price", "Rate %", "Term yrs", "Start", "Paid off", "Hours/wk", "Weeks used",
                     "Weeks source", "Annual hours", "Interest (as of)", "Required rate $/hr"],
          [[f'{a["ref"]}-{a["copy_index"]:03d} {a["label"]}', a["asset_type"], a.get("purchase_price"), a.get("interest_rate"),
            a.get("finance_term_years"), a.get("finance_start_date"), "Y" if a.get("finance_paid_off") else "N",
            a.get("utilisation_hours_per_week", 0), e["annual_weeks_used"], e["annual_weeks_source"], e["utilisation_hours_annual"],
            round(e["asset_interest_annual"], 2), round(e["required_asset_recovery_rate"], 4)]
           for a, e in zip(asset_list, expected["assets"])], [28, 11, 11, 8, 9, 12, 8, 9, 10, 14, 12, 15, 15])
    ca = seed["keys"]["qs_tools_cost_allocation_v2_1"]
    gname = {g["group_id"]: g["group_name"] for g in ca["operational_groups"]}
    aname = {a["asset_id"]: a["asset_name"] for a in seed["keys"]["qs_tools_saved_assets"]}
    sheet("Groups", ["Group", "Recovery source", "Run pattern", "Tied", "Labour (type: %)", "Assets (name: %)"],
          [[g["group_name"], g["group_recovery_hour_source"], g["asset_run_pattern"] or "together", "Y" if g["labour_tied_to_asset"] else "N",
            ", ".join(f'{l["staff_type_id"]}: {l["assignment_percent"]}' for l in ca["labour_group_assignments"] if l["group_id"] == g["group_id"]),
            ", ".join(f'{aname[x["asset_id"]]}: {x["assignment_percent"]}' for x in ca["asset_group_assignments"] if x["group_id"] == g["group_id"])]
           for g in ca["operational_groups"]], [26, 15, 12, 6, 60, 50])
    sheet("PnL", ["Line", "Section", "Category", "Sub-category", "Amount", "Interest treatment"],
          [[l["line_name"], l["section"], l["category"], l["review_subcategory"] or l["direct_cost_category_id"], l["amount"], l["interest_treatment"]]
           for l in seed["keys"]["qs_tools_profit_and_loss_state"]["pnl_lines"]], [34, 18, 18, 22, 14, 30])
    sheet("Rate_Builder", ["Calculator", "Line", "Unit", "Rate", "Qty"],
          [[c["name"], l["name"], l["unit"], l["rate"], l["quantity"]] for c in seed["keys"]["qs_tools_rate_builder_calculators_v1"] for l in c["lines"]],
          [50, 26, 6, 8, 6])
    wb.save(path)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("recipe")
    ap.add_argument("--as-of", default=date.today().isoformat())
    ap.add_argument("--out", default=".")
    args = ap.parse_args()
    recipe = json.load(open(args.recipe, encoding="utf-8"))
    as_of = date.fromisoformat(args.as_of)
    seed, expected, people, asset_list = build(recipe, as_of)
    os.makedirs(args.out, exist_ok=True)
    rid = recipe["recipe_id"]
    with open(os.path.join(args.out, f"seed_{rid}.json"), "w", encoding="utf-8") as f:
        json.dump(seed, f, indent=1)
    exp_out = {k: v for k, v in expected.items() if k != "labour"}
    exp_out["labour_totals"] = {k: v for k, v in expected["labour"].items() if k != "people"}
    with open(os.path.join(args.out, f"expected_{rid}.json"), "w", encoding="utf-8") as f:
        json.dump(exp_out, f, indent=1, default=str)
    write_review(os.path.join(args.out, f"review_{rid}.xlsx"), recipe, seed, expected, people, asset_list)
    m = seed["meta"]
    print(f'{rid}: {m["people"]} people, {m["assets"]} assets, {m["groups"]} groups, {m["key_count"]} keys, as of {m["as_of"]}')
    for k in ("labour.total_people_cost_annual", "labour.total_productive_output", "assets.total_asset_cost_annual",
              "general_overheads.total_general_overheads", "cost_summary.total_cost_burden",
              "business_summary.required_recovery_per_driver", "revenue_cogs.total_revenue"):
        print(f"  {k:52} {expected['nodes'][k]:>14,.2f}")
    ps = expected["pnl_summary"]
    print(f'  revenue basis {ps["revenue_basis"]}: billed from rates {ps["billed_from_rates"]:,.2f}; P&L net profit {ps["net_profit"]:,.2f} ({ps["net_profit"] / ps["revenue"] * 100:.1f}% of revenue)')


if __name__ == "__main__":
    main()
