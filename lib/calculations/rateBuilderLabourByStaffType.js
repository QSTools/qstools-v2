// OPEN-E (2026-10-13): Rate Builder labour charge-out, built per staff type.
// Mirrors Cost Allocation's cost side: each staff type in the group, at its own
// saved rate, weighted by its assigned hours over the group's recovery hours.
// A group's labour is COMPLETE only when every assigned staff type has a saved
// charge-out rate. There is deliberately no fallback rate: an unpriced staff
// type makes the whole labour line incomplete (charge_rate and floor_rate = 0).

function to_number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function lookup_positive(map, ids) {
  for (const id of ids) {
    const value = to_number(map?.[id]);
    if (value > 0) {
      return value;
    }
  }
  return 0;
}

export function build_labour_staff_type_breakdown({
  group,
  staff_type_rates = {},
  staff_type_floors = {},
  staff_type_names = {},
  recovery_hours = 0,
}) {
  const assignments = Array.isArray(group?.labour_group_assignments)
    ? group.labour_group_assignments
    : [];
  const hours_basis = to_number(recovery_hours);
  const by_type = new Map();

  assignments.forEach((assignment) => {
    if (!assignment || assignment.is_active === false) {
      return;
    }

    const ids = [
      assignment.staff_type_id,
      assignment.labour_type_id,
      assignment.labour_type_key,
    ].filter(Boolean);

    if (ids.length === 0) {
      return;
    }

    const key = ids[0];
    const existing = by_type.get(key) || {
      staff_type_id: key,
      ids,
      staff_type_name:
        staff_type_names[key] || assignment.staff_type_name || "Staff type",
      assigned_hours: 0,
    };

    existing.assigned_hours += to_number(assignment.assigned_hours);
    by_type.set(key, existing);
  });

  const rows = Array.from(by_type.values()).map((entry) => {
    const charge_out_rate = lookup_positive(staff_type_rates, entry.ids);
    const floor_rate = lookup_positive(staff_type_floors, entry.ids);
    const share = hours_basis > 0 ? entry.assigned_hours / hours_basis : 0;
    const issue =
      charge_out_rate <= 0
        ? "No charge-out rate saved"
        : floor_rate <= 0
          ? "No cost rate found"
          : "";

    return {
      staff_type_id: entry.staff_type_id,
      staff_type_name: entry.staff_type_name,
      assigned_hours: entry.assigned_hours,
      hours_share: share,
      charge_out_rate,
      floor_rate,
      charge_in_group: charge_out_rate * share,
      floor_in_group: floor_rate * share,
      is_priced: issue === "",
      issue,
    };
  });

  const unpriced_rows = rows.filter((row) => !row.is_priced);

  let issue_message = "";

  if (rows.length === 0) {
    issue_message = "No productive labour is assigned to this group.";
  } else if (hours_basis <= 0) {
    issue_message = "This group has no recovery hours.";
  } else if (unpriced_rows.length > 0) {
    issue_message =
      "Labour stays incomplete until every staff type in this group is priced: " +
      unpriced_rows
        .map((row) => `${row.staff_type_name} (${row.issue})`)
        .join(", ") +
      ". Set the rate in Labour Rates Builder.";
  }

  const is_complete = issue_message === "";

  const charge_rate = is_complete
    ? rows.reduce((sum, row) => sum + row.charge_in_group, 0)
    : 0;
  const floor_rate = is_complete
    ? rows.reduce((sum, row) => sum + row.floor_in_group, 0)
    : 0;

  return {
    rows,
    has_staff: rows.length > 0,
    is_complete,
    issue_message,
    total_assigned_hours: rows.reduce((sum, row) => sum + row.assigned_hours, 0),
    recovery_hours: hours_basis,
    charge_rate,
    floor_rate,
    per_hour_profit: is_complete ? charge_rate - floor_rate : 0,
  };
}