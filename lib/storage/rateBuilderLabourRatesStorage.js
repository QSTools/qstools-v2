const STORAGE_KEY = "qs_tools_rate_builder_labour_rates_v1";

export const DEFAULT_LABOUR_RATE_MODEL = {
  labour_rate_model_id: "default_labour_rate_model",
  labour_rate_model_name: "Standard Labour Charge-Out",

  labour_source_type_id: "all_productive",
  labour_source_type_name: "All productive labour weighted rate",
  labour_source_kind: "all_productive",

  labour_group_name: "All productive labour weighted rate",
  labour_unit_label: "hr",

  labour_cost_rate: 45,
  productive_efficiency_percent: 100,
  recovery_allowance_rate: 0,
  target_margin_percent: 25,
  current_charge_out_rate: 75,

  created_at: null,
  updated_at: null,
};

function safe_parse(json_value) {
  try {
    return JSON.parse(json_value);
  } catch {
    return null;
  }
}

export function create_labour_rate_model(overrides = {}) {
  const now = new Date().toISOString();

  return {
    ...DEFAULT_LABOUR_RATE_MODEL,
    labour_rate_model_id:
      overrides.labour_rate_model_id || crypto.randomUUID(),
    labour_rate_model_name:
      overrides.labour_rate_model_name || "New Labour Rate",

    labour_source_type_id:
      overrides.labour_source_type_id ||
      DEFAULT_LABOUR_RATE_MODEL.labour_source_type_id,
    labour_source_type_name:
      overrides.labour_source_type_name ||
      DEFAULT_LABOUR_RATE_MODEL.labour_source_type_name,
    labour_source_kind:
      overrides.labour_source_kind ||
      DEFAULT_LABOUR_RATE_MODEL.labour_source_kind,

    labour_group_name:
      overrides.labour_group_name ||
      overrides.labour_source_type_name ||
      DEFAULT_LABOUR_RATE_MODEL.labour_group_name,

    created_at: overrides.created_at || now,
    updated_at: now,

    ...overrides,
  };
}

export function load_labour_rate_models() {
  if (typeof window === "undefined") {
    return [DEFAULT_LABOUR_RATE_MODEL];
  }

  const stored_value = window.localStorage.getItem(STORAGE_KEY);
  const parsed_value = stored_value ? safe_parse(stored_value) : null;

  if (!Array.isArray(parsed_value) || parsed_value.length === 0) {
    return [create_labour_rate_model(DEFAULT_LABOUR_RATE_MODEL)];
  }

  return parsed_value.map((model) =>
    create_labour_rate_model({
      ...DEFAULT_LABOUR_RATE_MODEL,
      ...model,
      labour_source_type_id:
        model.labour_source_type_id ||
        DEFAULT_LABOUR_RATE_MODEL.labour_source_type_id,
      labour_source_type_name:
        model.labour_source_type_name ||
        model.labour_group_name ||
        DEFAULT_LABOUR_RATE_MODEL.labour_source_type_name,
      labour_source_kind:
        model.labour_source_kind ||
        DEFAULT_LABOUR_RATE_MODEL.labour_source_kind,
      created_at: model.created_at || null,
      updated_at: model.updated_at || null,
    })
  );
}

export function save_labour_rate_models(models) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(models));
}