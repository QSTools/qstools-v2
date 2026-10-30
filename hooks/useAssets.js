"use client";

import { useEffect, useMemo, useState } from "react";
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
import { get_mode } from "@/lib/storage/modelStorage";
import {
  get_scenario_removals,
  set_scenario_removal,
  subscribe_to_scenarios,
} from "@/lib/storage/modelScenarios";
import { apply_asset_removals } from "@/lib/calculations/scenarioRemovals";

// R3 slice 4 batch B: constants so the first render (server and client) is identical and baseline mode allocates nothing new.
const NO_SCENARIO_REMOVALS = Object.freeze({
  staff_ids: Object.freeze([]),
  asset_ids: Object.freeze([]),
  flags: Object.freeze({}),
  has_scenario: false,
  removal_count: 0,
});
const NO_SCENARIO_ROWS = Object.freeze([]);

export default function useAssets() {
  const {
    asset_state,
    saved_assets: stored_assets,
    active_asset_count: stored_active_asset_count,
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

  // R3 slice 4 batch B: scenario removals (asset markers in mirra_scenarios_v1). Empty, and no storage read, in baseline mode. Read after mount so the
  // first render matches the server. Every mounted copy of this hook listens, so none goes stale when a marker changes.
  const [scenario_removals, set_scenario_removals] = useState(NO_SCENARIO_REMOVALS);
  const [model_active, set_model_active] = useState(false);

  useEffect(() => {
    const loaded_removals = get_scenario_removals();
    set_scenario_removals((current) =>
      loaded_removals.removal_count === 0 && current.removal_count === 0 ? current : loaded_removals
    );
    set_model_active(get_mode() === "model");
    return subscribe_to_scenarios(() => set_scenario_removals(get_scenario_removals()));
  }, []);

  // The scenario view of the asset list: removed assets are filtered out and their overhead pool amounts move to the remaining live assets (pro rata),
  // so a removal never leaves unassigned cost. With no asset marker saved_assets IS stored_assets (same array, nothing extra calculated), which is
  // always the case in baseline mode. The stored list, the form and the register shown on the page keep the real assets.
  const removal_result = useMemo(
    () => apply_asset_removals(stored_assets, scenario_removals.asset_ids),
    [stored_assets, scenario_removals.asset_ids]
  );
  const saved_assets = removal_result.assets;
  const active_asset_count =
    saved_assets === stored_assets
      ? stored_active_asset_count
      : Array.isArray(saved_assets)
      ? saved_assets.filter((asset) => !asset.is_retired).length
      : 0;

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

  // Asset Finance Interest - P&L Match: compares the P&L's flagged
  // asset-finance interest line(s) against Assets' own confirmed total.
  // Sourced from the General Overheads hook already imported above -
  // no new dependency, no circular-import risk (see S22 brief).
  const asset_finance_pnl_match = useMemo(() => {
    const flagged_pnl_total = to_number(
      general_overheads?.calculated?.flagged_asset_finance_pnl_total
    );
    const matched_to_assets = to_number(
      general_overheads?.calculated?.assets_finance_interest_total
    );
    const remaining = Math.max(flagged_pnl_total - matched_to_assets, 0);
    const match_status =
      flagged_pnl_total <= 0
        ? matched_to_assets > 0.01
          ? "unflagged_but_assets_has_interest"
          : "not_applicable"
        : remaining <= 0.01
        ? "fully_matched"
        : "gap_present";

    return {
      flagged_pnl_total,
      matched_to_assets,
      remaining,
      match_status,
    };
  }, [
    general_overheads?.calculated?.flagged_asset_finance_pnl_total,
    general_overheads?.calculated?.assets_finance_interest_total,
  ]);

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

  const get_card = useMemo(() => () => {
    return buildAssetCard({
      asset_state,
      calculations,
      saved_assets: stored_assets,
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
    stored_assets,
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
              // Passthrough added 2026-09-12 for the Balance Sheet Fixed
              // Assets reconciliation (CFO_REQUIREMENTS_GAP_2026-09-12.txt
              // Part 1B item 2) - purchase_price was already stored per
              // asset (lib/storage/assetStorage.js) but never flowed
              // through this hook before now.
              purchase_price: Number(asset.purchase_price ?? 0),
              // F-10 (2026-10-26): pass-through for EBITDA. Stored at link
              // time by assetStorage (null when unlinked). Kept null, not 0,
              // so useBusinessOutcomePerSourceRevenue's to_number() check
              // still tells "unavailable" from a real figure.
              estimated_annual_depreciation:
                asset.estimated_annual_depreciation === null ||
                asset.estimated_annual_depreciation === undefined
                  ? null
                  : Number(asset.estimated_annual_depreciation),
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
    status.asset_pool_guardrail_status,
    asset_overhead_pools,
    business_default_annual_weeks,
  ]);

  // R3 slice 4 batch B: the reconciliation trust gate judges REAL data, so it gets the status and contract built from ALL assets. Only built when an
  // asset marker is applied (Model mode); otherwise the very same objects as status / output_contract come back. Known limit: calculations (the asset
  // open in the form) still uses the scenario list for the other assets' pool use; it only matters for the asset being edited.
  const unmodelled = useMemo(() => {
    if (saved_assets === stored_assets) return null;
    const real_status = buildAssetStatus({
      asset_state,
      calculations,
      saved_assets: stored_assets,
      active_asset_count: stored_active_asset_count,
      asset_overhead_pools,
      business_default_annual_weeks,
    });
    const real_output_contract = buildAssetsOutputContract({
      asset_state,
      saved_assets: stored_assets,
      status: real_status,
      asset_overhead_pools,
      business_default_annual_weeks,
    });
    return { status: real_status, output_contract: real_output_contract };
  }, [
    saved_assets,
    stored_assets,
    stored_active_asset_count,
    asset_state,
    calculations,
    asset_overhead_pools,
    business_default_annual_weeks,
  ]);

  function set_asset_removed(asset_id, removed) {
    const result = set_scenario_removal("asset", asset_id, removed);
    if (result.ok) set_scenario_removals(result.removals);
    return result;
  }

  const scenario = useMemo(() => {
    return {
      kind: "asset",
      active: model_active,
      rows:
        model_active && Array.isArray(stored_assets)
          ? stored_assets
              .filter((asset) => !asset.is_retired)
              .map((asset) => ({
                id: asset.asset_id ?? "",
                name: asset.asset_name || "Unnamed Asset",
                detail: normalizeAssetType(asset.asset_type),
              }))
          : NO_SCENARIO_ROWS,
      removed_ids: scenario_removals.asset_ids,
      flags: scenario_removals.flags,
      unplaced: removal_result.unplaced,
      set_removed: set_asset_removed,
    };
  }, [model_active, stored_assets, scenario_removals, removal_result]);

  return {
    status,
    get card() { return get_card(); },
    output_contract,
    unmodelled_status: unmodelled ? unmodelled.status : status,
    unmodelled_output_contract: unmodelled ? unmodelled.output_contract : output_contract,
    scenario,
    active_assets,
    business_default_annual_weeks,
    asset_finance_pnl_match,
  };
}



