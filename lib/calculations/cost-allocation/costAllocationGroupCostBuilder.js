import {
  safe_array,
  safe_number,
} from "@/lib/calculations/cost-allocation/costAllocationInputBuilder";

export function build_operational_group_cost_rows({
  active_groups,
  labour_group_assignments,
  non_productive_labour_group_assignments,
  asset_group_assignments,
  non_productive_asset_group_assignments,
  overhead_group_assignments,
}) {
  return safe_array(active_groups).map((group) => {
    const group_id = group.group_id || group.operational_group_id || "";
    const division_id = group.division_id || "main_operations";

    const labour_assignments = safe_array(labour_group_assignments).filter(
      (assignment) => assignment.group_id === group_id
    );

    const non_productive_labour_assignments = safe_array(
      non_productive_labour_group_assignments
    ).filter((assignment) => assignment.group_id === group_id);

    const asset_assignments = safe_array(asset_group_assignments).filter(
      (assignment) => assignment.group_id === group_id
    );

    const non_productive_asset_assignments = safe_array(
      non_productive_asset_group_assignments
    ).filter((assignment) => assignment.group_id === group_id);

    const overhead_assignments = safe_array(overhead_group_assignments).filter(
      (assignment) => assignment.group_id === group_id
    );

    const assigned_labour_cost = labour_assignments.reduce(
      (sum, assignment) => sum + safe_number(assignment.assigned_cost),
      0
    );

    const assigned_labour_hours = labour_assignments.reduce(
      (sum, assignment) => sum + safe_number(assignment.assigned_hours),
      0
    );

    const assigned_non_productive_labour_cost =
      non_productive_labour_assignments.reduce(
        (sum, assignment) => sum + safe_number(assignment.assigned_cost),
        0
      );

    const assigned_asset_burden = asset_assignments.reduce(
      (sum, assignment) => sum + safe_number(assignment.assigned_asset_cost),
      0
    );

    const assigned_asset_hours = asset_assignments.reduce(
      (maximum, assignment) =>
        Math.max(maximum, safe_number(assignment.assigned_asset_hours)),
      0
    );

    const assigned_non_productive_asset_cost =
      non_productive_asset_assignments.reduce(
        (sum, assignment) => sum + safe_number(assignment.assigned_asset_cost),
        0
      );

    const assigned_overhead_amount = overhead_assignments.reduce(
      (sum, assignment) =>
        sum + safe_number(assignment.assigned_overhead_amount),
      0
    );

    // Recovery driver: chosen once when the group is built (group_recovery_hour_source),
    // stored on the group record, and never recalculated downstream. If the user hasn't
    // explicitly chosen a driver, default to asset hours whenever the group carries an
    // asset - an asset-bearing group should recover against the hours the asset actually
    // runs, not against however many labour hours happen to be assigned to it. Groups with
    // no asset fall back to labour hours as before.
    const group_recovery_hour_source =
      group.group_recovery_hour_source ||
      (assigned_asset_hours > 0 ? "asset_hours" : "labour_hours");

    const manual_group_recovery_hours = safe_number(
      group.manual_group_recovery_hours
    );

    const group_recovery_hours =
      group_recovery_hour_source === "asset_hours"
        ? assigned_asset_hours
        : group_recovery_hour_source === "manual_hours"
          ? manual_group_recovery_hours
          : assigned_labour_hours;

    // Labour recovers labour, assets recover assets - no cross-subsidy. Each cost stream
    // is taken at its real assigned value; nothing is rescaled to fit the chosen driver.
    // Labour Module has already solved the weighted rate (including shift differentials)
    // for whichever staff type is assigned here, so assigned_labour_cost is used as-is.
    const labour_recovery_cost = assigned_labour_cost;
    const asset_recovery_cost = assigned_asset_burden;
    const overhead_recovery_cost = assigned_overhead_amount;

    const total_group_cost =
      labour_recovery_cost +
      asset_recovery_cost +
      overhead_recovery_cost +
      assigned_non_productive_labour_cost +
      assigned_non_productive_asset_cost;

    // These three sum to group_cost_per_hour by construction (total_group_cost / hours),
    // so the per-stream breakdown and the single blended rate always reconcile.
    const labour_recovery_rate =
      group_recovery_hours > 0 ? labour_recovery_cost / group_recovery_hours : 0;

    const asset_recovery_rate =
      group_recovery_hours > 0 ? asset_recovery_cost / group_recovery_hours : 0;

    const overhead_recovery_rate =
      group_recovery_hours > 0
        ? overhead_recovery_cost / group_recovery_hours
        : 0;

    const group_cost_per_hour =
      group_recovery_hours > 0 ? total_group_cost / group_recovery_hours : 0;

    // Coverage check, not a trust gate: when the group recovers on asset hours, does the
    // assigned labour actually cover the hours the asset runs? A gap here is operationally
    // meaningful (e.g. a 24/7 asset with only one shift assigned) but must never block
    // Model Readiness or mark the model untrusted - it's a review flag, surfaced so the
    // user can decide whether to assign more labour or accept the gap as intentional.
    const labour_coverage_gap_hours =
      group_recovery_hour_source === "asset_hours" &&
      assigned_asset_hours > assigned_labour_hours
        ? assigned_asset_hours - assigned_labour_hours
        : 0;

    const labour_coverage_warning =
      labour_coverage_gap_hours > 0
        ? {
            severity: "review",
            code: "labour_coverage_gap",
            message: `Assigned labour covers ${assigned_labour_hours.toFixed(
              0
            )} hours/year but the asset runs ${assigned_asset_hours.toFixed(
              0
            )} hours/year - a gap of ${labour_coverage_gap_hours.toFixed(
              0
            )} hours. Assign more labour or confirm the gap is intentional.`,
          }
        : null;

    const asset_utilisation_percent =
      assigned_asset_hours > 0
        ? (group_recovery_hours / assigned_asset_hours) * 100
        : 0;

    const labour_utilisation_percent =
      assigned_labour_hours > 0
        ? (group_recovery_hours / assigned_labour_hours) * 100
        : 0;

    return {
      group_id,
      division_id,
      group_name: group.group_name || "Unnamed operating group",

      assigned_labour_cost,
      assigned_labour_hours,
      labour_recovery_cost,

      non_productive_labour_group_assignments: non_productive_labour_assignments,
      assigned_non_productive_labour_cost,

      assigned_asset_burden,
      assigned_asset_hours,
      asset_recovery_cost,

      non_productive_asset_group_assignments: non_productive_asset_assignments,
      assigned_non_productive_asset_cost,

      assigned_overhead_amount,
      overhead_recovery_cost,

      total_group_cost,
      group_recovery_hour_source,
      group_recovery_hours,
      manual_group_recovery_hours,
      labour_recovery_rate,
      asset_recovery_rate,
      overhead_recovery_rate,
      asset_utilisation_percent,
      labour_utilisation_percent,
      labour_coverage_gap_hours,
      labour_coverage_warning,
      group_cost_per_hour,
      group_cost_per_unit: 0,

      labour_group_assignments: labour_assignments,
      asset_group_assignments: asset_assignments,
      overhead_group_assignments: overhead_assignments,

      allocation_status:
        total_group_cost > 0 ? "assigned" : "review_required",
    };
  });
}
