import {
  round_percent,
  to_number,
} from "./sharedRecoverySummaryHelpers.js";

function normalise_split_to_100({
  labour_basis,
  asset_basis,
  material_basis,
}) {
  const total_basis =
    to_number(labour_basis) + to_number(asset_basis) + to_number(material_basis);

  if (total_basis <= 0) {
    return {
      labour_share_percent: 100,
      asset_share_percent: 0,
      material_share_percent: 0,
    };
  }

  const raw_labour_share = (to_number(labour_basis) / total_basis) * 100;
  const raw_asset_share = (to_number(asset_basis) / total_basis) * 100;
  const raw_material_share = (to_number(material_basis) / total_basis) * 100;

  const labour_share_percent = round_percent(raw_labour_share);
  const asset_share_percent = round_percent(raw_asset_share);

  const material_share_percent = round_percent(
    100 - labour_share_percent - asset_share_percent
  );

  return {
    labour_share_percent,
    asset_share_percent,
    material_share_percent,
  };
}

export function build_suggested_starting_split({
  total_people_cost_annual,
  productive_asset_cost,
  has_productive_asset_recovery_base,
  total_direct_costs,
  recovery_hours_used,
  total_productive_output,
}) {
  const has_labour_recovery_base =
    to_number(recovery_hours_used) > 0 ||
    to_number(total_productive_output) > 0 ||
    to_number(total_people_cost_annual) > 0;

  const has_asset_recovery_base =
    has_productive_asset_recovery_base === true &&
    to_number(productive_asset_cost) > 0;

  const has_material_recovery_base = to_number(total_direct_costs) > 0;

  const labour_basis = has_labour_recovery_base
    ? to_number(total_people_cost_annual)
    : 0;

  const asset_basis = has_asset_recovery_base ? to_number(productive_asset_cost) : 0;

  const material_basis = has_material_recovery_base
    ? to_number(total_direct_costs)
    : 0;

  const split = normalise_split_to_100({
    labour_basis,
    asset_basis,
    material_basis,
  });

  if (
    has_labour_recovery_base &&
    has_asset_recovery_base &&
    has_material_recovery_base
  ) {
    return {
      suggested_recovery_model: "hybrid",
      suggested_labour_share_percent: split.labour_share_percent,
      suggested_asset_share_percent: split.asset_share_percent,
      suggested_material_share_percent: split.material_share_percent,
      suggested_overhead_absorbed_percent: 0,
      split_source: "system_suggested",
    };
  }

  if (has_labour_recovery_base && has_material_recovery_base) {
    return {
      suggested_recovery_model: "hybrid",
      suggested_labour_share_percent: split.labour_share_percent,
      suggested_asset_share_percent: 0,
      suggested_material_share_percent: split.material_share_percent,
      suggested_overhead_absorbed_percent: 0,
      split_source: "system_suggested",
    };
  }

  if (has_labour_recovery_base && has_asset_recovery_base) {
    return {
      suggested_recovery_model: "hybrid",
      suggested_labour_share_percent: split.labour_share_percent,
      suggested_asset_share_percent: split.asset_share_percent,
      suggested_material_share_percent: 0,
      suggested_overhead_absorbed_percent: 0,
      split_source: "system_suggested",
    };
  }

  if (has_asset_recovery_base && has_material_recovery_base) {
    return {
      suggested_recovery_model: "hybrid",
      suggested_labour_share_percent: 0,
      suggested_asset_share_percent: split.asset_share_percent,
      suggested_material_share_percent: split.material_share_percent,
      suggested_overhead_absorbed_percent: 0,
      split_source: "system_suggested",
    };
  }

  if (has_material_recovery_base) {
    return {
      suggested_recovery_model: "material_led",
      suggested_labour_share_percent: 0,
      suggested_asset_share_percent: 0,
      suggested_material_share_percent: 100,
      suggested_overhead_absorbed_percent: 0,
      split_source: "system_suggested",
    };
  }

  if (has_asset_recovery_base) {
    return {
      suggested_recovery_model: "asset_led",
      suggested_labour_share_percent: 0,
      suggested_asset_share_percent: 100,
      suggested_material_share_percent: 0,
      suggested_overhead_absorbed_percent: 0,
      split_source: "system_suggested",
    };
  }

  return {
    suggested_recovery_model: "labour_led",
    suggested_labour_share_percent: 100,
    suggested_asset_share_percent: 0,
    suggested_material_share_percent: 0,
    suggested_overhead_absorbed_percent: 0,
    split_source: "system_suggested",
  };
}
