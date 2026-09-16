README_REVENUE_RECOVERY_BUILD_PACK_2026-04-09.txt
QS Tools — Revenue Recovery Build Pack

Date: 2026-04-09

PURPOSE

This pack is the new working authority folder for the next QS Tools build phase.

It exists to support the shift from:

cost-only visibility
partial recovery visibility

to:

full production-based recovery modelling

This pack should now be treated as the live source baseline for the next build cycle.

WHY THIS PACK EXISTS

The earlier architecture correctly separated:

Cost Summary = WHAT it costs
Recovery Summary = HOW it is intended to be recovered
Cost Allocation = CAN it be delivered
Recovery Outcome = SHOULD / DOES it work at macro level

But your latest clarification exposed the missing commercial layers:

material margin
square metre rate models
tonne / cubic metre / load rate models
minimum charge logic
small-job uplift logic
production-based revenue streams

Without those layers, the system can describe cost and intended recovery, but it cannot yet fully describe how the business actually creates revenue.

This pack fixes that gap.

WHAT THIS PACK NOW REPRESENTS

This pack separates the system into five distinct layers:

1. Cost Layer

Owned by:

Labour
Employee Overheads
Assets
General Overheads
Cost Summary

Question answered:

What does the business cost to run?
2. Recovery Strategy Layer

Owned by:

Recovery Summary

Question answered:

How is the business intending to recover cost?
3. Revenue Stream Layer

Owned by:

Materials
Rate Models

Question answered:

What actually creates revenue in this business?
4. Delivery Structure Layer

Owned by:

Cost Allocation

Question answered:

Can the business physically deliver the recovery model it depends on?
5. Business Verdict Layer

Owned by:

Recovery Outcome

Question answered:

Does the full business model actually work?
INCLUDED FILES

This build pack should contain:

ACTIVE_SYSTEM_BRIEFS_v1.18_UPDATED.txt
Materials_Module_v1.0_LOCKED.txt
Rate_Models_Module_v1.0_LOCKED.txt
Square_Metre_Rate_Page_v1.0_LOCKED.txt
Volume_Rate_Page_v1.0_LOCKED.txt
Cost_Allocation_v2.2_LOCKED.txt
Recovery_Outcome_v1.1_LOCKED.txt
QS Tools — Source Files Guardrail Brief (v1.2 — LOCKED).txt
QS Tools — Full Aligned Source Pack (v1.18 — UPDATED).txt
Implementation_Order_2026-04-09_UPDATED.txt
README_REVENUE_RECOVERY_BUILD_PACK_2026-04-09.txt

Optional supporting authority files to keep alongside:

QS Tools - Naming Convention and Source File Structure Brief (v1.0 - LOCKED).txt
QS Tools — New Module Build Template (v1.0 — LOCKED).txt
QS Tools — New Page Build Checklist (v1.0 — LOCKED).txt
KEY SYSTEM CLARITY
Cost Summary is NOT the revenue model

Cost Summary remains a pure cost aggregation layer and must not define rate structures, material margin logic, or structural operating-unit logic

Recovery Summary is NOT the quoting layer

Recovery Summary defines intended recovery shares only. It does not define material sell rates, m² rates, or tonne rates

Cost Allocation is NOT the macro verdict page

Cost Allocation remains the micro delivery-unit and structure page. It may show simple unit-health signals, but it must not replace Recovery Outcome

Recovery Outcome is NOT the rate-authoring page

Recovery Outcome is the macro reconciliation page. It consumes the revenue streams; it does not author them

Materials and Rate Models are the missing commercial layers

These are the new pieces that make the whole system commercially meaningful.

HOW TO USE THIS PACK
Step 1 — Save the files in a fresh folder

Recommended folder name:

Revenue_Recovery_Build_Pack_2026-04-09

Step 2 — Treat this pack as the current authority

For the next build cycle, use this pack instead of older recovery-only assumptions.

Step 3 — Build in the locked order

Follow the implementation order in this pack.

Step 4 — Do not drift responsibilities

If a page starts trying to do another page’s job, stop and correct it before building further.

RECOMMENDED BUILD ORDER
Phase 1
lock the pack
confirm current authority files
stop using outdated assumptions
Phase 2
build Materials
build Square Metre Rate
build Volume Rate
Phase 3
build Cost Allocation v2.2
validate labour basis visibility
validate unit health visibility
Phase 4
build Recovery Outcome v1.1
wire Recovery Outcome to:
Recovery Summary
Materials
Rate Models
Cost Allocation
Phase 5
validate the full flow across:
Cost Summary → Recovery Summary → Materials → Rate Models → Cost Allocation → Recovery Outcome
WHAT SUCCESS LOOKS LIKE

When this pack is implemented correctly, QS Tools should be able to show:

what the business costs
how recovery is intended
what the business actually sells
how materials contribute margin
whether the operating structure supports delivery
whether the full business model is viable

That is the commercial outcome this pack is designed to unlock.

FINAL NOTE

This pack exists because the system is now moving from:

“What does the business cost?”

to:

“What does the business cost, what actually creates revenue, and does that full model work?”

That is the correct direction.