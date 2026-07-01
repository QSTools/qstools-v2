"use client";

import { useMemo } from "react";

import {
  safe_array,
  safe_number,
} from "@/lib/calculations/cost-allocation/costAllocationInputBuilder";

function normalise_asset_type(value) {
  return value === "support" ? "support" : "productive";
}

function get_asset_name(asset = {}) {
  return asset.asset_name || asset.name || "Unnamed Asset";
}

function get_asset_recovery_hours(asset = {}, default_recovery_hours = 0) {
  return (
    safe_number(asset.utilisation_hours_annual) ||
    safe_number(asset.asset_utilisation_hours_annual) ||
    safe_number(asset.recovery_hours_annual) ||
    safe_number(asset.asset_recovery_hours_used) ||
    safe_number(default_recovery_hours)
  );
}

function build_asset_recovery_overlay({
  asset_output_contract = {},
  recovery_hours_used = 0,
}) {
  const active_assets = safe_array(asset_output_contract.active_assets);
  const default_recovery_hours = safe_number(recovery_hours_used);

  const recovery_assets = active_assets.map((asset) => {
    const base_asset_cost_annual = safe_number(asset.total_asset_cost_annual);
    const allocated_asset_overhead_cost_annual = safe_number(
      asset.allocated_asset_overhead_cost_annual
    );

    const asset_recovery_cost_annual =
      asset.asset_recovery_cost_annual !== undefined
        ? safe_number(asset.asset_recovery_cost_annual)
        : base_asset_cost_annual + allocated_asset_overhead_cost_annual;

    const asset_recovery_hours_used = get_asset_recovery_hours(
      asset,
      default_recovery_hours
    );

    const asset_base_recovery_rate_per_hour =
      asset_recovery_hours_used > 0
        ? base_asset_cost_annual / asset_recovery_hours_used
        : 0;

    const allocated_asset_overhead_recovery_rate =
      asset_recovery_hours_used > 0
        ? allocated_asset_overhead_cost_annual / asset_recovery_hours_used
        : 0;

    const asset_recovery_rate_per_hour =
      asset_recovery_hours_used > 0
        ? asset_recovery_cost_annual / asset_recovery_hours_used
        : 0;

    return {
      ...asset,
      asset_type: normalise_asset_type(asset.asset_type),
      asset_name: get_asset_name(asset),

      base_asset_cost_annual,
      allocated_asset_overhead_cost_annual,
      asset_recovery_cost_annual,

      utilisation_hours_annual: asset_recovery_hours_used,
      asset_recovery_hours_used,

      asset_base_recovery_rate_per_hour,
      allocated_asset_overhead_recovery_rate,
      asset_recovery_rate_per_hour,

      minimum_recoverable_asset_rate: asset_recovery_rate_per_hour,
      fully_loaded_asset_recovery_rate: asset_recovery_rate_per_hour,

      cost_allocation_asset_cost_annual: asset_recovery_cost_annual,
    };
  });

  const asset_recovery_rows = recovery_assets.map((asset) => ({
    asset_id: asset.asset_id ?? "",
    asset_name: asset.asset_name ?? "Unnamed Asset",
    asset_type: asset.asset_type,

    base_asset_cost_annual: safe_number(asset.base_asset_cost_annual),
    allocated_asset_overhead_cost_annual: safe_number(
      asset.allocated_asset_overhead_cost_annual
    ),
    asset_recovery_cost_annual: safe_number(asset.asset_recovery_cost_annual),

    utilisation_hours_annual: safe_number(asset.utilisation_hours_annual),
    asset_recovery_hours_used: safe_number(asset.asset_recovery_hours_used),

    asset_base_recovery_rate_per_hour: safe_number(
      asset.asset_base_recovery_rate_per_hour
    ),
    allocated_asset_overhead_recovery_rate: safe_number(
      asset.allocated_asset_overhead_recovery_rate
    ),
    asset_recovery_rate_per_hour: safe_number(
      asset.asset_recovery_rate_per_hour
    ),

    minimum_recoverable_asset_rate: safe_number(
      asset.minimum_recoverable_asset_rate
    ),
    fully_loaded_asset_recovery_rate: safe_number(
      asset.fully_loaded_asset_recovery_rate
    ),
  }));

  const productive_assets = recovery_assets.filter(
    (asset) => asset.asset_type === "productive"
  );

  const support_assets = recovery_assets.filter(
    (asset) => asset.asset_type === "support"
  );

  const productive_asset_base_cost = productive_assets.reduce(
    (sum, asset) => sum + safe_number(asset.base_asset_cost_annual),
    0
  );

  const support_asset_base_cost = support_assets.reduce(
    (sum, asset) => sum + safe_number(asset.base_asset_cost_annual),
    0
  );

  const productive_asset_allocated_overhead_cost = productive_assets.reduce(
    (sum, asset) =>
      sum + safe_number(asset.allocated_asset_overhead_cost_annual),
    0
  );

  const support_asset_allocated_overhead_cost = support_assets.reduce(
    (sum, asset) =>
      sum + safe_number(asset.allocated_asset_overhead_cost_annual),
    0
  );

  const productive_asset_recovery_cost = productive_assets.reduce(
    (sum, asset) => sum + safe_number(asset.asset_recovery_cost_annual),
    0
  );

  const support_asset_recovery_cost = support_assets.reduce(
    (sum, asset) => sum + safe_number(asset.asset_recovery_cost_annual),
    0
  );

  return {
    active_assets: recovery_assets,
    asset_recovery_rows,

    productive_asset_base_cost,
    support_asset_base_cost,

    productive_asset_allocated_overhead_cost,
    support_asset_allocated_overhead_cost,

    productive_asset_recovery_cost,
    support_asset_recovery_cost,

    productive_asset_cost: productive_asset_recovery_cost,
    support_asset_cost: support_asset_recovery_cost,

    total_allocated_asset_overhead_cost:
      productive_asset_allocated_overhead_cost +
      support_asset_allocated_overhead_cost,

    total_asset_recovery_cost:
      productive_asset_recovery_cost + support_asset_recovery_cost,
  };
}

export function useCostAllocationAssetOverlay({
  asset_output_contract = {},
  recovery_hours_used = 0,
}) {
  return useMemo(() => {
    return build_asset_recovery_overlay({
      asset_output_contract,
      recovery_hours_used,
    });
  }, [asset_output_contract, recovery_hours_used]);
}