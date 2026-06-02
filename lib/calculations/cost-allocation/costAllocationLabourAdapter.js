import {
  safe_array,
  safe_number,
} from "@/lib/calculations/cost-allocation/costAllocationInputBuilder";

function normalise_text(value) {
  return String(value || "").trim();
}

function normalise_key(value) {
  return normalise_text(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function is_productive_staff(staff = {}) {
  if (staff?.contributes_to_recovery_hours === true) {
    return true;
  }

  const labour_class = normalise_key(staff?.labour_class);

  return labour_class === "productive";
}

function get_staff_type_label(staff = {}) {
  return (
    normalise_text(staff?.staff_type) ||
    normalise_text(staff?.staff_role) ||
    normalise_text(staff?.role) ||
    normalise_text(staff?.labour_type) ||
    "Unclassified productive labour"
  );
}

function get_staff_type_key_from_label(label) {
  return normalise_key(label) || "unclassified_productive_labour";
}

export function get_staff_label(staff = {}) {
  return (
    normalise_text(staff?.staff_name) ||
    normalise_text(staff?.name) ||
    "Unnamed staff"
  );
}

export function get_staff_labour_type_key(staff = {}) {
  const label = get_staff_type_label(staff);
  return get_staff_type_key_from_label(label);
}

export function find_labour_type_for_staff(staff = {}, labour_type_rows = []) {
  const staff_type_key = get_staff_labour_type_key(staff);

  return safe_array(labour_type_rows).find((row) => {
    return (
      row?.labour_type_key === staff_type_key ||
      row?.staff_type_id === staff_type_key ||
      row?.labour_type_id === staff_type_key
    );
  });
}

export function build_productive_labour_type_rows(labour_output_contract = {}) {
  const active_staff = safe_array(
    labour_output_contract?.active_staff ??
      labour_output_contract?.staff_rows ??
      labour_output_contract?.rows
  );

  const productive_staff = active_staff.filter((staff) => {
    return staff?.is_active !== false && is_productive_staff(staff);
  });

  const grouped = new Map();

  productive_staff.forEach((staff) => {
    const labour_type_label = get_staff_type_label(staff);
    const labour_type_key = get_staff_type_key_from_label(labour_type_label);

    if (!grouped.has(labour_type_key)) {
      grouped.set(labour_type_key, {
        staff_type_id: labour_type_key,
        staff_type_name: labour_type_label,

        labour_type_id: labour_type_key,
        labour_type_key,
        labour_type_label,

        staff_type: labour_type_label,
        staff_role: labour_type_label,
        labour_class: "productive",

        source_staff_ids: [],
        source_staff_names: [],

        total_productive_hours: 0,
        total_labour_cost: 0,
        total_annual_cost: 0,

        weighted_productive_hourly_rate: 0,
        weighted_hourly_cost_rate: 0,
        weighted_recovery_rate: 0,
      });
    }

    const row = grouped.get(labour_type_key);

    const productive_hours = safe_number(
      staff?.productive_hours ??
        staff?.productive_hours_annual ??
        staff?.annual_productive_hours ??
        staff?.recovery_hours ??
        staff?.recovery_hours_annual
    );

    const labour_cost = safe_number(
      staff?.total_labour_cost ??
        staff?.total_people_cost_annual ??
        staff?.annual_labour_cost ??
        staff?.employment_cost_annual ??
        staff?.total_annual_cost
    );

    row.source_staff_ids.push(staff?.staff_id || staff?.id || "");
    row.source_staff_names.push(get_staff_label(staff));

    row.total_productive_hours += productive_hours;
    row.total_labour_cost += labour_cost;
    row.total_annual_cost += labour_cost;
  });

  return Array.from(grouped.values()).map((row) => {
    const weighted_rate =
      row.total_productive_hours > 0
        ? row.total_labour_cost / row.total_productive_hours
        : 0;

    return {
      ...row,
      weighted_productive_hourly_rate: weighted_rate,
      weighted_hourly_cost_rate: weighted_rate,
      weighted_recovery_rate: weighted_rate,
    };
  });
}