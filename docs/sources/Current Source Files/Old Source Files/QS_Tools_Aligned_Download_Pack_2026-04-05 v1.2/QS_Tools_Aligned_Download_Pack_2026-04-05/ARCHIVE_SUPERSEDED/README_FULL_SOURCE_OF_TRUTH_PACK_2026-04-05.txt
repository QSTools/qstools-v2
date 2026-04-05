QS Tools — Full Source of Truth Pack (Aligned Update)
Date: 2026-04-05

Included source-of-truth files:
- Active System Briefs v1.14
- Labour Module v1.9
- Labour Scenario Layer v2.1
- Employee Overheads Module v1.6
- Assets Module v2.3
- General Overheads v2.1
- Cost Allocation v1.3
- Cost Summary Module v1.5
- Cost Summary Page v1.5
- Budget Module v1.2

Purpose:
This pack is the clean full source-of-truth baseline after the Labour People Cost contract alignment pass.

Key alignment change:
- Labour now exposes `base_labour_cost_annual`, `gross_wages_annual`, and `entitlements_annual`
- Cost Summary now consumes those outputs directly and no longer rebuilds wage-basis values downstream
- Cost Summary page remains structurally the same, with optional display of Employer Contribution Total alongside separate KiwiSaver and ESCT lines
