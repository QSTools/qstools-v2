"use client";

import { useState } from "react";

import {
  BusinessCompositionBar,
  BusinessCompositionRow,
  BusinessReferenceRow,
  BusinessSummaryBreadcrumb,
} from "@/components/business-summary/BusinessSummaryCompositionGraph";
import {
  TIME_SCALES,
  findNodeByPath,
  formatCurrency,
  formatNumber,
  getBreadcrumbNodes,
  getNodeChildren,
  getTimeScaleName,
  getTimeScaleSuffix,
  hasAvailableChildren,
  scaleAnnualValue,
  scalePeriodValue,
} from "@/components/business-summary/BusinessSummaryCardUtils";

function TableRow({ label, value, total = false }) {
  return (
    <div className={`labour-summary-table-row${total ? " total" : ""}`}>
      <div className="labour-summary-table-label">{label}</div>
      <div className="labour-summary-table-value">{value}</div>
    </div>
  );
}

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

  const business_type_label =
    business_type === "product_based"
      ? "Product / Unit-based business"
      : "Service / Labour-based business";

  const scaled_required_recovery = scaleAnnualValue(
    total_cost_burden,
    timeScale,
    required_recovery_rate
  );

  const scaled_actual_recovery = scaleAnnualValue(
    margin_pool,
    timeScale,
    actual_recovery_rate
  );

  const scaled_recovery_result = scaleAnnualValue(
    net_position,
    timeScale,
    profit_or_deficit_per_recovery_hour
  );

  const recovery_result_abs = Math.abs(scaled_recovery_result);
  const scale_label = getTimeScaleName(timeScale);
  const result_scale_label =
    timeScale === "hour" ? "Recovery Hour" : scale_label;
  const scale_suffix = getTimeScaleSuffix(timeScale);

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

  const scaled_revenue = scalePeriodValue(
    total_revenue,
    timeScale,
    recovery_hours_used
  );

  const scaled_direct_costs = scalePeriodValue(
    total_direct_costs,
    timeScale,
    recovery_hours_used
  );

  const scaled_margin_pool = scalePeriodValue(
    margin_pool,
    timeScale,
    recovery_hours_used
  );

  const scaled_people_cost =
    timeScale === "hour"
      ? people_cost_per_recovery_hour
      : scalePeriodValue(
        total_people_cost_annual,
        timeScale,
        recovery_hours_used
      );

  const scaled_margin_after_labour =
    timeScale === "hour"
      ? margin_after_labour_per_recovery_hour
      : scalePeriodValue(
        margin_after_labour,
        timeScale,
        recovery_hours_used
      );

  const scaled_asset_cost =
    timeScale === "hour"
      ? asset_cost_per_recovery_hour
      : scalePeriodValue(
        total_asset_cost_annual,
        timeScale,
        recovery_hours_used
      );

  const scaled_general_overheads =
    timeScale === "hour"
      ? business_overheads_per_recovery_hour
      : scalePeriodValue(
        total_business_overheads,
        timeScale,
        recovery_hours_used
      );

  const scaled_non_people_cost_burden =
    timeScale === "hour"
      ? non_people_cost_burden_per_recovery_hour
      : scalePeriodValue(
        non_people_cost_burden,
        timeScale,
        recovery_hours_used
      );

  const scaled_net_position = scalePeriodValue(
    net_position,
    timeScale,
    recovery_hours_used
  );

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
  const productive_staff = active_staff.filter(
    (staff) => staff.contributes_to_recovery_hours !== false
  );
  const non_productive_staff = active_staff.filter(
    (staff) => staff.contributes_to_recovery_hours === false
  );
  const productive_assets = active_assets.filter(
    (asset) => asset.asset_type === "productive"
  );
  const support_assets = active_assets.filter(
    (asset) => asset.asset_type !== "productive"
  );

  function buildStaffRows(staffRows = []) {
    return staffRows.map((staff, index) => {
      const staff_cost = scalePeriodValue(
        staff.total_labour_cost_annual,
        timeScale,
        recovery_hours_used
      );

      return {
        key: `${staff.profile_id || staff.staff_id || staff.staff_name || "staff"}-${index}`,
        label: staff.staff_name || "Unnamed staff",
        value: staff_cost,
        amount: Math.abs(staff_cost),
        referenceTotal: Math.abs(scaled_people_cost),
        suffix: scale_suffix,
      };
    });
  }

  function sumStaffCost(staffRows = []) {
    return staffRows.reduce(
      (total, staff) => total + (Number(staff.total_labour_cost_annual) || 0),
      0
    );
  }

  function buildAssetRows(assetRows = []) {
    return assetRows.map((asset, index) => {
      const asset_cost = scalePeriodValue(
        asset.total_asset_cost_annual,
        timeScale,
        recovery_hours_used
      );

      return {
        key: `${asset.asset_id || asset.asset_name || "asset"}-${index}`,
        label: asset.asset_name || "Unnamed asset",
        value: asset_cost,
        amount: Math.abs(asset_cost),
        referenceTotal: Math.abs(scaled_asset_cost),
        suffix: scale_suffix,
      };
    });
  }

  function sumAssetCost(assetRows = []) {
    return assetRows.reduce(
      (total, asset) => total + (Number(asset.total_asset_cost_annual) || 0),
      0
    );
  }

  function buildOverheadCategoryRows(categoryRows = []) {
    return categoryRows.map((category, index) => {
      const category_amount = category.total ?? category.amount;
      const category_value = scalePeriodValue(
        category_amount,
        timeScale,
        recovery_hours_used
      );

      return {
        key: `${category.category_id || category.category_name || category.category_label || "overhead-category"}-${index}`,
        label:
          category.category_label ||
          category.category_name ||
          category.category_id ||
          "Overhead category",
        value: category_value,
        amount: Math.abs(category_value),
        referenceTotal: Math.abs(scaled_general_overheads),
        suffix: scale_suffix,
      };
    });
  }

  const productive_staff_cost = scalePeriodValue(
    sumStaffCost(productive_staff),
    timeScale,
    recovery_hours_used
  );
  const non_productive_staff_cost = scalePeriodValue(
    sumStaffCost(non_productive_staff),
    timeScale,
    recovery_hours_used
  );
  const productive_staff_children = buildStaffRows(productive_staff);
  const non_productive_staff_children = buildStaffRows(non_productive_staff);
  const productive_asset_cost = scalePeriodValue(
    sumAssetCost(productive_assets),
    timeScale,
    recovery_hours_used
  );
  const support_asset_cost = scalePeriodValue(
    sumAssetCost(support_assets),
    timeScale,
    recovery_hours_used
  );
  const productive_asset_children = buildAssetRows(productive_assets);
  const support_asset_children = buildAssetRows(support_assets);
  const overhead_category_children =
    buildOverheadCategoryRows(overhead_category_totals);

  const direct_cost_children = (
    Array.isArray(direct_cost_category_totals) ? direct_cost_category_totals : []
  )
    .map((category) => {
      const categoryValue = scalePeriodValue(
        category.amount,
        timeScale,
        recovery_hours_used
      );

      return {
        key: `direct-cost-${category.category_id || category.label}`,
        label: category.label || "Direct cost category",
        value: categoryValue,
        amount: Math.abs(categoryValue),
        referenceTotal: Math.abs(scaled_direct_costs),
        suffix: scale_suffix,
      };
    })
    .filter((category) => category.amount > 0);

  const remaining_cost_children = [
    {
      key: "assets",
      label: "Asset Cost",
      value: scaled_asset_cost,
      amount: Math.abs(scaled_asset_cost),
      referenceTotal: Math.abs(scaled_non_people_cost_burden),
      suffix: scale_suffix,
      note: "Annual asset cost from Cost Summary.",
      children: [
        {
          key: "productive-assets",
          label: "Productive assets",
          value: productive_asset_cost,
          amount: Math.abs(productive_asset_cost),
          referenceTotal: Math.abs(scaled_asset_cost),
          suffix: scale_suffix,
          note: "Assets marked as productive.",
          children: productive_asset_children,
        },
        {
          key: "support-assets",
          label: "Support assets",
          value: support_asset_cost,
          amount: Math.abs(support_asset_cost),
          referenceTotal: Math.abs(scaled_asset_cost),
          suffix: scale_suffix,
          note: "Support assets remain in the cost burden.",
          children: support_asset_children,
        },
      ],
    },
    {
      key: "general-overheads",
      label: "Business Overheads",
      value: scaled_general_overheads,
      amount: Math.abs(scaled_general_overheads),
      referenceTotal: Math.abs(scaled_non_people_cost_burden),
      suffix: scale_suffix,
      note: "Annual business overheads from Cost Summary.",
      children: overhead_category_children,
    },
  ].filter((item) => item.amount > 0);

  const people_cost_children = [
    {
      key: "productive-labour",
      label: "Productive labour",
      value: productive_staff_cost,
      amount: Math.abs(productive_staff_cost),
      referenceTotal: Math.abs(scaled_people_cost),
      suffix: scale_suffix,
      note: "Staff selected to contribute recovery hours.",
      children: productive_staff_children,
    },
    {
      key: "non-productive-labour",
      label: "Non-productive labour",
      value: non_productive_staff_cost,
      amount: Math.abs(non_productive_staff_cost),
      referenceTotal: Math.abs(scaled_people_cost),
      suffix: scale_suffix,
      note: "Staff that add cost but do not contribute recovery hours.",
      children: non_productive_staff_children,
    },
  ];

  const pending_contribution_children = [
    {
      key: "labour-contribution-split",
      label: "Labour Contribution Split",
      value: 0,
      amount: 0,
      referenceTotal: Math.abs(scaled_margin_pool),
      suffix: scale_suffix,
      isPending: true,
      includeInBar: false,
      note: "Not yet calculated.",
      pendingLabel: "Requires claimed labour hours / quote-job data",
    },
    {
      key: "material-contribution-split",
      label: "Material Contribution Split",
      value: 0,
      amount: 0,
      referenceTotal: Math.abs(scaled_margin_pool),
      suffix: scale_suffix,
      isPending: true,
      includeInBar: false,
      note: "Not yet calculated.",
      pendingLabel: "Requires claimed labour hours / quote-job data",
    },
    {
      key: "other-contribution-split",
      label: "Other Contribution Split",
      value: 0,
      amount: 0,
      referenceTotal: Math.abs(scaled_margin_pool),
      suffix: scale_suffix,
      isPending: true,
      includeInBar: false,
      note: "Not yet calculated.",
      pendingLabel: "Requires claimed labour hours / quote-job data",
    },
  ];

  const business_hierarchy = {
    key: "business-result",
    label: "Business Result",
    value: scaled_revenue,
    amount: revenue_reference_total,
    referenceTotal: revenue_reference_total,
    suffix: scale_suffix,
    shareLabel: "revenue",
    note: "This shows how your revenue is consumed before profit is created.",
    children: [
      {
        key: "revenue-generated",
        label: "Revenue Generated",
        value: scaled_revenue,
        amount: revenue_reference_total,
        referenceTotal: revenue_reference_total,
        suffix: scale_suffix,
        isReference: true,
        includeInBar: false,
        note: "This is the income available before direct costs and operating cost baseline are covered.",
      },
      {
        key: "direct-costs",
        label: "COG / Direct Costs",
        value: scaled_direct_costs,
        amount: Math.abs(scaled_direct_costs),
        referenceTotal: revenue_reference_total,
        suffix: scale_suffix,
        note: "Direct costs are removed before Gross Profit / Margin Pool is calculated.",
        shareLabel: "direct costs",
        children: direct_cost_children,
      },
      {
        key: "margin-pool",
        label: "Gross Profit / Margin Pool",
        value: scaled_margin_pool,
        amount: Math.abs(scaled_margin_pool),
        referenceTotal: revenue_reference_total,
        suffix: scale_suffix,
        includeInBar: false,
        note: "Revenue after COG / Direct Costs.",
        shareLabel: "margin pool",
        children: pending_contribution_children,
      },
      {
        key: "people-cost",
        label: "Less People Cost",
        value: -Math.abs(scaled_people_cost),
        amount: Math.abs(scaled_people_cost),
        referenceTotal: revenue_reference_total,
        suffix: scale_suffix,
        note: "People Cost deducted from Gross Profit / Margin Pool.",
        shareLabel: "people cost",
        children: people_cost_children,
      },
      {
        key: "margin-after-labour",
        label: "Margin after Labour",
        value: scaled_margin_after_labour,
        amount: Math.abs(scaled_margin_after_labour),
        referenceTotal: revenue_reference_total,
        suffix: scale_suffix,
        includeInBar: false,
        note: "Gross Profit / Margin Pool after People Cost. This shows whether the business is already positive or negative before assets and business overheads.",
      },
      {
        key: "remaining-cost-burden",
        label: "Remaining Cost Burden",
        value: scaled_non_people_cost_burden,
        amount: Math.abs(scaled_non_people_cost_burden),
        referenceTotal: revenue_reference_total,
        suffix: scale_suffix,
        note: "Asset Cost and Business Overheads still need to be covered after People Cost.",
        shareLabel: "remaining cost burden",
        children: remaining_cost_children,
      },
      {
        key: "surplus-deficit",
        label: surplus_or_deficit_label,
        value: scaled_net_position,
        amount: surplus_or_deficit_amount,
        referenceTotal: revenue_reference_total,
        suffix: scale_suffix,
        includeInBar: scaled_net_position >= 0,
        note:
          scaled_net_position >= 0
            ? "Revenue left after direct costs, People Cost, Asset Cost, and Business Overheads."
            : "Costs exceed revenue by this amount.",
      },
    ],
  };

  const active_node =
    findNodeByPath(business_hierarchy, activePath) ?? business_hierarchy;
  const active_children = getNodeChildren(active_node);
  const active_bar_items = active_children.filter(
    (item) => item.includeInBar !== false && !item.isPending && item.amount > 0
  );
  const active_bar_total =
    active_node.key === "business-result"
      ? Math.max(
        revenue_reference_total,
        active_bar_items.reduce((total, item) => total + item.amount, 0)
      )
      : Math.abs(active_node.value);
  const active_share_label =
    active_node.key === "business-result"
      ? "revenue"
      : active_node.shareLabel || active_node.label.toLowerCase();
  const active_level_title =
    active_node.key === "business-result"
      ? "Revenue Consumption"
      : active_node.label;
  const active_level_helper =
    active_node.key === "margin-pool"
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
          <div className="ui-kicker">Business Result</div>
          <div className="ui-card-title-sm">{recovery_result_label}</div>
          <div className="ui-display">
            {formatCurrency(recovery_result_abs)}
            <span className="ui-help"> {scale_suffix}</span>
          </div>
          <p className="ui-help">{recovery_headline}</p>
          <p className="ui-help">
            Owner wages are already included in costs, so this result is after
            paying the owner properly.
          </p>
          <p className="ui-help">
            This compares your actual Gross Profit / Margin Pool against the
            Cost Summary recovery baseline.
          </p>

          <div className="cost-summary-toggle" aria-label="Time scale">
            {TIME_SCALES.map((option) => (
              <button
                key={option.key}
                type="button"
                className={
                  option.key === timeScale
                    ? "cost-summary-toggle-button active"
                    : "cost-summary-toggle-button"
                }
                onClick={() => setTimeScale(option.key)}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="labour-summary-table">
            <TableRow
              label={
                timeScale === "hour"
                  ? "Required Recovery Rate"
                  : `Required Recovery per ${scale_label}`
              }
              value={`${formatCurrency(scaled_required_recovery)} ${scale_suffix}`}
            />
            <TableRow
              label={
                timeScale === "hour"
                  ? "Actual Recovery Rate"
                  : `Actual Recovery per ${scale_label}`
              }
              value={`${formatCurrency(scaled_actual_recovery)} ${scale_suffix}`}
            />
            <TableRow
              label={recovery_result_label}
              value={`${formatCurrency(scaled_recovery_result)} ${scale_suffix}`}
              total
            />
            <TableRow
              label="Recovery Hours Used"
              value={`${formatNumber(recovery_hours_used)} hrs`}
            />
          </div>

          <div className="ui-stack-sm">
            <BusinessSummaryBreadcrumb
              crumbs={breadcrumbs}
              onSelectCrumb={handleSelectBreadcrumb}
            />
            <div className="ui-kicker">{active_level_title}</div>
            {active_level_helper ? (
              <div className="ui-help">{active_level_helper}</div>
            ) : null}
            <div className="cost-summary-level-total">
              <span className="cost-summary-level-total-label">
                {active_node.key === "business-result"
                  ? "Revenue Generated"
                  : active_node.label}
              </span>
              <span className="cost-summary-level-total-value">
                {formatCurrency(active_node.value)}
                <span className="cost-summary-level-total-suffix">
                  {scale_suffix}
                </span>
              </span>
            </div>

            <BusinessCompositionBar
              items={active_bar_items}
              total={active_bar_total}
              hoveredItemKey={hoveredItemKey}
              onHoverItem={setHoveredItemKey}
              onClearHover={() => setHoveredItemKey("")}
              onSelectItem={handleSelectHierarchyNode}
              shareLabel={active_share_label}
            />

            <div className="cost-summary-drill-list">
              {active_children.map((item) =>
                item.isReference ? (
                  <BusinessReferenceRow key={item.key} item={item} />
                ) : (
                  <BusinessCompositionRow
                    key={item.key}
                    item={item}
                    hoveredItemKey={hoveredItemKey}
                    onHoverItem={setHoveredItemKey}
                    onClearHover={() => setHoveredItemKey("")}
                    onSelectItem={handleSelectHierarchyNode}
                    shareLabel={active_share_label}
                  />
                )
              )}
            </div>
          </div>
        </div>

        <div className="ui-panel ui-stack-sm">
          <div className="ui-kicker">Business mode</div>
          <div className="ui-card-title-sm">{business_type_label}</div>
          <p className="ui-help">
            {activity_driver_type === "units"
              ? "Business Summary is calculating recovery through units sold."
              : "Business Summary is calculating recovery through productive hours."}
          </p>
        </div>

        <div className="ui-panel ui-stack-sm">
          <div className="ui-kicker">
            {activity_driver_type === "units"
              ? "Per-Unit Reality"
              : "Productive Hour Reality"}
          </div>

          <p className="ui-help">
            {activity_driver_type === "units"
              ? "This shows the business result spread across annual units sold."
              : "This shows the business result spread across total productive hours. The recovery rate above uses selected recovery hours."}
          </p>

          <div className="labour-summary-table">
            <TableRow
              label={
                activity_driver_type === "hours"
                  ? "Required recovery per productive hour"
                  : required_recovery_label
              }
              value={`${formatCurrency(
                required_recovery_per_driver
              )} ${required_recovery_unit_label}`}
            />
            <TableRow
              label={
                activity_driver_type === "hours"
                  ? "Current margin per productive hour"
                  : current_margin_label
              }
              value={`${formatCurrency(
                current_margin_per_driver
              )} ${required_recovery_unit_label}`}
            />
            <TableRow
              label={
                activity_driver_type === "hours"
                  ? "Productive hourly gap"
                  : recovery_gap_label
              }
              value={`${formatCurrency(
                recovery_gap_per_driver
              )} ${required_recovery_unit_label}`}
              total
            />
            <TableRow
              label={activity_driver_display_label}
              value={`${formatNumber(activity_driver_value)} ${activity_driver_suffix}`}
            />
            {activity_driver_type === "hours" ? (
              <TableRow
                label="Selected Recovery Hours"
                value={`${formatNumber(total_recovery_hours)} hrs`}
              />
            ) : null}
          </div>
        </div>

        {activity_driver_type === "units" ? (
          <div className="ui-panel ui-stack-sm">
            <div className="ui-kicker">Product driver source</div>
            <div className="labour-summary-table">
              <TableRow
                label="Units sold per year"
                value={`${formatNumber(units_sold_annual)} units`}
              />
              <TableRow
                label="Productive hours still available"
                value={`${formatNumber(total_productive_output)} hrs`}
              />
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
