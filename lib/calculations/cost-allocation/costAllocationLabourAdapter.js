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

function get_labour_class(staff = {}) {
  return is_productive_staff(staff) ? "productive" : "support";
}

function get_default_label_for_class(labour_class) {
  return labour_class === "productive"
    ? "Unclassified productive labour"
    : "Unclassified support labour";
}

// Prefer the real staff_type_name Labour already assigned - staff_type /
// staff_role / role / labour_type are fallbacks for legacy records that
// predate staff_type_name existing, not the primary source.
function get_staff_type_label(staff = {}) {
  const labour_class = get_labour_class(staff);

  return (
    normalise_text(staff?.staff_type_name) ||
    normalise_text(staff?.staff_type) ||
    normalise_text(staff?.staff_role) ||
    normalise_text(staff?.role) ||
    normalise_text(staff?.labour_type) ||
    normalise_text(staff?.labour_class) ||
    get_default_label_for_class(labour_class)
  );
}

function get_staff_type_key_from_label(label, labour_class = "productive") {
  const fallback =
    labour_class === "productive"
      ? "unclassified_productive_labour"
      : "unclassified_support_labour";

  return normalise_key(label) || fallback;
}

// FIX (2026-08-11): This previously always derived the grouping key by
// slugifying get_staff_type_label(), even when the staff record already
// carried a real staff_type_id from Labour (e.g. "senior_operator_staff").
// Slugifying "Senior Operator / Senior Staff" produces
// "senior_operator_senior_staff" - a DIFFERENT string from the real ID -
// which broke every downstream lookup keyed by the real staff_type_id
// (Rate Builder saved rates, overhead recovery rows in Cost Allocation).
// The real staff_type_id must always be used when present; slugifying the
// label is only a fallback for legacy/unclassified staff with no
// staff_type_id at all.
export function get_staff_labour_type_key(staff = {}) {
  const real_staff_type_id = normalise_text(staff?.staff_type_id);

  if (real_staff_type_id) {
    return real_staff_type_id;
  }

  const label = get_staff_type_label(staff);
  const labour_class = get_labour_class(staff);

  return get_staff_type_key_from_label(label, labour_class);
}

function get_productive_hours(staff = {}) {
  return safe_number(
    staff?.productive_hours ??
      staff?.productive_hours_annual ??
      staff?.annual_productive_hours ??
      staff?.recovery_hours ??
      staff?.recovery_hours_annual
  );
}

function get_labour_cost(staff = {}) {
  return safe_number(
    staff?.total_labour_cost ??
      staff?.total_people_cost_annual ??
      staff?.annual_labour_cost ??
      staff?.employment_cost_annual ??
      staff?.total_annual_cost
  );
}

export function get_staff_label(staff = {}) {
  return (
    normalise_text(staff?.staff_name) ||
    normalise_text(staff?.name) ||
    "Unnamed staff"
  );
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

function create_labour_type_row({ labour_type_key, labour_type_label, labour_class }) {
  return {
    staff_type_id: labour_type_key,
    staff_type_name: labour_type_label,

    labour_type_id: labour_type_key,
    labour_type_key,
    labour_type_label,

    staff_type: labour_type_label,
    staff_role: labour_type_label,
    labour_class,

    is_productive: labour_class === "productive",
    contributes_to_recovery_hours: labour_class === "productive",

    source_staff_ids: [],
    source_staff_names: [],

    staff_count: 0,
    productive_staff_count: labour_class === "productive" ? 0 : 0,
    support_staff_count: labour_class === "support" ? 0 : 0,

    total_productive_hours: 0,
    total_labour_cost: 0,
    total_annual_cost: 0,

    weighted_productive_hourly_rate: 0,
    weighted_hourly_cost_rate: 0,
    weighted_recovery_rate: 0,
  };
}

function finalise_labour_type_row(row) {
  const weighted_productive_rate =
    row.total_productive_hours > 0
      ? row.total_labour_cost / row.total_productive_hours
      : 0;

  const weighted_hourly_cost_rate =
    row.total_productive_hours > 0
      ? row.total_labour_cost / row.total_productive_hours
      : 0;

  return {
    ...row,
    weighted_productive_hourly_rate: weighted_productive_rate,
    weighted_hourly_cost_rate,
    weighted_recovery_rate: weighted_productive_rate,
  };
}

function build_labour_type_rows_by_class(
  labour_output_contract = {},
  required_labour_class = "productive"
) {
  const active_staff = safe_array(
    labour_output_contract?.active_staff ??
      labour_output_contract?.staff_rows ??
      labour_output_contract?.rows
  );

  const target_staff = active_staff.filter((staff) => {
    if (staff?.is_active === false) {
      return false;
    }

    return get_labour_class(staff) === required_labour_class;
  });

  const grouped = new Map();

  target_staff.forEach((staff) => {
    const labour_class = get_labour_class(staff);
    const labour_type_label = get_staff_type_label(staff);
    // FIX: use the real staff_type_id when present, via
    // get_staff_labour_type_key(), instead of always re-deriving the key
    // from the label. See fix note on get_staff_labour_type_key above.
    const labour_type_key = get_staff_labour_type_key(staff);

    if (!grouped.has(labour_type_key)) {
      grouped.set(
        labour_type_key,
        create_labour_type_row({
          labour_type_key,
          labour_type_label,
          labour_class,
        })
      );
    }

    const row = grouped.get(labour_type_key);
    const productive_hours =
      labour_class === "productive" ? get_productive_hours(staff) : 0;
    const labour_cost = get_labour_cost(staff);

    row.source_staff_ids.push(staff?.staff_id || staff?.id || "");
    row.source_staff_names.push(get_staff_label(staff));

    row.staff_count += 1;

    if (labour_class === "productive") {
      row.productive_staff_count += 1;
    } else {
      row.support_staff_count += 1;
    }

    row.total_productive_hours += productive_hours;
    row.total_labour_cost += labour_cost;
    row.total_annual_cost += labour_cost;
  });

  return Array.from(grouped.values()).map(finalise_labour_type_row);
}

export function build_productive_labour_type_rows(labour_output_contract = {}) {
  return build_labour_type_rows_by_class(labour_output_contract, "productive");
}

export function build_support_labour_type_rows(labour_output_contract = {}) {
  return build_labour_type_rows_by_class(labour_output_contract, "support");
}

export function build_all_labour_type_rows(labour_output_contract = {}) {
  const productive_rows = build_productive_labour_type_rows(
    labour_output_contract
  );

  const support_rows = build_support_labour_type_rows(labour_output_contract);

  return [...productive_rows, ...support_rows];
}
