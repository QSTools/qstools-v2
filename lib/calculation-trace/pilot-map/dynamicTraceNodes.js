// Mirra v6.0 - Calculation Trace - Dynamic Node Builders
// Real assets, real staff, and real overhead pools do not have fixed node
// IDs the way module-level aggregates do - they are built here, once per
// render, directly from live data. This is also where the genuine
// many-to-many "shared node" edges come from: a pool node lists no inputs
// of its own, and every asset drawing on it lists the pool's node_id in
// its own inputs array - so the pool's outgoing edges are every asset it
// feeds, and an asset's incoming edges include every pool feeding it.

function safeNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function buildAssetOverheadPoolNodes(live) {
  const pools = live?.general_overheads?.asset_overhead_pools ?? {};

  return Object.entries(pools).map(([pool_key, pool]) => ({
    node_id: `general_overheads.asset_overhead_pools.${pool_key}`,
    display_label: pool?.label || pool_key,
    module_name: "general-overheads",
    is_root_input: false,
    value_format: "currency",
    formula_text: `Sum of every overhead line tagged into this pool (${pool?.source_lines?.length ?? 0} source line(s) currently).`,
    brief_reference: "Dynamic pool node - built live from asset_overhead_pools",
    last_verified_against: "v6.0 kickoff session, calculation trace rebuild",
    source_file: "lib/selectors/general-overheads/generalOverheadPoolSelectors.js",
    implementation_status: "live_verified_field",
    inputs: [],
    resolve: () => safeNumber(pool?.amount),
  }));
}

export function buildAssetNodes(live) {
  const assets = Array.isArray(live?.assets?.assets) ? live.assets.assets : [];

  return assets.flatMap((asset) => {
    const asset_id = asset?.asset_id;
    if (!asset_id) {
      return [];
    }

    const label = asset?.asset_name || asset_id;
    const pool_assignments = asset?.effective_asset_overhead_pool_assignments ?? {};
    const feeding_pool_ids = Object.entries(pool_assignments)
      .filter(([, amount]) => (safeNumber(amount) ?? 0) > 0)
      .map(([pool_key]) => `general_overheads.asset_overhead_pools.${pool_key}`);

    return [
      {
        node_id: `assets.${asset_id}.total_asset_cost_annual`,
        display_label: `${label} - Finance Interest`,
        module_name: "assets",
        is_root_input: true,
        value_format: "currency",
        formula_text: "This asset's own finance-interest cost (asset_interest_annual + running_cost_annual, and running_cost_annual is currently a hardcoded 0).",
        brief_reference: "Dynamic asset node - built live from saved asset records",
        last_verified_against: "v6.0 kickoff session, calculation trace rebuild",
        source_file: "lib/calculations/assetCalculations.js",
        implementation_status: "live_verified_field",
        inputs: [],
        resolve: () => safeNumber(asset?.total_asset_cost_annual),
      },
      {
        node_id: `assets.${asset_id}.allocated_asset_overhead_cost_annual`,
        display_label: `${label} - Assigned Overhead Share`,
        module_name: "assets",
        is_root_input: false,
        value_format: "currency",
        formula_text: "This asset's assigned slice of one or more shared General Overheads pools.",
        brief_reference: "Dynamic asset node - built live from saved asset records",
        last_verified_against: "v6.0 kickoff session, calculation trace rebuild",
        source_file: "hooks/assets/assetOutputContract.js",
        implementation_status: "live_verified_field",
        inputs: feeding_pool_ids,
        resolve: () => safeNumber(asset?.allocated_asset_overhead_cost_annual),
      },
      {
        node_id: `assets.${asset_id}.asset_recovery_cost_annual`,
        display_label: `${label} - Total Recovery Cost`,
        module_name: "assets",
        is_root_input: false,
        value_format: "currency",
        formula_text: "asset_recovery_cost_annual = total_asset_cost_annual + allocated_asset_overhead_cost_annual",
        brief_reference: "Dynamic asset node - built live from saved asset records",
        last_verified_against: "v6.0 kickoff session, calculation trace rebuild",
        source_file: "hooks/assets/assetOutputContract.js",
        implementation_status: "live_verified_field",
        inputs: [
          `assets.${asset_id}.total_asset_cost_annual`,
          `assets.${asset_id}.allocated_asset_overhead_cost_annual`,
        ],
        resolve: () => safeNumber(asset?.asset_recovery_cost_annual),
      },
    ];
  });
}

export function buildStaffNodes(live) {
  const staff = Array.isArray(live?.labour?.active_staff) ? live.labour.active_staff : [];

  return staff.flatMap((profile) => {
    const staff_id = profile?.staff_id || profile?.profile_id;
    if (!staff_id) {
      return [];
    }

    const label = profile?.staff_name || staff_id;

    return [
      {
        node_id: `labour.${staff_id}.total_labour_cost_annual`,
        display_label: `${label} - Annual Labour Cost`,
        module_name: "labour",
        is_root_input: true,
        value_format: "currency",
        formula_text: "This staff member's annual_base_cost + annual_on_costs.",
        brief_reference: "Dynamic staff node - built live from saved labour profiles",
        last_verified_against: "v6.0 kickoff session, calculation trace rebuild",
        source_file: "lib/calculations/labourCalculations.js",
        implementation_status: "live_verified_field",
        inputs: [],
        resolve: () => safeNumber(profile?.total_labour_cost_annual ?? profile?.annual_labour_cost),
      },
    ];
  });
}