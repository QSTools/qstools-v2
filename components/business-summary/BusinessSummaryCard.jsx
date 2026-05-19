"use client";

import { useState } from "react";

import BusinessSummaryGraphSection from "@/components/business-summary/BusinessSummaryGraphSection";
import { buildBusinessSummaryHierarchyState } from "@/components/business-summary/BusinessSummaryHierarchyBuilder";
import BusinessSummaryModePanel from "@/components/business-summary/BusinessSummaryModePanel";
import BusinessSummaryResultHero from "@/components/business-summary/BusinessSummaryResultHero";
import {
  findNodeByPath,
  getBreadcrumbNodes,
  getNodeChildren,
  hasAvailableChildren,
} from "@/components/business-summary/BusinessSummaryCardUtils";

export default function BusinessSummaryCard({
  total_revenue = 0,
  total_direct_costs = 0,
  direct_cost_category_totals = [],
  margin_pool = 0,
  gross_margin_percent = 0,
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
  total_recovery_hours = 0,
  recovery_hours_used = 0,
  total_productive_output = 0,
  units_sold_annual = 0,
  business_type = "labour_based",
  is_product_based = false,
  is_labour_based = true,
  activity_driver_type = "hours",
  activity_driver_display_label = "Productive hours",
  activity_driver_value = 0,
  activity_driver_suffix = "hrs",
  required_recovery_per_driver = 0,
  required_recovery_label = "Required recovery per hour",
  required_recovery_unit_label = "$/hour",
  current_margin_per_driver = 0,
  current_margin_label = "Current margin per hour",
  recovery_gap_per_driver = 0,
  recovery_gap_label = "Hourly gap",
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
}) {
  const [timeScale, setTimeScale] = useState("hour");
  const [hoveredItemKey, setHoveredItemKey] = useState("");
  const [activePath, setActivePath] = useState(["business-result"]);

  const hierarchyState = buildBusinessSummaryHierarchyState({
    total_revenue,
    total_direct_costs,
    direct_cost_category_totals,
    margin_pool,
    gross_margin_percent,
    total_cost_burden,
    total_people_cost_annual,
    total_asset_cost_annual,
    total_business_overheads,
    margin_after_labour,
    non_people_cost_burden,
    people_cost_per_recovery_hour,
    asset_cost_per_recovery_hour,
    business_overheads_per_recovery_hour,
    margin_after_labour_per_recovery_hour,
    non_people_cost_burden_per_recovery_hour,
    recovery_hours_used,
    units_sold_annual,
    business_type,
    is_product_based,
    is_labour_based,
    activity_driver_type,
    revenue_per_unit,
    direct_cost_per_unit,
    margin_per_unit,
    required_units_to_break_even,
    unit_surplus_or_shortfall,
    required_recovery_rate,
    actual_recovery_rate,
    profit_or_deficit_per_recovery_hour,
    net_position,
    cost_burden_breakdown,
    timeScale,
  });

  const {
    active_time_scale,
    business_hierarchy,
    business_type_label,
    hero,
    product_mode_active,
    result_table,
  } = hierarchyState;

  const active_node =
    findNodeByPath(business_hierarchy, activePath) ?? business_hierarchy;
  const active_children = getNodeChildren(active_node);
  const active_bar_items = active_children.filter(
    (item) => item.includeInBar !== false && !item.isPending && item.amount > 0
  );
  const active_bar_total =
    active_node.key === "business-result"
      ? Math.max(
          Math.abs(active_node.referenceTotal || 0),
          active_bar_items.reduce((total, item) => total + item.amount, 0)
        )
      : Math.abs(active_node.value);
  const active_share_label =
    active_node.key === "business-result"
      ? "revenue"
      : active_node.shareLabel || active_node.label.toLowerCase();
  const active_level_title =
    active_node.key === "business-result"
      ? product_mode_active
        ? "Trading Margin Consumption"
        : "Revenue Consumption"
      : active_node.label;
  const active_level_helper =
    active_node.key === "business-result" && product_mode_active
      ? "This shows how product revenue becomes trading margin, then whether that margin covers the business cost burden."
      : active_node.key === "business-result"
        ? "This shows how your revenue is consumed before profit is created."
        : active_node.key === "margin-pool" && !product_mode_active
          ? "Full labour and material margin split becomes available once claimed labour hours and quote/job data are connected."
          : active_node.key === "remaining-cost-burden"
            ? "This shows the remaining cost burden after People Cost: Asset Cost plus Business Overheads."
            : active_node.note;
  const breadcrumbs = getBreadcrumbNodes(business_hierarchy, activePath);

  function handleSelectHierarchyNode(item) {
    if (!hasAvailableChildren(item)) {
      return;
    }

    setActivePath((previousPath) => [...previousPath, item.key]);
    setHoveredItemKey("");
  }

  function handleSelectBreadcrumb(index) {
    setActivePath((previousPath) => previousPath.slice(0, index + 1));
    setHoveredItemKey("");
  }

  return (
    <section className="ui-section">
      <div className="ui-stack">
        <div className="ui-stack-sm">
          <div className="ui-kicker">Business Snapshot</div>
          <div className="ui-card-title">Current position</div>
          <p className="ui-help">
            Factual summary of trading output compared with operating costs.
          </p>
        </div>

        <div className="ui-panel ui-stack-sm">
          <BusinessSummaryResultHero
            active_time_scale={active_time_scale}
            hero={hero}
            onTimeScaleChange={setTimeScale}
            product_mode_active={product_mode_active}
            result_table={result_table}
            timeScale={timeScale}
          />

          <BusinessSummaryGraphSection
            active_bar_items={active_bar_items}
            active_bar_total={active_bar_total}
            active_children={active_children}
            active_level_helper={active_level_helper}
            active_level_title={active_level_title}
            active_node={active_node}
            active_share_label={active_share_label}
            breadcrumbs={breadcrumbs}
            hoveredItemKey={hoveredItemKey}
            onClearHover={() => setHoveredItemKey("")}
            onHoverItem={setHoveredItemKey}
            onSelectBreadcrumb={handleSelectBreadcrumb}
            onSelectItem={handleSelectHierarchyNode}
            product_mode_active={product_mode_active}
          />
        </div>

        <BusinessSummaryModePanel
          activity_driver_display_label={activity_driver_display_label}
          activity_driver_suffix={activity_driver_suffix}
          activity_driver_type={activity_driver_type}
          activity_driver_value={activity_driver_value}
          business_type_label={business_type_label}
          current_margin_label={current_margin_label}
          current_margin_per_driver={current_margin_per_driver}
          recovery_gap_label={recovery_gap_label}
          recovery_gap_per_driver={recovery_gap_per_driver}
          required_recovery_label={required_recovery_label}
          required_recovery_per_driver={required_recovery_per_driver}
          required_recovery_unit_label={required_recovery_unit_label}
          total_productive_output={total_productive_output}
          total_recovery_hours={total_recovery_hours}
          units_sold_annual={units_sold_annual}
        />
      </div>
    </section>
  );
}
