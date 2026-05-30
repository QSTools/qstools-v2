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

function format_number(value, decimals = 2) {
  return Number(value || 0).toFixed(decimals);
}

function format_hours(value, decimals = 0) {
  return `${Number(value || 0).toLocaleString("en-NZ", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })} hrs`;
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

const ASSET_POOL_DEFINITIONS = [
  {
    key: "asset_fuel_pool",
    label: "Asset-related fuel pool",
  },
  {
    key: "asset_insurance_pool",
    label: "Asset-related insurance pool",
  },
  {
    key: "asset_repairs_maintenance_pool",
    label: "Asset-related repairs / maintenance pool",
  },
  {
    key: "asset_registration_compliance_pool",
    label: "Asset-related registration / compliance pool",
  },
  {
    key: "asset_consumables_pool",
    label: "Asset-related consumables pool",
  },
  {
    key: "asset_finance_interest_pool",
    label: "Asset finance / interest pool",
  },
];

function get_active_saved_assets(saved_assets = []) {
  return Array.isArray(saved_assets)
    ? saved_assets.filter((asset) => !asset.is_retired)
    : [];
}

function get_asset_pool_assignments(asset = {}) {
  const assignments = asset.asset_overhead_pool_assignments ?? {};

  return Object.fromEntries(
    ASSET_POOL_DEFINITIONS.map((pool) => [
      pool.key,
      Math.max(0, Number(assignments?.[pool.key] || 0)),
    ])
  );
}

function get_allocated_asset_overhead_cost(asset = {}) {
  return Object.values(get_asset_pool_assignments(asset)).reduce(
    (sum, value) => sum + Number(value || 0),
    0
  );
}

function build_asset_overhead_pool_summary({
  asset_state,
  saved_assets,
  asset_overhead_pools,
}) {
  const current_asset_id = asset_state?.asset_id ?? "";
  const current_assignments = get_asset_pool_assignments(asset_state);
  const active_saved_assets = get_active_saved_assets(saved_assets);

  return ASSET_POOL_DEFINITIONS.map((pool) => {
    const available_amount = Math.max(
      0,
      Number(asset_overhead_pools?.[pool.key]?.amount ?? 0)
    );

    const assigned_to_other_assets = active_saved_assets
      .filter((asset) => asset.asset_id !== current_asset_id)
      .reduce((sum, asset) => {
        const assignments = get_asset_pool_assignments(asset);
        return sum + Math.max(0, Number(assignments?.[pool.key] || 0));
      }, 0);

    const assigned_to_current_asset = Math.max(
      0,
      Number(current_assignments?.[pool.key] || 0)
    );

    const assigned_total =
      assigned_to_other_assets + assigned_to_current_asset;

    const raw_remaining_amount = available_amount - assigned_total;

    const remaining_amount = Math.max(0, raw_remaining_amount);

    const over_allocated_amount = Math.max(
      0,
      assigned_total - available_amount
    );

    const max_assignable_to_current_asset = Math.max(
      0,
      available_amount - assigned_to_other_assets
    );

    const allocation_status =
      over_allocated_amount > 0
        ? "over_allocated"
        : Math.abs(raw_remaining_amount) <= 1
          ? "balanced"
          : assigned_total < available_amount
            ? "under_allocated"
            : "review_required";

    const assignment_status =
      allocation_status === "over_allocated"
        ? "Over assigned"
        : assigned_total === 0
          ? "Unassigned"
          : allocation_status === "under_allocated"
            ? "Partially assigned"
            : "Fully assigned";

    return {
      pool_key: pool.key,
      label: pool.label,

      available_amount,
      assigned_to_current_asset,
      assigned_to_other_assets,
      assigned_total,
      remaining_amount,
      over_allocated_amount,
      max_assignable_to_current_asset,

      allocation_status,
      assignment_status,

      available_amount_label: format_currency(available_amount),
      assigned_to_current_asset_label: format_currency(
        assigned_to_current_asset
      ),
      assigned_to_other_assets_label: format_currency(
        assigned_to_other_assets
      ),
      assigned_total_label: format_currency(assigned_total),
      remaining_amount_label: format_currency(remaining_amount),
      over_allocated_amount_label: format_currency(over_allocated_amount),
      max_assignable_to_current_asset_label: format_currency(
        max_assignable_to_current_asset
      ),
    };
  });
}

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

function get_finance_status_label(finance_status) {
  if (finance_status === "active") return "Active";
  if (finance_status === "extended") return "Extended";
  if (finance_status === "paid_off") return "Paid off";
  if (finance_status === "term_ended") return "Term ended";
  return "Not financed";
}

function get_finance_lifecycle_note(calculations = {}) {
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
      (sum, asset) => sum + Number(asset.utilisation_hours_annual ?? 0),
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

export function buildAssetCard({
  asset_state,
  calculations,
  saved_assets,
  asset_overhead_pools,
  actions,
}) {
  const active_saved_assets = Array.isArray(saved_assets)
    ? saved_assets.filter((asset) => !asset.is_retired)
    : [];

  const productive_saved_assets = active_saved_assets.filter(
    (asset) => asset.asset_type === "productive"
  );

  const total_productive_asset_utilisation_hours_annual =
    productive_saved_assets.reduce(
      (sum, asset) => sum + Number(asset.utilisation_hours_annual ?? 0),
      0
    );

  const productive_asset_cost_annual = productive_saved_assets.reduce(
    (sum, asset) => sum + Number(asset.total_asset_cost_annual ?? 0),
    0
  );

  const productive_asset_assigned_overhead_cost_annual =
    productive_saved_assets.reduce(
      (sum, asset) => sum + get_allocated_asset_overhead_cost(asset),
      0
    );

  const productive_asset_recovery_cost_annual =
    productive_asset_cost_annual +
    productive_asset_assigned_overhead_cost_annual;

  const productive_asset_recovery_rate =
    total_productive_asset_utilisation_hours_annual > 0
      ? productive_asset_recovery_cost_annual /
        total_productive_asset_utilisation_hours_annual
      : 0;

  const current_asset_is_active = asset_state.is_retired !== true;

  const current_asset_cost_annual = current_asset_is_active
    ? Number(calculations.total_asset_cost_annual ?? 0)
    : 0;

  const allocated_asset_overhead_cost_annual =
    get_allocated_asset_overhead_cost(asset_state);

  const asset_recovery_cost_annual =
    current_asset_cost_annual + allocated_asset_overhead_cost_annual;

  const asset_overhead_pool_summary = build_asset_overhead_pool_summary({
    asset_state,
    saved_assets,
    asset_overhead_pools,
  });

  const current_asset_interest_annual = current_asset_is_active
    ? Number(
        calculations.asset_interest_annual ?? calculations.interest_annual ?? 0
      )
    : 0;

  const current_principal_annual = current_asset_is_active
    ? Number(
        calculations.asset_principal_repayment_annual ??
          calculations.principal_annual ??
          0
      )
    : 0;

  const current_finance_payment_annual = current_asset_is_active
    ? Number(calculations.asset_total_finance_payment_annual ?? 0)
    : 0;

  const current_asset_has_live_value =
    current_asset_cost_annual > 0 ||
    current_asset_interest_annual > 0 ||
    current_principal_annual > 0 ||
    current_finance_payment_annual > 0;

  const current_asset_status_label = asset_state.finance_paid_off
    ? "Paid off"
    : calculations.finance_status === "extended"
      ? "Term extended"
      : current_asset_has_live_value
        ? "Included"
        : "No live cost yet";

  const asset_rows = [...saved_assets]
    .sort((left, right) => {
      const left_time = new Date(
        left.updated_at || left.created_at || 0
      ).getTime();
      const right_time = new Date(
        right.updated_at || right.created_at || 0
      ).getTime();
      return right_time - left_time;
    })
    .map((asset) => ({
      asset_id: asset.asset_id,
      asset_name: asset.asset_name || "Unnamed asset",
      asset_type: asset.asset_type === "support" ? "Support" : "Productive",
      effective_from: asset.effective_from || "—",
      lifecycle: asset.is_retired ? "Retired" : "Active",
      total_asset_cost_annual: format_currency(
        asset.total_asset_cost_annual || 0
      ),
      allocated_asset_overhead_cost_annual: format_currency(
        get_allocated_asset_overhead_cost(asset)
      ),
      asset_recovery_cost_annual: format_currency(
        Number(asset.total_asset_cost_annual || 0) +
          get_allocated_asset_overhead_cost(asset)
      ),
      utilisation_hours_per_week:
        asset.asset_type === "productive"
          ? format_hours(asset.utilisation_hours_per_week, 2)
          : "-",
      utilisation_hours_annual:
        asset.asset_type === "productive"
          ? format_hours(asset.utilisation_hours_annual, 0)
          : "-",
      required_asset_recovery_rate:
        asset.asset_type === "productive"
          ? `${format_currency(asset.required_asset_recovery_rate || 0)} / hr`
          : "-",
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
      portfolio_summary: {
        rows: [
          {
            label: "Active saved assets",
            value: `${active_saved_assets.length}`,
          },
          {
            label: "Current asset status",
            value: current_asset_status_label,
          },
          {
            label: "Productive assets",
            value: `${productive_saved_assets.length}`,
          },
          {
            label: "Productive annual utilisation",
            value: format_hours(
              total_productive_asset_utilisation_hours_annual,
              0
            ),
          },
          {
            label: "Productive asset annual cost",
            value: format_currency(productive_asset_cost_annual),
          },
          {
            label: "Productive assigned overhead",
            value: format_currency(
              productive_asset_assigned_overhead_cost_annual
            ),
          },
          {
            label: "Productive asset recovery rate",
            value: `${format_currency(productive_asset_recovery_rate)} / hr`,
          },
          {
            label: "Annual operating asset cost",
            value: format_currency(current_asset_cost_annual),
            emphasis: true,
          },
          {
            label: "Allocated asset overhead pools",
            value: format_currency(allocated_asset_overhead_cost_annual),
          },
          {
            label: "Asset recovery cost annual",
            value: format_currency(asset_recovery_cost_annual),
            emphasis: true,
          },
          {
            label: "Annual finance interest",
            value: format_currency(current_asset_interest_annual),
          },
          {
            label: "Annual principal repayment",
            value: format_currency(current_principal_annual),
          },
          {
            label: "Annual finance payment",
            value: format_currency(current_finance_payment_annual),
            emphasis: true,
          },
        ],
        note:
          "Interest is included in ownership asset cost. Principal is shown for cash-flow visibility only. Assigned asset overhead pools are running/review costs from General Overheads and are transferred into asset recovery without changing the source P&L total.",
      },

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
          label: "Original Finance End Date",
          value: calculations.original_finance_end_date || "-",
        },
        {
          label: "Finance End Date",
          value: calculations.finance_end_date || "-",
        },
        {
          label: "Extension Months",
          value: format_number(asset_state.revised_term_months, 0),
        },
        {
          label: "Effective Finance Term",
          value: `${format_number(
            calculations.effective_finance_term_years,
            2
          )} yrs`,
        },
        {
          label: "Finance Lifecycle Note",
          value: get_finance_lifecycle_note(calculations),
        },
        {
          label: "Paid Off Date",
          value: calculations.finance_paid_off_date || "-",
        },
        {
          label: "Principal Annual (Cash Flow Later)",
          value: format_currency(calculations.principal_annual),
        },
        {
          label: "Asset Interest Annual",
          value: format_currency(calculations.asset_interest_annual),
        },
        {
          label: "Estimated Remaining Finance Balance",
          value: format_currency(
            calculations.estimated_remaining_finance_balance
          ),
        },
        {
          label: "Finance Progress",
          value: format_percent(calculations.finance_progress_percent),
        },
        {
          label: "Base Asset Cost Annual",
          value: format_currency(calculations.finance_cost_annual),
          emphasis: true,
        },
        {
          label: "Allocated Asset Overhead Pools",
          value: format_currency(allocated_asset_overhead_cost_annual),
        },
        {
          label: "Asset Recovery Cost Annual",
          value: format_currency(asset_recovery_cost_annual),
          emphasis: true,
        },
        {
          label: "Utilisation Hours / Week",
          value:
            asset_state.asset_type === "productive"
              ? format_hours(calculations.utilisation_hours_per_week, 2)
              : "-",
        },
        {
          label: "Annual Utilisation Hours",
          value:
            asset_state.asset_type === "productive"
              ? format_hours(calculations.utilisation_hours_annual, 0)
              : "-",
        },
        {
          label: "Required Asset Recovery Rate",
          value:
            asset_state.asset_type === "productive"
              ? `${format_currency(
                  calculations.required_asset_recovery_rate
                )} / hr`
              : "-",
          emphasis: true,
        },
      ],

      asset_overhead_pool_summary,
      on_change_asset_overhead_pool_assignment:
        actions.change_asset_overhead_pool_assignment,

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
        original_finance_end_date: calculations.original_finance_end_date || "-",
        finance_end_date: calculations.finance_end_date || "-",
        finance_lifecycle_note: get_finance_lifecycle_note(calculations),
        utilisation_hours_per_week: calculations.utilisation_hours_per_week,
        utilisation_hours_annual: calculations.utilisation_hours_annual,
        required_asset_recovery_rate:
          calculations.required_asset_recovery_rate,
      },
    },

    list: {
      asset_rows,
      on_load_asset: actions.load_asset,
      on_delete_asset: actions.delete_asset,
    },
  };
}