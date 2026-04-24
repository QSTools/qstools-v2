function format_currency(value) {
  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

const CATEGORY_DEFINITIONS = [
  {
    key: "office_admin",
    label: "Office / Admin",
  },
  {
    key: "financial_admin",
    label: "Financial Admin",
  },
  {
    key: "insurance_compliance",
    label: "Insurance & Compliance",
  },
  {
    key: "vehicles_running",
    label: "Vehicles (Running)",
  },
  {
    key: "facilities_premises",
    label: "Facilities / Premises",
  },
  {
    key: "sales_growth",
    label: "Sales / Growth",
  },
  {
    key: "other_unallocated",
    label: "Other / Unallocated",
  },
];

const DEFAULT_CATEGORY_MAP = {
  public_liability_insurance: "insurance_compliance",
  professional_indemnity_insurance: "insurance_compliance",

  accounting_fees: "financial_admin",
  legal_fees: "financial_admin",
  bank_fees: "financial_admin",

  software_subscriptions: "office_admin",
  internet_cost: "office_admin",
  phone_system_cost: "office_admin",
  office_supplies_cost: "office_admin",
  general_admin_cost: "office_admin",

  office_rent: "facilities_premises",
  power_cost: "facilities_premises",

  marketing_cost: "sales_growth",

  fuel_cost_annual: "vehicles_running",
  vehicle_maintenance_cost_annual: "vehicles_running",
  vehicle_repairs_cost_annual: "vehicles_running",
  vehicle_registration_cost_annual: "vehicles_running",
  vehicle_tyres_cost_annual: "vehicles_running",
  vehicle_consumables_cost_annual: "vehicles_running",

  other_general_overhead_cost: "other_unallocated",
};

function to_number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function get_category_definition(category_key) {
  return (
    CATEGORY_DEFINITIONS.find((category) => category.key === category_key) ||
    CATEGORY_DEFINITIONS.find((category) => category.key === "other_unallocated")
  );
}

function get_default_category_key(row) {
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
    CATEGORY_DEFINITIONS.some((category) => category.key === override_category_key)
  ) {
    return override_category_key;
  }

  return get_default_category_key(row);
}

function build_grouped_rows(overhead_rows, overhead_state, include_move_controls = false) {
  const grouped = CATEGORY_DEFINITIONS.map((category) => ({
    category_key: category.key,
    category_label: category.label,
    total_amount: 0,
    total_amount_display: format_currency(0),
    rows: [],
  }));

  for (const row of overhead_rows ?? []) {
    const effective_category_key = get_effective_category_key(row, overhead_state);
    const default_category_key = get_default_category_key(row);
    const effective_category = get_category_definition(effective_category_key);

    const target_group = grouped.find(
      (group) => group.category_key === effective_category.key
    );

    if (!target_group) {
      continue;
    }

    const row_amount = to_number(row.amount);

    const shaped_row = {
      ...row,
      amount: row_amount,
      amount_display: format_currency(row_amount),
      default_category_key,
      default_category_label: get_category_definition(default_category_key).label,
      effective_category_key,
      effective_category_label: effective_category.label,
      is_reclassified: effective_category_key !== default_category_key,
    };

    if (include_move_controls) {
      shaped_row.category_options = CATEGORY_DEFINITIONS.map((category) => ({
        value: category.key,
        label: category.label,
      }));
    }

    target_group.rows.push(shaped_row);
    target_group.total_amount += row_amount;
  }

  return grouped
    .map((group) => ({
      ...group,
      total_amount_display: format_currency(group.total_amount),
      rows: group.rows.sort((a, b) => b.amount - a.amount),
    }))
    .filter((group) => group.rows.length > 0);
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
    return get_effective_category_key(row, overhead_state) !== get_default_category_key(row);
  }).length;

  return {
    is_ready: warnings.length === 0,
    warning_count: warnings.length,
    warnings,
    active_profile_name: overhead_state.overhead_profile_name || "Untitled Profile",
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
        "Review and correct where each cost sits. If the P&L has grouped something incorrectly, move it to the correct category here.",
      grouped_overhead_rows: grouped_reclassification,
      update_category_override: actions.update_category_override,
    },
  };
}