import { format_currency } from "./assetSelectorFormatters";

export const ASSET_POOL_DEFINITIONS = [
  {
    key: "asset_fuel_pool",
    label: "Asset-related fuel pool",
  },
  {
    key: "asset_insurance_pool",
    label: "Asset-related insurance pool",
  },
  {
    key: "asset_repairs_maintenance_pool",
    label: "Asset-related repairs / maintenance pool",
  },
  {
    key: "asset_registration_compliance_pool",
    label: "Asset-related registration / compliance pool",
  },
  {
    key: "asset_consumables_pool",
    label: "Asset-related consumables pool",
  },
  {
    key: "asset_finance_interest_pool",
    label: "Asset finance / interest pool",
  },
];

export function get_active_saved_assets(saved_assets = []) {
  return Array.isArray(saved_assets)
    ? saved_assets.filter((asset) => !asset.is_retired)
    : [];
}

export function get_asset_pool_assignments(asset = {}) {
  const assignments = asset.asset_overhead_pool_assignments ?? {};

  return Object.fromEntries(
    ASSET_POOL_DEFINITIONS.map((pool) => [
      pool.key,
      Math.max(0, Number(assignments?.[pool.key] || 0)),
    ])
  );
}

export function get_allocated_asset_overhead_cost(asset = {}) {
  return Object.values(get_asset_pool_assignments(asset)).reduce(
    (sum, value) => sum + Number(value || 0),
    0
  );
}

export function build_asset_overhead_pool_summary({
  asset_state,
  saved_assets,
  asset_overhead_pools,
}) {
  const current_asset_id = asset_state?.asset_id ?? "";
  const current_assignments = get_asset_pool_assignments(asset_state);
  const active_saved_assets = get_active_saved_assets(saved_assets);

  return ASSET_POOL_DEFINITIONS.map((pool) => {
    const available_amount = Math.max(
      0,
      Number(asset_overhead_pools?.[pool.key]?.amount ?? 0)
    );

    const assigned_to_other_assets = active_saved_assets
      .filter((asset) => asset.asset_id !== current_asset_id)
      .reduce((sum, asset) => {
        const assignments = get_asset_pool_assignments(asset);
        return sum + Math.max(0, Number(assignments?.[pool.key] || 0));
      }, 0);

    const assigned_to_current_asset = Math.max(
      0,
      Number(current_assignments?.[pool.key] || 0)
    );

    const assigned_total =
      assigned_to_other_assets + assigned_to_current_asset;

    const raw_remaining_amount = available_amount - assigned_total;

    const remaining_amount = Math.max(0, raw_remaining_amount);

    const over_allocated_amount = Math.max(
      0,
      assigned_total - available_amount
    );

    const max_assignable_to_current_asset = Math.max(
      0,
      available_amount - assigned_to_other_assets
    );

    const allocation_status =
      over_allocated_amount > 0
        ? "over_allocated"
        : Math.abs(raw_remaining_amount) <= 1
          ? "balanced"
          : assigned_total < available_amount
            ? "under_allocated"
            : "review_required";

    const assignment_status =
      allocation_status === "over_allocated"
        ? "Over assigned"
        : assigned_total === 0
          ? "Unassigned"
          : allocation_status === "under_allocated"
            ? "Partially assigned"
            : "Fully assigned";

    return {
      pool_key: pool.key,
      label: pool.label,

      available_amount,
      assigned_to_current_asset,
      assigned_to_other_assets,
      assigned_total,
      remaining_amount,
      over_allocated_amount,
      max_assignable_to_current_asset,

      allocation_status,
      assignment_status,

      available_amount_label: format_currency(available_amount),
      assigned_to_current_asset_label: format_currency(
        assigned_to_current_asset
      ),
      assigned_to_other_assets_label: format_currency(
        assigned_to_other_assets
      ),
      assigned_total_label: format_currency(assigned_total),
      remaining_amount_label: format_currency(remaining_amount),
      over_allocated_amount_label: format_currency(over_allocated_amount),
      max_assignable_to_current_asset_label: format_currency(
        max_assignable_to_current_asset
      ),
    };
  });
}

