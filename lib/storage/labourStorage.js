const DEFAULT_LABOUR_STATE = {
  staff_id: "",
  staff_name: "",
  staff_role: "",
  labour_class: "",

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