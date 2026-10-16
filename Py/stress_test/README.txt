MIRRA STRESS TEST HARNESS (R2, step 1c) - 2026-10-17
=====================================================
A recipe describes a business in about ten decisions. The generator builds the
whole business from it, writes a localStorage seed for the isolated instance,
and computes the expected values INDEPENDENTLY of the app (from
CALCULATION_MAP_v6_0.txt, not from the app's JavaScript).

FILES
  recipes/scenario_a.json    Scenario A: 10 staff (7 productive), 7 assets (4 productive), 5 groups
  generate_business.py       recipe -> seed_<id>.json, expected_<id>.json, review_<id>.xlsx
  mirra_expected.py          independent formulas (layer 1: opening hours, labour, assets,
                             general overheads, cost summary, business summary, revenue/COGS)
  compare_trace.py           expected_<id>.json vs a calculation trace snapshot -> PASS/FAIL per node
  seed_loader.console.js     paste into the browser console on :3004: Backup / Load seed / Restore

RUN (PowerShell, repo root; Python 3 with openpyxl)
  python Py\stress_test\generate_business.py Py\stress_test\recipes\scenario_a.json --as-of 2026-10-17 --out "docs\Audit\v6_0\smoke_test\3.1 Stress Test\scenario_a"

  --as-of must be the NZ date the app runs on: asset interest is dated to "today" (calc map s5).

LOAD ON :3004 (isolated instance only)
  1. Close every other :3004 tab (an open page can overwrite the seed - register H8).
  2. Open any :3004 page, F12, paste seed_loader.console.js, Enter.
  3. Panel top right: "Load seed..." -> pick seed_scenario_a.json. A full backup downloads first,
     then ALL keys are replaced and the page reloads.
  4. Open the calculation trace page, save a snapshot into the scenario folder.
  5. python Py\stress_test\compare_trace.py "<folder>\expected_scenario_a.json" "<folder>\calculation_trace_snapshot_<n>.json"
  6. "Restore..." -> pick the backup file to put the baseline back.

RULES
  - Never run the loader on :3000 (it refuses anything but :3004).
  - Backups are raw and unfiltered (every key on the origin). See STORAGE_KEY_REGISTER_S0 section 2.
  - Same recipe + same --as-of = identical output.
  - Layer 1 plus the first of layer 2 (Business Outcome group modelled revenue, capacity gap, idle).
  - recipe pnl.revenue_basis: billed_from_rates (aligned: P&L revenue built from rates x real hours)
    or target_margin (misaligned variant, recipes/scenario_a_misaligned.json, not run yet).

LAYER 2 (added 2026-10-17, commit 7c333f8)
  mirra_expected_l2.py   independent layer-2 formulas (calc map s7, s8, s9): Cost Allocation group rows and overhead
                         pool, overhead split and Rate Builder overhead per staff type, Business Outcome per-source rows,
                         non-productive distribution, View A and View B cascades. ASSUMPTIONS A-1 to A-6 at the top.
  run_layer2.py          recipe -> expected_<id>_layer2.json (layer 1 + layer 2 nodes, raw checks, tolerances, detail)
  compare_full.py        snapshot nodes AND cost_allocation_raw vs expected_<id>_layer2.json; exit 1 on any fail

  python Py\stress_test\run_layer2.py Py\stress_test\recipes\scenario_a.json --as-of 2026-10-17 --out "docs\Audit\v6_0\smoke_test\3.1 Stress Test\scenario_a"
  python Py\stress_test\compare_full.py "docs\Audit\v6_0\smoke_test\3.1 Stress Test\scenario_a\expected_scenario_a_layer2.json" "docs\Audit\v6_0\smoke_test\3.1 Stress Test\calculation_trace_snapshot_<n>.json"

  Snapshots download into the 3.1 Stress Test folder, one level above scenario_a. Use the real file name, not <n>.
  Live runs can also be done by Claude in the desktop app's built-in browser pane on :3004 (own storage, the owner's
  Chrome is not touched); see the stress test brief Addendum 4.
  Aligned Scenario A: 217 of 217. Its cascades have zero shortfall; recipes/scenario_a_misaligned.json is the cascade test.
