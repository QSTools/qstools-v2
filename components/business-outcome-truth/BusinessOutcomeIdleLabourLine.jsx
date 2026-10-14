"use client";

import { get_idle_labour_for_entry } from "@/lib/selectors/business-outcome/businessOutcomeIdleLabourSelectors";

// Idle labour line for the working-group drill-down (idle cost Step 3, 2026-10-15).
// Shows only when the selected entry is a working group whose labour is tied to
// the asset and has idle hours. Figures come straight from Cost Allocation.
// DISPLAY ONLY: it is not added to or taken from any total.
function format_hours(value) {
  return Math.round(Number(value) || 0).toLocaleString("en-NZ");
}

function format_dollars(value) {
  return (Number(value) || 0).toLocaleString("en-NZ", {
    style: "currency",
    currency: "NZD",
    maximumFractionDigits: 0,
  });
}

export default function BusinessOutcomeIdleLabourLine({ idle_labour_by_group, entry }) {
  const idle = get_idle_labour_for_entry(idle_labour_by_group, entry);
  if (!idle) return null;

  return (
    <div
      className="ui-help"
      data-idle-labour-line="true"
      data-idle-hours={idle.hours}
      data-idle-cost={idle.cost}
    >
      <strong>Idle labour:</strong> {format_hours(idle.hours)} paid hours a year have no asset work to recover
      them, costing about {format_dollars(idle.cost)} a year. This cost is already inside this working
      group&apos;s net profit. It is shown here to explain it and is not added to or taken from any total.
      Yearly figures, whatever time scale is selected.
    </div>
  );
}
