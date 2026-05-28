export const DEFAULT_STAFF_TYPES = [
  {
    staff_type_id: "owner_director",
    staff_type_name: "Owner / Director",
    is_system_type: true,
    is_active: true,
    created_at: "",
    updated_at: "",
  },
  {
    staff_type_id: "manager",
    staff_type_name: "Manager",
    is_system_type: true,
    is_active: true,
    created_at: "",
    updated_at: "",
  },
  {
    staff_type_id: "supervisor_team_lead",
    staff_type_name: "Supervisor / Team Lead",
    is_system_type: true,
    is_active: true,
    created_at: "",
    updated_at: "",
  },
  {
    staff_type_id: "senior_operator_staff",
    staff_type_name: "Senior Operator / Senior Staff",
    is_system_type: true,
    is_active: true,
    created_at: "",
    updated_at: "",
  },
  {
    staff_type_id: "operator_delivery_staff",
    staff_type_name: "Operator / Delivery Staff",
    is_system_type: true,
    is_active: true,
    created_at: "",
    updated_at: "",
  },
  {
    staff_type_id: "junior_trainee",
    staff_type_name: "Junior / Trainee",
    is_system_type: true,
    is_active: true,
    created_at: "",
    updated_at: "",
  },
  {
    staff_type_id: "admin_support",
    staff_type_name: "Administration / Support",
    is_system_type: true,
    is_active: true,
    created_at: "",
    updated_at: "",
  },
  {
    staff_type_id: "sales_customer_support",
    staff_type_name: "Sales / Customer Support",
    is_system_type: true,
    is_active: true,
    created_at: "",
    updated_at: "",
  },
  {
    staff_type_id: "finance_accounts",
    staff_type_name: "Finance / Accounts",
    is_system_type: true,
    is_active: true,
    created_at: "",
    updated_at: "",
  },
  {
    staff_type_id: "other_review_required",
    staff_type_name: "Other / Review required",
    is_system_type: true,
    is_active: true,
    created_at: "",
    updated_at: "",
  },
];

const DEFAULT_LABOUR_STATE = {
  staff_id: "",
  staff_name: "",
  staff_role: "",
  staff_type_id: "",
  staff_type_name: "",
  labour_class: "",
  contributes_to_recovery_hours: true,

  hours_per_week: 40,
  days_per_week: 5,

  labour_rate: 0,
  charge_out_rate: 0,

  productivity_percent: 85,
  margin_target_percent: 20,

  annual_leave_weeks: 4,
  public_holiday_days: 12,
  sick_days: 10,
  bereavement_days: 1,
  family_violence_days: 0,

  employee_kiwisaver_enabled: true,

  acc_enabled: true,
  acc_bic_code: "",
  acc_bic_description: "",
  acc_cu_code: "",
  acc_cu_description: "",
  acc_rate: 0,
  acc_manual_override_enabled: false,
  acc_manual_rate: 0,

  // Future pressure-layer readiness metadata.
  // These are record/context fields only. They must not be used in Labour calculations.
  effective_from: "",
  change_reason: "",
  notes: "",
};

export const DEFAULT_LABOUR_MODULE_STATE = {
  staff_types: DEFAULT_STAFF_TYPES,
};

export function getDefaultLabourState() {
  return { ...DEFAULT_LABOUR_STATE };
}

export function buildLabourState(overrides = {}) {
  return {
    ...DEFAULT_LABOUR_STATE,
    ...overrides,
  };
}

export function resetLabourState() {
  return getDefaultLabourState();
}

export default getDefaultLabourState;
