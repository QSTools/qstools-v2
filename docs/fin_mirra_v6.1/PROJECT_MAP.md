# PROJECT MAP - Mirra (qstools-web)

Created 2026-10-22 (V6.1c, step 4b). Start here. One page that says where everything is.
Rule: one brief per module. Read this file, the working conventions, and only the brief(s) the task needs.
Paths are relative to `D:\QSTools\qstools-web`. Docs live under `docs\fin_mirra_v6.1\`.

## 1. Where documents live

| What | Where |
|---|---|
| Module briefs (12, plus the calculation trace brief; intent / rules / contract / status / findings) | `docs\fin_mirra_v6.1\Briefs\` |
| Calculation map (formulas, line hints, CM-n inconsistencies) | `docs\fin_mirra_v6.1\Calculations\CALCULATION_MAP_v6_0.txt` |
| Variable tracker | `docs\fin_mirra_v6.1\Calculations\VARIABLE_TRACKER_v6_0.txt` |
| Business Outcome file-by-file map | `docs\fin_mirra_v6.1\Calculations\BUSINESS_OUTCOME_FILE_MAP_v6_0.txt` |
| Raw calc extract (regenerate, gitignored dumps) | `docs\fin_mirra_v6.1\Calculations\calc_map\` via `python Py\audit-scripts\extract_calc_map.py` |
| Audit evidence (173 files, v6.0) | `docs\fin_mirra_v6.1\Audit\v6_0\` |
| Handovers | `docs\fin_mirra_v6.1\Audit\V6.1\<letter>\HANDOVER.txt` |
| Future-build briefs (not built) | `docs\fin_mirra_v6.1\Future_Build\` |
| Archive (never delete) | `docs\Archive\` ; v5.0 briefs in `docs\Archive\Mirra_v5_Briefs\` (historical, never updated) |
| Working conventions | repo root: `Working_Conventions_PowerShell_Patching_CSS_and_Numeric_Verification.txt` |
| Stress-test regression suite | `Py\stress_test\` (README.txt inside) |
| Audit scripts | `Py\audit-scripts\` |
| Calculation trace nodes | `lib\calculation-trace\` |

Brief rules: append a dated ADDENDUM at the bottom (check the last number first); when it changes a rule, status or
finding above, also edit that line in place. Never create a second brief for a module.

## 2. Module table

Calc map section = section number in CALCULATION_MAP_v6_0.txt. Brief = file in `Briefs\`.

| Module | Route | Brief | Calc map | Key files (full list: brief Section 6) |
|---|---|---|---|---|
| P&L (+ Balance Sheet) | `/p-and-l`, `/balance-sheet`, `/api/pnl-import` | PNL_BRIEF | s1 | `lib/calculations/profitAndLossCalculations.js`, `hooks/useProfitAndLoss.js`, `lib/selectors/profitAndLossSelectors.js` |
| Revenue / COGS | `/revenue-cogs` | REVENUE_COGS_BRIEF | s1 (+ s12) | `lib/calculations/revenueCogsCalculations.js`, `hooks/useRevenueCogs.js`, `lib/storage/revenueCogsStorage.js` |
| Opening Hours, Cost Summary, Business Summary, Recovery Summary | `/opening-hours`, `/cost-summary`, `/business-summary`, `/recovery-summary` | SUMMARIES_BRIEF | s2, s6 | `openingHoursCalculations.js`, `costSummaryCalculations.js`, `businessSummaryCalculations.js`, `lib/calculations/recovery-summary/calculateRecoverySummary.js` |
| Labour | `/labour` | LABOUR_BRIEF | s3 | `lib/calculations/labourCalculations.js`, `hooks/useLabour.js`, `lib/selectors/labour/*` |
| General Overheads | `/general-overheads` | GENERAL_OVERHEADS_BRIEF | s4 (+ s12) | `lib/calculations/generalOverheadCalculations.js`, `hooks/useGeneralOverheads.js`, `hooks/general-overheads/*` |
| Assets | `/assets` | ASSETS_BRIEF | s5 | `hooks/useAssets.js`, `hooks/assets/assetOutputContract.js`, `lib/calculations/assetCalculations.js` |
| Cost Allocation (the hinge) | `/cost-allocation` | COST_ALLOCATION_BRIEF | s7 | `hooks/useCostAllocation.js`, `lib/calculations/cost-allocation/costAllocationRuleBuildContext.js`, `...GroupCostBuilder.js` |
| Rate Builder | `/rate-builder` | RATE_BUILDER_BRIEF | s8 | `hooks/rate-builder/*`, `lib/calculations/rateBuilderLabourByStaffType.js`, `lib/calculations/shared/overheadSplit.js` |
| Business Outcome | `/business-outcome` (legacy `/recovery-outcome` is outside the core chain) | BUSINESS_OUTCOME_BRIEF | s9 (9.1-9.12) | `hooks/useBusinessOutcomePerSourceRevenue.js` (~1,430 lines, do not split without a decision), `lib/selectors/business-outcome/*`, `businessOutcomeViewBCalculations.js` |
| Business Modelling | `/business-modelling` | BUSINESS_MODELLING_BRIEF | s10 (+ s12) | `hooks/useBusinessModelling.js`, `lib/calculations/businessModellingAdditiveModel.js`, `businessModellingSourceRows.js` |
| Module Reconciliation + Model Readiness (the trust gate) | `/module-reconciliation`, `/model-readiness` | MODEL_READINESS_AND_RECONCILIATION_BRIEF | s11 (Reconciliation), s6 | `lib/reconciliation/reconciliationRules.js` (~1,035 lines, do not grow), `lib/calculations/modelReadinessCalculations.js` |
| Quote Engine + Quote Checker | `/quote-engine`, `/quote-checker` | QUOTE_ENGINE_BRIEF | s11 | `lib/calculations/quoteEngineCalculations.js`, `quoteCheckerCalculations.js`, `hooks/useAiBusinessState.js` |
| Calculation trace (cross-cutting; not a link in the calc chain) | route not examined | CALCULATION_TRACE_BRIEF | all | `lib/calculation-trace/*`, `scripts/check-calculation-trace-integrity.mjs` (broken import, finding T-1) |

No brief (neighbours): Revenue Reality (`/revenue-reality`), Quick Start (`quickStartCalculations.js`, calc map s11),
AI Business State (`/ai-business-state`, covered in the Quote Engine brief), `/dev/cross-import-check` (dev only, P&L brief).

## 3. Data flow (core chain)

P&L and Revenue/COGS set the baseline. Opening Hours, Labour, General Overheads and Assets produce output contracts.
Cost Allocation distributes every source dollar exactly once into operating groups. Rate Builder, Cost / Business /
Recovery Summary, Business Outcome and Business Modelling consume that. Module Reconciliation checks the modules
against the P&L; Model Readiness is the trust gate computed from those checks. Quote Engine / Checker sit outside the
chain. Mechanism lives in the calc map, never in the briefs.

## 4. Calc map sections

0 how to read / maintain | 1 P&L and Revenue/COGS | 2 Opening Hours | 3 Labour | 4 General Overheads | 5 Assets |
6 Cost / Business / Recovery Summary | 7 Cost Allocation | 8 Rate Builder | 9 Business Outcome | 10 Business Modelling |
11 Side tools (Quick Start, Quote Engine, Quote Checker, Reconciliation) | 12 Known inconsistencies (CM-n).

Calculation change = not done until the calc map matches the code: re-run the extract, update formula and line
numbers, close or amend the CM-n entry, re-date, commit with the code change. New calculated figures also need a
calculation trace node (definition of done, conventions 2026-10-16).

## 5. Build order (R-numbers)

Source: `Future_Build\LAUNCH_BUILD_ORDER_AND_THIRD_MOAT_FUTURE_BUILD_BRIEF_2026-10-14.txt`, Addendum 1 (A1).

| R | Step | State (as of R2 handover 2026-10-18) |
|---|---|---|
| R1 | Hours-mode smoke test sign-off | CLOSED |
| R2 | Stress test hours mode at scale, client side | IN PROGRESS |
| R3 | Business Modelling redesign (scratch overlay replaces the lever engine) | NEXT, after the fix batch |
| R4 | Units mode: build, smoke test, stress test, re-verify Business Modelling | not started |
| R5 | UI tidy-up and consistency pass | not started |
| R6 | Database (server plumbing and migration sit with or just before it - owner to confirm) | not started |
| R7 | AI layer: setup coaching + read-only explainer, shipped together | not started |
| | **FULL RELEASE LINE (launch bar)** | |
| R8 | Purchase orders, Xero write-back, timekeeping | after release |
| R9 | Server-load stress test | after R6, not a launch blocker |
| R10 | Xero certification and App Store listing | after R8 |

## 6. Current build position

R2, rest of it (from R2_HANDOVER_2026-10-18; re-confirm at step 8):
a. production-build timing run (stop dev, `npm run build`, `npm start` on a spare port such as 3005; rerun the
   Addendum 13 scripts there; Q-7 verdict on production numbers).
b. profile Business Outcome at 1,000 staff. c. typing in Cost Allocation percent and Rate Builder lines.
d. layer-2 gaps (assumed capacity / Best Case, Business Modelling start rows, Rate Builder all_productive row) after the fix batch.

Fix batch between R2 and R3, then ONE full regression re-run (A, A misaligned, B, A2, ladder):
F-1 ESCT to the IRD rule (core calc file, stop-and-confirm) | F-4 unassigned asset cost spread with red warning |
F-7 dry hire earns money (hourly, default off, placement to confirm) | F-10 EBITDA depreciation pass-through |
F-11 EBIT adds back all interest, trace nodes backfilled.
Performance fails (R2 UI speed pass, dev server): Business Outcome, Business Modelling and trace at 100 / 1,000 staff;
Business Modelling lever typing at every size (fix belongs in R3).

Docs reorganisation (V6.1): steps 1-5 done; step 6 (conventions and stale references) in progress; then 7, 8 (see latest HANDOVER.txt).
No stress-test work until V6.1 step 8.

## 7. Findings numbering

F-n = R2 fix batch (stress test). CM-n = calc map inconsistencies (s12). Module findings carry their own numbers
inside each brief's Section 8 (RC-n revenue/COGS, MR-n readiness, S-Hn / S-Gn summaries, BO-n business outcome,
RB-n rate builder, D-n cost allocation, Q-n stress test questions). Keep numbers; update status in place.

## 8. Future-build briefs (`Future_Build\`)

LAUNCH_BUILD_ORDER_AND_THIRD_MOAT (resolved build order, Addendum 1) | BUSINESS_MODELLING_REDESIGN_SCRATCH_OVERLAY (R3) |
UNITS_MODE (R4) | STRESS_TEST_DATABASE_AND_AGENT_DESIGN | REGRESSION_HEALTH_CHECK_SUITE | ESCT_TREATMENT_FIX (F-1) |
DRY_HIRE_UNATTENDED_ASSETS (F-7) | HOURS_BASED_BUSINESS_TYPES_TEST_AND_MARKET_COVERAGE | AI_ASSISTED_SETUP_AND_RESULTS_EXPLAINER (R7) |
GO_TO_MARKET_XERO_LISTING_AND_UNIT_ECONOMICS | POST_LAUNCH_VISION_AND_POSITIONING.
When one is built it folds into the module brief and the future-build file is archived.

## 9. Archived from the v6.0 brief folder

Nothing is held outside `Briefs\` and `Future_Build\` now. AI_STRATEGY_CUBAN_TALK, AI_WORKFLOW_TALKS_POCOCK,
R2_HANDOVER_2026-10-18, V6_0_KICKOFF_AND_HANDOVER_2026-09-20 and the old CALCULATION_TRACE_VERIFICATION_LAYER brief are in
`docs\Archive\fin_mirra_v6.0 Briefs\`. The trace brief is now `Briefs\CALCULATION_TRACE_BRIEF.txt`.

## 10. Known stale references (fixed in step 6)

Conventions and this map were corrected 2026-10-22 (V6.1d step 6). Still open: the project instructions (rule 11 and the doc
list) name `docs/fin_mirra_v6.0 Briefs/` and `docs/Audit/v6_0/` until the owner pastes the corrected text in the project
settings. Current paths are in Section 1 above.
