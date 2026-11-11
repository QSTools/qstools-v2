"""
build_reseller_seed.py - V6.1ch piece 0: the concrete reseller as a HOURS-mode seed, with PAPER numbers.

  python Py\\stress_test\\build_reseller_seed.py --as-of 2026-11-11 --out .tmp\\reseller_piece0

Reuses generate_business.build() for everything except the P&L (staff, 12 bowls, one working group, opening hours,
cost allocation, storage keys), then REPLACES the P&L with the reseller's lines. Writes under --out only; nothing in
the repo, public\\__stress_tmp or any existing seed or expected file is touched. No app code, no new stored field.

Paper figures (paper_reseller_piece0.json) are computed here from the inputs, never from the app:
  sell 250 a cube, buy 200 a cube, hired truck 240 a load, load 6 cubes, 100,000 cubes a year, fixed cost 1,000,000.
  Fixed cost = labour + asset finance interest + overheads. The app counts only finance interest as asset cost, so the
  12 bowls (100,000 each, 10 percent, 5 years, finance start in the future so interest never drifts) give 120,000 and
  overheads are the balance. Everything is anonymised: generic names only.
"""
import argparse
import json
import os
from datetime import date

import generate_business as gb
import mirra_expected as mx

SELL, BUY, TRUCK, LOAD_CUBES, CUBES, FIXED = 250.0, 200.0, 240.0, 6.0, 100000.0, 1000000.0

RECIPE = {
    "recipe_id": "reseller_piece0",
    "label": "Test Business R - concrete reseller (anonymised)",
    "financial_year": "2026",
    "business_type": "labour_based",
    "opening_hours": {"weekdays_open": ["monday", "tuesday", "wednesday", "thursday", "friday"], "open_time": "07:00",
                      "close_time": "16:30", "break_minutes": 30, "seasonal_shutdown_weeks": 3, "public_holiday_days": 0},
    "labour_defaults": {"hours_per_week": 40, "days_per_week": 5, "productivity_percent": 85, "annual_leave_weeks": 4,
                        "public_holiday_days": 12, "sick_days": 10, "bereavement_days": 1, "family_violence_days": 0,
                        "employee_kiwisaver_enabled": True, "acc_enabled": True},
    "staff": [
        {"ref": "S01", "staff_type_id": "owner_director", "headcount": 1, "labour_class": "non_productive", "labour_rate": 56, "acc_rate": 0.08},
        {"ref": "S02", "staff_type_id": "manager", "headcount": 1, "labour_class": "non_productive", "labour_rate": 47, "acc_rate": 0.08},
        {"ref": "S03", "staff_type_id": "admin_support", "headcount": 2, "labour_class": "non_productive", "labour_rate": 33, "acc_rate": 0.08},
        {"ref": "S04", "staff_type_id": "operator_delivery_staff", "headcount": 2, "labour_class": "productive", "labour_rate": 31, "acc_rate": 1.43},
    ],
    "charge_out_multiplier": 1.9, "charge_out_round_to": 5,
    "assets": [
        {"ref": "B01", "label": "Concrete bowl", "asset_type": "productive", "count": 12, "purchase_price": 100000,
         "interest_rate": 10, "finance_term_years": 5, "finance_start_date": "2027-01-01",
         "utilisation_hours_per_week": 30, "annual_weeks_override": 48, "machine_rate": 0},
    ],
    "groups": [
        {"ref": "G01", "label": "Bowl fleet", "recovery_hour_source": "asset_hours", "asset_run_pattern": "sequential",
         "labour_tied_to_asset": False, "assets": [["B01", 100]], "labour": [["operator_delivery_staff", 100]]},
        {"ref": "G02", "label": "Office and support", "recovery_hour_source": "labour_hours", "asset_run_pattern": "together",
         "labour_tied_to_asset": False, "assets": [],
         "labour": [["owner_director", 100], ["manager", 100], ["admin_support", 100]]},
    ],
    "pnl": {"revenue_basis": "billed_from_rates", "billing_realisation_percent": 100, "target_net_margin_percent": 0,
            "materials_percent_of_revenue": 0, "materials_markup_percent": 0, "overhead_percent_of_revenue": 0,
            "overhead_lines": [["Rent", "facilities_premises", 3], ["Insurance", "insurance_compliance", 2],
                               ["Accounting fees", "finance_admin", 1], ["Software subscriptions", "office_admin", 1],
                               ["Marketing", "sales_growth", 1], ["Yard and site costs", "facilities_premises", 4],
                               ["Repairs and maintenance", "facilities_premises", 3]],
            "interest_line_label": "Loan interest", "kiwisaver_line_includes_esct": False,
            "owner_labour_treatment": "owner_on_wages_in_pnl"},
    "non_productive_policy": "charge_to_self",
}


def paper(labour_cost, interest, overheads_pnl):
    loads = CUBES / LOAD_CUBES
    rev, concrete, truck = CUBES * SELL, CUBES * BUY, loads * TRUCK
    cos = concrete + truck
    fixed = labour_cost + interest + overheads_pnl
    return {
        "inputs": {"sell_per_cube": SELL, "buy_per_cube": BUY, "truck_per_load": TRUCK, "cubes_per_load": LOAD_CUBES,
                   "cubes_per_year": CUBES},
        "loads_per_year": round(loads, 2), "revenue": rev, "concrete": concrete, "truck": round(truck, 2),
        "cost_of_sales": round(cos, 2), "gross_profit": round(rev - cos, 2),
        "fixed_cost": {"labour": round(labour_cost, 2), "asset_finance_interest": round(interest, 2),
                       "overheads_after_asset_transfer": round(overheads_pnl, 2), "total": round(fixed, 2)},
        "net_profit": round(rev - cos - fixed, 2),
        "per_cube": {"price": SELL, "cost_of_sales": round(cos / CUBES, 2), "fixed": round(fixed / CUBES, 2),
                     "all_in_cost": round((cos + fixed) / CUBES, 2)},
        "per_6_cube_load": {"revenue": 1500.0, "concrete": 1200.0, "truck": 240.0, "left": 60.0},
        "break_even_cubes": round(fixed / (SELL - BUY - TRUCK / LOAD_CUBES), 0),
        "break_even_load_cubes": round(TRUCK / (SELL - BUY), 2),
        "break_even_buy_price": {str(c): round(SELL - TRUCK / c, 2) for c in (4.6, 5.6, 6.0)},
        "load_margin": {str(c): round((SELL - BUY) * c - TRUCK, 2) for c in (4.6, 4.8, 5.6, 6.0)},
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--as-of", default=date.today().isoformat())
    ap.add_argument("--out", default=".tmp/reseller_piece0")
    args = ap.parse_args()
    as_of = date.fromisoformat(args.as_of)
    seed, expected, people, asset_list = gb.build(RECIPE, as_of)
    ts = f"{as_of.isoformat()}T00:00:00.000Z"
    lab = mx.labour_totals(people)
    interest = sum(mx.asset_interest(a, as_of) for a in asset_list)
    labour_cost = lab["total_people_cost_annual"]
    overheads_pnl = FIXED - labour_cost - interest
    rid = RECIPE["recipe_id"]
    w = sum(x[2] for x in RECIPE["pnl"]["overhead_lines"])

    def line(name, amount, section, category, sub="", dcc="", interest_t="not_reviewed"):
        return {"pnl_line_id": gb.uid(rid, "pnl", name), "line_name": name, "amount": gb.r2(amount), "section": section,
                "category": category, "interest_treatment": interest_t, "review_subcategory": sub,
                "direct_cost_category_id": dcc, "source_type": "stress_test", "import_source": "stress_test"}

    lines = [line("Concrete sales", CUBES * SELL, "trading_income", "revenue"),
             line("Concrete purchases", CUBES * BUY, "cost_of_sales", "cogs", "", "materials"),
             line("Hired truck and driver", CUBES / LOAD_CUBES * TRUCK, "cost_of_sales", "cogs", "", "freight_cartage"),
             line("Salary & Wages", lab["gross_wages"], "operating_expenses", "labour", "salary_wages"),
             line("KiwiSaver Employer Contributions", lab["employer_kiwisaver"], "operating_expenses", "labour", "employer_kiwisaver"),
             line("ACC Levy", lab["acc"], "operating_expenses", "labour", "employer_acc")]
    stored_lab = sum(l["amount"] for l in lines if l["category"] == "labour")
    target_oh = round(FIXED - stored_lab - gb.r2(interest), 2)       # stored cents, so the P&L nets to exactly 0.00
    oh_lines = RECIPE["pnl"]["overhead_lines"]
    given = 0.0
    for i, (name, sub, wt) in enumerate(oh_lines):
        amt = round(target_oh - given, 2) if i == len(oh_lines) - 1 else gb.r2(target_oh * wt / w)
        given += amt
        lines.append(line(name, amt, "operating_expenses", "general_overheads", sub))
    lines.append(line("Loan interest", interest, "operating_expenses", "general_overheads", "finance_interest",
                      interest_t="contains_asset_finance_interest"))
    pnl_key = seed["keys"]["qs_tools_profit_and_loss_state"]
    pnl_key["pnl_lines"] = lines
    # P&L line amounts are rounded to cents: the paper figures use the stored amounts so the check is exact.
    stored_oh = sum(l["amount"] for l in lines if l["category"] == "general_overheads" and l["review_subcategory"] != "finance_interest")
    stored_cost = sum(l["amount"] for l in lines if l["category"] != "revenue")
    p = paper(labour_cost, interest, stored_oh)
    p["pnl_stored_net_profit"] = round(sum(l["amount"] for l in lines if l["category"] == "revenue") - stored_cost, 2)
    p["layer1_nodes"] = {k: round(v, 2) for k, v in mx.layer1(RECIPE, lines, as_of)["nodes"].items()}
    p["groups"] = {"G01": "Bowl fleet: 12 bowls + 2 operators", "G02": "Office and support: owner, manager, 2 admin"}
    os.makedirs(args.out, exist_ok=True)
    seed["meta"].update({"recipe_id": rid, "label": RECIPE["label"], "key_count": len(seed["keys"])})
    with open(os.path.join(args.out, f"seed_{rid}.json"), "w", encoding="utf-8") as f:
        json.dump(seed, f, indent=1)
    with open(os.path.join(args.out, f"paper_{rid}.json"), "w", encoding="utf-8") as f:
        json.dump(p, f, indent=1)
    print(f"seed + paper written to {args.out} (as of {as_of}, {len(seed['keys'])} keys)")
    print(f"  labour {labour_cost:,.2f}  asset interest {interest:,.2f}  overheads {stored_oh:,.2f}  fixed total {labour_cost + interest + stored_oh:,.2f}")
    print(f"  revenue {p['revenue']:,.2f}  cost of sales {p['cost_of_sales']:,.2f}  P&L net profit {p['pnl_stored_net_profit']:,.2f}")


if __name__ == "__main__":
    main()
