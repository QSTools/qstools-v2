import { normalizeAssetType } from "@/lib/storage/assetStorage";

export const ASSET_POOL_KEYS = [
  "asset_fuel_pool",
  "asset_insurance_pool",
  "asset_repairs_maintenance_pool",
  "asset_registration_compliance_pool",
  "asset_consumables_pool",
  "asset_finance_interest_pool",
];

export function to_number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function get_asset_pool_assignments(asset = {}) {
  const assignments = asset.asset_overhead_pool_assignments ?? {};

  return Object.fromEntries(
    ASSET_POOL_KEYS.map((pool_key) => [pool_key, to_number(assignments[pool_key])])
  );
}

export function get_allocated_asset_overhead_cost(asset = {}) {
  const assignments = get_asset_pool_assignments(asset);

  return Object.values(assignments).reduce(
    (sum, value) => sum + to_number(value),
    0
  );
}

export function build_asset_overhead_assignment_rows(asset = {}) {
  const assignments = get_asset_pool_assignments(asset);

  return Object.entries(assignments)
    .filter(([, amount]) => to_number(amount) !== 0)
    .map(([pool_key, amount]) => ({
      pool_key,
      amount: to_number(amount),
      assigned_asset_id: asset.asset_id ?? "",
      assigned_asset_name: asset.asset_name ?? "Unnamed Asset",
      assigned_asset_type: normalizeAssetType(asset.asset_type),
    }));
}

export function build_asset_overhead_pool_assignment_summary({
  asset_rows = [],
  asset_overhead_pools = {},
}) {
  return ASSET_POOL_KEYS.map((pool_key) => {
    const pool = asset_overhead_pools?.[pool_key] ?? {};
    const available_amount = to_number(pool.amount);
    const assigned_assets = asset_rows
      .map((asset) => {
        const assigned_amount = to_number(
          asset.asset_overhead_pool_assignments?.[pool_key]
        );

        if (assigned_amount === 0) {
          return null;
        }

        return {
          asset_id: asset.asset_id,
          asset_name: asset.asset_name,
          asset_type: asset.asset_type,
          amount: assigned_amount,
        };
      })
      .filter(Boolean);
    const assigned_amount = assigned_assets.reduce(
      (sum, assignment) => sum + to_number(assignment.amount),
      0
    );
    const remaining_amount = available_amount - assigned_amount;

    return {
      pool_key,
      label: pool.label || pool_key,
      available_amount,
      assigned_amount,
      remaining_amount,
      assignment_status:
        assigned_amount === 0
          ? "unassigned"
          : assigned_amount < available_amount
            ? "partially_assigned"
            : assigned_amount === available_amount
              ? "fully_assigned"
              : "over_assigned",
      source_lines: Array.isArray(pool.source_lines) ? pool.source_lines : [],
      assigned_assets,
    };
  });
}

export function get_effective_asset_pool_assignments({
  asset = {},
  pool_summary = [],
}) {
  const assignments = get_asset_pool_assignments(asset);
  const summary_by_key = new Map(
    pool_summary.map((pool) => [pool.pool_key, pool])
  );

  return Object.fromEntries(
    Object.entries(assignments).map(([pool_key, amount]) => {
      const raw_amount = to_number(amount);
      const pool = summary_by_key.get(pool_key);
      const available_amount = to_number(pool?.available_amount);
      const assigned_amount = to_number(pool?.assigned_amount);

      if (raw_amount <= 0 || assigned_amount <= available_amount) {
        return [pool_key, raw_amount];
      }

      if (available_amount <= 0) {
        return [pool_key, 0];
      }

      return [pool_key, raw_amount * (available_amount / assigned_amount)];
    })
  );
}

export function sum_asset_pool_assignments(assignments = {}) {
  return Object.values(assignments).reduce(
    (sum, value) => sum + to_number(value),
    0
  );
}

function resolve_asset_annual_weeks({
  asset_annual_weeks_override,
  business_default_annual_weeks,
}) {
  const override_weeks = to_number(asset_annual_weeks_override);

  if (override_weeks > 0) {
    return override_weeks;
  }

  const default_weeks = to_number(business_default_annual_weeks);

  return default_weeks > 0 ? default_weeks : 48;
}

export function get_asset_utilisation_fields(
  asset = {},
  business_default_annual_weeks = 48
) {
  const asset_type = normalizeAssetType(asset.asset_type);
  const utilisation_hours_per_week =
    asset_type === "productive"
      ? Math.max(to_number(asset.utilisation_hours_per_week ?? 40), 0)
      : 0;
  const annual_weeks_used = resolve_asset_annual_weeks({
    asset_annual_weeks_override: asset.asset_annual_weeks_override,
    business_default_annual_weeks,
  });
  const utilisation_hours_annual =
    asset_type === "productive"
      ? utilisation_hours_per_week * annual_weeks_used
      : 0;
  const total_asset_cost_annual = to_number(asset.total_asset_cost_annual);
  const required_asset_recovery_rate =
    asset_type === "productive" && utilisation_hours_annual > 0
      ? to_number(asset.asset_recovery_cost_annual ?? total_asset_cost_annual) /
        utilisation_hours_annual
      : 0;

  return {
    utilisation_hours_per_week,
    utilisation_hours_annual,
    annual_weeks_used,
    required_asset_recovery_rate,
    productive_asset_hours: utilisation_hours_annual,
    true_asset_cost_per_hour: required_asset_recovery_rate,
  };
}

export function build_asset_recovery_fields(asset = {}) {
  const allocated_asset_overhead_cost_annual =
    get_allocated_asset_overhead_cost(asset);
  const total_asset_cost_annual = to_number(asset.total_asset_cost_annual);

  return {
    allocated_asset_overhead_cost_annual,
    asset_recovery_cost_annual:
      total_asset_cost_annual + allocated_asset_overhead_cost_annual,
  };
}
