import {
  ASSET_POOL_BY_ALLOCATION_TYPE,
  BALANCED_POOL_CONFIGS,
  CATEGORY_DEFINITIONS,
  REDISTRIBUTION_POOL_CONFIGS,
  SYSTEM_ALLOCATION_LABELS,
  SYSTEM_ALLOCATION_TYPES,
} from "./generalOverheadDefinitions";

import {
  format_allocation_amount,
  format_currency,
  format_input_amount,
  to_number,
} from "./generalOverheadFormatting";

import {
  get_category_definition,
  get_default_category_key,
  get_effective_category_key,
} from "./generalOverheadCategorySelectors";

function is_valid_system_allocation_type(value) {
  return SYSTEM_ALLOCATION_TYPES.some((type) => type.key === value);
}

function row_name(row = {}) {
  return String(
    row.label || row.source_line_name || row.source_review_subcategory || ""
  ).toLowerCase();
}

function get_default_system_allocation_type(row = {}, category_key = "") {
  const name = row_name(row);

  if (row.is_asset_finance_interest) {
    return "asset_finance_interest";
  }

  if (row.key === "public_liability_insurance") {
    return "business_overhead";
  }

  if (row.key === "professional_indemnity_insurance") {
    return "business_overhead";
  }

  if (row.key === "asset_insurance_cost") {
    return "asset_related_insurance_pool";
  }

  if (row.key === "fuel_cost_annual" || name.includes("fuel")) {
    return "asset_related_fuel_pool";
  }

  if (
    row.key === "vehicle_maintenance_cost_annual" ||
    row.key === "vehicle_repairs_cost_annual" ||
    name.includes("vehicle maintenance") ||
    name.includes("vehicle repairs") ||
    name.includes("plant maintenance") ||
    name.includes("plant repairs") ||
    name.includes("fleet maintenance") ||
    name.includes("fleet repairs")
  ) {
    return "asset_related_repairs_maintenance_pool";
  }

  if (
    row.key === "vehicle_registration_cost_annual" ||
    name.includes("registration") ||
    name.includes("licensing") ||
    name.includes("licence") ||
    name.includes("license")
  ) {
    return "asset_related_registration_compliance_pool";
  }

  if (
    row.key === "vehicle_tyres_cost_annual" ||
    row.key === "vehicle_consumables_cost_annual" ||
    name.includes("tyre") ||
    name.includes("tire") ||
    name.includes("consumable")
  ) {
    return "asset_related_consumables_pool";
  }

  if (
    name.includes("asset insurance") ||
    name.includes("vehicle insurance") ||
    name.includes("plant insurance") ||
    name.includes("fleet insurance") ||
    name.includes("equipment insurance")
  ) {
    return "asset_related_insurance_pool";
  }

  if (category_key === "insurance_compliance") {
    return row.key === "insurance_compliance_cost"
      ? "unallocated_needs_review"
      : "business_overhead";
  }

  if (category_key === "vehicles_running") {
    return "unallocated_needs_review";
  }

  if (category_key === "finance_interest") {
    if (
      name.includes("vehicle loan") ||
      name.includes("asset loan") ||
      name.includes("plant loan")
    ) {
      return "asset_finance_interest";
    }

    return "business_overhead";
  }

  if (category_key === "staff_overheads") {
    return "staff_overhead";
  }

  if (category_key === "facilities_premises") {
    return "premises_overhead";
  }

  if (category_key === "sales_growth") {
    return "sales_overhead";
  }

  if (row.is_custom || category_key === "other_unallocated") {
    return "unallocated_needs_review";
  }

  return "business_overhead";
}

function get_effective_system_allocation_type(row, overhead_state, category_key) {
  const overrides = overhead_state?.system_allocation_overrides ?? {};
  const override_type = overrides[row.key];

  if (is_valid_system_allocation_type(override_type)) {
    return override_type;
  }

  return get_default_system_allocation_type(row, category_key);
}

function get_pool_status(source_total_amount, assigned_amount) {
  const source_total = format_allocation_amount(source_total_amount);
  const assigned_total = format_allocation_amount(assigned_amount);

  if (assigned_total <= 0) {
    return "unallocated";
  }

  if (assigned_total < source_total) {
    return "partially_allocated";
  }

  if (assigned_total === source_total) {
    return "fully_allocated";
  }

  return "over_allocated";
}

function get_balanced_pool_config(category_key) {
  return BALANCED_POOL_CONFIGS.find(
    (config) => config.category_key === category_key
  );
}

function get_redistribution_pool_config(category_key) {
  return REDISTRIBUTION_POOL_CONFIGS[category_key] || null;
}

function is_balanced_parent_key(row_key, balanced_config) {
  return Boolean(
    balanced_config?.parent_key && row_key === balanced_config.parent_key
  );
}

function is_balanced_child_key(row_key, balanced_config) {
  return Boolean(balanced_config?.child_keys?.includes(row_key));
}

function get_allocation_input_amount(row, overhead_state) {
  const overrides = overhead_state?.system_allocation_amount_overrides ?? {};
  const override_value = overrides[row.key];

  if (
    override_value !== undefined &&
    override_value !== null &&
    override_value !== ""
  ) {
    return to_number(override_value);
  }

  return to_number(row.amount);
}

function has_amount_override(row_key, overhead_state) {
  const overrides = overhead_state?.system_allocation_amount_overrides ?? {};

  return (
    overrides[row_key] !== undefined &&
    overrides[row_key] !== null &&
    overrides[row_key] !== ""
  );
}

function get_amount_override(row_key, overhead_state) {
  const overrides = overhead_state?.system_allocation_amount_overrides ?? {};
  return to_number(overrides[row_key]);
}

function build_virtual_redistribution_rows({
  category_key,
  category_label,
  source_total_amount,
  overhead_state,
}) {
  const redistribution_config = get_redistribution_pool_config(category_key);

  if (!redistribution_config) {
    return [];
  }

  const manual_target_total = redistribution_config.targets.reduce(
    (sum, target) => {
      if (target.balance_type === "auto_balance") {
        return sum;
      }

      const override_exists = has_amount_override(target.key, overhead_state);

      return (
        sum +
        (override_exists ? get_amount_override(target.key, overhead_state) : 0)
      );
    },
    0
  );

  return redistribution_config.targets.map((target) => {
    const override_exists = has_amount_override(target.key, overhead_state);

    const raw_amount =
      target.balance_type === "auto_balance"
        ? Math.max(source_total_amount - manual_target_total, 0)
        : override_exists
          ? get_amount_override(target.key, overhead_state)
          : 0;

    const amount = format_allocation_amount(raw_amount);

    const allocation_pool_key =
      ASSET_POOL_BY_ALLOCATION_TYPE[target.system_allocation_type] || "";

    return {
      key: target.key,
      label: target.label,
      amount,
      active_amount: amount,
      line_id: target.key,
      line_label: target.label,
      source_category: category_key,
      current_category: category_key,
      source_amount: 0,
      amount_display: format_currency(amount),
      input_amount_display: format_input_amount(amount),
      default_category_key: category_key,
      default_category_label: category_label,
      effective_category_key: category_key,
      effective_category_label: category_label,
      is_reclassified: false,
      system_allocation_type: target.system_allocation_type,
      system_allocation_label:
        SYSTEM_ALLOCATION_LABELS[target.system_allocation_type] ||
        target.label,
      is_asset_related_pool: Boolean(allocation_pool_key),
      allocation_pool_key,
      is_balanced_parent_pool: false,
      is_pool_split_row: true,
      is_allocation_only_amount: true,
      is_assigned: to_number(amount) > 0,
      is_pool_balance_row: false,
      is_virtual_redistribution_row: true,
      is_vehicle_redistribution_row: category_key === "vehicles_running",
      is_auto_balance_row: target.balance_type === "auto_balance",
      sort_order: target.sort_order ?? 999,
      source_line_name: `${category_label} redistribution`,
      source_review_subcategory: category_key,
      source_module: "general_overheads_redistribution",
      redistribution_source_total_amount: source_total_amount,
    };
  });
}

export function build_grouped_rows(
  overhead_rows,
  overhead_state,
  include_move_controls = false
) {
  const grouped = CATEGORY_DEFINITIONS.map((category) => ({
    category_key: category.key,
    category_label: category.label,
    source_total_amount: 0,
    assigned_amount: 0,
    remaining_amount: 0,
    allocation_pool_used: 0,
    allocation_pool_remaining: 0,
    allocation_pool_status: "unallocated",
    total_amount: 0,
    total_amount_display: format_currency(0),
    rows: [],
  }));

  const source_rows = (overhead_rows ?? []).map((row) => {
    const effective_category_key = get_effective_category_key(
      row,
      overhead_state
    );

    return {
      row,
      effective_category_key,
      default_category_key: get_default_category_key(row),
      source_amount: to_number(row.amount),
      input_amount: get_allocation_input_amount(row, overhead_state),
    };
  });

  const source_rows_by_key = new Map(
    source_rows.map((entry) => [entry.row.key, entry])
  );

  const balanced_pool_runtime = new Map();

  for (const group of grouped) {
    const balanced_config = get_balanced_pool_config(group.category_key);

    const group_source_rows = source_rows.filter(
      (entry) => entry.effective_category_key === group.category_key
    );

    const has_real_split_rows = Boolean(
      balanced_config &&
        group_source_rows.some((entry) => {
          const key = entry.row.key;

          return (
            !is_balanced_parent_key(key, balanced_config) &&
            !is_balanced_child_key(key, balanced_config)
          );
        })
    );

    const has_redistribution_pool = Boolean(
      has_real_split_rows && get_redistribution_pool_config(group.category_key)
    );

    balanced_pool_runtime.set(group.category_key, {
      balanced_config,
      has_real_split_rows,
      has_redistribution_pool,
    });

    let source_total_amount = group_source_rows.reduce(
      (sum, entry) => sum + entry.source_amount,
      0
    );

    if (balanced_config) {
      const parent_entry = source_rows_by_key.get(balanced_config.parent_key);
      const parent_source_amount = to_number(parent_entry?.source_amount);

      if (parent_source_amount > 0) {
        source_total_amount = parent_source_amount;
      }
    }

    group.source_total_amount = format_allocation_amount(source_total_amount);
    group.total_amount = format_allocation_amount(source_total_amount);
    group.total_amount_display = format_currency(source_total_amount);
  }

  for (const entry of source_rows) {
    const { row, effective_category_key, default_category_key } = entry;
    const effective_category = get_category_definition(effective_category_key);
    const target_group = grouped.find(
      (group) => group.category_key === effective_category.key
    );

    if (!target_group) {
      continue;
    }

    const runtime = balanced_pool_runtime.get(effective_category_key) ?? {};
    const balanced_config = runtime.balanced_config;
    const has_real_split_rows = runtime.has_real_split_rows === true;
    const has_redistribution_pool = runtime.has_redistribution_pool === true;

    const is_balanced_parent = is_balanced_parent_key(row.key, balanced_config);
    const is_balanced_child = is_balanced_child_key(row.key, balanced_config);

    if (has_real_split_rows && is_balanced_child) {
      continue;
    }

    if (has_redistribution_pool && !is_balanced_parent) {
      continue;
    }

    let input_amount = entry.input_amount;

    if (balanced_config && is_balanced_parent) {
      const child_assigned_total = source_rows.reduce((sum, child_entry) => {
        if (child_entry.effective_category_key !== effective_category_key) {
          return sum;
        }

        if (child_entry.row.key === balanced_config.parent_key) {
          return sum;
        }

        if (
          has_real_split_rows &&
          is_balanced_child_key(child_entry.row.key, balanced_config)
        ) {
          return sum;
        }

        return sum + child_entry.input_amount;
      }, 0);

      input_amount = Math.max(
        target_group.source_total_amount - child_assigned_total,
        0
      );
    }

    input_amount = format_allocation_amount(input_amount);

    const system_allocation_type = is_balanced_parent
      ? "business_overhead"
      : get_effective_system_allocation_type(
          row,
          overhead_state,
          effective_category_key
        );

    const allocation_pool_key =
      ASSET_POOL_BY_ALLOCATION_TYPE[system_allocation_type] || "";
    const is_asset_related_pool = Boolean(allocation_pool_key);
    const is_assigned =
      !is_balanced_parent &&
      system_allocation_type !== "unallocated_needs_review" &&
      to_number(input_amount) > 0;

    const shaped_row = {
      ...row,
      line_id: row.key,
      line_label: row.label,
      source_category: row.source_category || default_category_key,
      current_category: effective_category_key,
      source_amount: format_allocation_amount(entry.source_amount),
      amount: input_amount,
      amount_display: format_currency(input_amount),
      input_amount_display: format_input_amount(input_amount),
      default_category_key,
      default_category_label: get_category_definition(default_category_key)
        .label,
      effective_category_key,
      effective_category_label: effective_category.label,
      is_reclassified: effective_category_key !== default_category_key,
      system_allocation_type,
      system_allocation_label:
        SYSTEM_ALLOCATION_LABELS[system_allocation_type] ||
        SYSTEM_ALLOCATION_LABELS.unallocated_needs_review,
      is_asset_related_pool,
      allocation_pool_key,
      is_balanced_parent_pool: Boolean(is_balanced_parent),
      is_pool_split_row: Boolean(is_balanced_child),
      is_allocation_only_amount: Boolean(is_balanced_child),
      is_assigned,
      is_pool_balance_row: Boolean(is_balanced_parent),
      is_hidden_when_real_split_rows_exist: Boolean(
        is_balanced_parent && has_real_split_rows
      ),
    };

    if (include_move_controls) {
      shaped_row.category_options = CATEGORY_DEFINITIONS.map((category) => ({
        value: category.key,
        label: category.label,
      }));
      shaped_row.system_allocation_options = SYSTEM_ALLOCATION_TYPES.map(
        (type) => ({
          value: type.key,
          label: type.label,
        })
      );
    }

    if (
      include_move_controls &&
      shaped_row.is_hidden_when_real_split_rows_exist
    ) {
      continue;
    }

    target_group.rows.push(shaped_row);
  }

  for (const group of grouped) {
    const runtime = balanced_pool_runtime.get(group.category_key) ?? {};

    if (!runtime.has_redistribution_pool) {
      continue;
    }

    const virtual_rows = build_virtual_redistribution_rows({
      category_key: group.category_key,
      category_label: group.category_label,
      source_total_amount: group.source_total_amount,
      overhead_state,
    });

    for (const virtual_row of virtual_rows) {
      const shaped_virtual_row = { ...virtual_row };

      if (include_move_controls) {
        shaped_virtual_row.category_options = [
          {
            value: group.category_key,
            label: group.category_label,
          },
        ];

        shaped_virtual_row.system_allocation_options = [
          {
            value: shaped_virtual_row.system_allocation_type,
            label: shaped_virtual_row.system_allocation_label,
          },
        ];
      }

      group.rows.push(shaped_virtual_row);
    }
  }

  return grouped
    .map((group) => {
      const assigned_amount = group.rows.reduce((total, row) => {
        if (row.is_balanced_parent_pool) {
          return total;
        }

        return row.is_assigned ? total + to_number(row.amount) : total;
      }, 0);

      const asset_pool_amount = group.rows.reduce((total, row) => {
        if (row.is_balanced_parent_pool) {
          return total;
        }

        return row.is_asset_related_pool
          ? total + to_number(row.amount)
          : total;
      }, 0);

      const rounded_assigned_amount = format_allocation_amount(assigned_amount);
      const rounded_asset_pool_amount =
        format_allocation_amount(asset_pool_amount);
      const remaining_amount = format_allocation_amount(
        group.source_total_amount - rounded_assigned_amount
      );

      return {
        ...group,
        assigned_amount: rounded_assigned_amount,
        remaining_amount,
        allocation_pool_used: rounded_asset_pool_amount,
        allocation_pool_remaining: remaining_amount,
        allocation_pool_status: get_pool_status(
          group.source_total_amount,
          rounded_assigned_amount
        ),
        total_amount: group.source_total_amount,
        total_amount_display: format_currency(group.source_total_amount),
        rows: group.rows.sort((a, b) => {
          if (a.is_balanced_parent_pool && !b.is_balanced_parent_pool) {
            return -1;
          }

          if (!a.is_balanced_parent_pool && b.is_balanced_parent_pool) {
            return 1;
          }

          if (
            a.is_virtual_redistribution_row &&
            b.is_virtual_redistribution_row
          ) {
            return (a.sort_order ?? 999) - (b.sort_order ?? 999);
          }

          if (
            a.is_virtual_redistribution_row &&
            !b.is_virtual_redistribution_row
          ) {
            return -1;
          }

          if (
            !a.is_virtual_redistribution_row &&
            b.is_virtual_redistribution_row
          ) {
            return 1;
          }

          return b.amount - a.amount;
        }),
      };
    })
    .filter((group) => group.rows.length > 0);
}