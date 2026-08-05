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
import useOpeningHours from "@/hooks/useOpeningHours";
import { buildAssetsOutputContract } from "@/hooks/assets/assetOutputContract";
import {
  build_asset_overhead_assignment_rows,
  build_asset_recovery_fields,
  get_asset_pool_assignments,
  get_asset_utilisation_fields,
  sum_asset_pool_assignments,
  to_number,
} from "@/hooks/assets/assetHookUtils";

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
  const opening_hours = useOpeningHours();

  const business_default_annual_weeks =
    to_number(opening_hours?.calculated?.annual_open_weeks) || 48;

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
      assets_benchmark_total,
      business_default_annual_weeks
    );
  }, [
    asset_state,
    saved_assets,
    assets_benchmark_total,
    business_default_annual_weeks,
  ]);

  const current_asset_recovery_fields = useMemo(() => {
    const current_assignments = get_asset_pool_assignments(asset_state);
    const active_saved_assets = Array.isArray(saved_assets)
      ? saved_assets.filter(
          (asset) =>
            !asset.is_retired && asset.asset_id !== asset_state.asset_id
        )
      : [];
    const effective_current_assignments = Object.fromEntries(
      Object.entries(current_assignments).map(([pool_key, amount]) => {
        const available_amount = to_number(
          asset_overhead_pools?.[pool_key]?.amount
        );
        const assigned_to_other_assets = active_saved_assets.reduce(
          (sum, asset) =>
            sum +
            to_number(asset.asset_overhead_pool_assignments?.[pool_key]),
          0
        );
        const remaining_available = Math.max(
          available_amount - assigned_to_other_assets,
          0
        );

        return [pool_key, Math.min(to_number(amount), remaining_available)];
      })
    );
    const allocated_asset_overhead_cost_annual = sum_asset_pool_assignments(
      effective_current_assignments
    );
    const asset_recovery_cost_annual =
      to_number(base_calculations.total_asset_cost_annual) +
      allocated_asset_overhead_cost_annual;
    const recovery_fields = {
      allocated_asset_overhead_cost_annual,
      asset_recovery_cost_annual,
    };
    const utilisation_fields = get_asset_utilisation_fields(
      {
        ...asset_state,
        total_asset_cost_annual: base_calculations.total_asset_cost_annual,
        asset_recovery_cost_annual: recovery_fields.asset_recovery_cost_annual,
      },
      business_default_annual_weeks
    );

    return {
      ...recovery_fields,
      required_asset_recovery_rate:
        utilisation_fields.required_asset_recovery_rate,
      true_asset_cost_per_hour: utilisation_fields.true_asset_cost_per_hour,
    };
  }, [
    asset_state,
    saved_assets,
    asset_overhead_pools,
    base_calculations.total_asset_cost_annual,
    business_default_annual_weeks,
  ]);

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
      asset_overhead_pools,
      business_default_annual_weeks,
    });
  }, [
    asset_state,
    calculations,
    saved_assets,
    active_asset_count,
    asset_overhead_pools,
    business_default_annual_weeks,
  ]);

  const card = useMemo(() => {
    return buildAssetCard({
      asset_state,
      calculations,
      saved_assets,
      asset_overhead_pools,
      business_default_annual_weeks,
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
    business_default_annual_weeks,
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
            const utilisation_fields = get_asset_utilisation_fields(
              {
                ...asset,
                asset_recovery_cost_annual:
                  recovery_fields.asset_recovery_cost_annual,
              },
              business_default_annual_weeks
            );

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
              assigned_asset_overhead_source_rows:
                build_asset_overhead_assignment_rows(asset),
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
              utilisation_hours_per_week:
                utilisation_fields.utilisation_hours_per_week,
              utilisation_hours_annual:
                utilisation_fields.utilisation_hours_annual,
              required_asset_recovery_rate:
                utilisation_fields.required_asset_recovery_rate,
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
              productive_asset_hours: utilisation_fields.productive_asset_hours,
              true_asset_cost_per_hour:
                utilisation_fields.true_asset_cost_per_hour,
              is_active: !asset.is_retired,
            };
          })
      : [];
  }, [saved_assets, business_default_annual_weeks]);

  const output_contract = useMemo(() => {
    return buildAssetsOutputContract({
      asset_state,
      saved_assets,
      status,
      asset_overhead_pools,
      business_default_annual_weeks,
    });
  }, [
    asset_state.no_active_assets_confirmed,
    saved_assets,
    status.assets_ready,
    asset_overhead_pools,
    business_default_annual_weeks,
  ]);

  return {
    status,
    card,
    output_contract,
    active_assets,
    business_default_annual_weeks,
  };
}
