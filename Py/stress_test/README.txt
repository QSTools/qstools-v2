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
  python Py\stress_test\generate_business.py Py\stress_test\recipes\scenario_a.json --as-of 2026-10-17 --out "docs\fin_mirra_v6.1\Audit\v6_0\smoke_test\3.1 Stress Test\scenario_a"

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

  python Py\stress_test\run_layer2.py Py\stress_test\recipes\scenario_a.json --as-of 2026-10-17 --out "docs\fin_mirra_v6.1\Audit\v6_0\smoke_test\3.1 Stress Test\scenario_a"
  python Py\stress_test\compare_full.py "docs\fin_mirra_v6.1\Audit\v6_0\smoke_test\3.1 Stress Test\scenario_a\expected_scenario_a_layer2.json" "docs\fin_mirra_v6.1\Audit\v6_0\smoke_test\3.1 Stress Test\calculation_trace_snapshot_<n>.json"

  Snapshots download into the 3.1 Stress Test folder, one level above scenario_a. Use the real file name, not <n>.
  Live runs can also be done by Claude in the desktop app's built-in browser pane on :3004 (own storage, the owner's
  Chrome is not touched); see the stress test brief Addendum 4.
  Aligned Scenario A: 217 of 217. Misaligned Scenario A (the cascade test, real shortfall): 217 of 217 after the
  materials row floor (A-6, owner decision F-5, 2026-10-17). Outputs in 3.1 Stress Test\scenario_a_misaligned.
  Scaling (owner decision H2, built 2026-10-18, stress brief Addendum 8):
    python Py\stress_test\run_layer2.py Py\stress_test\recipes\scenario_a.json --as-of <today> --staff-total 100 --out <folder>
    python Py\stress_test\generate_business.py Py\stress_test\recipes\scenario_a.json --as-of <today> --staff-total 100 --out <folder>
    python Py\stress_test\check_scaling.py <base expected_layer2.json> <scaled expected_layer2.json> 10
  scale_recipe.py apportions headcount and asset copies, rounds labour percents to whole numbers summing to the base
  total, and sets any group with more than one asset copy to "sequential" so every figure scales exactly.
  --assets fixed keeps the recipe's asset list (staff-only growth; a different, loss-making shape).
  Ladder 2026-10-18: 10 staff 217/217, 100 staff 423/424, 1,000 staff 2,490/2,494 (all misses = finding F-6).

SCENARIO B (step 2b, 2026-10-18; stress brief Addendum 10)
  recipes/scenario_b.json   crane and plant hire: custom staff types, H5 strings, H6 absent group fields, H7 shared asset,
                            support assets assigned (F-4), dry-hire group with no labour (A-2), spread_as_overhead policy.
  python Py\stress_test\run_layer2.py Py\stress_test\recipes\scenario_b.json --as-of <today> --out "docs\fin_mirra_v6.1\Audit\v6_0\smoke_test\3.1 Stress Test\scenario_b"
  Live 2026-10-18: 269 of 269.
  New recipe options (generate_business.py docstring): custom_staff_types, labour_rate_as_string, pnl.string_amount_lines,
  omit_optional_fields.

SCENARIO A2 - REALISTIC OVER-STAFFING (step 2e, 2026-10-18; stress brief Addendum 12)
  recipes/scenario_a_overstaffed.json   Scenario A + 1 operator + 1 senior operator, every machine unit tied: each about
                                        20 percent over its machine hours. Live 2026-10-18: 217 of 217.

F-4 (2026-10-25): unassigned support-asset cost is now spread evenly across the working units (app and mirra_expected_l2.py A-7).
  Every productive asset must be assigned in a recipe, or the app blocks. Expected files generated before 2026-10-25 for a recipe
  with unassigned support assets (scenario_a, scenario_a_misaligned, scenario_a_overstaffed) must be regenerated.

ITEM D (2026-10-26; stress brief Addendum 20): layer-2 gaps covered. mirra_expected_l2.py A-8..A-10 adds Best Case (assumed capacity) nodes, Business
  Modelling row nodes (plus per-row basis / start / floor / ceiling in layer2_detail.business_modelling, checked live on /business-modelling) and the Rate
  Builder all_productive row. The all_productive checks are "derived_checks" in the expected file: expected = const + coef x (the app's own
  labour_share_percent / 100); compare_full.py evaluates them. Business Modelling OVERHEAD rows and lever effects are not covered.
  Live on A 267, A misaligned 267, A2 267, B 324 (existing + item d checks).

F-10 (2026-10-26; Business Outcome brief Addendum 2): EBIT / EBITDA covered. recipes/scenario_a_depreciation.json = Scenario A plus the new optional
  per-asset recipe field depreciation_annual (written to estimated_annual_depreciation; default none, so every older seed is unchanged). Put it only on
  productive assets that are 100% assigned until F-10b is built. mirra_expected_l2.py A-12 adds business_outcome.ebit.total_net_profit / total_interest /
  total_depreciation / ebit / ebitda (the app's trace nodes of the same ids, lib/calculation-trace/pilot-map/ebitTraceNodes.js).
  Live 2026-10-26 on the built-in browser pane at :3005: 174 of 174 nodes (raw and derived checks not run for this slice).
  The loader still refuses any port but :3004. The 3005 run wrote the seed keys into the pane's storage by hand, verified key by key by length and CRC32.
