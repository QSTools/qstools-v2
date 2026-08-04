import {
  format_currency,
  format_hours,
  format_number,
  format_percent,
} from "./assetSelectorFormatters";
import { get_live_asset_utilisation_hours_annual } from "./assetSelectorUtilisation";
import {
  build_asset_overhead_pool_summary,
  get_allocated_asset_overhead_cost,
} from "./assetOverheadPoolSelectors";
import {
  get_finance_lifecycle_note,
  get_finance_status_label,
} from "./assetStatusSelectors";

export function buildAssetCard({
  asset_state,
  calculations,
  saved_assets,
  asset_overhead_pools,
  actions,
  business_default_annual_weeks,
}) {
  const active_saved_assets = Array.isArray(saved_assets)
    ? saved_assets.filter((asset) => !asset.is_retired)
    : [];

  const productive_saved_assets = active_saved_assets.filter(
    (asset) => asset.asset_type === "productive"
  );

  const current_asset_type =
    asset_state.asset_type === "support" ? "support" : "productive";

  const current_asset_is_active = asset_state.is_retired !== true;

  const current_asset_cost_annual = current_asset_is_active
    ? Number(calculations.total_asset_cost_annual ?? 0)
    : 0;

  const allocated_asset_overhead_cost_annual =
    get_allocated_asset_overhead_cost(asset_state);

  const asset_recovery_cost_annual =
    current_asset_cost_annual + allocated_asset_overhead_cost_annual;

  // Swap the current draft's live numbers in for its stale saved record (if
  // any) so the portfolio totals update in real time as the form is edited,
  // not only after Save is clicked.
  const other_saved_productive_assets = productive_saved_assets.filter(
    (asset) => asset.asset_id !== asset_state.asset_id
  );

  const current_asset_live_preview =
    current_asset_is_active && current_asset_type === "productive"
      ? {
          asset_id: asset_state.asset_id,
          is_live_preview: true,
          utilisation_hours_annual: Number(
            calculations.utilisation_hours_annual ?? 0
          ),
          total_asset_cost_annual: current_asset_cost_annual,
          allocated_overhead_for_preview: allocated_asset_overhead_cost_annual,
        }
      : null;

  const effective_productive_assets = current_asset_live_preview
    ? [...other_saved_productive_assets, current_asset_live_preview]
    : other_saved_productive_assets;

  function get_effective_utilisation_hours_annual(asset) {
    if (asset.is_live_preview) {
      return Number(asset.utilisation_hours_annual || 0);
    }

    return get_live_asset_utilisation_hours_annual(
      asset,
      business_default_annual_weeks
    );
  }

  function get_effective_allocated_overhead(asset) {
    if (asset.is_live_preview) {
      return Number(asset.allocated_overhead_for_preview || 0);
    }

    return get_allocated_asset_overhead_cost(asset);
  }

  const total_productive_asset_utilisation_hours_annual =
    effective_productive_assets.reduce(
      (sum, asset) => sum + get_effective_utilisation_hours_annual(asset),
      0
    );

  const productive_asset_cost_annual = effective_productive_assets.reduce(
    (sum, asset) => sum + Number(asset.total_asset_cost_annual ?? 0),
    0
  );

  const productive_asset_assigned_overhead_cost_annual =
    effective_productive_assets.reduce(
      (sum, asset) => sum + get_effective_allocated_overhead(asset),
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
    .map((asset) => {
      const live_utilisation_hours_annual =
        get_live_asset_utilisation_hours_annual(
          asset,
          business_default_annual_weeks
        );
      const live_asset_recovery_cost_annual =
        Number(asset.total_asset_cost_annual || 0) +
        get_allocated_asset_overhead_cost(asset);
      const live_required_asset_recovery_rate =
        asset.asset_type === "productive" && live_utilisation_hours_annual > 0
          ? live_asset_recovery_cost_annual / live_utilisation_hours_annual
          : 0;

      return {
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
          live_asset_recovery_cost_annual
        ),
        utilisation_hours_per_week:
          asset.asset_type === "productive"
            ? format_hours(asset.utilisation_hours_per_week, 2)
            : "-",
        utilisation_hours_annual:
          asset.asset_type === "productive"
            ? format_hours(live_utilisation_hours_annual, 0)
            : "-",
        required_asset_recovery_rate:
          asset.asset_type === "productive"
            ? `${format_currency(live_required_asset_recovery_rate)} / hr`
            : "-",
        is_current: asset.asset_id === asset_state.asset_id,
      };
    });

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