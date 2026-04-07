const BALANCE_TOLERANCE = 0.0001;

function to_number(value) {
  const numeric_value = Number(value);
  return Number.isFinite(numeric_value) ? numeric_value : 0;
}

function round_currency(value) {
  return Number(to_number(value).toFixed(2));
}

function round_percent(value) {
  return Number(to_number(value).toFixed(2));
}

export function calculateRecoverySummary(input) {
  const total_cost_burden = to_number(input.total_cost_burden);
  const required_revenue = to_number(input.required_revenue);
  const required_recovery_rate = to_number(input.required_recovery_rate);
  const total_productive_output = to_number(input.total_productive_output);
  const total_people_cost_annual = to_number(input.total_people_cost_annual);
  const total_asset_cost_annual = to_number(input.total_asset_cost_annual);
  const total_business_overheads = to_number(input.total_business_overheads);

  const active_recovery_model = input.recovery_model || "labour_only";

  const labour_share_percent = to_number(input.labour_share_percent);
  const asset_share_percent = to_number(input.asset_share_percent);
  const overhead_share_percent = to_number(input.overhead_share_percent);

  const share_total =
    labour_share_percent + asset_share_percent + overhead_share_percent;

  const share_not_balanced =
    Math.abs(share_total - 100) > BALANCE_TOLERANCE;

  const labour_recovery_cost = round_currency(
    total_cost_burden * (labour_share_percent / 100)
  );

  const asset_recovery_cost = round_currency(
    total_cost_burden * (asset_share_percent / 100)
  );

  const overhead_absorbed_cost = round_currency(
    total_cost_burden * (overhead_share_percent / 100)
  );

  const no_productive_output = total_productive_output <= 0;

  const required_labour_recovery_rate = no_productive_output
    ? 0
    : round_currency(labour_recovery_cost / total_productive_output);

  const required_asset_recovery = round_currency(asset_recovery_cost);

  const asset_recovery_without_assets =
    asset_share_percent > 0 && total_asset_cost_annual <= 0;

  const labour_recovery_without_labour =
    labour_share_percent > 0 &&
    (total_people_cost_annual <= 0 || total_productive_output <= 0);

  const warnings = [];

  if (share_not_balanced) {
    warnings.push("share_not_balanced");
  }

  if (no_productive_output) {
    warnings.push("no_productive_output");
  }

  if (asset_recovery_without_assets) {
    warnings.push("asset_recovery_without_assets");
  }

  if (labour_recovery_without_labour) {
    warnings.push("labour_recovery_without_labour");
  }

  return {
    active_recovery_model,
    total_cost_burden: round_currency(total_cost_burden),
    required_revenue: round_currency(required_revenue),
    required_recovery_rate: round_currency(required_recovery_rate),
    total_productive_output: round_currency(total_productive_output),
    total_people_cost_annual: round_currency(total_people_cost_annual),
    total_asset_cost_annual: round_currency(total_asset_cost_annual),
    total_business_overheads: round_currency(total_business_overheads),

    labour_share_percent: round_percent(labour_share_percent),
    asset_share_percent: round_percent(asset_share_percent),
    overhead_share_percent: round_percent(overhead_share_percent),
    share_total: round_percent(share_total),

    labour_recovery_cost,
    asset_recovery_cost,
    overhead_absorbed_cost,
    required_labour_recovery_rate,
    required_asset_recovery,

    share_not_balanced,
    no_productive_output,
    asset_recovery_without_assets,
    labour_recovery_without_labour,
    warnings,
  };
}