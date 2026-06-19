const RATE_BUILDER_STORAGE_KEY = "qs_tools_rate_builder_calculators_v1";

export function loadRateBuilderCalculators(fallback_calculators = []) {
  if (typeof window === "undefined") {
    return fallback_calculators;
  }

  try {
    const stored_value = window.localStorage.getItem(RATE_BUILDER_STORAGE_KEY);

    if (!stored_value) {
      return fallback_calculators;
    }

    const parsed_value = JSON.parse(stored_value);

    if (!Array.isArray(parsed_value)) {
      return fallback_calculators;
    }

    return parsed_value;
  } catch {
    return fallback_calculators;
  }
}

export function saveRateBuilderCalculators(calculators = []) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      RATE_BUILDER_STORAGE_KEY,
      JSON.stringify(calculators)
    );
  } catch {
    // Local storage failure should not break the page.
  }
}