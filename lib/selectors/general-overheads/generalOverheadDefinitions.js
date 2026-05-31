export const CATEGORY_DEFINITIONS = [
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

export const DEFAULT_CATEGORY_MAP = {
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

export const BALANCED_POOL_CONFIGS = [
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
  {
    category_key: "finance_interest",
    parent_key: "finance_interest_cost",
    child_keys: ["accounting_fees", "bank_fees"],
  },
];

export const REDISTRIBUTION_POOL_CONFIGS = {
  insurance_compliance: {
    parent_key: "insurance_compliance_cost",
    targets: [
      {
        key: "insurance_compliance_split_business_insurance",
        label: "Business Insurance",
        system_allocation_type: "business_overhead",
        sort_order: 1,
        balance_type: "manual",
      },
      {
        key: "insurance_compliance_split_vehicle_asset_insurance",
        label: "Vehicle / Asset Insurance",
        system_allocation_type: "asset_related_insurance_pool",
        sort_order: 2,
        balance_type: "manual",
      },
      {
        key: "insurance_compliance_split_professional_indemnity",
        label: "Professional Indemnity",
        system_allocation_type: "business_overhead",
        sort_order: 3,
        balance_type: "manual",
      },
      {
        key: "insurance_compliance_split_compliance_hs",
        label: "Compliance / H&S",
        system_allocation_type: "business_overhead",
        sort_order: 4,
        balance_type: "auto_balance",
      },
    ],
  },

  vehicles_running: {
    parent_key: "vehicle_running_cost_annual",
    targets: [
      {
        key: "vehicles_running_split_fuel",
        label: "Fuel",
        system_allocation_type: "asset_related_fuel_pool",
        sort_order: 1,
        balance_type: "manual",
      },
      {
        key: "vehicles_running_split_repairs_maintenance",
        label: "Repairs / Maintenance",
        system_allocation_type: "asset_related_repairs_maintenance_pool",
        sort_order: 2,
        balance_type: "manual",
      },
      {
        key: "vehicles_running_split_registration_compliance",
        label: "Registration / Compliance",
        system_allocation_type: "asset_related_registration_compliance_pool",
        sort_order: 3,
        balance_type: "auto_balance",
      },
    ],
  },

  finance_interest: {
    parent_key: "finance_interest_cost",
    targets: [
      {
        key: "finance_interest_split_asset_finance_portion",
        label: "Includes Asset Finance Portion",
        system_allocation_type: "asset_finance_interest",
        sort_order: 1,
        balance_type: "manual",
      },
      {
        key: "finance_interest_split_business_finance_balance",
        label: "No Asset Finance / Business Finance Balance",
        system_allocation_type: "business_overhead",
        sort_order: 2,
        balance_type: "auto_balance",
      },
    ],
  },
};

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

export const SYSTEM_ALLOCATION_LABELS = Object.fromEntries(
  SYSTEM_ALLOCATION_TYPES.map((type) => [type.key, type.label])
);

export const ASSET_POOL_BY_ALLOCATION_TYPE = {
  asset_related_fuel_pool: "asset_fuel_pool",
  asset_related_insurance_pool: "asset_insurance_pool",
  asset_related_repairs_maintenance_pool: "asset_repairs_maintenance_pool",
  asset_related_registration_compliance_pool:
    "asset_registration_compliance_pool",
  asset_related_consumables_pool: "asset_consumables_pool",
  asset_finance_interest: "asset_finance_interest_pool",
};

export const ASSET_OVERHEAD_POOL_DEFINITIONS = {
  asset_fuel_pool: "Asset-related fuel pool",
  asset_insurance_pool: "Asset-related insurance pool",
  asset_repairs_maintenance_pool:
    "Asset-related repairs / maintenance pool",
  asset_registration_compliance_pool:
    "Asset-related registration / compliance pool",
  asset_consumables_pool: "Asset-related consumables pool",
  asset_finance_interest_pool: "Asset finance / interest pool",
};