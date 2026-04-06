function format_currency(value) {
  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function has_value(value) {
  return value !== null && value !== undefined && value !== "";
}

function has_positive_number(value) {
  return Number(value || 0) > 0;
}

export function buildAssetStatus({
  asset_state,
  calculations,
  saved_assets,
  active_asset_count,
}) {
  const warnings = [];

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

  if (asset_state.is_retired) {
    warnings.push("This asset is retired and excluded from active downstream use.");
  }

  return {
    is_ready: warnings.length === 0,
    warning_count: warnings.length,
    warnings,
    asset_name_label: asset_state.asset_name || "Unnamed asset",
    lifecycle_label: asset_state.is_retired ? "Retired" : "Active",
    effective_from_label: asset_state.effective_from || "No effective date",
    total_asset_cost_label: format_currency(calculations.total_asset_cost_annual),
    saved_asset_count_label: `${saved_assets.length} saved`,
    active_asset_count_label: `${active_asset_count} active`,
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
          label: "Finance Cost Annual",
          value: format_currency(calculations.finance_cost_annual),
        },
        {
          label: "Running Cost Annual",
          value: format_currency(calculations.running_cost_annual),
        },
        {
          label: "Total Asset Cost Annual",
          value: format_currency(calculations.total_asset_cost_annual),
          emphasis: true,
        },
      ],
      meta: {
        asset_name: asset_state.asset_name || "Unnamed asset",
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