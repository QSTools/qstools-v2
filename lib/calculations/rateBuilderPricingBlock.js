// Asset-pricing hard block (2026-10-14). UI-only gate: no number is changed.
// Reads the labour breakdown built by rateBuilderLabourByStaffType.js
// (OPEN-E, Addendum 16). Blocked whenever a group is selected and its labour
// is not complete. No group selected (breakdown null) is never blocked.
export function get_asset_pricing_block(labour_breakdown) {
  const not_blocked = {
    is_blocked: false,
    reason: "",
    missing_staff_types: [],
    message: "",
  };

  if (!labour_breakdown || labour_breakdown.is_complete) {
    return not_blocked;
  }

  if (!labour_breakdown.has_staff) {
    return {
      is_blocked: true,
      reason: "no_labour",
      missing_staff_types: [],
      message:
        "This group has no productive labour assigned. Assign labour to the group in Cost Allocation first.",
    };
  }

  if (!(Number(labour_breakdown.recovery_hours) > 0)) {
    return {
      is_blocked: true,
      reason: "no_hours",
      missing_staff_types: [],
      message:
        "This group has no recovery hours. Check the group's labour and asset hours in Cost Allocation first.",
    };
  }

  const missing = [];

  (labour_breakdown.rows || [])
    .filter((row) => !row.is_priced)
    .forEach((row) => {
      const label =
        row.charge_out_rate > 0
          ? `${row.staff_type_name} (no cost rate found)`
          : row.staff_type_name;

      if (!missing.includes(label)) {
        missing.push(label);
      }
    });

  return {
    is_blocked: true,
    reason: "unpriced_staff_types",
    missing_staff_types: missing,
    message:
      missing.length > 0
        ? `You haven't completed the Labour Rates Builder. Every staff type in this group needs a saved rate there before asset pricing can start. Missing: ${missing.join(", ")}.`
        : labour_breakdown.issue_message ||
          "Labour is incomplete for this group.",
  };
}