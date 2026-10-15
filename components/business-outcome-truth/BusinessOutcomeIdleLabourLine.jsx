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
      data-idle-labour-line="true"
      data-idle-hours={idle.hours}
      data-idle-cost={idle.cost}
      style={{
        background: "var(--warning-soft)",
        borderLeft: "4px solid var(--warning)",
        borderRadius: 6,
        padding: "10px 12px",
        margin: "10px 0",
        color: "var(--text-secondary)",
        fontSize: 13,
        lineHeight: 1.5,
      }}
    >
      <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
        Idle labour: {format_hours(idle.hours)} paid hours a year, costing about {format_dollars(idle.cost)} a year
      </div>
      <div style={{ marginTop: 4 }}>
        No asset work recovers these hours. This cost is already inside this working group&apos;s net
        profit. It is shown here to explain it and is not added to or taken from any total. Yearly
        figures, whatever time scale is selected.
      </div>
    </div>
  );
}
