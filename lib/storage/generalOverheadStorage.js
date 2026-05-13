const GENERAL_OVERHEAD_STORAGE_KEY = "qs_tools_general_overhead_state";

function create_uuid(prefix = "overhead") {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function create_timestamp() {
  return new Date().toISOString();
}

export function create_empty_general_overhead_state() {
  const timestamp = create_timestamp();

  return {
    overhead_profile_id: create_uuid("overhead-profile"),
    owner_scope_id: "",
    overhead_profile_name: "",
    public_liability_insurance: 0,
    professional_indemnity_insurance: 0,
    accounting_fees: 0,
    legal_fees: 0,
    software_subscriptions: 0,
    office_admin_cost: 0,
    office_rent: 0,
    power_cost: 0,
    internet_cost: 0,
    phone_system_cost: 0,
    bank_fees: 0,
    marketing_cost: 0,
    sales_growth_cost: 0,
    office_supplies_cost: 0,
    general_admin_cost: 0,

    staff_overheads_cost: 0,
    finance_interest_cost: 0,
    insurance_compliance_cost: 0,
    travel_cost: 0,

    fuel_cost_annual: 0,
    vehicle_running_cost_annual: 0,
    vehicle_maintenance_cost_annual: 0,
    vehicle_repairs_cost_annual: 0,
    vehicle_registration_cost_annual: 0,
    vehicle_tyres_cost_annual: 0,
    vehicle_consumables_cost_annual: 0,

    other_general_overhead_cost: 0,
    synced_pnl_overhead_items: [],
    custom_overhead_items: [],

    profile_version: 1,
    effective_from: "",
    is_active: true,
    created_at: timestamp,
    updated_at: timestamp,

    // Future pressure-layer readiness metadata.
    // These are record/context fields only. They must not be used in overhead calculations.
    change_reason: "",
    notes: "",
  };
}

export function load_general_overhead_state() {
  if (typeof window === "undefined") {
    return create_empty_general_overhead_state();
  }

  try {
    const raw = window.localStorage.getItem(GENERAL_OVERHEAD_STORAGE_KEY);

    if (!raw) {
      return create_empty_general_overhead_state();
    }

    const parsed = JSON.parse(raw);
    const fallback_state = create_empty_general_overhead_state();

    return {
      ...fallback_state,
      ...parsed,
      profile_version: Number(parsed.profile_version || 1),
      effective_from:
        parsed.effective_from || parsed.created_at || fallback_state.effective_from,
      is_active: parsed.is_active !== false,
      created_at: parsed.created_at || fallback_state.created_at,
      updated_at:
        parsed.updated_at || parsed.created_at || fallback_state.updated_at,
      change_reason: parsed.change_reason || "",
      notes: parsed.notes || "",
      custom_overhead_items: Array.isArray(parsed.custom_overhead_items)
        ? parsed.custom_overhead_items
        : [],
      synced_pnl_overhead_items: Array.isArray(parsed.synced_pnl_overhead_items)
        ? parsed.synced_pnl_overhead_items
        : [],
    };
  } catch {
    return create_empty_general_overhead_state();
  }
}

export function save_general_overhead_state(overhead_state) {
  if (typeof window === "undefined") {
    return overhead_state;
  }

  const next_state = {
    ...overhead_state,
    profile_version: Number(overhead_state.profile_version || 1),
    effective_from:
      overhead_state.effective_from || overhead_state.created_at || "",
    is_active: overhead_state.is_active !== false,
    created_at: overhead_state.created_at || create_timestamp(),
    updated_at: create_timestamp(),
    change_reason: overhead_state.change_reason || "",
    notes: overhead_state.notes || "",
  };

  window.localStorage.setItem(
    GENERAL_OVERHEAD_STORAGE_KEY,
    JSON.stringify(next_state)
  );

  return next_state;
}

export function reset_general_overhead_state() {
  const next_state = create_empty_general_overhead_state();
  save_general_overhead_state(next_state);
  return next_state;
}