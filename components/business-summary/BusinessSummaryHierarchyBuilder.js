import {
  formatCurrency,
  formatNumber,
  getTimeScaleName,
  getTimeScaleSuffix,
} from "@/components/business-summary/BusinessSummaryCardUtils";
import { buildBusinessSummaryHierarchyChildren } from "@/components/business-summary/hierarchy/businessSummaryHierarchyChildren";
import {
  PRODUCT_TIME_SCALES,
  createDisplayScalers,
  scaleProductAnnualValue,
} from "@/components/business-summary/hierarchy/businessSummaryHierarchyScaleUtils";
import { buildBusinessSummaryHierarchyTrees } from "@/components/business-summary/hierarchy/businessSummaryHierarchyTrees";

export { PRODUCT_TIME_SCALES };

export function buildBusinessSummaryHierarchyState({
  total_revenue = 0,
  total_direct_costs = 0,
  direct_cost_category_totals = [],
  margin_pool = 0,
  total_cost_burden = 0,
  total_people_cost_annual = 0,
  total_asset_cost_annual = 0,
  total_business_overheads = 0,
  margin_after_labour = 0,
  non_people_cost_burden = 0,
  people_cost_per_recovery_hour = 0,
  asset_cost_per_recovery_hour = 0,
  business_overheads_per_recovery_hour = 0,
  margin_after_labour_per_recovery_hour = 0,
  non_people_cost_burden_per_recovery_hour = 0,
  recovery_hours_used = 0,
  net_annual_business_open_hours = 0,
  units_sold_annual = 0,
  business_type = "labour_based",
  is_product_based = false,
  is_labour_based = true,
  activity_driver_type = "hours",
  revenue_per_unit = 0,
  direct_cost_per_unit = 0,
  margin_per_unit = 0,
  required_units_to_break_even = 0,
  unit_surplus_or_shortfall = 0,
  required_recovery_rate = 0,
  actual_recovery_rate = 0,
  profit_or_deficit_per_recovery_hour = 0,
  net_position = 0,
  cost_burden_breakdown = {
    people: {},
    assets: {},
    business_overheads: {},
  },
  timeScale = "hour",
} = {}) {
  const business_type_label =
    business_type === "product_based"
      ? "Product / Unit-based business"
      : "Service / Labour-based business";
  const product_mode_active =
    is_product_based === true ||
    is_labour_based === false ||
    business_type === "product_based" ||
    activity_driver_type === "units";
  const active_time_scale =
    product_mode_active && timeScale === "hour" ? "day" : timeScale;

  const open_hours_used = Number(net_annual_business_open_hours) || 0;
  const { scaleDisplayAnnualValue, scaleDisplayPeriodValue } =
    createDisplayScalers({
      active_time_scale,
      open_hours_used,
      product_mode_active,
    });

  const scaled_required_recovery = scaleDisplayAnnualValue(
    total_cost_burden,
    required_recovery_rate
  );
  const scaled_actual_recovery = scaleDisplayAnnualValue(
    margin_pool,
    actual_recovery_rate
  );
  const scaled_recovery_result = scaleDisplayAnnualValue(
    net_position,
    profit_or_deficit_per_recovery_hour
  );
  const recovery_result_abs = Math.abs(scaled_recovery_result);
  const scale_label = getTimeScaleName(active_time_scale);
  const result_scale_label =
    active_time_scale === "hour" ? "Open Hour" : scale_label;
  const scale_suffix = product_mode_active
    ? `/${active_time_scale}`
    : getTimeScaleSuffix(active_time_scale);
  const product_unit_suffix = `units/${active_time_scale}`;
  const product_period_phrase = `per ${active_time_scale}`;
  const scaled_units_sold = scaleProductAnnualValue(
    units_sold_annual,
    active_time_scale
  );
  const scaled_required_units_to_break_even = scaleProductAnnualValue(
    required_units_to_break_even,
    active_time_scale
  );
  const scaled_unit_surplus_or_shortfall = scaleProductAnnualValue(
    unit_surplus_or_shortfall,
    active_time_scale
  );

  const recovery_result_label =
    scaled_recovery_result >= 0
      ? `Surplus per ${result_scale_label}`
      : `Deficit per ${result_scale_label}`;
  const recovery_headline =
    scaled_recovery_result >= 0
      ? `You are earning ${formatCurrency(
          recovery_result_abs
        )}${scale_suffix} after covering your real business costs.`
      : `You are short ${formatCurrency(
          recovery_result_abs
        )}${scale_suffix} against your required recovery rate.`;
  const product_position_title =
    margin_per_unit <= 0
      ? "Product Margin Not Recoverable"
      : unit_surplus_or_shortfall < 0
        ? "Unit Volume Shortfall"
        : "Unit Volume Surplus";
  const product_hero_value =
    margin_per_unit <= 0
      ? formatCurrency(margin_per_unit)
      : formatNumber(Math.abs(scaled_unit_surplus_or_shortfall));
  const product_hero_suffix =
    margin_per_unit <= 0 ? "/unit" : ` ${product_unit_suffix}`;
  const product_helper_text =
    margin_per_unit <= 0
      ? "Product margin is not positive, so unit volume cannot recover the business cost burden."
      : unit_surplus_or_shortfall < 0
        ? `You need ${formatNumber(
            scaled_required_units_to_break_even
          )} units sold ${product_period_phrase} to recover the business cost burden. Current volume is ${formatNumber(
            scaled_units_sold
          )} units ${product_period_phrase}.`
        : `Current unit volume is above the break-even unit requirement ${product_period_phrase}.`;

  const scaled_revenue = scaleDisplayPeriodValue(total_revenue);
  const scaled_direct_costs = scaleDisplayPeriodValue(total_direct_costs);
  const scaled_margin_pool = scaleDisplayPeriodValue(margin_pool);
  const scaled_people_cost =
    active_time_scale === "hour"
      ? people_cost_per_recovery_hour
      : scaleDisplayPeriodValue(total_people_cost_annual);
  const scaled_margin_after_labour =
    active_time_scale === "hour"
      ? margin_after_labour_per_recovery_hour
      : scaleDisplayPeriodValue(margin_after_labour);
  const scaled_asset_cost =
    active_time_scale === "hour"
      ? asset_cost_per_recovery_hour
      : scaleDisplayPeriodValue(total_asset_cost_annual);
  const scaled_general_overheads =
    active_time_scale === "hour"
      ? business_overheads_per_recovery_hour
      : scaleDisplayPeriodValue(total_business_overheads);
  const scaled_non_people_cost_burden =
    active_time_scale === "hour"
      ? non_people_cost_burden_per_recovery_hour
      : scaleDisplayPeriodValue(non_people_cost_burden);
  const scaled_net_position = scaleDisplayPeriodValue(net_position);
  const product_secondary_result =
    margin_per_unit <= 0
      ? `Final surplus / deficit: ${formatCurrency(
          scaled_net_position
        )}${scale_suffix}`
      : scaled_net_position < 0
        ? `Final deficit: ${formatCurrency(scaled_net_position)}${scale_suffix}`
        : `Final surplus: ${formatCurrency(scaled_net_position)}${scale_suffix}`;

  const surplus_or_deficit_label =
    scaled_net_position >= 0 ? "Surplus" : "Deficit";
  const surplus_or_deficit_amount = Math.abs(scaled_net_position);
  const revenue_reference_total = Math.abs(scaled_revenue);
  const people_breakdown = cost_burden_breakdown.people ?? {};
  const assets_breakdown = cost_burden_breakdown.assets ?? {};
  const overheads_breakdown = cost_burden_breakdown.business_overheads ?? {};
  const active_staff = Array.isArray(people_breakdown.active_staff)
    ? people_breakdown.active_staff
    : [];
  const active_assets = Array.isArray(assets_breakdown.active_assets)
    ? assets_breakdown.active_assets
    : [];
  const overhead_category_totals = Array.isArray(
    overheads_breakdown.category_totals
  )
    ? overheads_breakdown.category_totals
    : [];

  const {
    direct_cost_children,
    people_cost_children,
    pending_contribution_children,
    product_margin_pool_children,
    remaining_cost_children,
  } = buildBusinessSummaryHierarchyChildren({
    active_assets,
    active_staff,
    direct_cost_category_totals,
    direct_cost_per_unit,
    margin_per_unit,
    overhead_category_totals,
    product_unit_suffix,
    revenue_per_unit,
    scaleDisplayPeriodValue,
    scale_suffix,
    scaled_asset_cost,
    scaled_direct_costs,
    scaled_general_overheads,
    scaled_margin_pool,
    scaled_non_people_cost_burden,
    scaled_people_cost,
    scaled_revenue,
    scaled_units_sold,
  });

  const { labour_business_hierarchy, product_business_hierarchy } =
    buildBusinessSummaryHierarchyTrees({
      direct_cost_children,
      margin_after_labour_note: {
        labour:
          "Gross Profit / Margin Pool after People Cost. This shows whether the business is already positive or negative before assets and business overheads.",
        product:
          "Trading Margin Pool after People Cost. This shows whether the business is positive or negative before assets and overheads.",
      },
      people_cost_children,
      pending_contribution_children,
      product_margin_pool_children,
      remaining_cost_children,
      revenue_reference_total,
      scale_suffix,
      scaled_direct_costs,
      scaled_general_overheads,
      scaled_margin_after_labour,
      scaled_margin_pool,
      scaled_net_position,
      scaled_non_people_cost_burden,
      scaled_people_cost,
      scaled_revenue,
      surplus_or_deficit_amount,
      surplus_or_deficit_label,
    });

  return {
    active_time_scale,
    business_hierarchy: product_mode_active
      ? product_business_hierarchy
      : labour_business_hierarchy,
    business_type_label,
    product_mode_active,
    hero: {
      product_position_title,
      product_hero_value,
      product_hero_suffix,
      product_helper_text,
      product_secondary_result,
      recovery_result_abs,
      recovery_result_label,
      recovery_headline,
    },
    result_table: {
      margin_per_unit,
      product_unit_suffix,
      recovery_hours_used,
      scale_label,
      scale_suffix,
      scaled_actual_recovery,
      scaled_net_position,
      scaled_recovery_result,
      scaled_required_recovery,
      scaled_required_units_to_break_even,
      scaled_unit_surplus_or_shortfall,
      scaled_units_sold,
    },
  };
}
