"use client";

const STORAGE_KEY = "qs_tools_quote_engine_store_v4";

function getIsoNow() {
  return new Date().toISOString();
}

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function createLocalId(prefix) {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export const DEFAULT_QUOTE_ENGINE_STATE = {
  quote_id: "",
  quote_job_id: "",
  quote_version_id: "",

  job_id: "",
  job_number: "",
  job_name: "",

  client_id: "",
  client_name: "",
  client_contact_name: "",
  client_phone: "",
  client_email: "",

  job_type_id: "",
  job_type_name: "",

  quote_name: "",
  quote_reference: "",
  quote_date: "",
  quote_status: "draft",
  quote_version: "1",

  is_winning_quote: false,
  is_live_job: false,
  live_job_id: "",

  quote_price_total: 0,

  cog_cost_total: 0,
  cog_pricing_mode: "markup",
  cog_markup_percent: 0,
  cog_sell_total: 0,

  labour_hours_allowed: 0,
  labour_hourly_cost_rate: 0,
  labour_cost_total: 0,
  labour_charge_total: 0,

  // Legacy aliases retained for compatibility
  estimated_labour_cost_total: 0,
  material_cost_total: 0,
  material_sell_total: 0,
  material_markup_percent: 0,
  labour_sell_total: 0,
  labour_charge_out_rate: 0,
  base_labour_hours_allowed: 0,
  direct_cost_package_allowance_total: 0,
  direct_cost_package_cost_total: 0,

  created_at: "",
  updated_at: "",
};

export function getHydrationSafeQuoteEngineStore() {
  return {
    current_quote_state: {
      ...DEFAULT_QUOTE_ENGINE_STATE,
    },
    quote_jobs: [],
    quote_versions: [],
  };
}

export function getDefaultQuoteEngineState() {
  const now = getIsoNow();

  return {
    ...DEFAULT_QUOTE_ENGINE_STATE,
    quote_id: createLocalId("quote"),
    quote_job_id: createLocalId("quote_job"),
    quote_version_id: createLocalId("quote_version"),
    quote_date: getTodayDate(),
    created_at: now,
    updated_at: now,
  };
}

export function buildQuoteEngineState(overrides = {}) {
  const now = getIsoNow();
  const base = getDefaultQuoteEngineState();

  const job_name = overrides.job_name || "";
  const job_number = overrides.job_number || "";

  const cog_cost_total = Number(
    overrides.cog_cost_total || overrides.material_cost_total || 0
  );

  const cog_markup_percent = Number(
    overrides.cog_markup_percent || overrides.material_markup_percent || 0
  );

  const cog_sell_total = Number(
    overrides.cog_sell_total || overrides.material_sell_total || 0
  );

  const labour_hours_allowed = Number(
    overrides.labour_hours_allowed || overrides.base_labour_hours_allowed || 0
  );

  const labour_hourly_cost_rate = Number(
    overrides.labour_hourly_cost_rate || 0
  );

  const labour_cost_total =
    labour_hours_allowed * labour_hourly_cost_rate;

  const labour_charge_total = Number(
    overrides.labour_charge_total || overrides.labour_sell_total || 0
  );

  return {
    ...base,
    ...overrides,

    quote_id: overrides.quote_id || base.quote_id,
    quote_job_id: overrides.quote_job_id || base.quote_job_id,
    quote_version_id: overrides.quote_version_id || base.quote_version_id,

    job_name,
    job_number,

    quote_name: overrides.quote_name || job_name,
    quote_reference: overrides.quote_reference || job_number,

    quote_date: overrides.quote_date || base.quote_date,
    quote_status: overrides.quote_status || "draft",
    quote_version: String(overrides.quote_version || "1"),

    is_winning_quote: Boolean(overrides.is_winning_quote),
    is_live_job: Boolean(overrides.is_live_job),

    quote_price_total: Number(overrides.quote_price_total || 0),

    cog_cost_total,
    cog_pricing_mode: "markup",
    cog_markup_percent,
    cog_sell_total,

    labour_hours_allowed,
    labour_hourly_cost_rate,
    labour_cost_total,
    labour_charge_total,

    // Legacy aliases
    estimated_labour_cost_total: labour_cost_total,
    material_cost_total: cog_cost_total,
    material_sell_total: cog_sell_total,
    material_markup_percent: cog_markup_percent,
    labour_sell_total: labour_charge_total,
    base_labour_hours_allowed: labour_hours_allowed,
    labour_charge_out_rate: Number(overrides.labour_charge_out_rate || 0),
    direct_cost_package_allowance_total: 0,
    direct_cost_package_cost_total: 0,

    created_at: overrides.created_at || now,
    updated_at: overrides.updated_at || now,
  };
}

export function getDefaultQuoteEngineStore() {
  return {
    current_quote_state: getDefaultQuoteEngineState(),
    quote_jobs: [],
    quote_versions: [],
  };
}

function buildQuoteEngineStore(overrides = {}) {
  return {
    current_quote_state: buildQuoteEngineState(
      overrides.current_quote_state || {}
    ),
    quote_jobs: Array.isArray(overrides.quote_jobs)
      ? overrides.quote_jobs
      : [],
    quote_versions: Array.isArray(overrides.quote_versions)
      ? overrides.quote_versions
      : [],
  };
}

function parseStoredStore(raw) {
  if (!raw) {
    return getDefaultQuoteEngineStore();
  }

  try {
    const parsed = JSON.parse(raw);

    if (parsed && typeof parsed === "object") {
      return buildQuoteEngineStore(parsed);
    }
  } catch {
    // Ignore invalid JSON.
  }

  return getDefaultQuoteEngineStore();
}

export function loadQuoteEngineStore() {
  if (typeof window === "undefined") {
    return getDefaultQuoteEngineStore();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return parseStoredStore(raw);
  } catch {
    return getDefaultQuoteEngineStore();
  }
}

export function saveQuoteEngineStore(store) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(buildQuoteEngineStore(store))
    );
  } catch {
    // Fail silently if storage is unavailable.
  }
}

export function resetQuoteEngineStore() {
  const next_store = getDefaultQuoteEngineStore();
  saveQuoteEngineStore(next_store);
  return next_store;
}

export function getNextQuoteVersionNumber(
  quote_versions = [],
  quote_job_id = ""
) {
  const versions_for_job = quote_versions.filter(
    (version) => version.quote_job_id === quote_job_id
  );

  const highest_version = versions_for_job.reduce((highest, version) => {
    const version_number = Number(version.quote_version || 0);

    return Number.isFinite(version_number)
      ? Math.max(highest, version_number)
      : highest;
  }, 0);

  return String(highest_version + 1);
}

export function createQuoteJobRecord(quote_state = {}) {
  const now = getIsoNow();

  return {
    quote_job_id: quote_state.quote_job_id || createLocalId("quote_job"),

    job_id: quote_state.job_id || "",
    job_number: quote_state.job_number || "",
    job_name: quote_state.job_name || "",

    client_id: quote_state.client_id || "",
    client_name: quote_state.client_name || "",
    client_contact_name: quote_state.client_contact_name || "",
    client_phone: quote_state.client_phone || "",
    client_email: quote_state.client_email || "",

    job_type_id: quote_state.job_type_id || "",
    job_type_name: quote_state.job_type_name || "",

    created_at: quote_state.created_at || now,
    updated_at: now,
  };
}

export function createQuoteVersionRecord(quote_state = {}) {
  const now = getIsoNow();

  const cog_cost_total = Number(
    quote_state.cog_cost_total || quote_state.material_cost_total || 0
  );

  const cog_markup_percent = Number(
    quote_state.cog_markup_percent || quote_state.material_markup_percent || 0
  );

  const cog_sell_total =
    cog_cost_total * (1 + cog_markup_percent / 100);

  const labour_hours_allowed = Number(
    quote_state.labour_hours_allowed ||
      quote_state.base_labour_hours_allowed ||
      0
  );

  const labour_hourly_cost_rate = Number(
    quote_state.labour_hourly_cost_rate || 0
  );

  const labour_cost_total =
    labour_hours_allowed * labour_hourly_cost_rate;

  const labour_charge_total = Math.max(
    0,
    Number(quote_state.quote_price_total || 0) - cog_sell_total
  );

  return {
    quote_id: quote_state.quote_id || createLocalId("quote"),
    quote_job_id: quote_state.quote_job_id || "",
    quote_version_id:
      quote_state.quote_version_id || createLocalId("quote_version"),

    quote_name: quote_state.quote_name || quote_state.job_name || "",
    quote_reference: quote_state.quote_reference || quote_state.job_number || "",
    quote_date: quote_state.quote_date || getTodayDate(),
    quote_status: quote_state.quote_status || "draft",
    quote_version: String(quote_state.quote_version || "1"),

    is_winning_quote: Boolean(quote_state.is_winning_quote),
    is_live_job: Boolean(quote_state.is_live_job),
    live_job_id: quote_state.live_job_id || "",

    quote_price_total: Number(quote_state.quote_price_total || 0),

    cog_cost_total,
    cog_pricing_mode: "markup",
    cog_markup_percent,
    cog_sell_total,

    labour_hours_allowed,
    labour_hourly_cost_rate,
    labour_cost_total,
    labour_charge_total,

    // Legacy aliases
    estimated_labour_cost_total: labour_cost_total,
    material_cost_total: cog_cost_total,
    material_sell_total: cog_sell_total,
    material_markup_percent: cog_markup_percent,
    labour_sell_total: labour_charge_total,
    labour_charge_out_rate: Number(quote_state.labour_charge_out_rate || 0),
    base_labour_hours_allowed: labour_hours_allowed,
    direct_cost_package_allowance_total: 0,
    direct_cost_package_cost_total: 0,

    created_at: quote_state.created_at || now,
    updated_at: now,
  };
}

export function mergeQuoteJobIntoState(quote_job = {}, overrides = {}) {
  const job_name = quote_job.job_name || "";
  const job_number = quote_job.job_number || "";

  return buildQuoteEngineState({
    ...overrides,

    quote_job_id: quote_job.quote_job_id || "",
    job_id: quote_job.job_id || "",
    job_number,
    job_name,

    client_id: quote_job.client_id || "",
    client_name: quote_job.client_name || "",
    client_contact_name: quote_job.client_contact_name || "",
    client_phone: quote_job.client_phone || "",
    client_email: quote_job.client_email || "",

    job_type_id: quote_job.job_type_id || "",
    job_type_name: quote_job.job_type_name || "",

    quote_name: overrides.quote_name || job_name,
    quote_reference: overrides.quote_reference || job_number,
  });
}

export function upsertById(records = [], record = {}, id_key = "") {
  const existing_index = records.findIndex(
    (item) => item[id_key] === record[id_key]
  );

  if (existing_index === -1) {
    return [...records, record];
  }

  return records.map((item, index) =>
    index === existing_index ? { ...item, ...record } : item
  );
}