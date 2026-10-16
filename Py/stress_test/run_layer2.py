"""
Build the layer-1 + layer-2 expected values for a recipe, independently of the app.

  python run_layer2.py recipes/scenario_a.json --as-of 2026-10-17 --out <folder>

Writes into --out:
  expected_<id>_layer2.json   layer 1 nodes + layer 2 nodes + raw checks + tolerances + assumptions + detail
                              (same node schema as expected_<id>.json, so compare_trace.py still reads it)
Does NOT touch seed_<id>.json: generate_business.py stays the single source of the seed. Run it first
(or let this script call it: it imports generate_business.build, so the seed and ids are identical).
"""
import argparse
import json
import os
from datetime import date

import generate_business as gb
import mirra_expected_l2 as l2


def build_full(recipe, as_of):
    seed, expected, people, asset_list = gb.build(recipe, as_of)
    rid = recipe["recipe_id"]
    ids = {"group": {g["ref"]: gb.uid(rid, "group", g["ref"]) for g in recipe["groups"]},
           "asset": {}}
    for a in asset_list:
        ids["asset"].setdefault(a["ref"], []).append(gb.uid(rid, "asset", a["ref"], a["copy_index"]))
    # layer1() keeps the per-person rows under "labour"; build() returns that dict untouched
    res = l2.layer2(recipe, as_of, expected, expected["charge_out_by_staff_type"], ids)
    full = {k: v for k, v in expected.items() if k not in ("labour",)}
    full["labour_totals"] = {k: v for k, v in expected["labour"].items() if k != "people"}
    full["nodes"] = {**expected["nodes"], **res["nodes"]}
    full["layer2_node_count"] = len(res["nodes"])
    full["tolerances"] = res["tolerances"]
    full["raw_checks"] = res["raw_checks"]
    full["layer2_detail"] = res["detail"]
    return seed, full


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("recipe")
    ap.add_argument("--as-of", default=date.today().isoformat())
    ap.add_argument("--out", default=".")
    args = ap.parse_args()
    recipe = json.load(open(args.recipe, encoding="utf-8"))
    seed, full = build_full(recipe, date.fromisoformat(args.as_of))
    os.makedirs(args.out, exist_ok=True)
    path = os.path.join(args.out, f'expected_{recipe["recipe_id"]}_layer2.json')
    with open(path, "w", encoding="utf-8") as f:
        json.dump(full, f, indent=1, default=str)
    print(f'{recipe["recipe_id"]}: {len(full["nodes"])} nodes ({full["layer2_node_count"]} layer 2), '
          f'{len(full["raw_checks"])} raw checks, as of {args.as_of} -> {path}')
    d = full["layer2_detail"]
    print(f'  overhead pool {d["overhead_pool"]:,.2f}; non-productive pool {d["non_productive_pool"]:,.2f}; '
          f'View A shortfall {d["shortfall_view_a"]:,.2f}; View B shortfall {d["shortfall_view_b"]:,.2f}, surplus {d["surplus_view_b"]:,.2f}')


if __name__ == "__main__":
    main()
