function format_currency(value) {
  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function format_percent(value) {
  return `${Number(value || 0).toFixed(2)}%`;
}

function has_value(value) {
  return value !== null && value !== undefined && value !== "";
}

function has_positive_number(value) {
  return Number(value || 0) > 0;
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

export function buildAssetStatus({
  asset_state,
  calculations,
  saved_assets,
  active_asset_count,
}) {
  const warnings = [];
  const asset_type =
    asset_state.asset_type === "support" ? "support" : "productive";

  if (!has_value(asset_state.asset_name)) {
    warnings.push("Asset name is missing.");
  }

  if (!has_value(asset_state.effective_from)) {
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
  }

  if (asset_type === "support") {
    warnings.push("Support assets are included in cost only.");
  }

  if (asset_state.is_retired) {
    warnings.push("This asset is retired and excluded from active downstream use.");
  }

  if (!has_positive_number(calculations.assets_benchmark_total)) {
    warnings.push("Awaiting P&L asset benchmark.");
  } else {
    if (calculations.reconciliation_state === "amber") {
      warnings.push("Asset total is close to benchmark but not fully reconciled.");
    }

    if (calculations.reconciliation_state === "red") {
      warnings.push("Asset total is materially out of balance with benchmark.");
    }
  }

  if (active_asset_count === 0) {
    warnings.push("No active assets are saved yet.");
  }

  return {
    is_ready: warnings.length === 0 && calculations.assets_ready,
    warning_count: warnings.length,
    warnings,

    asset_name_label: asset_state.asset_name || "Unnamed asset",
    lifecycle_label: asset_state.is_retired ? "Retired" : "Active",
    asset_type_label: asset_type === "support" ? "Support" : "Productive",
    effective_from_label: asset_state.effective_from || "No effective date",
    total_asset_cost_label: format_currency(calculations.total_asset_cost_annual),
    saved_asset_count_label: `${saved_assets.length} saved`,
    active_asset_count_label: `${active_asset_count} active`,

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

export function buildAssetCard({
  asset_state,
  calculations,
  saved_assets,
  actions,
}) {
  const asset_rows = [...saved_assets]
    .sort((left, right) => {
      const left_time = new Date(left.updated_at || left.created_at || 0).getTime();
      const right_time = new Date(right.updated_at || right.created_at || 0).getTime();
      return right_time - left_time;
    })
    .map((asset) => ({
      asset_id: asset.asset_id,
      asset_name: asset.asset_name || "Unnamed asset",
      asset_type: asset.asset_type === "support" ? "Support" : "Productive",
      effective_from: asset.effective_from || "—",
      lifecycle: asset.is_retired ? "Retired" : "Active",
      total_asset_cost_annual: format_currency(asset.total_asset_cost_annual || 0),
      is_current: asset.asset_id === asset_state.asset_id,
    }));

  return {
    form: {
      values: asset_state,
      on_change: actions.set_asset_field,
      on_bulk_change: actions.set_asset_fields,
      on_reset: actions.reset_asset_state,
      on_new_asset: actions.new_asset,
      on_save_asset: actions.save_asset,
    },
    summary: {
      rows: [
        {
          label: "Principal Annual",
          value: format_currency(calculations.principal_annual),
        },
        {
          label: "Interest Annual",
          value: format_currency(calculations.interest_annual),
        },
        {
          label: "Finance Cost Annual",
          value: format_currency(calculations.finance_cost_annual),
          emphasis: true,
        },
      ],
      module_total_asset_cost_label: format_currency(
        calculations.module_total_asset_cost_annual
      ),
      selected_asset_share_label:
        calculations.module_total_asset_cost_annual > 0
          ? format_percent(
            (Number(calculations.total_asset_cost_annual || 0) /
              Number(calculations.module_total_asset_cost_annual || 0)) *
            100
          )
          : "0.00%",
      meta: {
        asset_name: asset_state.asset_name || "Unnamed asset",
        asset_type:
          asset_state.asset_type === "support" ? "Support" : "Productive",
        effective_from: asset_state.effective_from || "—",
        lifecycle: asset_state.is_retired ? "Retired" : "Active",
      },
    },
    list: {
      asset_rows,
      on_load_asset: actions.load_asset,
      on_delete_asset: actions.delete_asset,
    },
  };
}