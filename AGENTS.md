# QS Tools — Codex Project Instructions

## Project role

This repository is QS Tools, a first-principles commercial decision engine for construction/business costing.

QS Tools is based on:

- strict module ownership
- downstream contracts
- visible assumptions
- controlled source files
- reconciliation
- model readiness
- commercially defensible cost recovery

Core principle:

> Simple in hindsight. Invisible beforehand.

Every cost must belong to exactly one module.

If a cost appears in more than one module, the system is incorrect.

QS Tools must be good enough to defend, not just good enough to work.

---

## Active source version

Use only the v3.6 source briefs.

The active source pack is stored at:

```text
docs/V3.6 Source Files
```

Do not use v3.5 or older source files unless the task explicitly says they are deprecated history.

The v3.6 source pack is the active source of truth.

If a coding decision conflicts with a locked v3.6 source brief, report the conflict before editing.

If existing code conflicts with v3.6, report the conflict before changing broad architecture.

If a rule is not written, do not invent it. Ask for the brief to be updated first.

---

## Required source briefs

Before making changes, read the relevant locked v3.6 source briefs.

Always start with these control briefs:

```text
docs/V3.6 Source Files/00_FIRST_PRINCIPLES_SYSTEM_BRIEF_v3.6_LOCKED.txt
docs/V3.6 Source Files/00_PRODUCT_STANDARD_AND_COMMERCIAL_DEFENSIBILITY_v3.6_LOCKED.txt
docs/V3.6 Source Files/01_ACTIVE_SYSTEM_BRIEF_v3.6_LOCKED.txt
docs/V3.6 Source Files/02_IMPLEMENTATION_ORDER_v3.6_LOCKED.txt
docs/V3.6 Source Files/03_VARIABLE_CONTRACT_BRIEF_v3.6_LOCKED.txt
```

For current Assets / Cost Summary work, also read:

```text
docs/V3.6 Source Files/04_PNL_PAGE_v3.6_LOCKED.txt
docs/V3.6 Source Files/05_GENERAL_OVERHEADS_v3.6_LOCKED.txt
docs/V3.6 Source Files/06_GENERAL_OVERHEADS_CATEGORY_MAPPING_v3.6_LOCKED.txt
docs/V3.6 Source Files/09_ASSETS_MODULE_v3.6_LOCKED.txt
docs/V3.6 Source Files/11_MODEL_READINESS_v3.6_LOCKED.txt
docs/V3.6 Source Files/13_COST_SUMMARY_v3.6_LOCKED.txt
docs/V3.6 Source Files/14_COST_SUMMARY_BUILD_BRIEF_v3.6_LOCKED.txt
docs/V3.6 Source Files/18_QS Tools — Cost Setup Readiness Milestone Brief_v3.6_LOCKED.txt
```

For downstream commercial layers, read:

```text
docs/V3.6 Source Files/19_REVENUE_COGS_v3.6_LOCKED.txt
docs/V3.6 Source Files/20_BUSINESS_SUMMARY_v3.6_LOCKED.txt
docs/V3.6 Source Files/21_BUSINESS_MODELLING_v3.6_LOCKED.txt
docs/V3.6 Source Files/22_QUOTE_ENGINE_v3.6_LOCKED.txt
```

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
→ Revenue / COGS
→ Business Summary
→ Business Modelling
→ Quote Engine later
→ Cash Flow later
→ Production Capacity later
```

Core separation:

```text
P&L = raw financial input and benchmark/classification only

General Overheads = shared / unclear / staff overhead / vehicle running / non-asset overhead cost classification

Labour = people cost, employer obligations, productive hours

Assets = ownership-only asset costs and asset finance interest

Module Reconciliation = evidence layer

Model Readiness = trust gate

Cost Summary = forward-looking operating cost burden

Revenue / COGS = trading-side margin pool

Business Summary = current business mirror

Business Modelling = locked baseline and editable scenario layer

Quote Engine = future quote-level commercial test layer

Cash Flow = future principal / finance payment pressure layer

Production Capacity = future delivery realism layer
```

The old active flow is no longer current:

```text
Cost Summary
→ Recovery Summary
→ Rate Models
→ Production Capacity
→ Recovery Outcome
→ Quote Benchmark
→ Budget
```

Do not rebuild toward that old flow unless a later locked v3.6 brief explicitly reinstates it.

---

## Current build priority

The current priority is:

```text
1. Keep v3.6 source briefs aligned.
2. Run narrow Codex inspection / alignment for Assets.
3. Confirm Assets:
   - remains ownership-only
   - excludes running costs
   - calculates forward-looking asset finance interest
   - does not use P&L interest as asset finance authority
   - excludes principal repayments from total_asset_cost_annual
   - excludes principal repayments from Cost Summary
   - exposes total_asset_cost_annual
   - exposes total_asset_interest_annual where available
4. Confirm General Overheads:
   - owns vehicle running costs
   - owns non-asset interest
   - excludes asset finance interest
5. Confirm Labour:
   - exposes total_labour_cost_annual
   - exposes final total_productive_output after entitlement and productivity logic
6. Finalise Cost Summary:
   - consumes upstream output contracts only
   - uses total_cost_burden / total_productive_output
   - displays trusted / warning / blocked state
7. Build Revenue / COGS.
8. Build Business Summary.
9. Build Business Modelling.
10. Build Quote Engine later.
11. Build Cash Flow later.
```

Do not move to Revenue / COGS until Cost Summary consumes the aligned upstream contracts cleanly.

Do not build Quote Engine yet.

`22_QUOTE_ENGINE_v3.6_LOCKED.txt` exists as a future boundary brief only.

---

## First-principles rules

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

Do not hide a conceptual problem with code.

Do not allow convenience to override commercial correctness.

---

## Product standard rules

QS Tools must be:

```text
Good enough to defend, not just good enough to work.
```

Every important output must survive challenge.

A trusted number must be:

```text
traceable
explainable
reconciled
owned by one module
free from hidden assumptions
supported by visible treatment decisions
safe to use downstream
clearly marked as historical, current, forward-looking, diagnostic, or scenario-based
```

Do not treat gross margin as proof of profit.

Do not treat total margin as proof that a quote-based business is recovering labour correctly.

Do not assume:

```text
Revenue - COGS = Labour content
```

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

Subcontract labour must be visible separately from internal labour recovery.

---

## Critical locked rules

### Cost ownership

Every cost must have one owner.

Examples:

```text
Salary & Wages → Labour
Employer KiwiSaver → Labour
ESCT → Labour
Employer ACC Levy → Labour

Staff expenses / PPE / welfare / recruitment → General Overheads
Vehicle fuel / servicing / repairs / tyres / registration → General Overheads

Asset ownership / lease / finance cost → Assets
Asset finance interest → Assets

Non-asset interest / overdraft / working capital interest → General Overheads

Revenue and Direct Costs / COGS → Revenue / COGS

Principal repayments → Cash Flow later
```

### Asset finance interest

Assets is the source of truth for asset finance interest.

P&L interest may be historical accounting context.

P&L interest must not override asset finance interest calculated by Assets.

Asset finance interest must be current / forward-looking.

The purpose is to estimate the asset finance interest the business needs to recover going forward, not to reconstruct the exact historical interest charged in the previous P&L period.

### Cash flow separation

Principal repayments are real cash pressure.

Principal repayments are not operating cost.

Principal repayments must not feed:

```text
total_asset_cost_annual
total_general_overheads
total_cost_burden
required_recovery_rate
Cost Summary
```

Principal belongs in the future Cash Flow layer.

Interest belongs in cost.

Principal belongs in cash flow.

### P&L role

P&L is raw financial input and classification context.

P&L benchmark values flow to Module Reconciliation only.

P&L values must not feed Cost Summary calculations directly.

P&L classified income and COGS / Direct Cost outputs may feed Revenue / COGS.

### Macro / micro classification

Macro classification drives the v3.6 core engine.

Micro / activity classification may be captured for future insight, but must not drive Cost Summary or Revenue / COGS unless a later locked brief explicitly promotes it.

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

Follow this separation:

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

## Naming rules

Internal contract variables use snake_case.

Folder names use kebab-case.

Component names use PascalCase and module prefixes.

IDs must use `_id` format.

Do not introduce camelCase internal contract variables for new cross-module contracts.

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

Warnings must be actionable.

If a model is blocked, show:

```text
what is blocked
why it is blocked
where to fix it
what happens if ignored
```

---

## Downstream contract rules

Upstream modules own inputs and calculations.

Downstream modules consume outputs only.

Never rebuild upstream maths downstream.

Never read raw upstream form state in downstream modules unless a locked brief explicitly allows it.

Never rename locked contract variables without a matching source brief update.

Never use display names as join keys.

Use IDs only for joins.

If a downstream module needs a value, expose it through a selector, hook, or contract output. Do not reach into raw upstream state.

---

## Module-specific guardrails

### P&L

P&L owns:

```text
raw P&L lines
P&L classification
P&L benchmark totals
income / revenue classification
COGS / direct cost classification
review-required status
excluded status
WIP / accounting adjustment visibility
reusable P&L mapping over time
```

P&L does not own downstream source-of-truth cost totals.

P&L benchmark values must not feed Cost Summary calculations directly.

P&L classified income and COGS / direct cost outputs may feed Revenue / COGS.

### General Overheads

General Overheads owns:

```text
total_general_overheads
category_totals
general_overheads_ready
general_overheads_variance_amount
general_overheads_variance_percent
non_asset_interest_annual
```

Only `total_general_overheads` may flow to Cost Summary.

General Overheads does not own Labour employer obligations.

General Overheads does not own asset ownership costs.

General Overheads does not own asset finance interest.

### Labour

Labour owns:

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

Labour output contracts must aggregate all active saved Labour profiles.

Active means:

```text
profile.is_active !== false
```

Cost Summary must use Labour’s final `total_productive_output`.

Cost Summary must not use paid hours, raw working hours, or pre-productivity hours.

### Assets

Assets owns:

```text
total_asset_cost_annual
total_asset_interest_annual
assets_ready
no_active_assets_confirmed
```

Assets owns ownership-only asset costs and asset finance interest.

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
principal repayments as operating cost
```

Vehicle and fleet running costs belong in General Overheads.

Principal repayments belong to Cash Flow later.

### Module Reconciliation

Module Reconciliation is the evidence layer.

It owns:

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

It must not recalculate upstream source-of-truth totals.

Business cost benchmark variance is diagnostic evidence unless a source module fails readiness.

### Model Readiness

Model Readiness is the verdict layer.

It owns:

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

Model Readiness does not create cost totals.

### Cost Summary

Cost Summary owns:

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

### Revenue / COGS

Revenue / COGS owns:

```text
total_revenue
total_direct_costs
margin_pool
gross_margin_percent
revenue_cogs_ready
revenue_cogs_warnings
```

Revenue / COGS calculates:

```text
Revenue - Direct Costs = Margin Pool
```

Revenue / COGS must not calculate Cost Summary.

Revenue / COGS must not define pricing.

### Business Summary

Business Summary owns:

```text
business_summary_ready
total_revenue
total_direct_costs
margin_pool
gross_margin_percent
total_cost_burden
net_position
total_productive_output
required_recovery_rate
current_margin_per_productive_hour
recovery_gap_per_hour
business_summary_status
business_summary_warnings
```

Business Summary is the factual mirror.

It must not suggest fixes or create scenarios.

### Business Modelling

Business Modelling owns:

```text
baseline_snapshot
active_scenario
upside_scenario
downside_scenario
scenario_delta_annual
scenario_delta_per_hour
scenario_net_position
scenario_required_recovery_rate
scenario_margin_per_productive_hour
scenario_recovery_gap_per_hour
modelling_ready
modelling_warnings
```

Baseline is read-only.

Scenario is editable.

Business Modelling must not mutate source modules.

### Quote Engine later

Quote Engine is governed by:

```text
docs/V3.6 Source Files/22_QUOTE_ENGINE_v3.6_LOCKED.txt
```

Quote Engine is not ready to build yet.

Do not build Quote Engine until:

```text
Cost Summary is trusted
Revenue / COGS exists
Business Summary exists
Business Modelling exists
selected baseline / scenario trust state exists
```

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
Recovery Summary as the next active v3.6 module
Rate Models as the next active v3.6 module
Recovery Outcome as the next active v3.6 module
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
principal repayments inside Cost Summary
principal repayments inside total_asset_cost_annual
principal repayments inside total_general_overheads
quote outputs inside Cost Summary
cash-flow outputs inside Cost Summary
```

---

## Build rules

After implementation changes, run:

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

If the build fails, do not keep making unrelated changes.

Report the failure and the likely cause.

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

## Before editing

Before making changes:

```text
1. Read AGENTS.md.
2. Read the relevant v3.6 source brief.
3. Inspect the existing file structure.
4. Identify existing hooks, storage, calculation files, selectors, and page/component patterns.
5. Identify existing storage keys and exported names.
6. Confirm actual variable names currently used in code.
7. Reuse existing conventions.
8. Avoid guessing when existing code already defines the source of truth.
9. Report conflicts between existing code and v3.6 before broad changes.
```

---

## Codex work pattern

For each task, follow this order:

```text
1. Read AGENTS.md.
2. Read the relevant v3.6 source brief.
3. Inspect the relevant files only.
4. Make the smallest safe change.
5. Run npm run build if implementation changed code.
6. Report changed files and result.
7. Stop.
```

Do not keep expanding scope without explicit instruction.

Do not refactor while fixing a bug unless the refactor is required to fix the bug.

Do not run broad tasks when a narrow inspection or alignment task is enough.