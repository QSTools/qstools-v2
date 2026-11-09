import { model_storage } from "./modelStorage.js";
import { apply_rate_deltas, get_rate_deltas } from "./modelLeverDiffs.js";

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

function read_baseline_labour_source_rates() {
  if (!can_use_browser_storage()) {
    return {};
  }

  const raw_value = model_storage.getItem(
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

// R3 slice 5 lever batch L1: in Model mode the saved charge-out rate moves (differences in mirra_diffs_v1) are added to the baseline map.
// In baseline mode get_rate_deltas() is empty and reads no storage, so the result equals the stored map.
export function readRateBuilderLabourSourceRates() {
  return apply_rate_deltas(read_baseline_labour_source_rates(), get_rate_deltas());
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

  model_storage.setItem(
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

  model_storage.removeItem(
    RATE_BUILDER_LABOUR_SOURCE_RATES_STORAGE_KEY
  );
}