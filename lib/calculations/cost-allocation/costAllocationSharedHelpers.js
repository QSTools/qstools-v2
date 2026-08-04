import {
  safe_array,
  safe_number,
} from "@/lib/calculations/cost-allocation/costAllocationInputBuilder";

export function get_staff_type_id(row = {}) {
  return (
    row.staff_type_id ||
    row.labour_type_id ||
    row.labour_type_key ||
    row.staff_id ||
    row.id ||
    ""
  );
}

export function get_staff_type_name(row = {}) {
  return (
    row.staff_type_name ||
    row.labour_type_label ||
    row.staff_name ||
    row.name ||
    "Productive labour group"
  );
}

export function get_weighted_hourly_rate(row = {}) {
  return safe_number(
    row.weighted_productive_hourly_rate ??
      row.weighted_hourly_cost_rate ??
      row.weighted_recovery_rate ??
      row.productive_labour_cost_rate ??
      0
  );
}

export function get_total_productive_hours(row = {}) {
  return safe_number(
    row.total_productive_hours ??
      row.productive_hours ??
      row.available_labour_hours ??
      0
  );
}

export function get_total_annual_cost(row = {}) {
  const explicit_cost = safe_number(
    row.total_annual_cost ??
      row.total_labour_cost ??
      row.total_productive_labour_cost ??
      row.available_labour_cost ??
      0
  );

  if (explicit_cost > 0) {
    return explicit_cost;
  }

  return get_total_productive_hours(row) * get_weighted_hourly_rate(row);
}

export function get_asset_id(row = {}) {
  return row.asset_id || row.id || "";
}

export function get_asset_name(row = {}) {
  return row.asset_name || row.name || "Productive asset";
}

export function get_total_asset_cost(row = {}) {
  return safe_number(
    row.asset_recovery_cost_annual ??
      row.total_asset_cost_annual ??
      row.cost_allocation_asset_cost_annual ??
      row.available_asset_cost ??
      0
  );
}

export function get_total_asset_hours(row = {}) {
  return safe_number(
    row.asset_recovery_hours_used ??
      row.utilisation_hours_annual ??
      row.utilisation_hours ??
      row.available_asset_hours ??
      0
  );
}

// S18 - Non-productive labour uses the same labour_group_assignments array
// as productive labour (add_labour_assignment() in useCostAllocation.js
// already stamps is_productive on every assignment it creates, sourced
// from all_labour_type_rows which covers both classes). This resolver is
// the single source of truth for which pool an assignment belongs to.
//
// Falls back to map membership only for assignments persisted before
// is_productive existed on the record - do not remove this fallback
// without confirming no legacy assignment records remain (see S18
// Section 8, "check live state before assuming").
export function resolve_is_productive_assignment(assignment = {}, productive_rate_map) {
  if (typeof assignment.is_productive === "boolean") {
    return assignment.is_productive;
  }

  const staff_type_id =
    assignment.staff_type_id ||
    assignment.labour_type_id ||
    assignment.labour_type_key ||
    "";

  return productive_rate_map.has(staff_type_id);
}
