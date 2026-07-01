const STORAGE_KEY = "qstools_rate_builder_labour_source_rates_v1";

export function readRateBuilderLabourSourceRates() {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw);

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    return parsed;
  } catch {
    return {};
  }
}

export function saveRateBuilderLabourSourceRate(labour_source_key, charge_out_rate) {
  if (typeof window === "undefined") {
    return {};
  }

  const source_key = String(labour_source_key || "").trim();

  if (!source_key) {
    return readRateBuilderLabourSourceRates();
  }

  const parsed_rate = Number(charge_out_rate);
  const safe_rate =
    Number.isFinite(parsed_rate) && parsed_rate >= 0 ? parsed_rate : 0;

  const current = readRateBuilderLabourSourceRates();

  const next = {
    ...current,
    [source_key]: safe_rate,
  };

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));

  return next;
}

export function saveRateBuilderLabourSourceRates(rate_map) {
  if (typeof window === "undefined") {
    return {};
  }

  const safe_map = rate_map && typeof rate_map === "object" ? rate_map : {};

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(safe_map));

  return safe_map;
}
