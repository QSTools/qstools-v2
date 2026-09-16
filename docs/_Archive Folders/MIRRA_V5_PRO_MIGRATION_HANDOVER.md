# Mirra v5.0 Pro Migration Handover

STATUS: READY FOR PRO MIGRATION
VERSION: v5.0
REPO: qstools-v2
BRANCH: main

## Purpose

This file is the portable handover brief for continuing Mirra / QS Tools from a fresh ChatGPT Pro workspace.

The repo is now the source of truth. Do not rely on Business workspace project memory.

## Current Source of Truth

Primary v5 brief folder:

docs/Mirra_v5_Briefs/

Primary audit folder:

docs/Audit/

Audit tooling folder:

tools/audit/

Historical v4 source folder:

docs/v4.0 Source Files/

Business meeting and strategic planning material:

docs/Business Meetings/

Top-level architecture / operating briefs:

docs/MIRRA_CORE_CLOSED_LOOP_RECOVERY_MODEL_v1.0_LOCKED.txt
docs/MIRRA_V5_CONTINUOUS_CONTRACT_ALIGNMENT_WORKFLOW.md
docs/MIRRA_V5_PRO_MIGRATION_HANDOVER.md
docs/MIRRA_CHAT_UPLOAD_REQUIREMENTS_BRIEF.md

## Locked File Structure Decision

The final v5 brief structure is:

- 24_MIRRA_MODEL_FEEDBACK_LOOP_v4.0_LOCKED.txt = Model Feedback Loop module contract
- 31_Macro_Micro_Layer_v4.0_Locked.txt = Macro / Micro Layer architecture
- S01_MIRRA_OPENING_HOURS_SUPPORTING_MODULE_v5.0.txt = Opening Hours supporting module
- S02_MIRRA_QUICK_START_SUPPORTING_MODULE_v5.0.txt = Quick Start supporting module

The Closed Loop Recovery Model is not a normal module contract. It is a top-level product architecture brief and lives at:

docs/MIRRA_CORE_CLOSED_LOOP_RECOVERY_MODEL_v1.0_LOCKED.txt

## Final Audit Position

Latest completed v5 contract audit position:

- Matched: 262
- Code only / not in brief: 81
- Code only / unknown owner: 0
- Code only / legacy review: 8 classified
- Brief only / missing in code: 616

Important interpretation:

The remaining 81 code-only fields have already been reviewed. Do not force this count to zero. Most are wrappers, helper/display fields, local state, or accepted-but-extractor-limited fields.

## Completed Audit Work

The following has been completed:

- v5.0 brief package created and committed.
- Code output contract register created.
- Brief output contract register created.
- Normalised brief ownership created using file-to-module mapping.
- Opening Hours supporting module brief added and renamed to S01.
- Quick Start supporting module brief added and renamed to S02.
- Unknown-owner rows reduced from 44 to 0.
- Legacy rows reviewed and classified as stale/legacy.
- Remaining 83 code-only rows reviewed.
- 6 true remaining contract fields accepted.
- Remaining 81 code-only rows documented as reviewed, mostly wrappers/helpers/display/state fields.
- Final audit snapshots created.
- Closed Loop Recovery Model moved to top-level docs as product architecture.
- Continuous Contract Alignment Workflow added as the ongoing alignment process.
- Chat Upload Requirements Brief added as a one-time migration checklist.

## Final Audit Evidence

Key files:

docs/Audit/MIRRA_FINAL_POST_REVIEW_AUDIT_SNAPSHOT_v5.0.txt
docs/Audit/MIRRA_FINAL_POST_REVIEW_AUDIT_ROWS_v5.0.csv
docs/Audit/MIRRA_REMAINING_CODE_ONLY_FINAL_REVIEW_SUMMARY_v5.0.txt
docs/Audit/MIRRA_FINAL_REMAINING_CODE_ONLY_81_POST_REVIEW_v5.0.csv
docs/Audit/MIRRA_LEGACY_REVIEW_8_DECISIONS_v5.0.txt

## Important Rules

- Do not try to force the remaining code-only count to zero.
- Do not promote wrappers, helpers, display tokens, formatting utilities, or state containers into formal output contracts.
- Every variable must have one owner.
- Downstream modules consume output_contract only.
- Do not read raw upstream state downstream.
- Business logic belongs in lib/calculations.
- Selectors shape output.
- Hooks orchestrate state/storage.
- Components render.
- Status strips are read-only.
- Negative commercial result is valid output, not data failure.
- After every meaningful module/output change, run the Continuous Contract Alignment Workflow.

## Current Build Work

Scheduling / Gantt working-hours logic has been updated and committed.

The Gantt now treats start/end dates as calculated display values and uses business opening weekdays where available, falling back to Monday-Friday.

## Important Supporting Docs

Committed planning/source docs include:

- Business meeting notes
- Business Plan & Growth future build brief
- Invoice Automation / PO reconciliation future build brief
- Scheduling / Gantt source briefs
- Staff Time Portal source brief
- Daily Site Note source brief
- Migration to Pro brief
- Historical v4 contract source briefs
- Chat Upload Requirements checklist

## New Pro Chat Upload Order

When starting a new Pro chat, upload or paste these first:

1. docs/Mirra_v5_Briefs/24_MIRRA_MODEL_FEEDBACK_LOOP_v4.0_LOCKED.txt
2. Latest relevant audit snapshot/register from docs/Audit/
3. docs/MIRRA_V5_CONTINUOUS_CONTRACT_ALIGNMENT_WORKFLOW.md
4. docs/MIRRA_V5_PRO_MIGRATION_HANDOVER.md

Optional supporting uploads:

- docs/MIRRA_CORE_CLOSED_LOOP_RECOVERY_MODEL_v1.0_LOCKED.txt
- docs/Mirra_v5_Briefs/31_Macro_Micro_Layer_v4.0_Locked.txt
- docs/Mirra_v5_Briefs/S01_MIRRA_OPENING_HOURS_SUPPORTING_MODULE_v5.0.txt
- docs/Mirra_v5_Briefs/S02_MIRRA_QUICK_START_SUPPORTING_MODULE_v5.0.txt

## Next Recommended Work

After migration to Pro:

1. Open this file first in the new Pro chat.
2. Confirm the repo is pulled from origin/main.
3. Run npm run build.
4. Continue from the current v5 brief package.
5. Do not reopen completed audit cleanup unless a new code change requires it.
6. Use the Continuous Contract Alignment Workflow after every meaningful module/output change.
7. Next product work should continue around Business Outcome, Business Modelling, and the planned Calculation Trace / Logic Chain page.
8. Scheduling, Staff Time Portal, and Daily Site Notes remain valid future/current operational workstreams, but should not override the core commercial model chain unless deliberately prioritised.

## Migration Instruction

Use this repo and these committed docs as the project memory.

Do not depend on old Business workspace context.

A status report describes the project. Uploaded files and command output verify the project. A new chat should treat repo state as reported until the relevant files or audit outputs are uploaded.
