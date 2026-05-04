function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-NZ", {
    maximumFractionDigits: 0,
  });
}

function formatPercent(value) {
  return `${Number(value || 0).toLocaleString("en-NZ", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`;
}

function formatCurrency(value) {
  return Number(value || 0).toLocaleString("en-NZ", {
    style: "currency",
    currency: "NZD",
    maximumFractionDigits: 0,
  });
}

export function buildQuoteEngineStatus({ calculations = {}, upstream = {} }) {
  const warnings = [];
  const quote_price_total = toNumber(calculations.quote_price_total);
  const base_labour_hours_allowed = toNumber(
    calculations.base_labour_hours_allowed
  );
  const required_recovery_rate = toNumber(calculations.required_recovery_rate);
  const productive_labour_cost_rate = toNumber(
    calculations.productive_labour_cost_rate
  );
  const direct_cost_total = toNumber(calculations.direct_cost_total);
  const quote_margin_pool = toNumber(calculations.quote_margin_pool);
  const quote_gap = toNumber(calculations.quote_gap);
  const quote_price_total_is_zero = quote_price_total <= 0;
  const labour_hours_is_zero = base_labour_hours_allowed <= 0;
  const required_recovery_rate_is_zero = required_recovery_rate <= 0;
  const model_untrusted =
    upstream.model_trust_state !== "ready" || upstream.model_ready !== true;

  if (quote_price_total_is_zero) {
    warnings.push({
      warning_id: "no_quote_price",
      message: "Quote price is missing, so margin metrics cannot be trusted.",
    });
  }

  if (labour_hours_is_zero) {
    warnings.push({
      warning_id: "no_labour_hours",
      message: "Allowed labour hours are zero. Hours-based recovery cannot be tested.",
    });
  }

  if (required_recovery_rate_is_zero) {
    warnings.push({
      warning_id: "no_required_recovery_rate",
      message: "Required recovery rate is zero, so the quote gap cannot be validated.",
    });
  }

  if (productive_labour_cost_rate <= 0) {
    warnings.push({
      warning_id: "no_model_labour_cost_rate",
      message: "True labour cost rate is missing from Labour outputs.",
    });
  }

  if (quote_margin_pool < 0) {
    warnings.push({
      warning_id: "negative_margin_pool",
      message: "Margin pool is negative; this quote is losing money before recovery.",
    });
  }

  if (direct_cost_total === 0) {
    warnings.push({
      warning_id: "zero_direct_cost",
      message: "Direct cost is zero. Confirm the quote cost build-up before trusting results.",
    });
  }

  if (
    toNumber(calculations.direct_cost_package_allowance_total) > 0 &&
    toNumber(calculations.direct_cost_package_cost_total) >
      toNumber(calculations.direct_cost_package_allowance_total)
  ) {
    warnings.push({
      warning_id: "direct_cost_package_pool_overassigned",
      message: "Direct cost package cost exceeds the allowance pool.",
    });
  }

  if (model_untrusted) {
    warnings.push({
      warning_id: "untrusted_model",
      message: "Upstream model readiness is blocked or not trusted.",
    });
  }

  if (Array.isArray(upstream.business_summary_warnings) && upstream.business_summary_warnings.length > 0) {
    warnings.push({
      warning_id: "model_warning_present",
      message: "The Business Summary baseline has warnings that may affect quote trust.",
    });
  }

  const has_invalid_input =
    quote_price_total_is_zero ||
    labour_hours_is_zero ||
    required_recovery_rate_is_zero ||
    model_untrusted;

  let quote_result_status = "works";

  if (has_invalid_input) {
    quote_result_status = "invalid";
  } else if (quote_margin_pool >= 0 && quote_gap < 0) {
    quote_result_status = "leaking";
  } else if (
    Math.abs(quote_gap) <= Math.max(1, Math.abs(required_recovery_rate) * 0.1) ||
    (Array.isArray(upstream.business_summary_warnings) &&
      upstream.business_summary_warnings.length > 0)
  ) {
    quote_result_status = "marginal";
  }

  return {
    quote_result_status,
    quote_warnings: warnings,
    quote_warning_count: warnings.length,
    summary: {
      quote_price_total: formatCurrency(quote_price_total),
      direct_cost_total: formatCurrency(direct_cost_total),
      quote_margin_pool: formatCurrency(quote_margin_pool),
      business_recovery_required_total: formatCurrency(
        calculations.business_recovery_required_total
      ),
      quote_gap: formatCurrency(quote_gap),
      achieved_margin_per_hour: formatCurrency(
        calculations.achieved_margin_per_hour
      ),
      required_recovery_rate: formatCurrency(required_recovery_rate),
      hourly_gap: formatCurrency(calculations.hourly_gap),
      max_viable_hours: formatNumber(calculations.max_viable_hours),
      required_price_at_allowed_hours: formatCurrency(
        calculations.required_price_at_allowed_hours
      ),
      price_gap: formatCurrency(calculations.price_gap),
    },
    model_ready: upstream.model_ready === true,
    model_readiness_status: upstream.model_readiness_status || "blocked",
    model_trust_state: upstream.model_trust_state || "blocked",
    required_recovery_rate: required_recovery_rate,
    hourly_gap: calculations.hourly_gap,
    quote_gap: quote_gap,
  };
}

export function buildQuoteEngineBuildUp({ calculations = {} }) {
  return {
    title: "How This Quote Is Being Tested",
    sections: [
      {
        title: "Quote Inputs",
        rows: [
          {
            label: "Quote price total",
            value: formatCurrency(calculations.quote_price_total),
          },
          {
            label: "Material cost total",
            value: formatCurrency(calculations.material_cost_total),
          },
          {
            label: "Material sell total",
            value: formatCurrency(calculations.material_sell_total),
          },
          {
            label: "Labour sell total",
            value: formatCurrency(calculations.labour_sell_total),
          },
          {
            label: "Allowed labour hours",
            value: formatNumber(calculations.base_labour_hours_allowed),
          },
          {
            label: "Direct cost package allowance",
            value: formatCurrency(calculations.direct_cost_package_allowance_total),
          },
          {
            label: "Direct cost package cost",
            value: formatCurrency(calculations.direct_cost_package_cost_total),
          },
        ],
      },
      {
        title: "Model Inputs Consumed",
        rows: [
          {
            label: "Required recovery rate",
            value: formatCurrency(calculations.required_recovery_rate),
          },
          {
            label: "Productive labour cost rate",
            value: formatCurrency(calculations.productive_labour_cost_rate),
          },
          {
            label: "Total productive output",
            value: formatNumber(calculations.total_productive_output),
          },
          {
            label: "Model trust state",
            value: String(calculations.quote_model_trust_state),
          },
        ],
      },
      {
        title: "Direct Cost Build-Up",
        rows: [
          {
            label: "Material cost total",
            value: formatCurrency(calculations.material_cost_total),
          },
          {
            label: "True labour cost total",
            value: formatCurrency(calculations.true_labour_cost_total),
          },
          {
            label: "Direct cost package cost total",
            value: formatCurrency(calculations.direct_cost_package_cost_total),
          },
          {
            label: "Direct cost total",
            value: formatCurrency(calculations.direct_cost_total),
          },
        ],
      },
      {
        title: "Margin Pool Build-Up",
        rows: [
          {
            label: "Quote price total",
            value: formatCurrency(calculations.quote_price_total),
          },
          {
            label: "Direct cost total",
            value: formatCurrency(calculations.direct_cost_total),
          },
          {
            label: "Quote margin pool",
            value: formatCurrency(calculations.quote_margin_pool),
          },
          {
            label: "Quote margin percent",
            value: formatPercent(calculations.quote_margin_percent),
          },
        ],
      },
      {
        title: "Recovery Requirement Build-Up",
        rows: [
          {
            label: "Allowed labour hours",
            value: formatNumber(calculations.base_labour_hours_allowed),
          },
          {
            label: "Required recovery rate",
            value: formatCurrency(calculations.required_recovery_rate),
          },
          {
            label: "Business recovery required total",
            value: formatCurrency(calculations.business_recovery_required_total),
          },
        ],
      },
      {
        title: "Quote Gap Build-Up",
        rows: [
          {
            label: "Quote margin pool",
            value: formatCurrency(calculations.quote_margin_pool),
          },
          {
            label: "Business recovery required total",
            value: formatCurrency(calculations.business_recovery_required_total),
          },
          {
            label: "Quote gap",
            value: formatCurrency(calculations.quote_gap),
          },
        ],
      },
      {
        title: "Hourly Reality Build-Up",
        rows: [
          {
            label: "Achieved margin per hour",
            value: formatCurrency(calculations.achieved_margin_per_hour),
          },
          {
            label: "Required recovery rate",
            value: formatCurrency(calculations.required_recovery_rate),
          },
          {
            label: "Hourly gap",
            value: formatCurrency(calculations.hourly_gap),
          },
          {
            label: "Max viable hours",
            value: formatNumber(calculations.max_viable_hours),
          },
        ],
      },
      {
        title: "Repair / Constraint Build-Up",
        rows: [
          {
            label: "Direct cost package allowance",
            value: formatCurrency(calculations.direct_cost_package_allowance_total),
          },
          {
            label: "Direct cost package cost",
            value: formatCurrency(calculations.direct_cost_package_cost_total),
          },
          {
            label: "Package pool available",
            value: formatCurrency(
              calculations.direct_cost_package_allowance_total -
                calculations.direct_cost_package_cost_total
            ),
          },
        ],
      },
    ],
  };
}

export function buildQuoteEngineRepair({ calculations = {}, repair_state = {} }) {
  const price_adjustment_amount = toNumber(repair_state.price_adjustment_amount);
  const labour_hours_adjustment = toNumber(repair_state.labour_hours_adjustment);
  const material_margin_adjustment_percent = toNumber(
    repair_state.material_margin_adjustment_percent
  );
  const direct_cost_package_adjustment_amount = toNumber(
    repair_state.direct_cost_package_adjustment_amount
  );

  const adjusted_quote_price_total =
    toNumber(calculations.quote_price_total) + price_adjustment_amount;
  const adjusted_base_labour_hours_allowed = Math.max(
    0,
    toNumber(calculations.base_labour_hours_allowed) + labour_hours_adjustment
  );
  const adjusted_material_markup_percent =
    toNumber(calculations.material_markup_percent) +
    material_margin_adjustment_percent;
  const adjusted_material_sell_total =
    toNumber(calculations.material_cost_total) *
    (1 + adjusted_material_markup_percent / 100);
  const adjusted_direct_cost_package_cost_total =
    toNumber(calculations.direct_cost_package_cost_total) +
    direct_cost_package_adjustment_amount;
  const adjusted_true_labour_cost_total =
    adjusted_base_labour_hours_allowed * toNumber(calculations.productive_labour_cost_rate);
  const adjusted_direct_cost_total =
    toNumber(calculations.material_cost_total) +
    adjusted_true_labour_cost_total +
    adjusted_direct_cost_package_cost_total;
  const adjusted_quote_margin_pool =
    adjusted_quote_price_total - adjusted_direct_cost_total;
  const adjusted_business_recovery_required_total =
    adjusted_base_labour_hours_allowed * toNumber(calculations.required_recovery_rate);
  const adjusted_quote_gap =
    adjusted_quote_margin_pool - adjusted_business_recovery_required_total;
  const original_quote_gap = toNumber(calculations.quote_gap);
  const gap_closed_amount = adjusted_quote_gap - original_quote_gap;
  const gap_closed_percent = original_quote_gap === 0
    ? 0
    : (gap_closed_amount / Math.abs(original_quote_gap)) * 100;

  return {
    original_quote_gap,
    adjusted_quote_gap,
    remaining_quote_gap: adjusted_quote_gap,
    gap_closed_amount,
    gap_closed_percent,
    adjusted_quote_price_total,
    adjusted_material_sell_total,
    adjusted_base_labour_hours_allowed,
    adjusted_direct_cost_package_cost_total,
  };
}

export function buildQuoteEngineOutputContract({ calculations = {} }) {
  return {
    quote_revenue: calculations.quote_revenue,
    quote_price_total: calculations.quote_price_total,
    material_cost_total: calculations.material_cost_total,
    material_sell_total: calculations.material_sell_total,
    labour_sell_total: calculations.labour_sell_total,
    base_labour_hours_allowed: calculations.base_labour_hours_allowed,
    direct_cost_package_allowance_total:
      calculations.direct_cost_package_allowance_total,
    direct_cost_package_cost_total: calculations.direct_cost_package_cost_total,
    true_labour_cost_total: calculations.true_labour_cost_total,
    direct_cost_total: calculations.direct_cost_total,
    quote_margin_pool: calculations.quote_margin_pool,
    quote_margin_percent: calculations.quote_margin_percent,
    business_recovery_required_total:
      calculations.business_recovery_required_total,
    achieved_margin_per_hour: calculations.achieved_margin_per_hour,
    required_recovery_rate: calculations.required_recovery_rate,
    hourly_gap: calculations.hourly_gap,
    quote_gap: calculations.quote_gap,
    max_viable_hours: calculations.max_viable_hours,
    required_price_at_allowed_hours:
      calculations.required_price_at_allowed_hours,
    price_gap: calculations.price_gap,
    quote_result_status: calculations.quote_result_status,
    quote_warnings: calculations.quote_warnings,
    quote_model_used: calculations.quote_model_used,
    quote_model_trust_state: calculations.quote_model_trust_state,
  };
}
