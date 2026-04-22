function to_number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function round_currency(value) {
  return Number((value || 0).toFixed(2));
}

function round_percent(value) {
  return Number((value || 0).toFixed(2));
}

function calculate_finance_cost_annual({
  purchase_price,
  interest_rate,
  finance_term_years,
}) {
  const has_finance =
    purchase_price > 0 &&
    interest_rate > 0 &&
    finance_term_years > 0;

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
  const finance_term_years = to_number(asset_state.finance_term_years);

  const assets_benchmark_total =
    assets_benchmark_total_override !== null &&
    Number.isFinite(Number(assets_benchmark_total_override))
      ? to_number(assets_benchmark_total_override)
      : to_number(asset_state.assets_benchmark_total);

  const finance_cost_annual = calculate_finance_cost_annual({
    purchase_price,
    interest_rate,
    finance_term_years,
  });

  const running_cost_annual = 0;

  const total_asset_cost_annual =
    finance_cost_annual + running_cost_annual;

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

  const assets_ready = reconciliation_state === "green";

  return {
    asset_type,
    finance_cost_annual: round_currency(finance_cost_annual),
    running_cost_annual: round_currency(running_cost_annual),
    total_asset_cost_annual: round_currency(total_asset_cost_annual),

    assets_benchmark_total: round_currency(assets_benchmark_total),
    module_total_asset_cost_annual: round_currency(
      module_total_asset_cost_annual
    ),
    assets_variance_amount: round_currency(assets_variance_amount),
    assets_variance_percent: round_percent(assets_variance_percent),
    reconciliation_state,
    assets_ready,
  };
}