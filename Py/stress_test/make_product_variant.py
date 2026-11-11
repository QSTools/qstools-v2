"""
make_product_variant.py - V6.1ci piece 1 (C3b): turn the piece 0 reseller HOURS seed into a PRODUCT-mode seed with unit driver data.
READ-ONLY on the repo: reads a seed json, writes ONE new json under --out. No app code, no existing seed or expected file is touched.

  python Py\\stress_test\\make_product_variant.py
      [--seed .tmp\\reseller_piece0\\seed_reseller_piece0.json] [--out .tmp\\reseller_piece1\\product_seed]
  then read it headless (production server must be running):
  python Py\\stress_test\\read_reseller_screens.py --seed .tmp\\reseller_piece1\\product_seed\\seed_reseller_piece1_product.json --out .tmp\\reseller_piece1\\prod_after1

CHANGES (only these two storage keys, existing fields only, no new stored field):
  qs_tools_business_setup_v1        business_type -> "product_based"
  qs_tools_revenue_cogs_state_v2    commercial_driver_mode "unit_based", one unit row: m3, 100 percent, sell 250, 100,000 a year
PAPER (hand-calculated from the piece 0 seed, not from the app): overheads 380,577.86; labour 499,422.14; asset interest 120,000;
  burden 1,000,000.00; overhead pool should be 380,577.86 (the old code gives the whole burden 1,000,000.00).
"""
import argparse
import json
import os

ap = argparse.ArgumentParser()
ap.add_argument("--seed", default=os.path.join(".tmp", "reseller_piece0", "seed_reseller_piece0.json"))
ap.add_argument("--out", default=os.path.join(".tmp", "reseller_piece1", "product_seed"))
a = ap.parse_args()

with open(a.seed, encoding="utf-8") as f:
    seed = json.load(f)
keys = seed["keys"]
bs = keys["qs_tools_business_setup_v1"]
bs["business_type"] = "product_based"
rc = keys["qs_tools_revenue_cogs_state_v2"]
rc["commercial_driver_mode"] = "unit_based"
rc["units_sold_annual"] = 100000
rc["unit_driver_rows"] = [{"id": "unit-driver-1", "unit_label": "Concrete cube", "unit_type": "m3",
                           "revenue_share_percent": 100, "average_sale_rate_per_unit": 250, "estimated_units_annual": 100000}]
seed["meta"]["recipe_id"] = "reseller_piece1_product"
seed["meta"]["label"] = "Test Business R - concrete reseller, PRODUCT mode (anonymised)"
os.makedirs(a.out, exist_ok=True)
dest = os.path.join(a.out, "seed_reseller_piece1_product.json")
with open(dest, "w", encoding="utf-8") as f:
    json.dump(seed, f, indent=1)
print("written", dest)
print("business_type:", bs["business_type"], "| mode:", rc["commercial_driver_mode"], "| units:", rc["units_sold_annual"])
