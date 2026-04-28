# QS Tools — Codex Project Instructions

## Project role

This repository is QS Tools, a first-principles commercial decision engine for construction/business costing.

The system is based on strict module ownership, downstream contracts, visible assumptions, and controlled source files.

Core principle:

> Simple in hindsight. Invisible beforehand.

Every cost must belong to exactly one module.

If a cost appears in more than one module, the system is incorrect.

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

If a coding decision conflicts with the First Principles brief, report the conflict before editing.

If existing code conflicts with v3.6, report the conflict before changing broad architecture.

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

## Current build priority

The next implementation unit is:

```text
Module Reconciliation + Model Readiness Gate
```

Build this before finalising Cost Summary.

Do not treat Cost Summary as trusted/final until:

```text
Module Reconciliation exists
Model Readiness exists
diagnostics page confirms outputs
ModelReadinessStatusStrip exists
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
```

P&L benchmark values flow to Module Reconciliation only.

P&L values must not feed Cost Summary calculations directly.

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
unclear / unallocated business costs
```

Only `total_general_overheads` may flow to Cost Summary.

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

---

### Assets owns

```text
total_asset_cost_annual
assets_ready
```

Assets owns ownership-only costs:

```text
finance cost
lease cost
depreciation cost
ownership cost
```

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
```

Vehicle and fleet running costs belong in General Overheads.

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

When uncertain, inspect first and report before editing.