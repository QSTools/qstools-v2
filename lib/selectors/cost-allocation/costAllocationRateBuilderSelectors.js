function to_number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function round_currency(value) {
  return Number(to_number(value).toFixed(2));
}

function get_labour_assignment_id(assignment = {}) {
  return (
    assignment.staff_type_id ||
    assignment.labour_type_id ||
    assignment.labour_type_key ||
    ""
  );
}

function get_labour_assignment_name(assignment = {}) {
  return (
    assignment.staff_type_name ||
    assignment.labour_type_label ||
    assignment.labour_type_name ||
    "Productive labour group"
  );
}

export function build_rate_builder_labour_recovery_rows(calculated = {}) {
  const operational_group_cost_rows =
    calculated?.operational_group_cost_rows ?? [];

  const overhead_allocation_method =
    calculated?.overhead_allocation_method ??
    calculated?.overhead_pool?.allocation_method ??
    "cost_allocation";

  const rows_by_labour_source = new Map();

  operational_group_cost_rows.forEach((group) => {
    const labour_assignments = Array.isArray(group?.labour_group_assignments)
      ? group.labour_group_assignments
      : [];

    const group_labour_cost = to_number(group?.assigned_labour_cost);
    const group_overhead_amount = to_number(group?.assigned_overhead_amount);

    if (group_labour_cost <= 0 || group_overhead_amount <= 0) {
      return;
    }

    labour_assignments.forEach((assignment) => {
      const labour_source_type_id = get_labour_assignment_id(assignment);

      if (!labour_source_type_id) {
        return;
      }

      const assigned_labour_cost = to_number(assignment?.assigned_cost);
      const assigned_labour_hours = to_number(assignment?.assigned_hours);

      if (assigned_labour_cost <= 0 || assigned_labour_hours <= 0) {
        return;
      }

      const labour_weight = assigned_labour_cost / group_labour_cost;
      const allocated_business_overhead_amount =
        group_overhead_amount * labour_weight;

      const existing = rows_by_labour_source.get(labour_source_type_id) || {
        labour_source_type_id,
        staff_type_id: labour_source_type_id,
        labour_source_type_name: get_labour_assignment_name(assignment),
        labour_source_kind: "staff_type",
        assigned_labour_cost: 0,
        assigned_labour_hours: 0,
        labour_allocated_business_overhead_pool: 0,
        source_group_rows: [],
      };

      existing.assigned_labour_cost += assigned_labour_cost;
      existing.assigned_labour_hours += assigned_labour_hours;
      existing.labour_allocated_business_overhead_pool +=
        allocated_business_overhead_amount;

      existing.source_group_rows.push({
        group_id: group?.group_id || "",
        group_name: group?.group_name || "Operating group",
        assigned_labour_cost,
        assigned_labour_hours,
        assigned_overhead_amount: allocated_business_overhead_amount,
      });

      rows_by_labour_source.set(labour_source_type_id, existing);
    });
  });

  const staff_type_rows = Array.from(rows_by_labour_source.values()).map(
    (row) => {
      const allocated_business_overhead_recovery_rate =
        row.assigned_labour_hours > 0
          ? row.labour_allocated_business_overhead_pool /
            row.assigned_labour_hours
          : 0;

      return {
        ...row,
        assigned_labour_cost: round_currency(row.assigned_labour_cost),
        assigned_labour_hours: round_currency(row.assigned_labour_hours),
        labour_allocated_business_overhead_pool: round_currency(
          row.labour_allocated_business_overhead_pool
        ),
        allocated_business_overhead_amount: round_currency(
          row.labour_allocated_business_overhead_pool
        ),
        assigned_overhead_amount: round_currency(
          row.labour_allocated_business_overhead_pool
        ),
        allocated_business_overhead_recovery_rate: round_currency(
          allocated_business_overhead_recovery_rate
        ),
        total_business_overheads: round_currency(
          calculated?.total_available_overhead_cost ??
            calculated?.total_grouped_overhead_cost ??
            calculated?.overhead_absorbed_cost ??
            0
        ),
        overhead_allocation_source: "cost_allocation",
        overhead_allocation_method,
      };
    }
  );

  const all_assigned_labour_cost = staff_type_rows.reduce(
    (sum, row) => sum + to_number(row.assigned_labour_cost),
    0
  );

  const all_assigned_labour_hours = staff_type_rows.reduce(
    (sum, row) => sum + to_number(row.assigned_labour_hours),
    0
  );

  const total_available_overhead = to_number(
    calculated?.total_available_overhead_cost ??
      calculated?.total_grouped_overhead_cost ??
      calculated?.overhead_absorbed_cost ??
      0
  );

  const labour_share_percent = to_number(calculated?.labour_share_percent ?? 100);

  const labour_allocated_overhead =
    total_available_overhead * (labour_share_percent / 100);

  const all_allocated_overhead =
    labour_allocated_overhead > 0
      ? labour_allocated_overhead
      : staff_type_rows.reduce(
          (sum, row) =>
            sum + to_number(row.labour_allocated_business_overhead_pool),
          0
        );

  const all_productive_row = {
    labour_source_type_id: "all_productive",
    staff_type_id: "all_productive",
    labour_source_type_name: "All productive labour weighted rate",
    labour_source_kind: "all_productive",
    assigned_labour_cost: round_currency(all_assigned_labour_cost),
    assigned_labour_hours: round_currency(all_assigned_labour_hours),
    labour_allocated_business_overhead_pool:
      round_currency(all_allocated_overhead),
    allocated_business_overhead_amount: round_currency(all_allocated_overhead),
    assigned_overhead_amount: round_currency(all_allocated_overhead),
    allocated_business_overhead_recovery_rate: round_currency(
      all_assigned_labour_hours > 0
        ? all_allocated_overhead / all_assigned_labour_hours
        : 0
    ),
    total_business_overheads: round_currency(total_available_overhead),
    overhead_allocation_source: "cost_allocation",
    overhead_allocation_method,
    source_group_rows: [],
  };

  return [all_productive_row, ...staff_type_rows];
}