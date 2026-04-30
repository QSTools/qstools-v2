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

function has_valid_number(value) {
  return Number.isFinite(Number(value));
}

function get_active_saved_assets(saved_assets = []) {
  return Array.isArray(saved_assets)
    ? saved_assets.filter((asset) => !asset.is_retired)
    : [];
}

function is_valid_active_asset_record(asset) {
  return (
    has_value(asset?.asset_id) &&
    has_value(asset?.asset_name) &&
    has_value(asset?.asset_type) &&
    asset?.is_retired !== true &&
    has_valid_number(asset?.total_asset_cost_annual)
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

function get_finance_status_label(finance_status) {
  if (finance_status === "active") return "Active";
  if (finance_status === "paid_off") return "Paid off";
  if (finance_status === "term_ended") return "Term ended";
  return "Not financed";
}

export function buildAssetStatus({
  asset_state,
  calculations,
  saved_assets,
  active_asset_count,
}) {
  const warnings = [];
  const active_saved_assets = get_active_saved_assets(saved_assets);
  const active_saved_asset_total = active_saved_assets.reduce(
    (sum, asset) => sum + Number(asset.total_asset_cost_annual ?? 0),
    0,
  );
  const invalid_active_assets = active_saved_assets.filter(
    (asset) => !is_valid_active_asset_record(asset),
  );
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
  }

  if (active_saved_assets.length === 0 && asset_type === "support") {
    warnings.push("Support assets are included in cost only.");
  }

  if (active_saved_assets.length === 0 && asset_state.is_retired) {
    warnings.push("This asset is retired and excluded from active downstream use.");
  }

  if (no_active_assets_ready) {
    warnings.push("No active assets explicitly confirmed.");
  } else if (!has_positive_number(calculations.assets_benchmark_total)) {
    warnings.push("Awaiting P&L asset benchmark. This is diagnostic only.");
  } else {
    if (calculations.reconciliation_state === "amber") {
      warnings.push("Asset total is close to benchmark but not fully reconciled. This is diagnostic only.");
    }

    if (calculations.reconciliation_state === "red") {
      warnings.push("Asset total is materially out of balance with benchmark. This is diagnostic only.");
    }
  }

  if (invalid_active_assets.length > 0) {
    warnings.push("One or more active asset records are missing required setup fields.");
  }

  if (active_saved_assets.length === 0 && !no_active_assets_confirmed) {
    warnings.push("No active assets are saved yet.");
  }

  const assets_ready = active_assets_ready || no_active_assets_ready;

  return {
    is_ready: assets_ready,
    assets_ready,
    no_active_assets_confirmed,
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
          label: "Finance Status",
          value: get_finance_status_label(calculations.finance_status),
        },
        {
          label: "Finance Start Date",
          value: calculations.finance_start_date || "-",
        },
        {
          label: "Finance End Date",
          value: calculations.finance_end_date || "-",
        },
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
        finance_status: get_finance_status_label(calculations.finance_status),
        finance_start_date: calculations.finance_start_date || "-",
        finance_end_date: calculations.finance_end_date || "-",
      },
    },
    list: {
      asset_rows,
      on_load_asset: actions.load_asset,
      on_delete_asset: actions.delete_asset,
    },
  };
}
