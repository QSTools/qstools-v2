import { normalizeAssetType } from "@/lib/storage/assetStorage";
import {
  build_asset_overhead_assignment_rows,
  build_asset_overhead_pool_assignment_summary,
  get_asset_pool_assignments,
  get_asset_utilisation_fields,
  get_effective_asset_pool_assignments,
  sum_asset_pool_assignments,
} from "@/hooks/assets/assetHookUtils";

export function buildAssetsOutputContract({
  asset_state,
  saved_assets,
  status,
  asset_overhead_pools,
  business_default_annual_weeks,
}) {
  const live_assets = Array.isArray(saved_assets)
    ? saved_assets.filter((asset) => !asset.is_retired)
    : [];

  const productive_assets = live_assets.filter(
    (asset) => normalizeAssetType(asset.asset_type) === "productive"
  );
  const support_assets = live_assets.filter(
    (asset) => normalizeAssetType(asset.asset_type) === "support"
  );

  const raw_asset_rows = live_assets.map((asset) => ({
      asset_id: asset.asset_id ?? "",
      asset_name: asset.asset_name ?? "Unnamed Asset",
      asset_type: normalizeAssetType(asset.asset_type),
      total_asset_cost_annual: Number(asset.total_asset_cost_annual ?? 0),
      utilisation_hours_per_week: Number(
        asset.utilisation_hours_per_week ?? 0
      ),
      utilisation_hours_annual: Number(asset.utilisation_hours_annual ?? 0),
      asset_annual_weeks_override:
        asset.asset_annual_weeks_override === null ||
        asset.asset_annual_weeks_override === undefined ||
        asset.asset_annual_weeks_override === ""
          ? null
          : Number(asset.asset_annual_weeks_override),
      annual_weeks_used: Number(asset.annual_weeks_used ?? 0),
      annual_weeks_source: asset.annual_weeks_source ?? "",
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
      is_active: !asset.is_retired,
    }));

  const asset_overhead_pool_assignment_summary =
    build_asset_overhead_pool_assignment_summary({
      asset_rows: raw_asset_rows,
      asset_overhead_pools,
    });

  const asset_rows = raw_asset_rows.map((asset) => {
    const effective_assignments = get_effective_asset_pool_assignments({
      asset,
      pool_summary: asset_overhead_pool_assignment_summary,
    });
    const allocated_asset_overhead_cost_annual =
      sum_asset_pool_assignments(effective_assignments);
    const asset_recovery_cost_annual =
      Number(asset.total_asset_cost_annual ?? 0) +
      allocated_asset_overhead_cost_annual;
    const utilisation_fields = get_asset_utilisation_fields(
      {
        ...asset,
        asset_recovery_cost_annual,
      },
      business_default_annual_weeks
    );

    return {
      ...asset,
      allocated_asset_overhead_cost_annual,
      asset_recovery_cost_annual,
      effective_asset_overhead_pool_assignments: effective_assignments,
      assigned_asset_overhead_source_rows:
        build_asset_overhead_assignment_rows({
          ...asset,
          asset_overhead_pool_assignments: effective_assignments,
        }),
      utilisation_hours_per_week:
        utilisation_fields.utilisation_hours_per_week,
      utilisation_hours_annual: utilisation_fields.utilisation_hours_annual,
      required_asset_recovery_rate:
        utilisation_fields.required_asset_recovery_rate,
      productive_asset_hours: utilisation_fields.productive_asset_hours,
      true_asset_cost_per_hour:
        utilisation_fields.true_asset_cost_per_hour,
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

  const productive_asset_rows = asset_rows.filter(
    (asset) => asset.asset_type === "productive"
  );

  const productive_asset_cost = productive_asset_rows.reduce(
    (sum, asset) => sum + Number(asset.total_asset_cost_annual ?? 0),
    0
  );
  const productive_asset_recovery_cost_annual =
    productive_asset_rows.reduce(
      (sum, asset) => sum + Number(asset.asset_recovery_cost_annual ?? 0),
      0
    );
  const productive_asset_assigned_overhead_cost_annual =
    productive_asset_rows.reduce(
      (sum, asset) =>
        sum + Number(asset.allocated_asset_overhead_cost_annual ?? 0),
      0
    );
  const support_asset_cost = support_assets.reduce(
    (sum, asset) => sum + Number(asset.total_asset_cost_annual ?? 0),
    0
  );
  const support_asset_rows = asset_rows.filter(
    (asset) => asset.asset_type === "support"
  );
  const support_asset_assigned_overhead_cost_annual =
    support_asset_rows.reduce(
      (sum, asset) =>
        sum + Number(asset.allocated_asset_overhead_cost_annual ?? 0),
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

  const total_productive_asset_utilisation_hours_annual =
    productive_asset_rows.reduce(
      (sum, asset) => sum + Number(asset.utilisation_hours_annual ?? 0),
      0
    );
  const productive_asset_recovery_rate =
    total_productive_asset_utilisation_hours_annual > 0
      ? productive_asset_recovery_cost_annual /
        total_productive_asset_utilisation_hours_annual
      : 0;
  const total_asset_related_overhead_pool_amount =
    asset_overhead_pool_assignment_summary.reduce(
      (sum, pool) => sum + Number(pool.available_amount ?? 0),
      0
    );
  const asset_related_unassigned_cost =
    asset_overhead_pool_assignment_summary.reduce(
      (sum, pool) => sum + Math.max(Number(pool.remaining_amount ?? 0), 0),
      0
    );
  const asset_overhead_assignment_warnings =
    asset_overhead_pool_assignment_summary
      .filter((pool) => pool.assignment_status === "over_assigned")
      .map((pool) => ({
        warning_key: "asset_pool_assigned_over_available",
        message: `${pool.label} has more assigned to assets than the General Overheads pool contains.`,
        pool_key: pool.pool_key,
      }));

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
    productive_asset_cost_annual: productive_asset_cost,
    productive_asset_recovery_cost_annual,
    productive_asset_assigned_overhead_cost_annual,
    support_asset_cost,
    support_asset_assigned_overhead_cost_annual,
    total_productive_asset_utilisation_hours_annual,
    productive_asset_recovery_rate,

    asset_overhead_pools,
    asset_overhead_pool_assignment_summary,
    total_allocated_asset_overhead_cost_annual,
    total_assigned_asset_overhead_cost_annual:
      total_allocated_asset_overhead_cost_annual,
    total_asset_related_overhead_pool_amount,
    asset_related_pool_total: total_asset_related_overhead_pool_amount,
    asset_related_assigned_to_assets:
      total_allocated_asset_overhead_cost_annual,
    asset_related_unassigned_cost,
    asset_related_unassigned_balance: asset_related_unassigned_cost,
    total_unassigned_asset_related_overhead_cost_annual:
      asset_related_unassigned_cost,
    asset_related_overhead_pool: asset_overhead_pool_assignment_summary,
    asset_review_required: asset_related_unassigned_cost > 0,
    asset_overhead_assignment_warnings,
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
}
