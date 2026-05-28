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
  const labour_hours_allowed = toNumber(calculations.labour_hours_allowed);
  const required_recovery_rate = toNumber(calculations.required_recovery_rate);
  const estimated_job_cost_total = toNumber(calculations.estimated_job_cost_total);
  const quote_margin_pool = toNumber(calculations.quote_margin_pool);
  const quote_gap = toNumber(calculations.quote_gap);
  const estimated_labour_cost_total = toNumber(
    calculations.estimated_labour_cost_total
  );
  const model_labour_cost_total = toNumber(calculations.model_labour_cost_total);

  const quote_price_total_is_zero = quote_price_total <= 0;
  const labour_hours_is_zero = labour_hours_allowed <= 0;
  const required_recovery_rate_is_zero = required_recovery_rate <= 0;

  const model_untrusted =
    upstream.model_trust_state !== "ready" || upstream.model_ready !== true;

  if (!calculations.job_name && !calculations.job_number) {
    warnings.push({
      warning_id: "missing_job_identity",
      message:
        "Job name and job number are missing. Save a job identity before relying on quote history.",
    });
  }

  if (!calculations.client_name) {
    warnings.push({
      warning_id: "missing_client_name",
      message:
        "Client name is missing. Add a client before converting this quote to a live job.",
    });
  }

  if (!calculations.quote_date) {
    warnings.push({
      warning_id: "missing_quote_date",
      message: "Quote date is missing.",
    });
  }

  if (quote_price_total_is_zero) {
    warnings.push({
      warning_id: "no_quote_price",
      message: "Quote price is missing, so margin metrics cannot be trusted.",
    });
  }

  if (labour_hours_is_zero) {
    warnings.push({
      warning_id: "no_labour_hours",
      message:
        "Allowed labour hours are zero. Hours-based recovery cannot be tested.",
    });
  }

  if (estimated_labour_cost_total <= 0) {
    warnings.push({
      warning_id: "no_estimated_labour_cost",
      message:
        "Estimated labour cost is missing. Labour cost variance cannot be tested.",
    });
  }

  if (required_recovery_rate_is_zero) {
    warnings.push({
      warning_id: "no_required_recovery_rate",
      message:
        "Required recovery rate is zero, so the quote gap cannot be validated.",
    });
  }

  if (model_labour_cost_total > 0 && estimated_labour_cost_total > 0) {
    const labour_cost_variance = toNumber(calculations.labour_cost_variance);

    if (labour_cost_variance < 0) {
      warnings.push({
        warning_id: "estimated_labour_below_model",
        message:
          "Estimated labour cost is below the model labour cost for the allowed hours.",
      });
    }
  }

  if (quote_margin_pool < 0) {
    warnings.push({
      warning_id: "negative_margin_pool",
      message:
        "Margin pool is negative; this quote is losing money before recovery.",
    });
  }

  if (estimated_job_cost_total === 0) {
    warnings.push({
      warning_id: "zero_estimated_job_cost",
      message:
        "Estimated job cost is zero. Confirm COG and labour cost inputs before trusting results.",
    });
  }

  if (model_untrusted) {
    warnings.push({
      warning_id: "untrusted_model",
      message: "Upstream model readiness is blocked or not trusted.",
    });
  }

  if (
    Array.isArray(upstream.business_summary_warnings) &&
    upstream.business_summary_warnings.length > 0
  ) {
    warnings.push({
      warning_id: "model_warning_present",
      message:
        "The business model baseline has warnings that may affect quote trust.",
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
      direct_cost_total: formatCurrency(estimated_job_cost_total),
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

    required_recovery_rate,
    hourly_gap: calculations.hourly_gap,
    quote_gap,
  };
}

export function buildQuoteEngineBuildUp({ calculations = {} }) {
  return {
    title: "How This Quote Is Being Tested",
    sections: [
      {
        title: "Quote Identity",
        rows: [
          {
            label: "Job number",
            value: calculations.job_number || "Not set",
          },
          {
            label: "Job name",
            value: calculations.job_name || "Not set",
          },
          {
            label: "Client",
            value: calculations.client_name || "Not set",
          },
          {
            label: "Job type",
            value: calculations.job_type_name || "Not set",
          },
          {
            label: "Quote version",
            value: `v${calculations.quote_version || "1"}`,
          },
          {
            label: "Quote date",
            value: calculations.quote_date || "Not set",
          },
        ],
      },
      {
        title: "Quote Inputs",
        rows: [
          {
            label: "Quote price total",
            value: formatCurrency(calculations.quote_price_total),
          },
          {
            label: "COG cost total",
            value: formatCurrency(calculations.cog_cost_total),
          },
          {
            label: "COG markup percent",
            value: formatPercent(calculations.cog_markup_percent),
          },
          {
            label: "COG sell total",
            value: formatCurrency(calculations.cog_sell_total),
          },
          {
            label: "Labour hours allowed",
            value: formatNumber(calculations.labour_hours_allowed),
          },
          {
            label: "Estimated labour cost total",
            value: formatCurrency(calculations.estimated_labour_cost_total),
          },
          {
            label: "Calculated labour charge total",
            value: formatCurrency(calculations.labour_charge_total),
          },
        ],
      },
      {
        title: "Quote Balance",
        rows: [
          {
            label: "Quote price total",
            value: formatCurrency(calculations.quote_price_total),
          },
          {
            label: "COG sell total",
            value: formatCurrency(calculations.cog_sell_total),
          },
          {
            label: "Calculated labour charge total",
            value: formatCurrency(calculations.labour_charge_total),
          },
          {
            label: "COG margin total",
            value: formatCurrency(calculations.cog_margin_total),
          },
          {
            label: "Labour margin total",
            value: formatCurrency(calculations.labour_margin_total),
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
            value: String(calculations.quote_model_trust_state || "blocked"),
          },
        ],
      },
      {
        title: "Estimated Job Cost Build-Up",
        rows: [
          {
            label: "COG cost total",
            value: formatCurrency(calculations.cog_cost_total),
          },
          {
            label: "Estimated labour cost total",
            value: formatCurrency(calculations.estimated_labour_cost_total),
          },
          {
            label: "Estimated job cost total",
            value: formatCurrency(calculations.estimated_job_cost_total),
          },
        ],
      },
      {
        title: "Labour Reality Check",
        rows: [
          {
            label: "Labour hours allowed",
            value: formatNumber(calculations.labour_hours_allowed),
          },
          {
            label: "Estimated labour cost rate",
            value: formatCurrency(calculations.estimated_labour_cost_rate),
          },
          {
            label: "Model labour cost total",
            value: formatCurrency(calculations.model_labour_cost_total),
          },
          {
            label: "Estimated labour cost total",
            value: formatCurrency(calculations.estimated_labour_cost_total),
          },
          {
            label: "Labour cost variance",
            value: formatCurrency(calculations.labour_cost_variance),
          },
          {
            label: "Calculated labour charge total",
            value: formatCurrency(calculations.labour_charge_total),
          },
          {
            label: "Calculated labour charge rate",
            value: formatCurrency(calculations.labour_charge_out_rate),
          },
          {
            label: "Labour margin total",
            value: formatCurrency(calculations.labour_margin_total),
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
            label: "Estimated job cost total",
            value: formatCurrency(calculations.estimated_job_cost_total),
          },
          {
            label: "Quote margin pool",
            value: formatCurrency(calculations.quote_margin_pool),
          },
          {
            label: "Quote margin percent",
            value: formatPercent(calculations.quote_margin_percent * 100),
          },
        ],
      },
      {
        title: "Recovery Requirement Build-Up",
        rows: [
          {
            label: "Allowed labour hours",
            value: formatNumber(calculations.labour_hours_allowed),
          },
          {
            label: "Required recovery rate",
            value: formatCurrency(calculations.required_recovery_rate),
          },
          {
            label: "Business recovery required total",
            value: formatCurrency(
              calculations.business_recovery_required_total
            ),
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
            value: formatCurrency(
              calculations.business_recovery_required_total
            ),
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
    ],
  };
}

export function buildQuoteEngineRepair({ calculations = {}, repair_state = {} }) {
  const price_adjustment_amount = toNumber(repair_state.price_adjustment_amount);
  const labour_hours_adjustment = toNumber(repair_state.labour_hours_adjustment);
  const cog_margin_adjustment_percent = toNumber(
    repair_state.material_margin_adjustment_percent
  );

  const adjusted_quote_price_total =
    toNumber(calculations.quote_price_total) + price_adjustment_amount;

  const adjusted_labour_hours_allowed = Math.max(
    0,
    toNumber(calculations.labour_hours_allowed) + labour_hours_adjustment
  );

  const adjusted_cog_markup_percent =
    toNumber(calculations.cog_markup_percent) + cog_margin_adjustment_percent;

  const adjusted_cog_sell_total =
    toNumber(calculations.cog_cost_total) *
    (1 + adjusted_cog_markup_percent / 100);

  const adjusted_labour_charge_total = Math.max(
    0,
    adjusted_quote_price_total - adjusted_cog_sell_total
  );

  const adjusted_estimated_job_cost_total =
    toNumber(calculations.cog_cost_total) +
    toNumber(calculations.estimated_labour_cost_total);

  const adjusted_quote_margin_pool =
    adjusted_quote_price_total - adjusted_estimated_job_cost_total;

  const adjusted_business_recovery_required_total =
    adjusted_labour_hours_allowed * toNumber(calculations.required_recovery_rate);

  const adjusted_quote_gap =
    adjusted_quote_margin_pool - adjusted_business_recovery_required_total;

  const original_quote_gap = toNumber(calculations.quote_gap);

  const gap_closed_amount = adjusted_quote_gap - original_quote_gap;

  const gap_closed_percent =
    original_quote_gap === 0
      ? 0
      : (gap_closed_amount / Math.abs(original_quote_gap)) * 100;

  return {
    original_quote_gap,
    adjusted_quote_gap,
    remaining_quote_gap: adjusted_quote_gap,
    gap_closed_amount,
    gap_closed_percent,
    adjusted_quote_price_total,
    adjusted_material_sell_total: adjusted_cog_sell_total,
    adjusted_labour_charge_total,
    adjusted_base_labour_hours_allowed: adjusted_labour_hours_allowed,
    adjusted_direct_cost_package_cost_total: 0,
  };
}

export function buildQuoteEngineOutputContract({ calculations = {} }) {
  return {
    quote_id: calculations.quote_id,
    quote_job_id: calculations.quote_job_id,
    quote_version_id: calculations.quote_version_id,

    job_id: calculations.job_id,
    job_number: calculations.job_number,
    job_name: calculations.job_name,

    client_id: calculations.client_id,
    client_name: calculations.client_name,
    client_contact_name: calculations.client_contact_name,
    client_phone: calculations.client_phone,
    client_email: calculations.client_email,

    job_type_id: calculations.job_type_id,
    job_type_name: calculations.job_type_name,

    quote_name: calculations.quote_name,
    quote_reference: calculations.quote_reference,
    quote_date: calculations.quote_date,
    quote_status: calculations.quote_status,
    quote_version: calculations.quote_version,

    is_winning_quote: calculations.is_winning_quote,
    is_live_job: calculations.is_live_job,
    live_job_id: calculations.live_job_id,

    created_at: calculations.created_at,
    updated_at: calculations.updated_at,

    quote_revenue: calculations.quote_revenue,
    quote_price_total: calculations.quote_price_total,

    cog_cost_total: calculations.cog_cost_total,
    cog_pricing_mode: calculations.cog_pricing_mode,
    cog_markup_percent: calculations.cog_markup_percent,
    cog_sell_total: calculations.cog_sell_total,
    cog_margin_total: calculations.cog_margin_total,

    labour_hours_allowed: calculations.labour_hours_allowed,
    estimated_labour_cost_total: calculations.estimated_labour_cost_total,
    estimated_labour_cost_rate: calculations.estimated_labour_cost_rate,
    labour_charge_total: calculations.labour_charge_total,
    labour_charge_out_rate: calculations.labour_charge_out_rate,
    labour_margin_total: calculations.labour_margin_total,

    model_labour_cost_total: calculations.model_labour_cost_total,
    labour_cost_variance: calculations.labour_cost_variance,

    estimated_job_cost_total: calculations.estimated_job_cost_total,
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