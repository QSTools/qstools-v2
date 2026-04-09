function to_number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function round_currency(value) {
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

export function calculateAssetOutputs(asset_state = {}) {
  const asset_type =
    asset_state.asset_type === "support" ? "support" : "productive";

  const purchase_price = to_number(asset_state.purchase_price);
  const interest_rate = to_number(asset_state.interest_rate);
  const finance_term_years = to_number(asset_state.finance_term_years);

  const maintenance_cost_monthly = to_number(
    asset_state.maintenance_cost_monthly
  );
  const fuel_cost_monthly = to_number(asset_state.fuel_cost_monthly);
  const registration_cost_monthly = to_number(
    asset_state.registration_cost_monthly
  );
  const other_running_cost_monthly = to_number(
    asset_state.other_running_cost_monthly
  );

  const finance_cost_annual = calculate_finance_cost_annual({
    purchase_price,
    interest_rate,
    finance_term_years,
  });

  const running_cost_annual =
    (
      maintenance_cost_monthly +
      fuel_cost_monthly +
      registration_cost_monthly +
      other_running_cost_monthly
    ) * 12;

  const total_asset_cost_annual =
    finance_cost_annual + running_cost_annual;

  return {
    asset_type,
    finance_cost_annual: round_currency(finance_cost_annual),
    running_cost_annual: round_currency(running_cost_annual),
    total_asset_cost_annual: round_currency(total_asset_cost_annual),
  };
}