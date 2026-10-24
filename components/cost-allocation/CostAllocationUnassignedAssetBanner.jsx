"use client";

// F-4: big red warning on Cost Allocation when asset cost is not assigned to a working unit.
// Support-asset cost has been spread evenly (numbers still complete); a productive asset
// that is not assigned is blocking. Renders nothing when everything is assigned.

function formatMoney(value) {
  return `$${Number(value || 0).toLocaleString("en-NZ", {
    maximumFractionDigits: 0,
  })}`;
}

const banner_style = {
  border: "2px solid #b91c1c",
  background: "#fef2f2",
  color: "#7f1d1d",
  borderRadius: "12px",
  padding: "16px 20px",
};

export default function CostAllocationUnassignedAssetBanner({ recovery_plan }) {
  const spread_cost = Number(
    recovery_plan?.unassigned_support_asset_spread_cost || 0
  );
  const spread_group_count = Number(
    recovery_plan?.unassigned_support_asset_spread_group_count || 0
  );
  const productive_cost = Number(
    recovery_plan?.unassigned_productive_asset_cost || 0
  );
  const has_productive = recovery_plan?.has_unassigned_productive_asset === true;
  const has_spread = spread_cost > 0.005;

  if (!has_productive && !has_spread) {
    return null;
  }

  return (
    <section role="alert" style={banner_style}>
      <p style={{ fontWeight: 700, fontSize: "1.05rem", margin: 0 }}>
        Unassigned asset cost - fix this before relying on the numbers
      </p>

      {has_productive ? (
        <p style={{ margin: "8px 0 0" }}>
          BLOCKING: {formatMoney(productive_cost)} a year of productive asset
          cost is not assigned to any working unit. Every productive asset must
          be assigned. Assign it below.
        </p>
      ) : null}

      {has_spread ? (
        <p style={{ margin: "8px 0 0" }}>
          {formatMoney(spread_cost)} a year of support asset cost (vehicles,
          etc.) is not assigned to any working unit. It has been spread evenly
          across {spread_group_count} working unit
          {spread_group_count === 1 ? "" : "s"} so the totals are complete.
          Assign each support asset to the unit that uses it to get true unit
          costs.
        </p>
      ) : null}
    </section>
  );
}
