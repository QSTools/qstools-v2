"use client";

import { useMemo } from "react";
import {
  createEmptyAssetState,
  normalizeAssetType,
  useAssetStorage,
} from "@/lib/storage/assetStorage";
import { calculateAssetOutputs } from "@/lib/calculations/assetCalculations";
import {
  buildAssetStatus,
  buildAssetCard,
} from "@/lib/selectors/assetSelectors";
import useProfitAndLoss from "@/hooks/useProfitAndLoss";
import useGeneralOverheads from "@/hooks/useGeneralOverheads";

const ASSET_POOL_KEYS = [
  "asset_fuel_pool",
  "asset_insurance_pool",
  "asset_repairs_maintenance_pool",
  "asset_registration_compliance_pool",
  "asset_consumables_pool",
  "asset_finance_interest_pool",
];

function to_number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function get_asset_pool_assignments(asset = {}) {
  const assignments = asset.asset_overhead_pool_assignments ?? {};

  return Object.fromEntries(
    ASSET_POOL_KEYS.map((pool_key) => [pool_key, to_number(assignments[pool_key])])
  );
}

function get_allocated_asset_overhead_cost(asset = {}) {
  const assignments = get_asset_pool_assignments(asset);

  return Object.values(assignments).reduce(
    (sum, value) => sum + to_number(value),
    0
  );
}

function build_asset_recovery_fields(asset = {}) {
  const allocated_asset_overhead_cost_annual =
    get_allocated_asset_overhead_cost(asset);
  const total_asset_cost_annual = to_number(asset.total_asset_cost_annual);

  return {
    allocated_asset_overhead_cost_annual,
    asset_recovery_cost_annual:
      total_asset_cost_annual + allocated_asset_overhead_cost_annual,
  };
}

export default function useAssets() {
  const {
    asset_state,
    saved_assets,
    active_asset_count,
    set_asset_field,
    set_asset_fields,
    replace_asset_state,
    reset_asset_state,
    save_asset,
    load_asset,
    delete_asset,
  } = useAssetStorage();

  const { output_contract: pnl_output_contract } = useProfitAndLoss();
  const general_overheads = useGeneralOverheads();

  const asset_overhead_pools = useMemo(() => {
    return general_overheads?.output_contract?.asset_overhead_pools ?? {};
  }, [general_overheads?.output_contract?.asset_overhead_pools]);

  const assets_benchmark_total = Number(
    pnl_output_contract?.assets_benchmark_total ?? 0
  );

  const base_calculations = useMemo(() => {
    return calculateAssetOutputs(
      asset_state,
      saved_assets,
      assets_benchmark_total
    );
  }, [asset_state, saved_assets, assets_benchmark_total]);

  const current_asset_recovery_fields = useMemo(() => {
    return build_asset_recovery_fields({
      ...asset_state,
      total_asset_cost_annual: base_calculations.total_asset_cost_annual,
    });
  }, [asset_state, base_calculations.total_asset_cost_annual]);

  const calculations = useMemo(() => {
    return {
      ...base_calculations,
      ...current_asset_recovery_fields,
    };
  }, [base_calculations, current_asset_recovery_fields]);

  function handle_new_asset() {
    replace_asset_state(createEmptyAssetState());
  }

  function handle_save_asset() {
    save_asset(calculations);
  }

  function handle_load_asset(asset_id) {
    load_asset(asset_id);
  }

  function handle_delete_asset(asset_id) {
    delete_asset(asset_id);
  }

  function handle_change_asset_overhead_pool_assignment(pool_key, value) {
    const current_assignments = get_asset_pool_assignments(asset_state);

    set_asset_field("asset_overhead_pool_assignments", {
      ...current_assignments,
      [pool_key]: to_number(value),
    });
  }

  const status = useMemo(() => {
    return buildAssetStatus({
      asset_state,
      calculations,
      saved_assets,
      active_asset_count,
    });
  }, [asset_state, calculations, saved_assets, active_asset_count]);

  const card = useMemo(() => {
    return buildAssetCard({
      asset_state,
      calculations,
      saved_assets,
      asset_overhead_pools,
      actions: {
        set_asset_field,
        set_asset_fields,
        reset_asset_state,
        new_asset: handle_new_asset,
        save_asset: handle_save_asset,
        load_asset: handle_load_asset,
        delete_asset: handle_delete_asset,
        change_asset_overhead_pool_assignment:
          handle_change_asset_overhead_pool_assignment,
      },
    });
  }, [
    asset_state,
    calculations,
    saved_assets,
    asset_overhead_pools,
    set_asset_field,
    set_asset_fields,
    reset_asset_state,
  ]);

  const active_assets = useMemo(() => {
    return Array.isArray(saved_assets)
      ? saved_assets
          .filter((asset) => !asset.is_retired)
          .map((asset) => {
            const recovery_fields = build_asset_recovery_fields(asset);

            return {
              asset_id: asset.asset_id ?? "",
              asset_name: asset.asset_name ?? "Unnamed Asset",
              asset_type: normalizeAssetType(asset.asset_type),
              total_asset_cost_annual: Number(asset.total_asset_cost_annual ?? 0),
              allocated_asset_overhead_cost_annual:
                recovery_fields.allocated_asset_overhead_cost_annual,
              asset_recovery_cost_annual:
                recovery_fields.asset_recovery_cost_annual,
              asset_overhead_pool_assignments:
                get_asset_pool_assignments(asset),
              asset_interest_annual: Number(
                asset.asset_interest_annual ?? asset.interest_annual ?? 0
              ),
              finance_cost_annual: Number(asset.finance_cost_annual ?? 0),
              estimated_remaining_finance_balance: Number(
                asset.estimated_remaining_finance_balance ?? 0
              ),
              finance_progress_percent: Number(
                asset.finance_progress_percent ?? 0
              ),
              finance_active: asset.finance_active === true,
              finance_status: asset.finance_status ?? "not_financed",
              finance_start_date: asset.finance_start_date ?? "",
              finance_end_date: asset.finance_end_date ?? "",
              finance_paid_off: asset.finance_paid_off === true,
              cash_flow_support: {
                asset_principal_repayment_annual: Number(
                  asset.asset_principal_repayment_annual ??
                    asset.principal_annual ??
                    0
                ),
                asset_total_finance_payment_annual: Number(
                  asset.asset_total_finance_payment_annual ?? 0
                ),
              },
              productive_asset_hours: Number(asset.productive_asset_hours ?? 0),
              true_asset_cost_per_hour: Number(
                asset.true_asset_cost_per_hour ?? 0
              ),
              is_active: !asset.is_retired,
            };
          })
      : [];
  }, [saved_assets]);

  const output_contract = useMemo(() => {
    const live_assets = Array.isArray(saved_assets)
      ? saved_assets.filter((asset) => !asset.is_retired)
      : [];

    const productive_assets = live_assets.filter(
      (asset) => normalizeAssetType(asset.asset_type) === "productive"
    );
    const support_assets = live_assets.filter(
      (asset) => normalizeAssetType(asset.asset_type) === "support"
    );

    const asset_rows = live_assets.map((asset) => {
      const recovery_fields = build_asset_recovery_fields(asset);

      return {
        asset_id: asset.asset_id ?? "",
        asset_name: asset.asset_name ?? "Unnamed Asset",
        asset_type: normalizeAssetType(asset.asset_type),
        total_asset_cost_annual: Number(asset.total_asset_cost_annual ?? 0),
        allocated_asset_overhead_cost_annual:
          recovery_fields.allocated_asset_overhead_cost_annual,
        asset_recovery_cost_annual: recovery_fields.asset_recovery_cost_annual,
        asset_overhead_pool_assignments: get_asset_pool_assignments(asset),
        asset_interest_annual: Number(
          asset.asset_interest_annual ?? asset.interest_annual ?? 0
        ),
        finance_cost_annual: Number(asset.finance_cost_annual ?? 0),
        estimated_remaining_finance_balance: Number(
          asset.estimated_remaining_finance_balance ?? 0
        ),
        finance_progress_percent: Number(asset.finance_progress_percent ?? 0),
        finance_active: asset.finance_active === true,
        finance_status: asset.finance_status ?? "not_financed",
        finance_start_date: asset.finance_start_date ?? "",
        finance_end_date: asset.finance_end_date ?? "",
        finance_paid_off: asset.finance_paid_off === true,
        cash_flow_support: {
          asset_principal_repayment_annual: Number(
            asset.asset_principal_repayment_annual ??
              asset.principal_annual ??
              0
          ),
          asset_total_finance_payment_annual: Number(
            asset.asset_total_finance_payment_annual ?? 0
          ),
        },
        productive_asset_hours: Number(asset.productive_asset_hours ?? 0),
        true_asset_cost_per_hour: Number(asset.true_asset_cost_per_hour ?? 0),
        is_active: !asset.is_retired,
      };
    });

    const total_asset_cost_annual = asset_rows.reduce(
      (sum, asset) => sum + Number(asset.total_asset_cost_annual ?? 0),
      0
    );

    const total_allocated_asset_overhead_cost_annual = asset_rows.reduce(
      (sum, asset) =>
        sum + Number(asset.allocated_asset_overhead_cost_annual ?? 0),
      0
    );

    const total_asset_recovery_cost_annual = asset_rows.reduce(
      (sum, asset) => sum + Number(asset.asset_recovery_cost_annual ?? 0),
      0
    );

    const productive_asset_cost = productive_assets.reduce(
      (sum, asset) => sum + Number(asset.total_asset_cost_annual ?? 0),
      0
    );
    const support_asset_cost = support_assets.reduce(
      (sum, asset) => sum + Number(asset.total_asset_cost_annual ?? 0),
      0
    );

    const total_asset_interest_annual = live_assets.reduce(
      (sum, asset) =>
        sum + Number(asset.asset_interest_annual ?? asset.interest_annual ?? 0),
      0
    );

    const cash_flow_support = {
      total_asset_principal_repayment_annual: live_assets.reduce(
        (sum, asset) =>
          sum +
          Number(
            asset.asset_principal_repayment_annual ??
              asset.principal_annual ??
              0
          ),
        0
      ),
      total_asset_finance_payment_annual: live_assets.reduce(
        (sum, asset) =>
          sum + Number(asset.asset_total_finance_payment_annual ?? 0),
        0
      ),
      cash_flow_layer: "future_only",
    };

    return {
      assets: asset_rows,
      active_assets: asset_rows,
      assets_ready: Boolean(status.assets_ready),
      no_active_assets_confirmed:
        asset_state.no_active_assets_confirmed === true,
      has_productive_asset_recovery_base: productive_assets.length > 0,
      productive_asset_count: productive_assets.length,
      support_asset_count: support_assets.length,
      productive_asset_cost,
      support_asset_cost,

      asset_overhead_pools,
      total_allocated_asset_overhead_cost_annual,
      total_asset_recovery_cost_annual,

      finance_cost_annual: live_assets.reduce(
        (sum, asset) => sum + Number(asset.finance_cost_annual ?? 0),
        0
      ),
      legacy_display: {
        running_cost_annual: live_assets.reduce(
          (sum, asset) => sum + Number(asset.running_cost_annual ?? 0),
          0
        ),
      },
      total_asset_interest_annual,
      cash_flow_support,
      total_asset_cost_annual,
    };
  }, [
    asset_state.no_active_assets_confirmed,
    saved_assets,
    status.assets_ready,
    asset_overhead_pools,
  ]);

  return {
    status,
    card,
    output_contract,
    active_assets,
  };
}