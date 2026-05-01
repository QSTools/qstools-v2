function to_number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function round_currency(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Number(parsed.toFixed(2)) : 0;
}

function round_percent(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Number(parsed.toFixed(2)) : 0;
}

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

function parse_date(value) {
  if (!value || typeof value !== "string") {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) {
    return null;
  }

  return new Date(Date.UTC(year, month - 1, day));
}

function format_date(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

function calculate_finance_end_date({ finance_start_date, finance_term_years }) {
  const start_date = parse_date(finance_start_date);

  if (!start_date || finance_term_years <= 0) {
    return "";
  }

  const end_date = new Date(start_date.getTime());
  end_date.setUTCFullYear(end_date.getUTCFullYear() + finance_term_years);

  return format_date(end_date);
}

function get_finance_lifecycle({
  has_finance,
  finance_paid_off,
  finance_start_date,
  finance_term_years,
}) {
  const finance_end_date = calculate_finance_end_date({
    finance_start_date,
    finance_term_years,
  });
  const end_date = parse_date(finance_end_date);
  const today = new Date();
  const current_date = new Date(
    Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  );
  const term_ended = Boolean(end_date && current_date > end_date);

  if (!has_finance) {
    return {
      finance_end_date,
      finance_active: false,
      finance_status: "not_financed",
    };
  }

  if (finance_paid_off) {
    return {
      finance_end_date,
      finance_active: false,
      finance_status: "paid_off",
    };
  }

  if (term_ended) {
    return {
      finance_end_date,
      finance_active: false,
      finance_status: "term_ended",
    };
  }

  return {
    finance_end_date,
    finance_active: true,
    finance_status: "active",
  };
}

function calculate_total_finance_payment_annual({
  purchase_price,
  interest_rate,
  finance_term_years,
}) {
  const has_finance =
    purchase_price > 0 && interest_rate > 0 && finance_term_years > 0;

  if (!has_finance) {
    return 0;
  }

  const monthly_rate = interest_rate / 100 / 12;
  const total_months = finance_term_years * 12;

  if (monthly_rate <= 0 || total_months <= 0) {
    return 0;
  }

  const monthly_repayment =
    (purchase_price * monthly_rate) /
    (1 - Math.pow(1 + monthly_rate, -total_months));

  return monthly_repayment * 12;
}

function calculate_forward_asset_interest({
  purchase_price,
  interest_rate,
  finance_term_years,
  finance_start_date,
  finance_active,
}) {
  const has_finance =
    purchase_price > 0 && interest_rate > 0 && finance_term_years > 0;

  if (!has_finance || !finance_active) {
    return {
      asset_interest_annual: 0,
      estimated_remaining_finance_balance: 0,
      finance_progress_percent: 0,
    };
  }

  const start_date = parse_date(finance_start_date);
  const today = new Date();
  const current_date = new Date(
    Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  );
  const total_term_days = finance_term_years * 365.25;
  const elapsed_days = start_date
    ? Math.max(
        0,
        (current_date.getTime() - start_date.getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : 0;
  const finance_progress_ratio =
    total_term_days > 0 ? clamp(elapsed_days / total_term_days, 0, 1) : 0;
  const remaining_term_percent = 1 - finance_progress_ratio;
  const estimated_remaining_finance_balance =
    purchase_price * remaining_term_percent;
  const asset_interest_annual =
    estimated_remaining_finance_balance * (interest_rate / 100);

  return {
    asset_interest_annual,
    estimated_remaining_finance_balance,
    finance_progress_percent: finance_progress_ratio * 100,
  };
}

function calculate_cash_flow_support({
  total_finance_payment_annual,
  asset_interest_annual,
  finance_active,
}) {
  if (!finance_active || total_finance_payment_annual <= 0) {
    return {
      asset_principal_repayment_annual: 0,
      asset_total_finance_payment_annual: 0,
    };
  }

  return {
    asset_principal_repayment_annual: Math.max(
      total_finance_payment_annual - asset_interest_annual,
      0
    ),
    asset_total_finance_payment_annual: total_finance_payment_annual,
  };
}

function calculate_reconciliation_state({
  assets_benchmark_total,
  assets_variance_percent,
}) {
  if (assets_benchmark_total <= 0) {
    return "pending";
  }

  const absolute_variance_percent = Math.abs(assets_variance_percent);

  if (absolute_variance_percent <= 0.5) {
    return "green";
  }

  if (absolute_variance_percent <= 1.0) {
    return "amber";
  }

  return "red";
}

export function calculateAssetOutputs(
  asset_state = {},
  saved_assets = [],
  assets_benchmark_total_override = null
) {
  const asset_type =
    asset_state.asset_type === "support" ? "support" : "productive";

  const purchase_price = to_number(asset_state.purchase_price);
  const interest_rate = to_number(asset_state.interest_rate);
  const finance_start_date =
    typeof asset_state.finance_start_date === "string"
      ? asset_state.finance_start_date
      : "";
  const finance_term_years = to_number(asset_state.finance_term_years);
  const finance_paid_off = asset_state.finance_paid_off === true;
  const has_finance =
    purchase_price > 0 && interest_rate > 0 && finance_term_years > 0;
  const { finance_end_date, finance_active, finance_status } =
    get_finance_lifecycle({
      has_finance,
      finance_paid_off,
      finance_start_date,
      finance_term_years,
    });

  const assets_benchmark_total =
    assets_benchmark_total_override !== null &&
    Number.isFinite(Number(assets_benchmark_total_override))
      ? to_number(assets_benchmark_total_override)
      : to_number(asset_state.assets_benchmark_total);

  const total_finance_payment_annual = finance_active
    ? calculate_total_finance_payment_annual({
        purchase_price,
        interest_rate,
        finance_term_years,
      })
    : 0;
  const finance_interest = calculate_forward_asset_interest({
    purchase_price,
    interest_rate,
    finance_term_years,
    finance_start_date,
    finance_active,
  });
  const asset_interest_annual = finance_interest.asset_interest_annual;
  const cash_flow_support = calculate_cash_flow_support({
    total_finance_payment_annual,
    asset_interest_annual,
    finance_active,
  });

  const running_cost_annual = 0;

  const total_asset_cost_annual = asset_interest_annual + running_cost_annual;

  const active_saved_assets = Array.isArray(saved_assets)
    ? saved_assets.filter((asset) => !asset.is_retired)
    : [];

  const other_active_asset_total = active_saved_assets
    .filter((asset) => asset.asset_id !== asset_state.asset_id)
    .reduce(
      (sum, asset) => sum + Number(asset.total_asset_cost_annual ?? 0),
      0
    );

  const module_total_asset_cost_annual =
    other_active_asset_total + total_asset_cost_annual;

  const assets_variance_amount =
    module_total_asset_cost_annual - assets_benchmark_total;

  const assets_variance_percent =
    assets_benchmark_total > 0
      ? (assets_variance_amount / assets_benchmark_total) * 100
      : 0;

  const reconciliation_state = calculate_reconciliation_state({
    assets_benchmark_total,
    assets_variance_percent,
  });

  const benchmark_reconciled = reconciliation_state === "green";
  const assets_ready = Number.isFinite(total_asset_cost_annual);

  return {
    asset_type,

    principal_annual: round_currency(
      cash_flow_support.asset_principal_repayment_annual
    ),
    interest_annual: round_currency(asset_interest_annual),
    asset_interest_annual: round_currency(asset_interest_annual),
    estimated_remaining_finance_balance: round_currency(
      finance_interest.estimated_remaining_finance_balance
    ),
    finance_progress_percent: round_percent(
      finance_interest.finance_progress_percent
    ),
    asset_principal_repayment_annual: round_currency(
      cash_flow_support.asset_principal_repayment_annual
    ),
    asset_total_finance_payment_annual: round_currency(
      cash_flow_support.asset_total_finance_payment_annual
    ),
    finance_start_date,
    finance_end_date,
    finance_active,
    finance_paid_off,
    finance_status,
    finance_cost_annual: round_currency(asset_interest_annual),
    running_cost_annual: round_currency(running_cost_annual),
    total_asset_cost_annual: round_currency(total_asset_cost_annual),

    assets_benchmark_total: round_currency(assets_benchmark_total),
    module_total_asset_cost_annual: round_currency(
      module_total_asset_cost_annual
    ),
    assets_variance_amount: round_currency(assets_variance_amount),
    assets_variance_percent: round_percent(assets_variance_percent),
    reconciliation_state,
    benchmark_reconciled,
    assets_ready,
  };
}
