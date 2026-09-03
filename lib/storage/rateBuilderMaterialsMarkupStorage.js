const RATE_BUILDER_MATERIALS_MARKUP_STORAGE_KEY =
  "qstools_rate_builder_materials_markup_v1";

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

const DEFAULT_MATERIALS_MARKUP_STATE = {
  materials_markup_percent: 0,
};

export function readRateBuilderMaterialsMarkup() {
  if (!can_use_browser_storage()) {
    return { ...DEFAULT_MATERIALS_MARKUP_STATE };
  }
  const raw_value = window.localStorage.getItem(
    RATE_BUILDER_MATERIALS_MARKUP_STORAGE_KEY
  );
  if (!raw_value) {
    return { ...DEFAULT_MATERIALS_MARKUP_STATE };
  }
  const parsed_value = safe_parse_json(raw_value, DEFAULT_MATERIALS_MARKUP_STATE);
  if (!parsed_value || typeof parsed_value !== "object") {
    return { ...DEFAULT_MATERIALS_MARKUP_STATE };
  }
  return {
    materials_markup_percent: to_number(parsed_value.materials_markup_percent),
  };
}

export function writeRateBuilderMaterialsMarkup(state = {}) {
  if (!can_use_browser_storage()) {
    return;
  }
  const normalised_state = {
    materials_markup_percent: to_number(state.materials_markup_percent),
  };
  window.localStorage.setItem(
    RATE_BUILDER_MATERIALS_MARKUP_STORAGE_KEY,
    JSON.stringify(normalised_state)
  );
}

export function saveRateBuilderMaterialsMarkupPercent(materials_markup_percent) {
  writeRateBuilderMaterialsMarkup({
    materials_markup_percent: to_number(materials_markup_percent),
  });
}

export function clearRateBuilderMaterialsMarkup() {
  if (!can_use_browser_storage()) {
    return;
  }
  window.localStorage.removeItem(RATE_BUILDER_MATERIALS_MARKUP_STORAGE_KEY);
}
