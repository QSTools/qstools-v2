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
    office_rent: 0,
    power_cost: 0,
    internet_cost: 0,
    phone_system_cost: 0,
    bank_fees: 0,
    marketing_cost: 0,
    office_supplies_cost: 0,
    general_admin_cost: 0,
    other_general_overhead_cost: 0,
    custom_overhead_items: [],
    profile_version: 1,
    effective_from: "",
    is_active: true,
    created_at: timestamp,
    updated_at: timestamp,
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

    return {
      ...create_empty_general_overhead_state(),
      ...parsed,
      custom_overhead_items: Array.isArray(parsed.custom_overhead_items)
        ? parsed.custom_overhead_items
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

  window.localStorage.setItem(
    GENERAL_OVERHEAD_STORAGE_KEY,
    JSON.stringify(overhead_state)
  );

  return overhead_state;
}

export function reset_general_overhead_state() {
  const next_state = create_empty_general_overhead_state();
  save_general_overhead_state(next_state);
  return next_state;
}