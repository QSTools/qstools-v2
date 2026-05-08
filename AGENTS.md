# QS Tools — Codex Project Instructions

## AGENTS.md — v3.8 MODE-AWARE BUILD INSTRUCTIONS

**STATUS:** ACTIVE CODEX INSTRUCTIONS
**VERSION:** v3.8
**REPLACES:** AGENTS.md v3.6 instructions
**UPDATED FOR:** Business Setup, mode-aware Revenue / COGS, mode-aware Business Summary, and activity-driver recovery logic

---

## Project Role

This repository is QS Tools, a first-principles commercial decision engine for construction and business costing.

QS Tools is based on:

```text
strict module ownership
downstream contracts
visible assumptions
controlled source files
reconciliation
model readiness
commercially defensible cost recovery
mode-aware recovery through hours or units
```

Core principle:

```text
Simple in hindsight. Invisible beforehand.
```

Every cost must belong to exactly one module.

If a cost appears in more than one module, the system is incorrect.

QS Tools must be good enough to defend, not just good enough to work.

---

## Active Source Version

Use the current active source briefs.

The project has moved beyond the old v3.6-only source pack.

The active build is now governed by:

```text
v3.8 locked source briefs where available
v3.7 locked source briefs where not yet superseded
older briefs only when explicitly marked as deprecated history or migration reference
```

Do not use v3.6 as the active source of truth unless the task explicitly says to inspect legacy v3.6 history.

If a coding decision conflicts with a locked active source brief, report the conflict before editing.

If existing code conflicts with the active brief, report the conflict before changing broad architecture.

If a rule is not written, do not invent it. Ask for the brief to be updated first.

---

## Active Source Pack Location

The preferred active source pack location is:

```text
docs/V3.8 Source Files
```

If the repository still stores active files in an older folder during migration, use the newest active locked brief by filename/version, not the folder name alone.

Important:

```text
Folder name does not override brief version.
The newest active locked brief wins.
```

---

## Required Source Brief Read Order

Before making changes, read the relevant active locked source briefs.

Always start with the current control briefs where present:

```text
00_FIRST_PRINCIPLES_SYSTEM_BRIEF_*_LOCKED.txt
00_PRODUCT_STANDARD_AND_COMMERCIAL_DEFENSIBILITY_*_LOCKED.txt
01_ACTIVE_SYSTEM_BRIEF_*_LOCKED.txt
02_IMPLEMENTATION_ORDER_*_LOCKED.txt
03_VARIABLE_CONTRACT_BRIEF_*_LOCKED.txt
```

For the current mode-aware foundation, always read:

```text
24_Bussiness_Setup_v3.7_Locked.txt
19_REVENUE_COGS_v3.8_LOCKED.txt
20_BUSINESS_SUMMARY_v3.8_LOCKED.txt
```

For cost setup and readiness work, read the active versions of:

```text
04_PNL_PAGE_*.txt
05_GENERAL_OVERHEADS_*.txt
06_GENERAL_OVERHEADS_CATEGORY_MAPPING_*.txt
07_LABOUR_MODULE_*.txt
08_LABOUR_ACC_INTEGRATION_*.txt
09_ASSETS_MODULE_*.txt
10_MODULE_RECONCILIATION_*.txt
11_MODEL_READINESS_*.txt
13_COST_SUMMARY_*.txt
14_COST_SUMMARY_BUILD_BRIEF_*.txt
18_COST_SETUP_READINESS_MILESTONE_*.txt
```

For downstream commercial layers, read the active versions of:

```text
Recovery Summary brief
Cost Allocation brief
Business Outcome brief
21_BUSINESS_MODELLING_*.txt
22_QUOTE_ENGINE_*.txt
23_BUSINESS_FEEDBACK_LOOP_*.txt
```

Do not rely on memory of a brief. Read the relevant file before editing.

---

## Active System Flow

The active practical flow is:

```text
Business Setup
→ P&L
→ Revenue / COGS
→ General Overheads / Labour / Assets
→ Module Reconciliation
→ Model Readiness
→ Cost Summary
→ Business Summary
→ Recovery Summary
→ Cost Allocation
→ Business Outcome
→ Business Modelling
→ Quote Engine later
→ Accepted Quote Snapshot later
→ Monthly Actuals / Feedback Loop later
→ Cash Flow later
→ Production Capacity later
```

Core separation:

```text
Business Setup = business identity and recovery driver mode
P&L = raw financial input and benchmark/classification only
Revenue / COGS = trading-side margin pool and units_sold_annual where product-based
General Overheads = shared / unclear / staff overhead / vehicle running / non-asset overhead cost classification
Labour = people cost, employer obligations, productive hours
Assets = ownership-only asset costs and asset finance interest
Module Reconciliation = evidence layer
Model Readiness = trust gate
Cost Summary = forward-looking operating cost burden
Business Summary = current business mirror through selected activity driver
Recovery Summary = recovery plan / intended recovery method
Cost Allocation = whether the structure can deliver the recovery plan
Business Outcome = whether the model works
Business Modelling = locked baseline and editable scenario layer
Quote Engine = quote-level leak detection later
Accepted Quote Snapshot = locked prediction later
Monthly Actuals / Feedback Loop = macro prediction-vs-reality later
Cash Flow = future principal / finance payment pressure layer
Production Capacity = future delivery realism layer
```

---

## Mode-Aware Recovery Principle

QS Tools uses one universal recovery equation:

```text
Total Business Cost ÷ Activity Driver = Required Recovery Per Output
```

The activity driver is selected by Business Setup.

```text
labour_based  → productive hours → $/hour
product_based → units sold       → $/unit
```

This is not an industry category.

It is the output driver used by the system to interpret recovery pressure.

---

## Current Build Priority

The current priority is:

```text
1. Confirm Business Setup persists and exposes business_type.
2. Confirm Revenue / COGS consumes business_type.
3. Confirm product_based Revenue / COGS captures and persists units_sold_annual.
4. Confirm Business Summary consumes mode-aware Revenue / COGS outputs.
5. Confirm Business Summary calculates per-hour or per-unit recovery correctly.
6. Preserve legacy hour fields for Business Modelling compatibility.
7. Update Recovery Summary to consume Business Summary activity-driver outputs.
8. Update Cost Allocation only after Recovery Summary is mode-aware.
9. Update Business Outcome after Recovery Summary and Cost Allocation are aligned.
10. Defer product-mode Business Modelling and Quote Engine changes until separately briefed.
```

Do not build Quote Engine yet unless explicitly instructed by a current locked brief and task.

Do not build Feedback Loop yet.

Do not build Cash Flow yet.

Do not build Production Capacity yet.

Do not run broad Codex tasks against unclear behaviour.

Use:

```text
Brief first. Narrow build second. Verify. Commit. Move on.
```

---

## First-Principles Rules

QS Tools must not hide assumptions, invent recovery numbers, or create commercial outputs that cannot be traced back to real business costs and real business output.

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

## Product Standard Rules

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
clearly marked as historical, current, forward-looking, diagnostic, scenario-based, or prediction-based
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

## Critical Locked Rules

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
required_recovery_per_driver
Cost Summary
Business Summary
```

Principal belongs in the future Cash Flow layer.

Interest belongs in cost.

Principal belongs in cash flow.

### P&L role

P&L is raw financial input and classification context.

P&L benchmark values flow to Module Reconciliation only.

P&L values must not feed Cost Summary calculations directly.

P&L classified income and COGS / direct cost outputs may feed Revenue / COGS.

### Macro / micro classification

Macro classification drives the core engine.

Micro / activity classification may be captured for future insight, but must not drive Cost Summary, Revenue / COGS, or Business Summary unless a later locked brief explicitly promotes it.

---

## Core Code Guardrails

Do not rename existing files, folders, components, functions, hooks, exports, imports, storage keys, route paths, or contract variables unless the task explicitly requires it.

Do not change public component props unless the task explicitly requires it.

Do not change localStorage keys unless the task explicitly requires it.

Do not change exported function names unless the task explicitly requires it.

Do not change existing route names or URLs unless the task explicitly requires it.

Do not change existing CSS class names unless the task explicitly requires it.

Do not replace working logic with a new pattern unless the change is required by the active source briefs.

Do not move files unless the task explicitly requires it.

Do not delete files unless the task explicitly requires it.

Prefer additive changes over destructive changes.

When a rename or contract change is required, update all imports, exports, references, tests, and source briefs consistently.

If an existing variable name conflicts with the active contract, create a small adapter / selector layer rather than rewriting the whole module unless explicitly asked.

Keep existing user-facing behaviour unless the active brief requires a change.

---

## File Architecture Rules

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

## Naming Rules

Internal contract variables use snake_case.

Folder names use kebab-case.

Component names use PascalCase and module prefixes.

IDs must use `_id` format.

Do not introduce camelCase internal contract variables for new cross-module contracts.

If existing React prop names use camelCase, do not rewrite the whole codebase. Keep new cross-module contracts snake_case.

Do not rename existing symbols only for style preference.

---

## UI Rules

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

Warnings must be explicit.

Do not show only vague warning counts where the user needs the actual issue.

---

## Downstream Contract Rules

Upstream modules own inputs and calculations.

Downstream modules consume outputs only.

Never rebuild upstream maths downstream.

Never read raw upstream form state in downstream modules unless a locked brief explicitly allows it.

Never rename locked contract variables without a matching source brief update.

Never use display names as join keys.

Use IDs only for joins.

If a downstream module needs a value, expose it through a selector, hook, or contract output.

Do not reach into raw upstream state.

---

# Module-Specific Guardrails

---

## Business Setup

Business Setup owns:

```text
business_name
business_type
is_labour_based
is_product_based
setup_completed
```

Allowed `business_type` values:

```text
labour_based
product_based
```

Business Setup must persist saved mode and must not overwrite saved state before storage has loaded.

Business Setup must remain editable during the current development phase.

Business Setup must not calculate financial outputs.

Business Setup must not mutate downstream modules directly.

---

## P&L

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
future monthly actuals later
```

P&L does not own downstream source-of-truth cost totals.

P&L benchmark values must not feed Cost Summary calculations directly.

P&L classified income and COGS / direct cost outputs may feed Revenue / COGS.

P&L does not calculate Margin Pool.

P&L does not compare accepted quotes to monthly actuals.

---

## Revenue / COGS

Revenue / COGS owns:

```text
total_revenue
total_direct_costs
margin_pool
gross_margin_percent
revenue_cogs_ready
revenue_cogs_warnings
business_type
is_labour_based
is_product_based
units_sold_annual
```

Revenue / COGS calculates:

```text
Revenue - Direct Costs = Margin Pool
```

Revenue / COGS must not calculate Cost Summary.

Revenue / COGS must not define pricing.

Revenue / COGS must not calculate Net Position.

Revenue / COGS must not calculate required recovery per unit, per hour, or per driver.

In product-based mode, Revenue / COGS captures and persists `units_sold_annual`.

In labour-based mode, `units_sold_annual` must be hidden and must not affect readiness.

---

## General Overheads

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

Category subtotals are display/review only unless a later locked brief promotes them.

General Overheads does not own Labour employer obligations.

General Overheads does not own asset ownership costs.

General Overheads does not own asset finance interest.

---

## Labour

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
productive_labour_cost_rate where available
labour_ready
```

Labour output contracts must aggregate all active saved Labour profiles.

Active means:

```text
profile.is_active !== false
```

Cost Summary must use Labour’s final `total_productive_output`.

Cost Summary must not use paid hours, raw working hours, or pre-productivity hours.

In product-based mode, Labour remains a cost source and productive capacity source, but Business Summary uses `units_sold_annual` as the primary recovery driver.

---

## Assets

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

Asset finance interest must be forward-looking and sourced from Assets, not historical P&L interest.

---

## Module Reconciliation

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

Module Reconciliation does not calculate Margin Pool, Net Position, quote gaps, or feedback-loop outputs.

---

## Model Readiness

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

Downstream modules must inherit model readiness/trust state.

---

## Cost Summary

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

Cost Summary must not calculate required recovery per unit.

Cost Summary still owns the hour-based `required_recovery_rate`:

```text
total_cost_burden / total_productive_output
```

Business Summary decides whether recovery is displayed through productive hours or units sold.

---

## Business Summary

Business Summary owns:

```text
business_summary_ready
business_type
activity_driver_type
activity_driver_label
activity_driver_value
required_recovery_per_driver
required_recovery_label
required_recovery_unit_label
current_margin_per_driver
current_margin_label
recovery_gap_per_driver
recovery_gap_label
total_revenue
total_direct_costs
margin_pool
gross_margin_percent
total_cost_burden
total_productive_output
units_sold_annual
net_position
business_summary_status
business_summary_warnings
model_trust_state
revenue_cogs_ready
cost_summary_ready
```

Business Summary is the factual mirror.

It combines Revenue / COGS Margin Pool with Cost Summary Operating Cost Burden.

It uses the selected activity driver:

```text
labour_based  → total_productive_output
product_based → units_sold_annual
```

Business Summary must not suggest fixes or create scenarios.

Business Summary must not calculate quote pricing or quote gaps.

Business Summary must not mutate Business Setup, Revenue / COGS, or Cost Summary.

Business Summary must preserve legacy hour-based outputs for Business Modelling compatibility:

```text
required_recovery_rate
current_margin_per_productive_hour
recovery_gap_per_hour
current_margin_per_hour
hourly_gap
```

---

## Recovery Summary

Recovery Summary consumes Business Summary outputs and owns the intended recovery plan.

Recovery Summary must consume the mode-aware Business Summary contract.

It must not assume all recovery is labour/hour-based.

Recovery Summary must not recalculate Business Summary.

Recovery Summary must not mutate Business Setup, Revenue / COGS, Cost Summary, or Business Summary.

---

## Cost Allocation

Cost Allocation must not decide business mode.

Cost Allocation must not mutate Business Setup.

Cost Allocation must not recalculate Business Summary or Recovery Summary.

Cost Allocation should be updated only after Recovery Summary is mode-aware.

---

## Business Outcome

Business Outcome consumes downstream recovery, allocation, and summary outputs.

Business Outcome must inherit the active business mode and activity-driver context from upstream outputs.

Business Outcome must not calculate source costs or mutate upstream modules.

---

## Business Modelling

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

Current implementation note:

```text
Business Modelling remains primarily hour/labour-oriented and uses legacy Business Summary hour fields.
Product-mode Business Modelling is deferred until a later locked brief.
```

---

## Quote Engine Later

Quote Engine is not the current build unless explicitly instructed.

Quote Engine must not assume all businesses are labour/hour-based once Business Summary v3.8 is active.

Product/unit quote testing must be separately briefed if it is not part of the first Quote Engine build.

Quote Engine must not rebuild upstream maths.

Quote Engine must not overwrite accepted quote snapshots.

---

# Removed / Banned Concepts

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
Revenue / COGS calculating Net Position
Revenue / COGS calculating required recovery per unit
Cost Summary calculating required recovery per unit
Business Summary creating scenarios
Business Summary calculating quote gaps
Quote Engine rebuilding upstream maths
Feedback Loop overwriting accepted quote snapshots
monthly actuals overwriting baseline assumptions automatically
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

# Build Rules

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

# Git / Checkpoint Rules

Prefer small commits.

Commit after a working build.

Do not bundle unrelated changes into one commit.

If a change goes sideways, stop and use Git rather than piling on fixes.

Before risky changes, create a backup branch or patch if needed.

Do not commit failed experiments unless explicitly instructed.

---

# Before Editing

Before making changes:

```text
1. Read AGENTS.md.
2. Read the relevant active source brief.
3. Inspect the existing file structure.
4. Identify existing hooks, storage, calculation files, selectors, and page/component patterns.
5. Identify existing storage keys and exported names.
6. Confirm actual variable names currently used in code.
7. Reuse existing conventions.
8. Avoid guessing when existing code already defines the source of truth.
9. Report conflicts between existing code and active briefs before broad changes.
```

---

# Codex Work Pattern

For each task, follow this order:

```text
1. Read AGENTS.md.
2. Read the relevant active source brief.
3. Inspect the relevant files only.
4. Make the smallest safe change.
5. Run npm run build if implementation changed code.
6. Report changed files and result.
7. Stop.
```

Do not keep expanding scope without explicit instruction.

Do not refactor while fixing a bug unless the refactor is required to fix the bug.

Do not run broad tasks when a narrow inspection or alignment task is enough.

---

# Final Instruction

AGENTS.md is intended to be self-contained enough for Codex to avoid major architecture mistakes.

Do not shrink this file aggressively.

Keep it current, enforceable, and aligned with the latest locked source briefs.
