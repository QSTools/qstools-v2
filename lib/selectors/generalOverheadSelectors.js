function format_currency(value) {
  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

const CATEGORY_DEFINITIONS = [
  { key: "office_admin", label: "Office / Admin" },
  { key: "financial_admin", label: "Accounting / Admin" },
  { key: "finance_interest", label: "Finance / Interest" },
  { key: "insurance_compliance", label: "Insurance / Compliance" },
  { key: "staff_overheads", label: "Staff Overheads" },
  { key: "vehicles_running", label: "Vehicle Running Costs" },
  { key: "travel", label: "Travel" },
  { key: "facilities_premises", label: "Facilities / Premises" },
  { key: "sales_growth", label: "Sales / Growth" },
  { key: "other_unallocated", label: "Other / Unallocated" },
];

const DEFAULT_CATEGORY_MAP = {
  public_liability_insurance: "insurance_compliance",
  professional_indemnity_insurance: "insurance_compliance",
  asset_insurance_cost: "insurance_compliance",
  insurance_compliance_cost: "insurance_compliance",

  accounting_fees: "financial_admin",
  legal_fees: "financial_admin",
  bank_fees: "financial_admin",
  finance_interest_cost: "finance_interest",

  software_subscriptions: "office_admin",
  office_admin_cost: "office_admin",
  internet_cost: "office_admin",
  phone_system_cost: "office_admin",
  office_supplies_cost: "office_admin",
  general_admin_cost: "office_admin",

  office_rent: "facilities_premises",
  power_cost: "facilities_premises",

  marketing_cost: "sales_growth",
  sales_growth_cost: "sales_growth",

  staff_overheads_cost: "staff_overheads",
  travel_cost: "travel",

  fuel_cost_annual: "vehicles_running",
  vehicle_running_cost_annual: "vehicles_running",
  vehicle_maintenance_cost_annual: "vehicles_running",
  vehicle_repairs_cost_annual: "vehicles_running",
  vehicle_registration_cost_annual: "vehicles_running",
  vehicle_tyres_cost_annual: "vehicles_running",
  vehicle_consumables_cost_annual: "vehicles_running",

  other_general_overhead_cost: "other_unallocated",
};

const BALANCED_POOL_CONFIGS = [
  {
    category_key: "insurance_compliance",
    parent_key: "insurance_compliance_cost",
    child_keys: [
      "public_liability_insurance",
      "professional_indemnity_insurance",
      "asset_insurance_cost",
    ],
  },
  {
    category_key: "vehicles_running",
    parent_key: "vehicle_running_cost_annual",
    child_keys: [
      "fuel_cost_annual",
      "vehicle_maintenance_cost_annual",
      "vehicle_repairs_cost_annual",
      "vehicle_registration_cost_annual",
      "vehicle_tyres_cost_annual",
      "vehicle_consumables_cost_annual",
    ],
  },
];

export const SYSTEM_ALLOCATION_TYPES = [
  { key: "business_overhead", label: "Business overhead" },
  { key: "asset_related_fuel_pool", label: "Asset-related fuel pool" },
  {
    key: "asset_related_insurance_pool",
    label: "Asset-related insurance pool",
  },
  {
    key: "asset_related_repairs_maintenance_pool",
    label: "Asset-related repairs / maintenance pool",
  },
  {
    key: "asset_related_registration_compliance_pool",
    label: "Asset-related registration / compliance pool",
  },
  {
    key: "asset_related_consumables_pool",
    label: "Asset-related consumables pool",
  },
  { key: "asset_finance_interest", label: "Asset finance / interest" },
  { key: "staff_overhead", label: "Staff overhead" },
  { key: "premises_overhead", label: "Premises overhead" },
  { key: "sales_overhead", label: "Sales overhead" },
  { key: "unallocated_needs_review", label: "Unallocated / needs review" },
];

const SYSTEM_ALLOCATION_LABELS = Object.fromEntries(
  SYSTEM_ALLOCATION_TYPES.map((type) => [type.key, type.label])
);

const ASSET_POOL_BY_ALLOCATION_TYPE = {
  asset_related_fuel_pool: "asset_fuel_pool",
  asset_related_insurance_pool: "asset_insurance_pool",
  asset_related_repairs_maintenance_pool: "asset_repairs_maintenance_pool",
  asset_related_registration_compliance_pool:
    "asset_registration_compliance_pool",
  asset_related_consumables_pool: "asset_consumables_pool",
  asset_finance_interest: "asset_finance_interest_pool",
};

const ASSET_OVERHEAD_POOL_DEFINITIONS = {
  asset_fuel_pool: "Asset-related fuel pool",
  asset_insurance_pool: "Asset-related insurance pool",
  asset_repairs_maintenance_pool:
    "Asset-related repairs / maintenance pool",
  asset_registration_compliance_pool:
    "Asset-related registration / compliance pool",
  asset_consumables_pool: "Asset-related consumables pool",
  asset_finance_interest_pool: "Asset finance / interest pool",
};

function to_number(value) {
  if (typeof value === "string") {
    const cleaned = value.replace(/,/g, "");
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function get_category_definition(category_key) {
  return (
    CATEGORY_DEFINITIONS.find((category) => category.key === category_key) ||
    CATEGORY_DEFINITIONS.find(
      (category) => category.key === "other_unallocated"
    )
  );
}

function get_default_category_key(row) {
  if (
    row.overhead_category_key &&
    CATEGORY_DEFINITIONS.some(
      (category) => category.key === row.overhead_category_key
    )
  ) {
    return row.overhead_category_key;
  }

  if (row.is_custom) {
    return "other_unallocated";
  }

  return DEFAULT_CATEGORY_MAP[row.key] || "other_unallocated";
}

function get_effective_category_key(row, overhead_state) {
  const overrides = overhead_state?.overhead_category_overrides ?? {};
  const override_category_key = overrides[row.key];

  if (
    override_category_key &&
    CATEGORY_DEFINITIONS.some(
      (category) => category.key === override_category_key
    )
  ) {
    return override_category_key;
  }

  return get_default_category_key(row);
}

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
  if (assigned_amount <= 0) {
    return "unallocated";
  }

  if (assigned_amount < source_total_amount) {
    return "partially_allocated";
  }

  if (assigned_amount === source_total_amount) {
    return "fully_allocated";
  }

  return "over_allocated";
}

function get_balanced_pool_config(category_key) {
  return BALANCED_POOL_CONFIGS.find(
    (config) => config.category_key === category_key
  );
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

function build_grouped_rows(
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

  for (const group of grouped) {
    const balanced_config = get_balanced_pool_config(group.category_key);

    const group_source_rows = source_rows.filter(
      (entry) => entry.effective_category_key === group.category_key
    );

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

    group.source_total_amount = source_total_amount;
    group.total_amount = source_total_amount;
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

    const balanced_config = get_balanced_pool_config(effective_category_key);
    const is_balanced_parent =
      balanced_config?.parent_key && row.key === balanced_config.parent_key;
    const is_balanced_child =
      balanced_config?.child_keys?.includes(row.key) === true;

    let input_amount = entry.input_amount;

    if (balanced_config && is_balanced_parent) {
      const child_assigned_total = balanced_config.child_keys.reduce(
        (sum, child_key) => {
          const child_entry = source_rows_by_key.get(child_key);

          if (!child_entry) {
            return sum;
          }

          return sum + child_entry.input_amount;
        },
        0
      );

      input_amount = Math.max(
        target_group.source_total_amount - child_assigned_total,
        0
      );
    }

    const system_allocation_type = get_effective_system_allocation_type(
      row,
      overhead_state,
      effective_category_key
    );
    const allocation_pool_key =
      ASSET_POOL_BY_ALLOCATION_TYPE[system_allocation_type] || "";
    const is_asset_related_pool = Boolean(allocation_pool_key);
    const is_assigned =
      system_allocation_type !== "unallocated_needs_review" &&
      to_number(input_amount) > 0;

    const shaped_row = {
      ...row,
      line_id: row.key,
      line_label: row.label,
      source_category: row.source_category || default_category_key,
      current_category: effective_category_key,
      source_amount: entry.source_amount,
      amount: input_amount,
      amount_display: format_currency(input_amount),
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

    target_group.rows.push(shaped_row);
  }

  return grouped
    .map((group) => {
      const assigned_amount = group.rows.reduce((total, row) => {
        return row.is_assigned ? total + to_number(row.amount) : total;
      }, 0);

      const asset_pool_amount = group.rows.reduce((total, row) => {
        return row.is_asset_related_pool
          ? total + to_number(row.amount)
          : total;
      }, 0);

      const remaining_amount = group.source_total_amount - assigned_amount;

      return {
        ...group,
        assigned_amount,
        remaining_amount,
        allocation_pool_used: asset_pool_amount,
        allocation_pool_remaining: remaining_amount,
        allocation_pool_status: get_pool_status(
          group.source_total_amount,
          assigned_amount
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

          return b.amount - a.amount;
        }),
      };
    })
    .filter((group) => group.rows.length > 0);
}

function build_pool_source_line(row) {
  return {
    line_id: row.line_id,
    line_label: row.line_label,
    source_category: row.source_category,
    current_category: row.current_category,
    source_amount: row.source_amount,
    amount: row.amount,
    system_allocation_type: row.system_allocation_type,
    system_allocation_label: row.system_allocation_label,
    is_asset_related_pool: row.is_asset_related_pool,
    allocation_pool_key: row.allocation_pool_key,
  };
}

function build_asset_overhead_pools(rows = []) {
  const pools = Object.fromEntries(
    Object.entries(ASSET_OVERHEAD_POOL_DEFINITIONS).map(([key, label]) => [
      key,
      {
        label,
        amount: 0,
        source_lines: [],
      },
    ])
  );

  rows.forEach((row) => {
    if (!row?.is_asset_related_pool || !row?.allocation_pool_key) {
      return;
    }

    const target_pool = pools[row.allocation_pool_key];

    if (!target_pool) {
      return;
    }

    target_pool.amount += to_number(row.amount);
    target_pool.source_lines.push(build_pool_source_line(row));
  });

  return pools;
}

function build_allocation_pool_warnings(rows = [], group_summaries = []) {
  const warnings = [];

  rows.forEach((row) => {
    if (
      row.system_allocation_type === "unallocated_needs_review" &&
      to_number(row.amount) !== 0 &&
      !row.is_balanced_parent_pool
    ) {
      warnings.push({
        warning_key: "overhead_line_needs_allocation_type",
        message: `${row.line_label} needs a system allocation type before it can support downstream asset modelling.`,
        line_id: row.line_id,
      });
    }
  });

  group_summaries.forEach((group) => {
    if (group.allocation_pool_status === "over_allocated") {
      warnings.push({
        warning_key: "asset_pool_over_allocated",
        message: `${group.category_label} has more allocated than the P&L source total.`,
        category_key: group.category_key,
      });
    }

    if (group.allocation_pool_status === "partially_allocated") {
      warnings.push({
        warning_key: "asset_pool_partially_allocated",
        message: `${group.category_label} is partially assigned. The remaining amount stays in General Overheads.`,
        category_key: group.category_key,
      });
    }
  });

  return warnings;
}

export function build_general_overhead_category_totals(
  rows = [],
  overhead_state = {}
) {
  const totals = new Map(
    CATEGORY_DEFINITIONS.map((category) => [
      category.key,
      {
        category_id: category.key,
        category_name: category.label,
        total: 0,
      },
    ])
  );

  for (const row of rows ?? []) {
    const category_key = get_effective_category_key(row, overhead_state);
    const category = get_category_definition(category_key);
    const existing = totals.get(category.key);

    totals.set(category.key, {
      ...existing,
      total: to_number(existing?.total) + to_number(row.active_amount),
    });
  }

  return Array.from(totals.values());
}

export function build_general_overhead_allocation_outputs({
  overhead_rows = [],
  overhead_state = {},
}) {
  const grouped_rows = build_grouped_rows(overhead_rows, overhead_state, false);
  const allocation_rows = grouped_rows.flatMap((group) => group.rows);
  const asset_overhead_pools = build_asset_overhead_pools(allocation_rows);
  const total_asset_overhead_pool_amount = Object.values(
    asset_overhead_pools
  ).reduce((total, pool) => total + to_number(pool?.amount), 0);
  const unallocated_overhead_lines = allocation_rows.filter(
    (row) =>
      row.system_allocation_type === "unallocated_needs_review" &&
      to_number(row.amount) !== 0
  );
  const unallocated_overhead_amount = unallocated_overhead_lines.reduce(
    (total, row) => total + to_number(row.amount),
    0
  );

  return {
    allocation_rows,
    allocation_pool_summaries: grouped_rows.map((group) => ({
      category_key: group.category_key,
      category_label: group.category_label,
      source_total_amount: group.source_total_amount,
      assigned_amount: group.assigned_amount,
      remaining_amount: group.remaining_amount,
      allocation_pool_used: group.allocation_pool_used,
      allocation_pool_remaining: group.allocation_pool_remaining,
      allocation_pool_status: group.allocation_pool_status,
    })),
    asset_overhead_pools,
    total_asset_overhead_pool_amount,
    unallocated_overhead_lines: unallocated_overhead_lines.map(
      build_pool_source_line
    ),
    unallocated_overhead_amount,
    allocation_pool_warnings: build_allocation_pool_warnings(
      allocation_rows,
      grouped_rows
    ),
  };
}

export function build_general_overhead_status({
  overhead_state,
  saved_overheads,
  calculated,
}) {
  const warnings = [];

  if (!overhead_state.overhead_profile_name?.trim()) {
    warnings.push("Profile name is missing.");
  }

  if ((saved_overheads ?? []).length === 0) {
    warnings.push("No saved overhead profiles yet.");
  }

  const grouped_summary = build_grouped_rows(
    calculated.overhead_rows,
    overhead_state,
    false
  );

  const reclassified_count = (calculated.overhead_rows ?? []).filter((row) => {
    return (
      get_effective_category_key(row, overhead_state) !==
      get_default_category_key(row)
    );
  }).length;

  return {
    is_ready: warnings.length === 0,
    warning_count: warnings.length,
    warnings,
    active_profile_name:
      overhead_state.overhead_profile_name || "Untitled Profile",
    saved_profile_count: (saved_overheads ?? []).length,
    total_general_overheads_display: format_currency(
      calculated.total_general_overheads
    ),
    reclassified_count,
    grouped_summary,
  };
}

export function build_general_overhead_card({
  overhead_state,
  saved_overheads,
  calculated,
  output_contract,
  actions,
}) {
  const grouped_summary = build_grouped_rows(
    calculated.overhead_rows,
    overhead_state,
    false
  );

  const grouped_reclassification = build_grouped_rows(
    calculated.overhead_rows,
    overhead_state,
    true
  );

  return {
    profile: {
      overhead_profile_name: overhead_state.overhead_profile_name,
      effective_from: overhead_state.effective_from,
      is_active: overhead_state.is_active,
      save_profile: actions.save_profile,
      reset_state: actions.reset_state,
      sync_from_pnl: actions.sync_from_pnl,
      update_field: actions.update_field,
    },
    profiles: {
      saved_overheads,
      load_profile: actions.load_profile,
      delete_profile: actions.delete_profile,
    },
    form: {
      overhead_state,
      update_field: actions.update_field,
      update_custom_item: actions.update_custom_item,
      add_custom_item: actions.add_custom_item,
      remove_custom_item: actions.remove_custom_item,
    },
    summary: {
      total_general_overheads: calculated.total_general_overheads,
      total_general_overheads_display: format_currency(
        calculated.total_general_overheads
      ),
      overhead_rows: calculated.overhead_rows.map((row) => ({
        ...row,
        amount_display: format_currency(row.amount),
      })),
      grouped_overhead_rows: grouped_summary,
      output_contract,
    },
    reclassification: {
      title: "Reclassify Overheads",
      help_text:
        "Review and assign portions of broad overhead pools. This working layer does not change the General Overheads total used by Cost Summary.",
      grouped_overhead_rows: grouped_reclassification,
      update_category_override: actions.update_category_override,
      update_system_allocation_override:
        actions.update_system_allocation_override,
      update_system_allocation_amount_override:
        actions.update_system_allocation_amount_override,
    },
  };
}