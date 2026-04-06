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

  /*
    Finance model placeholder.
    Current safe assumption:
    annual finance carrying cost = purchase_price * (interest_rate / 100)

    When the final finance model is locked, change it here only.
  */
  return purchase_price * (interest_rate / 100);
}

export function calculateAssetOutputs(asset_state = {}) {
  const purchase_price = to_number(asset_state.purchase_price);
  const interest_rate = to_number(asset_state.interest_rate);
  const finance_term_years = to_number(asset_state.finance_term_years);

  const maintenance_cost_monthly = to_number(asset_state.maintenance_cost_monthly);
  const fuel_cost_monthly = to_number(asset_state.fuel_cost_monthly);
  const registration_cost_monthly = to_number(asset_state.registration_cost_monthly);
  const other_running_cost_monthly = to_number(asset_state.other_running_cost_monthly);

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
    finance_cost_annual: round_currency(finance_cost_annual),
    running_cost_annual: round_currency(running_cost_annual),
    total_asset_cost_annual: round_currency(total_asset_cost_annual),
  };
}