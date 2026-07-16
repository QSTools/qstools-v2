function toNumber(value, fallback = 0) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function roundCurrency(value) {
  return Math.round(toNumber(value) * 100) / 100;
}

function roundPercent(value) {
  return Math.round(toNumber(value) * 100) / 100;
}

function resolveRequiredLabourRecovery(selected_model = {}, business_summary = {}) {
  return (
    toNumber(selected_model.required_recovery_per_driver, NaN) ||
    toNumber(selected_model.required_recovery_rate, NaN) ||
    toNumber(business_summary.required_recovery_per_driver, NaN) ||
    toNumber(business_summary.required_recovery_rate, NaN) ||
    0
  );
}

function resolveTargetMarginPercent(selected_model = {}) {
  return (
    toNumber(selected_model.target_margin_percent, NaN) ||
    toNumber(selected_model.margin_target_percent, NaN) ||
    toNumber(selected_model.gross_profit_percent, NaN) ||
    0
  );
}

export function calculateQuoteCheckerResult({
  quote = {},
  selected_model = {},
  business_summary = {},
  downstream_permissions = {},
  trust_state = "blocked",
  export_blockers = [],
  export_warnings = [],
} = {}) {
  const labour_hours = toNumber(quote.labour_hours);
  const labour_charge_total = toNumber(quote.labour_charge_total);
  const material_cost = toNumber(quote.material_cost);
  const material_charge_total = toNumber(quote.material_charge_total);
  const other_direct_cost = toNumber(quote.other_direct_cost);
  const other_direct_charge_total = toNumber(quote.other_direct_charge_total);

  const total_quote_charge =
    labour_charge_total + material_charge_total + other_direct_charge_total;

  const total_direct_cost =
    material_cost + other_direct_cost;

  const gross_profit_dollars =
    total_quote_charge - total_direct_cost;

  const gross_profit_percent =
    total_quote_charge > 0
      ? (gross_profit_dollars / total_quote_charge) * 100
      : 0;

  const implied_labour_charge_rate =
    labour_hours > 0 ? labour_charge_total / labour_hours : 0;

  const material_markup_dollars =
    material_charge_total - material_cost;

  const material_markup_percent =
    material_cost > 0 ? (material_markup_dollars / material_cost) * 100 : 0;

  const other_direct_markup_dollars =
    other_direct_charge_total - other_direct_cost;

  const other_direct_markup_percent =
    other_direct_cost > 0
      ? (other_direct_markup_dollars / other_direct_cost) * 100
      : 0;

  const required_labour_recovery =
    resolveRequiredLabourRecovery(selected_model, business_summary);

  const target_margin_percent =
    resolveTargetMarginPercent(selected_model);

  const labour_recovery_gap =
    implied_labour_charge_rate - required_labour_recovery;

  const blockers = [];
  const warnings = [];

  if (downstream_permissions.can_use_for_quote_checker !== true) {
    blockers.push({
      id: "quote_checker_permission_blocked",
      message: "The current model is not ready to be trusted for quote checking.",
    });
  }

  if (labour_hours <= 0) {
    blockers.push({
      id: "labour_hours_missing",
      message: "Labour hours must be greater than zero.",
    });
  }

  if (total_quote_charge <= 0) {
    blockers.push({
      id: "quote_charge_missing",
      message: "Total quote charge must be greater than zero.",
    });
  }

  if (
    required_labour_recovery > 0 &&
    implied_labour_charge_rate > 0 &&
    implied_labour_charge_rate < required_labour_recovery
  ) {
    warnings.push({
      id: "labour_recovery_below_model",
      message: "Implied labour charge rate is below the selected model recovery requirement.",
    });
  }

  if (
    target_margin_percent > 0 &&
    gross_profit_percent > 0 &&
    gross_profit_percent < target_margin_percent
  ) {
    warnings.push({
      id: "gross_profit_below_target",
      message: "Gross profit percent is below the selected model target margin.",
    });
  }

  const quote_alignment_status =
    blockers.length > 0 ? "blocked" : warnings.length > 0 ? "warning" : "aligned";

  return {
    quote_name: quote.quote_name || "Untitled quote",
    trust_state,
    total_quote_charge: roundCurrency(total_quote_charge),
    total_direct_cost: roundCurrency(total_direct_cost),
    gross_profit_dollars: roundCurrency(gross_profit_dollars),
    gross_profit_percent: roundPercent(gross_profit_percent),
    implied_labour_charge_rate: roundCurrency(implied_labour_charge_rate),
    material_markup_dollars: roundCurrency(material_markup_dollars),
    material_markup_percent: roundPercent(material_markup_percent),
    other_direct_markup_dollars: roundCurrency(other_direct_markup_dollars),
    other_direct_markup_percent: roundPercent(other_direct_markup_percent),
    required_labour_recovery: roundCurrency(required_labour_recovery),
    target_margin_percent: roundPercent(target_margin_percent),
    labour_recovery_gap: roundCurrency(labour_recovery_gap),
    quote_alignment_status,
    blockers,
    warnings,
    export_blockers,
    export_warnings,
  };
}
