# QS Tools — Codex Project Instructions

## Project role

This repository is QS Tools, a first-principles commercial decision engine for construction/business costing.

The system is based on strict module ownership, downstream contracts, visible assumptions, controlled source files, reconciliation, model readiness, and commercially defensible cost recovery.

Core principle:

> Simple in hindsight. Invisible beforehand.

Every cost must belong to exactly one module.

If a cost appears in more than one module, the system is incorrect.

QS Tools must be good enough to defend, not just good enough to work.

---

## Active source version

Use only the v3.6 source briefs.

The v3.6 source pack is stored at:

```text
docs/V3.6 Source Files
```

Do not use v3.5 or older source files unless the task explicitly says they are deprecated history.

The v3.6 source pack is the active source of truth.

The First Principles brief is the highest-level system philosophy:

```text
docs/V3.6 Source Files/00_FIRST_PRINCIPLES_SYSTEM_BRIEF_v3.6_LOCKED.txt
```

The Product Standard & Commercial Defensibility brief defines the product quality bar:

```text
docs/V3.6 Source Files/00_PRODUCT_STANDARD_AND_COMMERCIAL_DEFENSIBILITY_v3.6_LOCKED.txt
```

The Active System Brief defines the current v3.6 architecture and build priority:

```text
docs/V3.6 Source Files/01_ACTIVE_SYSTEM_BRIEF_v3.6_LOCKED.txt
```

The Labour Recovery & Margin Pool Standard defines the fixed-price recovery test:

```text
docs/V3.6 Source Files/17_LABOUR_RECOVERY_AND_MARGIN_POOL_STANDARD_v3.6_LOCKED.txt
```

The Cost Setup Readiness milestone is locked here:

```text
docs/V3.6 Source Files/18_QS Tools — Cost Setup Readiness Milestone Brief_v3.6_LOCKED.txt
```

This milestone brief records the working baseline for:

```text
P&L interest treatment
General Overheads sync
Assets finance lifecycle and readiness
Labour active-profile aggregation
Module Reconciliation
Model Readiness
```

Use the Cost Setup Readiness milestone before changing Cost Summary or any upstream cost-readiness logic.

If a coding decision conflicts with the First Principles brief, report the conflict before editing.

If a coding decision makes the system less traceable, less explainable, or less commercially defensible, report the conflict before editing.

If a coding decision treats gross margin as proof of profit, report the conflict before editing.

If existing code conflicts with v3.6, report the conflict before changing broad architecture.

The first P&L setup is expected to take time because it creates a reusable explicit mapping layer for future monthly P&L imports and eventual Xero API integration.

Do not optimise for faster setup if doing so weakens the commercial model.

---

## Locked v3.6 architecture

Current locked flow:

```text
P&L
→ General Overheads
→ Labour
→ Assets
→ Module Reconciliation
→ Model Readiness
→ Cost Summary
→ Recovery Summary
→ Rate Models
→ Production Capacity
→ Recovery Outcome
→ Quote Benchmark
→ Budget
```

Core separation:

```text
P&L = raw financial input and benchmark/classification only
General Overheads = shared / unclear / staff overhead / vehicle running cost classification
Labour = people cost, employer obligations, productive hours
Assets = ownership-only asset costs
Module Reconciliation = evidence layer
Model Readiness = trust gate
Cost Summary = WHAT it costs
Recovery Summary = HOW it is recovered
Rate Models = practical earning rates
Production Capacity = CAN it be delivered
Recovery Outcome = SHOULD you run it
Quote Benchmark = does the model align with real quotes
Budget = locked upstream output consumer
```

---

## First Principles rules

QS Tools must not hide assumptions, invent recovery numbers, or create commercial outputs that cannot be traced back to real business costs and real productive capacity.

Every output must be traceable back to:

```text
a real input
a stated assumption
a source module
a calculation rule
a downstream contract
```

If an output cannot be traced, it should not be trusted.

The system must remove assumptions wherever feasible.

Where an assumption remains, it must be:

```text
visible
named
explainable
reviewable
separated from actuals
```

Hidden assumptions are not allowed.

QS Tools must not create a recovery number out of thin air.

A recovery number must come from:

```text
actual cost burden
productive capacity
recovery strategy
rate model
real-world quote benchmark
```

If the number cannot be explained, it is not valid.

---

## Product Standard & Commercial Defensibility rules

QS Tools must be good enough to defend, not just good enough to work.

The Product Standard & Commercial Defensibility brief defines the quality bar:

```text
docs/V3.6 Source Files/00_PRODUCT_STANDARD_AND_COMMERCIAL_DEFENSIBILITY_v3.6_LOCKED.txt
```

QS Tools should aim for 10/10 in:

```text
commercial logic
cost ownership
traceability
reconciliation
readiness gating
user clarity
source data treatment
module contracts
downstream trust
decision usefulness
```

Every important output must survive challenge.

If someone questions a number, QS Tools must be able to show:

```text
where the number came from
what source line or module produced it
what category owns it
what assumptions were made
whether the user manually resolved it
whether it is included or excluded
whether it blocks readiness
what downstream output it affects
```

If the system cannot explain a number, the number should not be trusted.

A trusted number must be:

```text
traceable
explainable
reconciled
owned by one module
free from hidden assumptions
supported by visible treatment decisions
safe to use downstream
```

A 10/10 system means:

```text
Every cost has one owner.
Every assumption is visible.
Every unresolved item blocks trust.
Every resolved item has a treatment.
Every downstream number is traceable.
Every variance has an explanation.
Every module has a clean contract.
```

Do not optimise for faster setup if doing so weakens the commercial model.

Do not hide a conceptual problem with code.

Do not allow convenience to override commercial correctness.

### Labour recovery and margin pool rules

Labour recovery visibility is a core product standard.

Do not treat total margin as sufficient proof that a quote-based business is recovering labour correctly.

Do not assume:

```text
Revenue - COGS = Labour content
```

That is too broad and can hide the labour recovery leak.

For fixed-price and quote-based businesses, distinguish:

```text
revenue
external/direct costs
subcontract labour
internal labour
general overhead recovery
asset ownership recovery
target profit
```

The defensible baseline concept is:

```text
Revenue
- external/direct costs
= margin / recovery pool
```

Then:

```text
margin / recovery pool
- required internal labour recovery
- required general overhead recovery
- required asset ownership recovery
- target profit
= recovery surplus / shortfall
```

If the surplus / shortfall is negative, the quote is commercially loss-making against the model even if a simple gross-margin view looks acceptable.

Subcontract labour must be visible separately from internal labour recovery.

Subcontract labour may be part of COGS, but it must not be confused with internal productive labour capacity.

Before quote-level analysis exists, the summary layers should still expose baseline labour recovery using Labour, Cost Summary, Recovery Summary, and Revenue Summary outputs.

Future Quote Benchmark should prove labour recovery quote-by-quote.

---

## Current build priority

The current cost setup readiness milestone is complete.

Model Readiness now passes with:

```text
P&L readiness PASS
Labour readiness PASS
General Overheads readiness PASS
Assets readiness PASS
Module Reconciliation PASS
Business benchmark variance diagnostic only
```

The current build priority is now:

```text
1. Commit and preserve the Cost Setup Readiness milestone.
2. Wire Cost Summary as a trusted / warning / blocked consumer of Model Readiness.
3. Ensure Cost Summary consumes upstream output contracts only.
4. Add Cost Summary visibility for:
   - total_labour_cost_annual
   - total_asset_cost_annual
   - total_general_overheads
   - total_cost_burden
   - required_revenue
   - required_recovery_rate
   - model_readiness_status
5. Add the later finance / interest bridge as diagnostic display only, not as a replacement for asset ownership cost.
```

Do not move to Recovery Summary until Cost Summary consumes the now-ready upstream contracts cleanly.

Do not treat Cost Summary as trusted/final until:

```text
Module Reconciliation exists
Model Readiness exists
diagnostics page confirms outputs
ModelReadinessStatusStrip exists
upstream blockers have been resolved or intentionally held as warnings
```

---

## Core code guardrails

Do not rename existing files, folders, components, functions, hooks, exports, imports, storage keys, route paths, or contract variables unless the task explicitly requires it.

Do not change public component props unless the task explicitly requires it.

Do not change localStorage keys unless the task explicitly requires it.

Do not change exported function names unless the task explicitly requires it.

Do not change existing route names or URLs unless the task explicitly requires it.

Do not change existing CSS class names unless the task explicitly requires it.

Do not replace working logic with a new pattern unless the change is required by the v3.6 source briefs.

Do not move files unless the task explicitly requires it.

Do not delete files unless the task explicitly requires it.

Prefer additive changes over destructive changes.

When a rename or contract change is required, update all imports, exports, references, tests, and source briefs consistently.

If an existing variable name conflicts with the v3.6 contract, create a small adapter / selector layer rather than rewriting the whole module unless explicitly asked.

Keep existing user-facing behaviour unless the v3.6 brief requires a change.

---

## File architecture rules

Follow this separation at all times:

```text
page.jsx = layout and orchestration only
hooks = integration / orchestration
calculations = business logic
selectors = shaping
storage = persistence
components = UI only
```

Do not put business logic in React components.

Do not put business logic in `page.jsx`.

Do not put persistence logic in UI components.

Do not put display formatting into calculation functions unless the relevant brief explicitly requires it.

Prefer small focused files over large all-in-one files.

Use adapters/selectors where needed to protect existing modules from unnecessary rewrites.

---

## Module ownership rules

### P&L owns

```text
pnl_ready
pnl_lines
pnl_categories
total_business_costs
labour_benchmark_total
assets_benchmark_total
general_overheads_benchmark_total
unassigned_balance
review_required_lines
accounting_adjustment_lines
```

P&L owns:

```text
raw P&L lines
P&L classification
P&L benchmark totals
review-required status
excluded status
WIP / accounting adjustment visibility
reusable P&L mapping over time
```

P&L benchmark values flow to Module Reconciliation only.

P&L values must not feed Cost Summary calculations directly.

P&L does not own downstream source-of-truth cost totals.

---

### General Overheads owns

```text
total_general_overheads
category_totals
general_overheads_ready
general_overheads_variance_amount
general_overheads_variance_percent
```

General Overheads owns:

```text
shared operating costs
staff overhead review categories
vehicle running costs
fleet running costs
office/admin costs
finance/admin overheads
insurance/compliance
sales/growth overheads
travel overheads
unclear / unallocated business costs after review
```

Only `total_general_overheads` may flow to Cost Summary.

General Overheads does not own Labour employer obligations.

General Overheads does not own asset ownership costs.

---

### Labour owns

```text
total_gross_wages_annual
total_entitlements_annual
total_employer_kiwisaver_annual
total_esct_annual
total_acc_levy_annual
total_employer_contribution_annual
total_labour_cost_annual
total_productive_output
labour_ready
```

Labour owns:

```text
gross wages
paid entitlements
employer KiwiSaver
ESCT
employer ACC levy
productive hours
```

Labour does not own staff overheads.

Labour does not own vehicle running costs.

Labour does not own asset ownership costs.

Labour output contracts must aggregate all active saved Labour profiles.

Active means:

```text
profile.is_active !== false
```

Module Reconciliation must consume aggregate Labour contract totals, not only the current Labour form calculation.

---

### Assets owns

```text
total_asset_cost_annual
total_asset_interest_annual
total_asset_principal_annual
assets_ready
no_active_assets_confirmed
```

Assets owns ownership-only costs:

```text
finance cost
lease cost
ownership cost
replacement / ownership recovery if explicitly enabled
```

Depreciation must not be included as a default cash recovery cost unless a locked v3.6 brief explicitly enables it.

Assets must not own:

```text
fuel
servicing
repairs
maintenance
registration
licensing
tyres
consumables
shared fleet costs
labour costs
vehicle running costs
```

Vehicle and fleet running costs belong in General Overheads.

Assets must distinguish:

```text
active asset
active finance
paid-off finance
term-ended finance
retired asset
sold asset
```

Paid-off or term-ended finance must not continue creating current finance cost.

Assets readiness is based on valid ownership records, not P&L benchmark matching.

P&L benchmark variance remains diagnostic only.

---

### Module Reconciliation owns

```text
reconciliation_ready
reconciliation_checks
blocking_checks
warning_checks
blocking_modules
warning_modules
module_total_business_costs
pnl_business_cost_variance
pnl_business_cost_variance_percent
```

Module Reconciliation is the evidence layer.

It checks whether upstream modules are internally consistent, contract-compliant, and safe to trust.

It must not recalculate upstream source-of-truth totals.

Business cost benchmark variance is diagnostic evidence unless a source module fails readiness.

---

### Model Readiness owns

```text
model_ready
blocking_modules
warning_modules
blocking_checks
warning_checks
model_readiness_status
```

Allowed `model_readiness_status` values:

```text
ready
warning
blocked
```

Model Readiness is the verdict layer.

Model Readiness does not create cost totals.

---

### Cost Summary owns

```text
total_people_cost_annual
total_asset_cost_annual
total_business_overheads
total_business_cost_annual
total_cost_burden
required_revenue
required_recovery_rate
total_productive_output
model_ready
blocking_modules
warning_modules
model_readiness_status
```

Cost Summary consumes upstream cost outputs only.

Cost Summary must not own reconciliation.

Cost Summary must not rebuild Labour, Assets, or General Overheads maths.

Cost Summary must consume Model Readiness outputs and clearly show whether the model is:

```text
trusted
warning
blocked
```

---
## P&L interest treatment rule

P&L interest treatment is factual metadata only.

Allowed states:

```text
not_reviewed
contains_asset_finance_interest
no_asset_finance_interest
```

Legacy mappings:

```text
unknown → not_reviewed
asset_finance_exclude → contains_asset_finance_interest
general_overhead_keep → no_asset_finance_interest
```

Selecting `contains_asset_finance_interest` must not:

```text
delete the line
exclude the line
zero the line
unwire the line
remove the line from General Overheads
```

The full P&L interest value remains inside the model.

General Overheads must carry the full interest value forward.

Cost Summary may later show a diagnostic finance / interest bridge comparing:

```text
P&L interest total
P&L interest marked as containing asset finance
total_asset_interest_annual
total_asset_principal_annual
total_asset_cost_annual
```

The bridge is explanatory only.

It must not replace `total_asset_cost_annual`.

---

## P&L reusable mapping rule

The first P&L setup may take time because it creates a reusable explicit mapping layer.

The reusable mapping layer should connect:

```text
P&L account / Xero account / report line
→ QS category
→ review subcategory
→ treatment
→ owning module
→ readiness impact
```

Future monthly P&L entry or Xero API import should use this mapping.

Known mapped lines should map automatically.

New, changed, or unresolved lines should be highlighted for review.

Do not optimise for faster setup if it weakens the commercial model.

---

## WIP / accounting adjustment rule

WIP Adjustment must not be automatically assigned to:

```text
COGS
General Overheads
Labour
Assets
Income
Excluded
```

WIP Adjustment must default to:

```text
category: review_required
review_subcategory: wip_accounting_adjustment
```

WIP remains a blocker until explicitly resolved.

Allowed WIP treatments:

```text
Leave as Review Required
Exclude from QS Cost Model
Include as COGS / Direct Job Cost
Treat as Income / Revenue Timing Adjustment
```

Do not auto-resolve WIP.

Do not silently exclude WIP.

Do not silently include WIP in COGS.

WIP is an accounting/timing adjustment until the user explicitly resolves it.

---

## Removed / banned concepts

Do not reintroduce:

```text
Employee Overheads module
Staff Overheads module
Employee Overheads as a downstream input
Staff Overheads as a downstream input
running costs inside Assets
raw P&L lines feeding Cost Summary
Cost Summary owning reconciliation
Cost Summary rebuilding upstream maths
Cost Allocation as an active v3.6 module
Budget as an active v3.6 module
```

Banned variables include:

```text
employee_overheads_total
total_employee_overheads_annual
employee_overheads_total_annual
employee_overheads_benchmark_total
employee_overheads_ready
employee_overheads_status
employee_overheads_variance_amount
employee_overheads_variance_percent
employee_overheads_annual
staff_overheads_total
staff_overheads_ready
running_cost_annual inside Cost Summary
active_revenue_model inside Cost Summary
active_asset_labour_links inside Cost Summary
```

---

## Downstream contract rules

Upstream modules own inputs and calculations.

Downstream modules consume outputs only.

Never rebuild upstream maths downstream.

Never read raw upstream form state in downstream modules.

Never rename locked contract variables.

Never use display names as join keys.

Use IDs only for joins.

If a downstream module needs a value, expose it through a selector, hook, or contract output. Do not reach into raw upstream state.

---

## Naming rules

Internal contract variables use snake_case.

Folder names use kebab-case.

Component names use PascalCase and module prefixes.

IDs must use `_id` format.

Do not introduce camelCase internal contract variables.

If existing React prop names use camelCase, do not rewrite the whole codebase. Keep new cross-module contracts snake_case.

Do not rename existing symbols only for style preference.

Do not rename existing storage keys unless explicitly required by a locked source brief.

Do not rename route paths unless explicitly requested.

Do not rename component props if downstream components already depend on them.

---

## UI rules

Use the QS Tools UI system only.

Do not add:

```text
inline styles
hardcoded colours
text-white
bg-* hacks
one-off styling patterns
```

Use existing `ui-*` classes and CSS tokens.

Do not redesign UI unless the task explicitly asks for design changes.

Warnings must be actionable.

Avoid generic warnings where the user cannot see what to fix.

If a model is blocked, show the user:

```text
what is blocked
why it is blocked
where to fix it
what happens if ignored
```

---

## Required files for current build

For Module Reconciliation:

```text
lib/reconciliation/reconciliationRules.js
lib/reconciliation/moduleReconciliation.js
hooks/useModuleReconciliation.js
```

For Model Readiness:

```text
lib/calculations/modelReadinessCalculations.js
hooks/useModelReadiness.js
components/model-readiness/ModelReadinessStatusStrip.jsx
```

Temporary diagnostics page:

```text
app/dev/model-readiness/page.jsx
```

Do not add the diagnostics page to the main sidebar unless explicitly requested.

---

## Module Reconciliation rules

Each reconciliation check should use this shape:

```js
{
  check_id,
  module,
  severity,
  passed,
  message,
  detail,
  recommended_action
}
```

Allowed severity values:

```text
blocker
warning
info
```

Module Reconciliation must output:

```text
reconciliation_ready
reconciliation_checks
blocking_checks
warning_checks
blocking_modules
warning_modules
```

Module Reconciliation must not:

```text
recalculate Labour
recalculate Assets
recalculate General Overheads
edit P&L lines
move costs automatically
create pricing logic
create recovery logic
create new source-of-truth totals
```

---

## Model Readiness rules

Readiness formula:

```text
model_ready =
pnl_ready
AND general_overheads_ready
AND labour_ready
AND assets_ready
AND reconciliation_ready
AND blocking_checks.length = 0
```

Status formula:

```text
if blocking_checks.length > 0:
  model_readiness_status = "blocked"

else if warning_checks.length > 0:
  model_readiness_status = "warning"

else:
  model_readiness_status = "ready"
```

Model Readiness must not:

```text
recalculate Labour
recalculate Assets
recalculate General Overheads
reclassify P&L
create cost totals
create recovery logic
create pricing logic
```

---

## Cost Summary rules

Cost Summary formulas:

```text
total_people_cost_annual =
total_labour_cost_annual

total_business_overheads =
total_general_overheads

total_business_cost_annual =
total_asset_cost_annual + total_business_overheads

total_cost_burden =
total_people_cost_annual
+ total_asset_cost_annual
+ total_business_overheads

required_revenue =
total_cost_burden

required_recovery_rate =
required_revenue / total_productive_output
```

If `total_productive_output = 0`:

```text
required_recovery_rate = 0
warning required
```

Cost Summary must consume Model Readiness outputs and show not-trusted state when `model_ready = false`.

Cost Summary must not consume raw P&L lines directly.

Cost Summary must not rebuild Labour, Assets, or General Overheads calculations.

Cost Summary may show P&L benchmark diagnostics only through prepared reconciliation/readiness outputs.

---

## Long-term commercial control loop

Future monthly P&L import, Xero API integration, accepted quote tracking, and actual-vs-model performance analysis must come after the baseline model is commercially defensible.

The long-term QS Tools loop is:

```text
Baseline setup
→ trusted cost model
→ quote benchmark
→ quote accepted / rejected
→ monthly P&L import
→ actual performance vs model
→ variance analysis
→ better future pricing decisions
```

The first P&L setup creates the reusable business mapping layer that future monthly imports and Xero API integration will rely on.

A weak baseline creates weak monthly analysis.

A trusted baseline creates meaningful commercial control.

Do not build monthly import or Xero API integration before the baseline engine is stable.

---

## Before editing

Before making changes:

```text
1. Inspect the existing file structure.
2. Identify existing hooks, storage, calculation files, selectors, and page/component patterns.
3. Identify existing storage keys and exported names.
4. Reuse existing conventions.
5. Confirm actual variable names currently used in code.
6. Avoid guessing when existing code already defines the source of truth.
7. Report conflicts between existing code and v3.6 before broad changes.
```

---

## Build rules

After editing, run:

```bash
npm run build
```

Then report:

```text
files changed
build result
warnings/errors
anything intentionally not changed
```

If the build fails, do not keep making unrelated changes. Report the failure and the likely cause.

For inspect-only tasks, do not run `npm run build` unless explicitly requested.

For implementation tasks, run `npm run build` once unless a build error requires one narrow follow-up fix.

---

## Git / checkpoint rules

Prefer small commits.

Commit after a working build.

Do not bundle unrelated changes into one commit.

If a change goes sideways, stop and use Git rather than piling on fixes.

Before risky changes, create a backup branch or patch if needed.

Do not commit failed experiments unless explicitly instructed.

---

## Safety rules

Do not make broad rewrites unless explicitly requested.

Do not change unrelated modules.

Do not delete source files.

Do not change contracts without a matching v3.6 brief.

Do not silently remove working behaviour unless the v3.6 source pack requires it.

Do not make speculative improvements outside the task.

Do not refactor for neatness unless the task requires refactoring.

Do not change styling, routing, storage, or contracts as a side effect of another change.

Do not hide unresolved commercial assumptions with code.

If a task reveals a conflict between current code and v3.6 source briefs, report the conflict and propose the smallest safe fix.

When uncertain, inspect first and report before editing.

---

## Codex work pattern

For each task, follow this order:

1. Read `AGENTS.md`.
2. Read the relevant v3.6 source brief.
3. Inspect the relevant files only.
4. Make the smallest safe change.
5. Run `npm run build` if implementation changed code.
6. Report changed files and result.
7. Stop.

Do not keep expanding scope without explicit instruction.

Do not refactor while fixing a bug unless the refactor is required to fix the bug.