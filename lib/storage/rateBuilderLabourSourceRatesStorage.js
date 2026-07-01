const RATE_BUILDER_LABOUR_SOURCE_RATES_STORAGE_KEY =
  "qstools_rate_builder_labour_source_rates_v1";

function can_use_browser_storage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function to_number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function safe_parse_json(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function readRateBuilderLabourSourceRates() {
  if (!can_use_browser_storage()) {
    return {};
  }

  const raw_value = window.localStorage.getItem(
    RATE_BUILDER_LABOUR_SOURCE_RATES_STORAGE_KEY
  );

  if (!raw_value) {
    return {};
  }

  const parsed_value = safe_parse_json(raw_value, {});

  if (!parsed_value || typeof parsed_value !== "object") {
    return {};
  }

  return Object.entries(parsed_value).reduce((rate_map, [source_id, rate]) => {
    if (!source_id) {
      return rate_map;
    }

    rate_map[source_id] = to_number(rate);
    return rate_map;
  }, {});
}

export function writeRateBuilderLabourSourceRates(rate_map = {}) {
  if (!can_use_browser_storage()) {
    return;
  }

  const normalised_rate_map = Object.entries(rate_map || {}).reduce(
    (next_rate_map, [source_id, rate]) => {
      if (!source_id) {
        return next_rate_map;
      }

      next_rate_map[source_id] = to_number(rate);
      return next_rate_map;
    },
    {}
  );

  window.localStorage.setItem(
    RATE_BUILDER_LABOUR_SOURCE_RATES_STORAGE_KEY,
    JSON.stringify(normalised_rate_map)
  );
}

export function saveRateBuilderLabourSourceRate(source_id, rate) {
  if (!source_id) {
    return;
  }

  const existing_rates = readRateBuilderLabourSourceRates();

  writeRateBuilderLabourSourceRates({
    ...existing_rates,
    [source_id]: to_number(rate),
  });
}

export function deleteRateBuilderLabourSourceRate(source_id) {
  if (!source_id) {
    return;
  }

  const existing_rates = readRateBuilderLabourSourceRates();
  const next_rates = { ...existing_rates };

  delete next_rates[source_id];

  writeRateBuilderLabourSourceRates(next_rates);
}

export function clearRateBuilderLabourSourceRates() {
  if (!can_use_browser_storage()) {
    return;
  }

  window.localStorage.removeItem(
    RATE_BUILDER_LABOUR_SOURCE_RATES_STORAGE_KEY
  );
}