"use client";

import { useState } from "react";

const TIME_SCALES = [
  { key: "hour", label: "Hour", suffix: "/ hr" },
  { key: "day", label: "Day", suffix: "/ day" },
  { key: "week", label: "Week", suffix: "/ week" },
  { key: "month", label: "Month", suffix: "/ month" },
  { key: "quarter", label: "Quarter", suffix: "/ quarter" },
  { key: "year", label: "Year", suffix: "/ year" },
];

function formatCurrency(value) {
  const number = Number(value) || 0;

  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    maximumFractionDigits: 0,
  }).format(number);
}

function formatPercent(value) {
  const number = Number(value) || 0;

  return new Intl.NumberFormat("en-NZ", {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(number);
}

function formatDisplayPercent(value) {
  const percent = Number(value) || 0;

  if (percent === 0) return "0%";
  if (percent > 0 && percent < 0.1) return "<0.1%";

  return `${percent.toFixed(1)}%`;
}

function formatNumber(value) {
  const number = Number(value) || 0;

  return new Intl.NumberFormat("en-NZ", {
    maximumFractionDigits: 0,
  }).format(number);
}

function TableRow({ label, value, total = false }) {
  return (
    <div className={`labour-summary-table-row${total ? " total" : ""}`}>
      <div className="labour-summary-table-label">{label}</div>
      <div className="labour-summary-table-value">{value}</div>
    </div>
  );
}

function scaleAnnualValue(annualValue, timeScale, hourlyValue = 0) {
  const value = Number(annualValue) || 0;

  if (timeScale === "hour") return Number(hourlyValue) || 0;
  if (timeScale === "day") return value / 260;
  if (timeScale === "week") return value / 52;
  if (timeScale === "month") return value / 12;
  if (timeScale === "quarter") return value / 4;

  return value;
}

function scalePeriodValue(annualValue, timeScale, recoveryHoursUsed = 0) {
  const value = Number(annualValue) || 0;
  const recoveryHours = Number(recoveryHoursUsed) || 0;

  if (timeScale === "hour") {
    return recoveryHours > 0 ? value / recoveryHours : 0;
  }

  if (timeScale === "day") return value / 260;
  if (timeScale === "week") return value / 52;
  if (timeScale === "month") return value / 12;
  if (timeScale === "quarter") return value / 4;

  return value;
}

function getTimeScaleSuffix(timeScale) {
  return TIME_SCALES.find((option) => option.key === timeScale)?.suffix ?? "";
}

function getTimeScaleName(timeScale) {
  return TIME_SCALES.find((option) => option.key === timeScale)?.label ?? "Hour";
}

function calculateShare(part, total) {
  const safePart = Number(part) || 0;
  const safeTotal = Number(total) || 0;

  return safeTotal > 0 ? (safePart / safeTotal) * 100 : 0;
}

function getNodeChildren(node = {}) {
  return Array.isArray(node.children) ? node.children : [];
}

function hasAvailableChildren(node = {}) {
  return getNodeChildren(node).length > 0;
}

function findNodeByPath(root, path = []) {
  return path.slice(1).reduce((currentNode, key) => {
    return getNodeChildren(currentNode).find((child) => child.key === key);
  }, root);
}

function getBreadcrumbNodes(root, path = []) {
  const crumbs = [];
  let currentNode = root;

  path.forEach((key, index) => {
    if (index === 0) {
      crumbs.push(root);
      return;
    }

    currentNode = getNodeChildren(currentNode).find(
      (child) => child.key === key
    );

    if (currentNode) {
      crumbs.push(currentNode);
    }
  });

  return crumbs;
}

function BusinessCompositionBar({
  items = [],
  total = 0,
  hoveredItemKey = "",
  onHoverItem,
  onClearHover,
  onSelectItem,
  shareLabel = "revenue",
}) {
  const safeTotal = Number(total) || 0;
  const hasPositiveTotal = safeTotal > 0;

  if (!hasPositiveTotal || items.length === 0) {
    return (
      <div
        className="cost-summary-bar empty"
        aria-label="Business Summary revenue composition unavailable"
      >
        <div className="cost-summary-bar-empty" />
      </div>
    );
  }

  return (
    <div
      className="cost-summary-bar"
      aria-label="Business Summary revenue composition"
    >
      {items.map((item, index) => {
        const share = calculateShare(item.amount, item.referenceTotal);
        const isActive = hoveredItemKey === item.key;
        const isMuted = Boolean(hoveredItemKey) && !isActive;
        const isClickable = hasAvailableChildren(item);
        const className = [
          "cost-summary-bar-segment",
          `cost-summary-bar-segment--${index % 6}`,
          isClickable ? "clickable" : "static",
          isActive ? "active" : "",
          isMuted ? "muted" : "",
        ]
          .filter(Boolean)
          .join(" ");
        const segmentLabel = `${item.label}: ${formatCurrency(
          item.value
        )}, ${formatDisplayPercent(share)} of ${shareLabel}`;
        const commonProps = {
          className,
          style: { "--segment-grow": `${Math.max(item.amount, 0)}` },
          onMouseEnter: () => onHoverItem(item.key),
          onMouseLeave: onClearHover,
          "aria-label": segmentLabel,
          title: segmentLabel,
        };

        if (isClickable) {
          return (
            <button
              key={item.key}
              type="button"
              {...commonProps}
              onClick={() => onSelectItem(item)}
            />
          );
        }

        return <div key={item.key} role="img" {...commonProps} />;
      })}
    </div>
  );
}

function BusinessCompositionRow({
  item,
  hoveredItemKey = "",
  onHoverItem,
  onClearHover,
  onSelectItem,
  shareLabel = "revenue",
}) {
  const isActive = hoveredItemKey === item.key;
  const isMuted = Boolean(hoveredItemKey) && !isActive;
  const share = calculateShare(item.amount, item.referenceTotal);
  const isClickable = hasAvailableChildren(item);
  const className = [
    "cost-summary-drill-row",
    isClickable ? "clickable" : "static",
    isActive ? "active" : "",
    isMuted ? "muted" : "",
  ]
    .filter(Boolean)
    .join(" ");
  const valueDisplay = item.isPending
    ? item.valueLabel || "Pending"
    : formatCurrency(item.value);
  const shareDisplay = item.isPending
    ? item.pendingLabel || "Requires quote/job data"
    : `${formatDisplayPercent(share)} of ${shareLabel}`;
  const rowContent = (
    <>
      <div className="ui-stack-sm">
        <div className="cost-summary-drill-label">{item.label}</div>
        {item.note ? <div className="ui-help">{item.note}</div> : null}
      </div>

      <div className="cost-summary-drill-value">
        <div className="ui-card-title-sm">
          {valueDisplay}
          {!item.isPending ? (
            <span className="ui-help"> {item.suffix}</span>
          ) : null}
        </div>
        <div className="ui-help">{shareDisplay}</div>
      </div>
    </>
  );

  const commonProps = {
    className,
    onMouseEnter: () => onHoverItem(item.key),
    onMouseLeave: onClearHover,
  };

  if (isClickable) {
    return (
      <button type="button" {...commonProps} onClick={() => onSelectItem(item)}>
        {rowContent}
      </button>
    );
  }

  return (
    <div {...commonProps}>
      {rowContent}
    </div>
  );
}

function BusinessReferenceRow({ item }) {
  return (
    <div className="cost-summary-drill-row static">
      <div className="ui-stack-sm">
        <div className="cost-summary-drill-label">{item.label}</div>
        {item.note ? <div className="ui-help">{item.note}</div> : null}
      </div>

      <div className="cost-summary-drill-value">
        <div className="ui-card-title-sm">
          {formatCurrency(item.value)}
          <span className="ui-help"> {item.suffix}</span>
        </div>
        <div className="ui-help">100.0% of revenue</div>
      </div>
    </div>
  );
}

function BusinessSummaryBreadcrumb({ crumbs = [], onSelectCrumb }) {
  if (crumbs.length === 0) {
    return null;
  }

  return (
    <div className="cost-summary-breadcrumb" aria-label="Business hierarchy">
      {crumbs.map((crumb, index) => (
        <button
          key={`${crumb.key}-${index}`}
          type="button"
          className="cost-summary-breadcrumb-item"
          onClick={() => onSelectCrumb(index)}
        >
          {crumb.label}
        </button>
      ))}
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
  const scaled_operating_costs = scalePeriodValue(
    total_cost_burden,
    timeScale,
    recovery_hours_used
  );
  const scaled_margin_pool = scalePeriodValue(
    margin_pool,
    timeScale,
    recovery_hours_used
  );
  const scaled_people_cost = scalePeriodValue(
    total_people_cost_annual,
    timeScale,
    recovery_hours_used
  );
  const scaled_asset_cost = scalePeriodValue(
    total_asset_cost_annual,
    timeScale,
    recovery_hours_used
  );
  const scaled_general_overheads = scalePeriodValue(
    total_business_overheads,
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
  const operating_cost_children = [
    {
      key: "people-cost",
      label: "People Cost",
      value: scaled_people_cost,
      amount: Math.abs(scaled_people_cost),
      referenceTotal: Math.abs(scaled_operating_costs),
      suffix: scale_suffix,
    },
    {
      key: "assets",
      label: "Assets",
      value: scaled_asset_cost,
      amount: Math.abs(scaled_asset_cost),
      referenceTotal: Math.abs(scaled_operating_costs),
      suffix: scale_suffix,
    },
    {
      key: "general-overheads",
      label: "General Overheads",
      value: scaled_general_overheads,
      amount: Math.abs(scaled_general_overheads),
      referenceTotal: Math.abs(scaled_operating_costs),
      suffix: scale_suffix,
    },
  ].filter((item) => item.amount > 0);
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
        note: "Direct costs are removed before the business cost baseline is tested.",
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
        key: "operating-cost-baseline",
        label: "Operating Cost Baseline",
        value: scaled_operating_costs,
        amount: Math.abs(scaled_operating_costs),
        referenceTotal: revenue_reference_total,
        suffix: scale_suffix,
        note: "This is the Cost Summary baseline for the selected period.",
        shareLabel: "operating cost baseline",
        children: operating_cost_children,
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
            ? "Revenue left after direct costs and the operating cost baseline."
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
      : active_node.key === "operating-cost-baseline"
        ? "View the Cost Summary page for the full cost breakdown."
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
            This compares your actual margin pool against the Cost Summary
            recovery baseline.
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
          <div className="ui-kicker">Macro Position</div>
          <div className="labour-summary-table">
            <TableRow label="Revenue" value={formatCurrency(total_revenue)} />
            <TableRow
              label="Direct Costs"
              value={formatCurrency(total_direct_costs)}
            />
            <TableRow
              label="Margin Pool"
              value={formatCurrency(margin_pool)}
            />
            <TableRow
              label="Gross Margin %"
              value={formatPercent(gross_margin_percent)}
            />
            <TableRow
              label="Operating Costs"
              value={formatCurrency(total_cost_burden)}
            />
            <TableRow
              label="Net Position"
              value={formatCurrency(net_position)}
              total
            />
          </div>
        </div>

        <div className="ui-panel ui-stack-sm">
          <div className="ui-kicker">
            {activity_driver_type === "units"
              ? "Per-Unit Reality"
              : "Per-Hour Reality"}
          </div>

          <div className="labour-summary-table">
            <TableRow
              label={required_recovery_label}
              value={`${formatCurrency(
                required_recovery_per_driver
              )} ${required_recovery_unit_label}`}
            />
            <TableRow
              label={current_margin_label}
              value={`${formatCurrency(
                current_margin_per_driver
              )} ${required_recovery_unit_label}`}
            />
            <TableRow
              label={recovery_gap_label}
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
