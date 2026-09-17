const NON_PRODUCTIVE_POLICY_STORAGE_KEY = "qstools_business_outcome_non_productive_policy_v1";

// Stores the business-wide default for how a MIXED working unit's own
// non-productive cost (e.g. the Foreman's company car, riding alongside
// his real billable work) affects the cascade - confirmed with user,
// 2026-09-17. PURE-support working units (no productive member at all,
// e.g. an Office Staff unit) are NOT affected by this setting - they
// always spread, since there is no other meaningful option (no revenue
// stream exists to charge their cost to). This setting only governs the
// genuine choice that exists for MIXED units.
//
//   "charge_to_self" (default) - that unit's own rate must cover it.
//     Confirmed correct for cases like the Foreman - the true cost of
//     running him, including his vehicle, shows up in his own number.
//   "spread_as_overhead" - spread alongside pure-support cost instead.
//     Confirmed needed because charge_to_self can push one person's
//     rate implausibly high to recover a cost that was never really
//     theirs alone (user's own example: $150/hr to recover a shared
//     vehicle).

function can_use_browser_storage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

const DEFAULT_NON_PRODUCTIVE_POLICY_STATE = {
  mixed_unit_non_productive_policy: "charge_to_self",
};

export function readNonProductiveCostPolicy() {
  if (!can_use_browser_storage()) {
    return { ...DEFAULT_NON_PRODUCTIVE_POLICY_STATE };
  }

  const raw_value = window.localStorage.getItem(NON_PRODUCTIVE_POLICY_STORAGE_KEY);
  if (!raw_value) {
    return { ...DEFAULT_NON_PRODUCTIVE_POLICY_STATE };
  }

  try {
    const parsed = JSON.parse(raw_value);
    if (!parsed || typeof parsed !== "object") {
      return { ...DEFAULT_NON_PRODUCTIVE_POLICY_STATE };
    }
    const policy = parsed.mixed_unit_non_productive_policy;
    return {
      mixed_unit_non_productive_policy:
        policy === "spread_as_overhead" ? "spread_as_overhead" : "charge_to_self",
    };
  } catch {
    return { ...DEFAULT_NON_PRODUCTIVE_POLICY_STATE };
  }
}

export function writeNonProductiveCostPolicy(mixed_unit_non_productive_policy) {
  if (!can_use_browser_storage()) {
    return;
  }

  window.localStorage.setItem(
    NON_PRODUCTIVE_POLICY_STORAGE_KEY,
    JSON.stringify({
      mixed_unit_non_productive_policy:
        mixed_unit_non_productive_policy === "spread_as_overhead" ? "spread_as_overhead" : "charge_to_self",
    })
  );
}