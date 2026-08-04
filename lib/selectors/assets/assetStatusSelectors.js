import {
  format_currency,
  format_hours,
  format_percent,
  has_positive_number,
  has_valid_number,
  has_value,
} from "./assetSelectorFormatters";
import { get_live_asset_utilisation_hours_annual } from "./assetSelectorUtilisation";
import {
  build_asset_overhead_pool_summary,
  get_active_saved_assets,
} from "./assetOverheadPoolSelectors";

function is_valid_active_asset_record(asset) {
  const finance_fields_started =
    has_positive_number(asset?.purchase_price) ||
    has_positive_number(asset?.interest_rate) ||
    has_positive_number(asset?.finance_term_years);

  const finance_fields_valid =
    !finance_fields_started ||
    (has_positive_number(asset?.purchase_price) &&
      has_positive_number(asset?.interest_rate) &&
      has_positive_number(asset?.finance_term_years) &&
      has_value(asset?.finance_start_date));

  return (
    has_value(asset?.asset_id) &&
    has_value(asset?.asset_name) &&
    has_value(asset?.asset_type) &&
    asset?.is_retired !== true &&
    has_valid_number(asset?.total_asset_cost_annual) &&
    finance_fields_valid
  );
}

function get_reconciliation_label(reconciliation_state) {
  if (reconciliation_state === "pending") {
    return "Awaiting benchmark";
  }

  if (reconciliation_state === "green") {
    return "Reconciled";
  }

  if (reconciliation_state === "amber") {
    return "Close variance";
  }

  return "Out of balance";
}

export function get_finance_status_label(finance_status) {
  if (finance_status === "active") return "Active";
  if (finance_status === "extended") return "Extended";
  if (finance_status === "paid_off") return "Paid off";
  if (finance_status === "term_ended") return "Term ended";
  return "Not financed";
}

export function get_finance_lifecycle_note(calculations = {}) {
  if (calculations.finance_status === "paid_off") {
    return "Finance has been paid off. Future interest, principal and finance payment are treated as zero.";
  }

  if (calculations.finance_status === "extended") {
    return "Finance term has been extended. Current finance outputs use the original term plus extension months.";
  }

  if (calculations.finance_status === "term_ended") {
    return "Finance term has ended. Future interest, principal and finance payment are treated as zero.";
  }

  if (calculations.finance_status === "active") {
    return "Finance is active. Interest is included as operating asset cost; principal is shown for cash-flow visibility.";
  }

  return "No active finance is currently included for this asset.";
}

export function buildAssetStatus({
  asset_state,
  calculations,
  saved_assets,
  active_asset_count,
  asset_overhead_pools = {},
  business_default_annual_weeks,
}) {
  const warnings = [];
  const active_saved_assets = get_active_saved_assets(saved_assets);

  const active_saved_asset_total = active_saved_assets.reduce(
    (sum, asset) => sum + Number(asset.total_asset_cost_annual ?? 0),
    0
  );

  const invalid_active_assets = active_saved_assets.filter(
    (asset) => !is_valid_active_asset_record(asset)
  );

  const productive_active_assets = active_saved_assets.filter(
    (asset) => asset.asset_type === "productive"
  );

  const productive_assets_missing_utilisation = productive_active_assets.filter(
    (asset) => !has_positive_number(asset.utilisation_hours_per_week)
  );

  const total_productive_asset_utilisation_hours_annual =
    productive_active_assets.reduce(
      (sum, asset) =>
        sum +
        get_live_asset_utilisation_hours_annual(
          asset,
          business_default_annual_weeks
        ),
      0
    );

  const productive_asset_cost_annual = productive_active_assets.reduce(
    (sum, asset) => sum + Number(asset.total_asset_cost_annual ?? 0),
    0
  );

  const productive_asset_recovery_rate =
    total_productive_asset_utilisation_hours_annual > 0
      ? productive_asset_cost_annual /
        total_productive_asset_utilisation_hours_annual
      : 0;

  const asset_pool_summary = build_asset_overhead_pool_summary({
    asset_state,
    saved_assets,
    asset_overhead_pools,
  });

  const asset_pool_over_allocated = asset_pool_summary.some(
    (pool) => pool.allocation_status === "over_allocated"
  );

  const asset_pool_review_required = asset_pool_summary.some((pool) =>
    ["under_allocated", "no_source_pool", "review_required"].includes(
      pool.allocation_status
    )
  );

  const asset_pool_guardrail_status = asset_pool_over_allocated
    ? "blocked"
    : asset_pool_review_required
      ? "review_required"
      : "ready";

  const asset_type =
    asset_state.asset_type === "support" ? "support" : "productive";

  const no_active_assets_confirmed =
    asset_state.no_active_assets_confirmed === true;

  const no_active_assets_ready =
    active_saved_assets.length === 0 &&
    no_active_assets_confirmed &&
    active_saved_asset_total === 0;

  const active_assets_ready =
    active_saved_assets.length > 0 && invalid_active_assets.length === 0;

  if (
    active_saved_assets.length === 0 &&
    !no_active_assets_ready &&
    !has_value(asset_state.asset_name)
  ) {
    warnings.push("Asset name is missing.");
  }

  if (
    active_saved_assets.length === 0 &&
    !no_active_assets_ready &&
    !has_value(asset_state.effective_from)
  ) {
    warnings.push("Effective from date is missing.");
  }

  const finance_fields_started =
    has_positive_number(asset_state.purchase_price) ||
    has_positive_number(asset_state.interest_rate) ||
    has_positive_number(asset_state.finance_term_years);

  if (finance_fields_started) {
    if (!has_positive_number(asset_state.purchase_price)) {
      warnings.push("Purchase price is required when finance inputs are used.");
    }

    if (!has_positive_number(asset_state.interest_rate)) {
      warnings.push("Interest rate is required when finance inputs are used.");
    }

    if (!has_positive_number(asset_state.finance_term_years)) {
      warnings.push("Finance term is required when finance inputs are used.");
    }

    if (!has_value(asset_state.finance_start_date)) {
      warnings.push(
        "Finance start date is required when finance inputs are used."
      );
    }
  }

  if (
    asset_state.finance_term_extended === true &&
    !has_positive_number(asset_state.revised_term_months)
  ) {
    warnings.push("Enter extension months when extending finance.");
  }

  if (
    asset_state.finance_paid_off === true &&
    !has_value(asset_state.finance_paid_off_date)
  ) {
    warnings.push("Paid-off date is missing.");
  }

  if (active_saved_assets.length === 0 && asset_type === "support") {
    warnings.push("Support assets are included in cost only.");
  }

  if (
    active_saved_assets.length === 0 &&
    asset_type === "productive" &&
    !has_positive_number(asset_state.utilisation_hours_per_week)
  ) {
    warnings.push(
      "Productive asset utilisation is zero, so asset recovery rate is held at 0."
    );
  }

  if (active_saved_assets.length === 0 && asset_state.is_retired) {
    warnings.push(
      "This asset is retired and excluded from active downstream use."
    );
  }

  if (no_active_assets_ready) {
    warnings.push("No active assets explicitly confirmed.");
  } else if (!has_positive_number(calculations.assets_benchmark_total)) {
    warnings.push("Awaiting P&L asset benchmark. This is diagnostic only.");
  } else {
    if (calculations.reconciliation_state === "amber") {
      warnings.push(
        "Asset total is close to benchmark but not fully reconciled. This is diagnostic only."
      );
    }

    if (calculations.reconciliation_state === "red") {
      warnings.push(
        "Asset total is materially out of balance with benchmark. This is diagnostic only."
      );
    }
  }

  if (invalid_active_assets.length > 0) {
    warnings.push(
      "One or more active asset records are missing required setup fields."
    );
  }

  if (productive_assets_missing_utilisation.length > 0) {
    warnings.push(
      "One or more productive assets have zero utilisation, so their asset recovery rate is held at 0."
    );
  }

  if (
    asset_pool_summary.some(
      (pool) =>
        Number(pool.available_amount || 0) > 0 &&
        Number(pool.assigned_total || 0) === 0
    )
  ) {
    warnings.push(
      "Asset-related overhead pools exist but are not assigned to assets yet. They remain visible for review."
    );
  }

  if (asset_pool_over_allocated) {
    warnings.push(
      "One or more asset-related overhead pools are assigned above the available General Overheads pool amount."
    );
  }

  if (active_saved_assets.length === 0 && !no_active_assets_confirmed) {
    warnings.push("No active assets are saved yet.");
  }

  const assets_ready =
    (active_assets_ready || no_active_assets_ready) && !asset_pool_over_allocated;

  return {
    is_ready: assets_ready,
    assets_ready,
    no_active_assets_confirmed,
    warning_count: warnings.length,
    warnings,

    asset_pool_guardrail_status,

    asset_name_label: asset_state.asset_name || "Unnamed asset",
    lifecycle_label: asset_state.is_retired ? "Retired" : "Active",
    asset_type_label: asset_type === "support" ? "Support" : "Productive",
    effective_from_label: asset_state.effective_from || "No effective date",
    total_asset_cost_label: format_currency(
      calculations.total_asset_cost_annual
    ),
    saved_asset_count_label: `${saved_assets.length} saved`,
    active_asset_count_label: `${active_asset_count} active`,
    productive_asset_count_label: `${productive_active_assets.length} productive`,
    total_productive_asset_utilisation_hours_annual,
    total_productive_asset_utilisation_hours_annual_label: format_hours(
      total_productive_asset_utilisation_hours_annual,
      0
    ),
    productive_asset_cost_annual,
    productive_asset_cost_annual_label: format_currency(
      productive_asset_cost_annual
    ),
    productive_asset_recovery_rate,
    productive_asset_recovery_rate_label: `${format_currency(
      productive_asset_recovery_rate
    )} / hr`,

    assets_benchmark_total_label: format_currency(
      calculations.assets_benchmark_total
    ),

    module_total_asset_cost_label: format_currency(
      calculations.module_total_asset_cost_annual
    ),
    assets_variance_amount_label: format_currency(
      calculations.assets_variance_amount
    ),
    assets_variance_percent_label: format_percent(
      calculations.assets_variance_percent
    ),
    reconciliation_label: get_reconciliation_label(
      calculations.reconciliation_state
    ),
    reconciliation_state: calculations.reconciliation_state,
  };
}

