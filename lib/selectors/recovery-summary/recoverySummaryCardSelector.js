import { build_recovery_summary_warning_system } from "@/lib/recovery/recoveryRiskWarningSystem";
import {
  get_insight,
  get_resolved_recovery_shares,
  is_asset_recovery_clean,
  is_business_summary_trusted,
  is_labour_recovery_clean,
  is_material_recovery_clean,
  normalise_recovery_model,
} from "@/lib/selectors/recovery-summary/recoverySummarySelectorHelpers";

export function buildRecoverySummaryCard({
  calculated = {},
  recovery_state = {},
  update_recovery_field = () => {},
  reset_recovery_state = () => {},
} = {}) {
  const recovery_model = normalise_recovery_model(
    recovery_state.recovery_model ??
      calculated.recovery_model ??
      calculated.suggested_recovery_model
  );

  const use_saved_split =
    recovery_state.split_manually_overridden === true ||
    recovery_model !== "hybrid";

  const resolved_shares = get_resolved_recovery_shares({
    calculated,
    recovery_state,
    use_saved_split,
  });

  const resolved_overhead_absorbed_percent =
    resolved_shares.overhead_absorbed_percent;

  const recovery_warning_system = build_recovery_summary_warning_system({
    business_summary_trusted: is_business_summary_trusted(calculated),

    margin_pool: calculated.margin_pool ?? calculated.gross_profit ?? 0,

    total_cost_burden: calculated.total_cost_burden ?? 0,

    current_recovery_rate:
      calculated.current_margin_per_driver ??
      calculated.actual_recovery_rate ??
      0,

    required_recovery_rate:
      calculated.required_recovery_per_driver ??
      calculated.required_recovery_rate ??
      0,

    labour_recovery_clean: is_labour_recovery_clean(calculated),
    asset_recovery_clean: is_asset_recovery_clean(calculated),
    material_recovery_clean: is_material_recovery_clean(calculated),

    context: {
      business_type: calculated.business_type ?? "labour_based",
      recovery_mode: calculated.recovery_mode ?? "hours_based",
      active_recovery_model: calculated.active_recovery_model,
      model_trust_state: calculated.model_trust_state,
      warnings: calculated.warnings ?? [],
    },
  });

  return {
    active_recovery_model: normalise_recovery_model(
      calculated.active_recovery_model
    ),
    recovery_model,

    business_type: calculated.business_type ?? "labour_based",
    recovery_mode: calculated.recovery_mode ?? "hours_based",
    is_product_based: calculated.is_product_based === true,
    is_labour_based: calculated.is_labour_based !== false,
    activity_driver_type: calculated.activity_driver_type ?? "hours",
    activity_driver_label:
      calculated.activity_driver_label ?? "Selected recovery hours",
    activity_driver_value: calculated.activity_driver_value ?? 0,

    required_recovery_per_driver:
      calculated.required_recovery_per_driver ?? 0,
    current_margin_per_driver: calculated.current_margin_per_driver ?? 0,
    recovery_gap_per_driver: calculated.recovery_gap_per_driver ?? 0,
    recovery_plan_target_per_driver:
      calculated.recovery_plan_target_per_driver ?? 0,

    total_revenue: calculated.total_revenue ?? 0,
    total_direct_costs: calculated.total_direct_costs ?? 0,
    margin_pool: calculated.margin_pool ?? 0,
    gross_profit: calculated.gross_profit ?? calculated.margin_pool ?? 0,
    gross_margin_percent: calculated.gross_margin_percent ?? 0,

    total_cost_burden: calculated.total_cost_burden ?? 0,
    total_people_cost_annual: calculated.total_people_cost_annual ?? 0,
    total_asset_cost_annual: calculated.total_asset_cost_annual ?? 0,
    total_business_overheads: calculated.total_business_overheads ?? 0,
    cost_burden_breakdown: calculated.cost_burden_breakdown ?? {
      people: {},
      assets: {},
      business_overheads: {},
    },

    has_productive_asset_recovery_base:
      calculated.has_productive_asset_recovery_base === true,
    productive_asset_count: calculated.productive_asset_count ?? 0,
    support_asset_count: calculated.support_asset_count ?? 0,
    productive_asset_cost: calculated.productive_asset_cost ?? 0,
    productive_asset_cost_annual:
      calculated.productive_asset_cost_annual ??
      calculated.productive_asset_cost ??
      0,
    support_asset_cost: calculated.support_asset_cost ?? 0,
    asset_utilisation_hours_annual:
      calculated.asset_utilisation_hours_annual ?? 0,
    required_asset_recovery_rate:
      calculated.required_asset_recovery_rate ?? 0,
    asset_recovery_status: calculated.asset_recovery_status ?? "not_selected",

    required_revenue: calculated.required_revenue ?? 0,
    required_recovery_rate:
      calculated.required_recovery_rate ??
      calculated.required_recovery_per_driver ??
      0,

    total_recovery_hours: calculated.total_recovery_hours ?? 0,
    recovery_hours_used: calculated.recovery_hours_used ?? 0,
    actual_recovery_rate: calculated.actual_recovery_rate ?? 0,
    profit_or_deficit_per_recovery_hour:
      calculated.profit_or_deficit_per_recovery_hour ?? 0,

    total_productive_output: calculated.total_productive_output ?? 0,
    units_sold_annual: calculated.units_sold_annual ?? 0,
    margin_per_unit: calculated.margin_per_unit ?? 0,
    required_units_to_break_even:
      calculated.required_units_to_break_even ?? 0,
    unit_surplus_or_shortfall:
      calculated.unit_surplus_or_shortfall ?? 0,
    total_units: calculated.total_units ?? calculated.units_sold_annual ?? 0,
    required_cost_per_unit: calculated.required_cost_per_unit ?? 0,
    unit_surplus_or_gap: calculated.unit_surplus_or_gap ?? 0,
    total_annual_surplus_or_gap:
      calculated.total_annual_surplus_or_gap ?? 0,
    required_units_if_margin_fixed:
      calculated.required_units_if_margin_fixed ??
      calculated.required_units_to_break_even ??
      0,
    required_margin_if_units_fixed:
      calculated.required_margin_if_units_fixed ?? 0,
    product_unit_recovery_status:
      calculated.product_unit_recovery_status ??
      calculated.product_recovery_status ??
      "not_recoverable",
    commercial_driver_mode: calculated.commercial_driver_mode ?? "",
    unit_driver_rows: calculated.unit_driver_rows ?? [],
    product_unit_label: calculated.product_unit_label ?? "Unit",
    product_unit_type: calculated.product_unit_type ?? "each",
    product_unit_type_label: calculated.product_unit_type_label ?? "unit",
    product_unit_margin_label:
      calculated.product_unit_margin_label ?? "Margin per unit",
    product_required_cost_label:
      calculated.product_required_cost_label ?? "Required cost per unit",
    product_surplus_gap_label:
      calculated.product_surplus_gap_label ?? "Surplus / gap per unit",
    product_total_units_label:
      calculated.product_total_units_label ?? "Total units",
    product_unit_suffix: calculated.product_unit_suffix ?? "units",
    product_rate_suffix: calculated.product_rate_suffix ?? "/unit",
    product_recovery_ready: calculated.product_recovery_ready === true,
    product_recovery_status:
      calculated.product_recovery_status ?? "not_recoverable",
    net_position: calculated.net_position ?? 0,

    labour_share_percent: resolved_shares.labour_share_percent,
    asset_share_percent: resolved_shares.asset_share_percent,
    material_share_percent: resolved_shares.material_share_percent,

    overhead_absorbed_percent: resolved_overhead_absorbed_percent,
    overhead_share_percent: resolved_overhead_absorbed_percent,

    suggested_recovery_model: calculated.suggested_recovery_model,
    suggested_labour_share_percent:
      calculated.suggested_labour_share_percent ??
      resolved_shares.labour_share_percent,
    suggested_asset_share_percent:
      calculated.suggested_asset_share_percent ??
      resolved_shares.asset_share_percent,
    suggested_material_share_percent:
      calculated.suggested_material_share_percent ??
      resolved_shares.material_share_percent,
    suggested_overhead_absorbed_percent:
      calculated.suggested_overhead_absorbed_percent ??
      resolved_overhead_absorbed_percent,
    split_source: calculated.split_source,

    recovery_plan_split: calculated.recovery_plan_split,
    component_required_recovery: calculated.component_required_recovery,

    labour_recovery_cost: calculated.labour_recovery_cost ?? 0,
    labour_recovery_hours: calculated.labour_recovery_hours ?? 0,
    labour_recovery_status: calculated.labour_recovery_status ?? "not_selected",
    labour_recovery_gap: calculated.labour_recovery_gap ?? 0,
    asset_recovery_cost: calculated.asset_recovery_cost ?? 0,
    material_recovery_cost: calculated.material_recovery_cost ?? 0,
    material_margin_pool: calculated.material_margin_pool ?? 0,
    material_margin_percent: calculated.material_margin_percent ?? 0,
    overhead_absorbed_cost: calculated.overhead_absorbed_cost ?? 0,

    required_labour_recovery_rate:
      calculated.required_labour_recovery_rate ?? 0,

    required_labour_recovery_rate_per_recovery_hour:
      calculated.required_labour_recovery_rate_per_recovery_hour ?? 0,

    required_asset_recovery_per_recovery_hour:
      calculated.required_asset_recovery_per_recovery_hour ?? 0,

    required_material_recovery_per_recovery_hour:
      calculated.required_material_recovery_per_recovery_hour ?? 0,

    overhead_absorbed_cost_per_recovery_hour:
      calculated.overhead_absorbed_cost_per_recovery_hour ?? 0,

    required_asset_recovery: calculated.required_asset_recovery ?? 0,
    required_material_recovery: calculated.required_material_recovery ?? 0,

    explained_recovery_total: calculated.explained_recovery_total ?? 100,
    share_total: calculated.share_total ?? 100,

    gross_profit_source_status:
      calculated.gross_profit_source_status ?? "pending_live_feedback",
    material_margin_status: calculated.material_margin_status ?? "not_selected",
    asset_utilisation_status:
      calculated.asset_utilisation_status ?? "not_selected",
    material_recovery_included: Boolean(calculated.material_recovery_included),
    asset_recovery_included: Boolean(calculated.asset_recovery_included),

    overhead_absorption_level:
      calculated.overhead_absorption_level ?? "none",
    overhead_absorption_title:
      calculated.overhead_absorption_title ?? "Recovery model is fully assigned",
    overhead_absorption_message: calculated.overhead_absorption_message ?? "",
    overhead_absorption_diagnostics:
      calculated.overhead_absorption_diagnostics ?? [],

    share_not_balanced: Boolean(calculated.share_not_balanced),
    no_productive_output: Boolean(calculated.no_productive_output),
    no_recovery_hours: Boolean(calculated.no_recovery_hours),

    asset_recovery_without_assets: Boolean(
      calculated.asset_share_without_asset_recovery_base
    ),

    labour_recovery_without_labour: Boolean(
      calculated.labour_share_without_productive_output
    ),

    insight_text: get_insight(calculated),

    recovery_warning_rows:
      recovery_warning_system.recovery_warning_rows ?? [],

    primary_recovery_warning:
      recovery_warning_system.primary_recovery_warning ?? null,

    cascade_recovery_warnings:
      recovery_warning_system.cascade_recovery_warnings ?? [],

    recovery_failure_path:
      recovery_warning_system.recovery_failure_path ?? [],

    has_primary_recovery_warning:
      recovery_warning_system.has_primary_recovery_warning === true,

    has_blocking_recovery_warning:
      recovery_warning_system.has_blocking_recovery_warning === true,

    has_review_recovery_warning:
      recovery_warning_system.has_review_recovery_warning === true,

    blocking_recovery_warning_count:
      recovery_warning_system.blocking_recovery_warning_count ?? 0,

    review_recovery_warning_count:
      recovery_warning_system.review_recovery_warning_count ?? 0,

    info_recovery_warning_count:
      recovery_warning_system.info_recovery_warning_count ?? 0,

    recovery_warning_count:
      recovery_warning_system.recovery_warning_count ?? 0,

    on_recovery_model_change: (value) => {
      const next_recovery_model = normalise_recovery_model(value);

      update_recovery_field("recovery_model", next_recovery_model, {
        manual_override: false,
      });

      if (next_recovery_model === "labour_led") {
        update_recovery_field("labour_share_percent", 100, {
          manual_override: false,
        });
        update_recovery_field("asset_share_percent", 0, {
          manual_override: false,
        });
        update_recovery_field("material_share_percent", 0, {
          manual_override: false,
        });
        return;
      }

      if (next_recovery_model === "asset_led") {
        update_recovery_field("labour_share_percent", 0, {
          manual_override: false,
        });
        update_recovery_field("asset_share_percent", 100, {
          manual_override: false,
        });
        update_recovery_field("material_share_percent", 0, {
          manual_override: false,
        });
        return;
      }

      if (next_recovery_model === "material_led") {
        update_recovery_field("labour_share_percent", 0, {
          manual_override: false,
        });
        update_recovery_field("asset_share_percent", 0, {
          manual_override: false,
        });
        update_recovery_field("material_share_percent", 100, {
          manual_override: false,
        });
        return;
      }

      if (next_recovery_model === "hybrid") {
        update_recovery_field(
          "labour_share_percent",
          calculated.suggested_labour_share_percent ??
            resolved_shares.labour_share_percent ??
            50,
          { manual_override: false }
        );
        update_recovery_field(
          "asset_share_percent",
          calculated.suggested_asset_share_percent ??
            resolved_shares.asset_share_percent ??
            25,
          { manual_override: false }
        );
        update_recovery_field(
          "material_share_percent",
          calculated.suggested_material_share_percent ??
            resolved_shares.material_share_percent ??
            25,
          { manual_override: false }
        );
      }
    },

    on_labour_share_change: (value) =>
      update_recovery_field("labour_share_percent", value),

    on_asset_share_change: (value) =>
      update_recovery_field("asset_share_percent", value),

    on_material_share_change: (value) =>
      update_recovery_field("material_share_percent", value),

    on_reset: () => {
      update_recovery_field(
        "recovery_model",
        calculated.suggested_recovery_model ?? "labour_led",
        { manual_override: false }
      );
      update_recovery_field(
        "labour_share_percent",
        calculated.suggested_labour_share_percent ??
          resolved_shares.labour_share_percent ??
          100,
        { manual_override: false }
      );
      update_recovery_field(
        "asset_share_percent",
        calculated.suggested_asset_share_percent ??
          resolved_shares.asset_share_percent ??
          0,
        { manual_override: false }
      );
      update_recovery_field(
        "material_share_percent",
        calculated.suggested_material_share_percent ??
          resolved_shares.material_share_percent ??
          0,
        { manual_override: false }
      );
    },
  };
}
