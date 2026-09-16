QS Tools — Next Build Brief Pack
Date: 2026-04-05

Purpose:
This pack becomes the new working brief baseline after the Labour v1.9 and Cost Summary v1.5 implementation lock.

What changed:
- Labour now exposes gross_wages_annual and entitlements_annual as explicit downstream outputs
- Cost Summary now consumes those outputs directly
- Cost Summary People Cost structure is now aligned to:
  Gross Wages
  Entitlements
  Employer KiwiSaver
  ESCT
  Employee Overheads
  Total People Cost

What comes next:
- Employee Overheads to Cost Summary wiring
- Then Assets to Cost Summary wiring
- Then General Overheads to Cost Summary wiring
- Then Budget confirmation against final Cost Summary outputs

This pack is intended to prevent drift before the next implementation phase.
