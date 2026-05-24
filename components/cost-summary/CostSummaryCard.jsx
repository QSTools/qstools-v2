"use client";

import { useMemo, useState } from "react";
import { formatCostSummaryPercent } from "@/lib/selectors/costSummarySelectors";

const TIME_SCALES = [
  { key: "hour", label: "Hour", suffix: "/ hr" },
  { key: "day", label: "Day", suffix: "/ day" },
  { key: "week", label: "Week", suffix: "/ week" },
  { key: "month", label: "Month", suffix: "/ month" },
  { key: "quarter", label: "Quarter", suffix: "/ quarter" },
  { key: "year", label: "Year", suffix: "/ year" },
];

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function formatMoney(value, maximumFractionDigits = 0) {
  const number = toNumber(value);

  return `$${number.toLocaleString(undefined, {
    maximumFractionDigits,
  })}`;
}

function formatNumber(value) {
  return toNumber(value).toLocaleString(undefined, {
    maximumFractionDigits: 0,
  });
}

function calculateShare(part, total) {
  const safePart = toNumber(part);
  const safeTotal = toNumber(total);

  if (safeTotal <= 0) return 0;
  return (safePart / safeTotal) * 100;
}

function scaleAnnualValue(annualValue, timeScale, totalRecoveryHours) {
  const value = toNumber(annualValue);
  const recoveryHours = toNumber(totalRecoveryHours);

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

function getInsightForLevel(level, items, total_cost_burden) {
  const largestItem = [...items].sort((a, b) => b.amount - a.amount)[0];

  if (!largestItem || total_cost_burden <= 0) {
    return "Cost Summary shows the business cost that must be recovered.";
  }

  const shareOfTotal = calculateShare(largestItem.amount, total_cost_burden);

  if (level === "total") {
    return `${largestItem.label} is the largest part of your total cost at ${formatCostSummaryPercent(
      shareOfTotal
    )}.`;
  }

  return `${largestItem.label} is the largest item in this layer and represents ${formatCostSummaryPercent(
    shareOfTotal
  )} of your total cost.`;
}

function CostBar({
  items,
  total,
  timeScale,
  totalRecoveryHours,
  hoveredItemKey,
  onHoverItem,
  onClearHover,
  onSelect,
}) {
  const safeTotal = toNumber(total);
  const hasPositiveTotal = safeTotal > 0;
  const hasPositiveSegments = items.some((item) => toNumber(item.amount) > 0);

  if (!hasPositiveTotal || !hasPositiveSegments || items.length === 0) {
    return (
      <div
        className="cost-summary-bar empty"
        aria-label="Cost composition unavailable"
      >
        <div className="cost-summary-bar-empty" />
      </div>
    );
  }

  return (
    <div className="cost-summary-bar" aria-label="Cost composition">
      {items.map((item, index) => {
        const hasChildren =
          Array.isArray(item.children) && item.children.length > 0;
        const share = calculateShare(item.amount, safeTotal);
        const scaledValue = scaleAnnualValue(
          item.amount,
          timeScale,
          totalRecoveryHours
        );
        const isActive = hoveredItemKey === item.key;
        const isMuted = Boolean(hoveredItemKey) && !isActive;
        const className = [
          "cost-summary-bar-segment",
          `cost-summary-bar-segment--${index % 6}`,
          hasChildren ? "clickable" : "static",
          isActive ? "active" : "",
          isMuted ? "muted" : "",
        ]
          .filter(Boolean)
          .join(" ");
        const sharedProps = {
          className,
          style: { "--segment-grow": `${Math.max(toNumber(item.amount), 0)}` },
          onMouseEnter: () => onHoverItem(item.key),
          onMouseLeave: onClearHover,
          "aria-label": `${item.label}: ${formatMoney(
            scaledValue
          )}${getTimeScaleSuffix(timeScale)}, ${formatCostSummaryPercent(
            share
          )} of this layer`,
          title: `${item.label}: ${formatMoney(
            scaledValue
          )}${getTimeScaleSuffix(timeScale)}, ${formatCostSummaryPercent(
            share
          )} of this layer`,
        };

        if (!hasChildren) {
          return <div key={item.key} role="img" {...sharedProps} />;
        }

        return (
          <button
            key={item.key}
            type="button"
            {...sharedProps}
            onFocus={() => onHoverItem(item.key)}
            onBlur={onClearHover}
            onClick={() => onSelect(item)}
          />
        );
      })}
    </div>
  );
}

function DrillRow({
  item,
  parentTotal,
  total_cost_burden,
  timeScale,
  totalRecoveryHours,
  hoveredItemKey,
  onHoverItem,
  onClearHover,
  onSelect,
}) {
  const hasChildren = Array.isArray(item.children) && item.children.length > 0;
  const scaledValue = scaleAnnualValue(
    item.amount,
    timeScale,
    totalRecoveryHours
  );

  const shareOfParent = calculateShare(item.amount, parentTotal);
  const shareOfTotal = calculateShare(item.amount, total_cost_burden);
  const isActive = hoveredItemKey === item.key;
  const isMuted = Boolean(hoveredItemKey) && !isActive;
  const className = [
    "cost-summary-drill-row",
    hasChildren ? "clickable" : "static",
    isActive ? "active" : "",
    isMuted ? "muted" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      <div className="ui-stack-sm">
        <div className="cost-summary-drill-label">{item.label}</div>
        {item.note ? <div className="ui-help">{item.note}</div> : null}
      </div>

      <div className="cost-summary-drill-value">
        <div className="ui-card-title-sm">
          {formatMoney(scaledValue)}
          <span className="ui-help"> {getTimeScaleSuffix(timeScale)}</span>
        </div>
        <div className="ui-help">
          {formatCostSummaryPercent(shareOfParent)} of this layer
          {" · "}
          {formatCostSummaryPercent(shareOfTotal)} of total
        </div>
      </div>
    </>
  );

  const sharedProps = {
    className,
    onMouseEnter: () => onHoverItem(item.key),
    onMouseLeave: onClearHover,
  };

  if (!hasChildren) {
    return <div {...sharedProps}>{content}</div>;
  }

  return (
    <button
      type="button"
      {...sharedProps}
      onFocus={() => onHoverItem(item.key)}
      onBlur={onClearHover}
      onClick={() => onSelect(item)}
    >
      {content}
    </button>
  );
}

function Breadcrumb({ path, onSelect }) {
  return (
    <div className="cost-summary-breadcrumb">
      {path.map((crumb, index) => (
        <button
          key={`${crumb.key}-${index}`}
          type="button"
          className="cost-summary-breadcrumb-item"
          onClick={() => onSelect(index)}
        >
          {crumb.label}
        </button>
      ))}
    </div>
  );
}

function makeNode({ key, label, amount = 0, title, note, children = [] }) {
  return {
    key,
    label,
    title: title || label,
    amount: toNumber(amount),
    total: toNumber(amount),
    note,
    children,
    items: children,
  };
}

function getNodeByPath(root, activePath = []) {
  return activePath.slice(1).reduce((node, key) => {
    return node?.children?.find((child) => child.key === key) ?? node;
  }, root);
}

function getBreadcrumbNodes(root, activePath = []) {
  const nodes = [root];
  let node = root;

  for (const key of activePath.slice(1)) {
    const next = node?.children?.find((child) => child.key === key);
    if (!next) break;
    nodes.push(next);
    node = next;
  }

  return nodes;
}

export default function CostSummaryCard({
  people_cost_total,
  business_cost_total,
  asset_cost_total = 0,
  total_asset_interest_annual = 0,
  general_overheads_total = 0,
  total_cost_burden,
  required_revenue,
  required_recovery_rate,
  total_recovery_hours = 0,
  labour_detail = {},
  asset_detail = {},
  overhead_detail = {},
  highlight_insight = "",
}) {
  const [timeScale, setTimeScale] = useState("hour");
  const [activePath, setActivePath] = useState(["total"]);
  const [hoveredItemKey, setHoveredItemKey] = useState("");

  const total_people_cost_annual = toNumber(people_cost_total);
  const total_business_cost_annual = toNumber(business_cost_total);
  const total_asset_cost_annual = toNumber(asset_cost_total);
  const total_asset_interest = toNumber(total_asset_interest_annual);
  const total_business_overheads = toNumber(general_overheads_total);
  const total_cost_burden_annual = toNumber(total_cost_burden);
  const required_revenue_annual = toNumber(required_revenue);
  const required_recovery_rate_hourly = toNumber(required_recovery_rate);
  const recovery_hours_total = toNumber(total_recovery_hours);

  const hierarchy = useMemo(() => {
    function buildContributionNodes(prefix, detail = {}) {
      return [
        makeNode({
          key: `${prefix}-kiwisaver`,
          label: "KiwiSaver",
          amount: detail.employer_kiwisaver_annual,
        }),
        makeNode({
          key: `${prefix}-esct`,
          label: "ESCT",
          amount: detail.esct_annual,
        }),
        makeNode({
          key: `${prefix}-acc`,
          label: "ACC",
          amount: detail.acc_levy_annual,
        }),
      ];
    }

    function buildEntitlementNodes(prefix, detail = {}) {
      return [
        makeNode({
          key: `${prefix}-annual-leave`,
          label: "Annual Leave",
          amount: detail.annual_leave_cost_annual,
        }),
        makeNode({
          key: `${prefix}-public-holidays`,
          label: "Public Holidays",
          amount: detail.public_holiday_cost_annual,
        }),
        makeNode({
          key: `${prefix}-sick-leave`,
          label: "Sick Leave",
          amount: detail.sick_leave_cost_annual,
        }),
        makeNode({
          key: `${prefix}-bereavement-leave`,
          label: "Bereavement Leave",
          amount: detail.bereavement_leave_cost_annual,
        }),
        makeNode({
          key: `${prefix}-family-violence-leave`,
          label: "Family Violence Leave",
          amount: detail.family_violence_leave_cost_annual,
        }),
      ];
    }

    function buildLabourClassNode(key, label, detail = {}) {
      return makeNode({
        key,
        label,
        amount: detail.total_labour_cost_annual,
        children: [
          makeNode({
            key: `${key}-base-wages`,
            label: "Base Wages",
            amount: detail.base_wages_annual,
          }),
          makeNode({
            key: `${key}-employer-contributions`,
            label: "Employer Contributions",
            amount: detail.employer_contribution_annual,
            children: buildContributionNodes(key, detail),
          }),
          makeNode({
            key: `${key}-entitlements`,
            label: "Entitlements",
            amount: detail.entitlements_annual,
            note: "Entitlement cost is separated from base wages here for review.",
            children: buildEntitlementNodes(key, detail),
          }),
        ],
      });
    }

    const running_cost_annual = toNumber(asset_detail.running_cost_annual);
    const asset_children = [
      makeNode({
        key: "asset-total-cost",
        label: "Total Asset Cost",
        amount: total_asset_cost_annual,
      }),
      makeNode({
        key: "asset-finance-interest",
        label: "Asset Finance Interest",
        amount: total_asset_interest,
        note: "Supporting detail only. This is already included inside Asset Cost where applicable.",
      }),
    ];

    if (running_cost_annual > 0) {
      asset_children.push(
        makeNode({
          key: "asset-running-cost",
          label: "Running Cost",
          amount: running_cost_annual,
          note: "Legacy display only where upstream Assets exposes running cost.",
        })
      );
    }

    const category_totals = Array.isArray(overhead_detail.category_totals)
      ? overhead_detail.category_totals
      : [];
    const overhead_children = category_totals
      .filter((category) => toNumber(category?.total) > 0)
      .map((category) =>
        makeNode({
          key: `overheads-${category.category_id}`,
          label: category.category_name || category.category_id,
          amount: category.total,
        })
      );

    if (overhead_children.length === 0) {
      overhead_children.push(
        makeNode({
          key: "general-overheads-total",
          label: "Total General Overheads",
          amount: total_business_overheads,
          note: "Future-ready: category-level overhead outputs are not available in this Cost Summary view.",
        })
      );
    }

    return makeNode({
      key: "total",
      label: "Total Cost",
      title: "Where your business cost comes from",
      amount: total_cost_burden_annual,
      children: [
        makeNode({
          key: "people",
          label: "People Cost",
          title: "People cost breakdown",
          amount: total_people_cost_annual,
          children: [
            buildLabourClassNode(
              "productive-labour",
              "Productive Labour",
              labour_detail.productive
            ),
            buildLabourClassNode(
              "non-productive-labour",
              "Non-productive Labour",
              labour_detail.non_productive
            ),
          ],
        }),
        makeNode({
          key: "assets",
          label: "Assets",
          title: "Asset cost breakdown",
          amount: total_asset_cost_annual,
          children: asset_children,
        }),
        makeNode({
          key: "overheads",
          label: "General Overheads",
          title: "General overhead breakdown",
          amount: total_business_overheads,
          children: overhead_children,
        }),
      ],
    });
  }, [
    total_cost_burden_annual,
    total_people_cost_annual,
    total_asset_cost_annual,
    total_asset_interest,
    total_business_overheads,
    labour_detail,
    asset_detail,
    overhead_detail,
  ]);

  const activeLevel = getNodeByPath(hierarchy, activePath);
  const activeItems = activeLevel.items ?? [];
  const breadcrumb = getBreadcrumbNodes(hierarchy, activePath);

  const headlineValue =
    timeScale === "hour"
      ? required_recovery_rate_hourly
      : scaleAnnualValue(
          required_revenue_annual,
          timeScale,
          recovery_hours_total
        );

  const insight =
    highlight_insight ||
    getInsightForLevel(
      activeLevel.key,
      activeItems,
      total_cost_burden_annual
    );

  function handleSelectLevel(item) {
    setHoveredItemKey("");
    setActivePath((currentPath) => [...currentPath, item.key]);
  }

  function handleSelectBreadcrumb(index) {
    setActivePath((currentPath) => currentPath.slice(0, index + 1));
    setHoveredItemKey("");
  }

  return (
    <section className="ui-section">
      <div className="ui-stack">
        <div className="ui-panel ui-stack-sm">
          <div className="ui-kicker">Cost Baseline</div>
          <div className="ui-card-title">
            What your business must recover
          </div>

          <div className="cost-summary-hero">
            <div className="ui-stack-sm">
              <div className="ui-kicker">
                Required Recovery {getTimeScaleSuffix(timeScale)}
              </div>
              <div className="ui-display">
                {formatMoney(headlineValue)}
                <span className="ui-help"> {getTimeScaleSuffix(timeScale)}</span>
              </div>
              <div className="ui-help">
                {timeScale === "hour"
                  ? "This is the cost your business must recover for each recovery hour."
                  : "This is the same cost baseline scaled to the selected period."}
              </div>
            </div>

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
          </div>
        </div>

        <div className="ui-panel ui-stack-sm">
          <Breadcrumb path={breadcrumb} onSelect={handleSelectBreadcrumb} />

          <div className="ui-split">
            <div className="ui-stack-sm">
              <div className="ui-kicker">Cost Composition</div>
              <div className="ui-card-title-sm">{activeLevel.title}</div>
              <div className="ui-help">
                {activeLevel.key === "people"
                  ? "Only selected productive staff generate recovery hours. All staff costs are carried by those hours."
                  : "Click a section to explore. Values stay tied back to the total recovery baseline."}
              </div>
            </div>

            <div className="cost-summary-level-total">
              <span className="cost-summary-level-total-label">Total</span>
              <span className="cost-summary-level-total-value">
                {formatMoney(
                  scaleAnnualValue(
                    activeLevel.total,
                    timeScale,
                    recovery_hours_total
                  )
                )}
                <span className="cost-summary-level-total-suffix">
                  {getTimeScaleSuffix(timeScale)}
                </span>
              </span>
            </div>
          </div>

          <CostBar
            items={activeItems}
            total={activeLevel.total}
            timeScale={timeScale}
            totalRecoveryHours={recovery_hours_total}
            hoveredItemKey={hoveredItemKey}
            onHoverItem={setHoveredItemKey}
            onClearHover={() => setHoveredItemKey("")}
            onSelect={handleSelectLevel}
          />

          <div className="cost-summary-drill-list">
            {activeItems.map((item) => (
              <DrillRow
                key={item.key}
                item={item}
                parentTotal={activeLevel.total}
                total_cost_burden={total_cost_burden_annual}
                timeScale={timeScale}
                totalRecoveryHours={recovery_hours_total}
                hoveredItemKey={hoveredItemKey}
                onHoverItem={setHoveredItemKey}
                onClearHover={() => setHoveredItemKey("")}
                onSelect={handleSelectLevel}
              />
            ))}
          </div>

          <div className="cost-summary-insight">
            <div className="ui-kicker">Plain-language read</div>
            <div className="ui-help">{insight}</div>
          </div>
        </div>

        <div className="ui-panel ui-stack-sm">
          <div className="ui-kicker">Baseline Inputs</div>
          <div className="ui-card-title-sm">What this is based on</div>

          <div className="labour-summary-table">
            <div className="labour-summary-table-row">
              <div className="labour-summary-table-label">
                Total Operating Cost
              </div>
              <div className="labour-summary-table-value">
                {formatMoney(total_cost_burden_annual)}
              </div>
            </div>

            <div className="labour-summary-table-row">
              <div className="labour-summary-table-label">
                Operating Recovery Hours
              </div>
              <div className="labour-summary-table-value">
                {formatNumber(recovery_hours_total)} hrs
              </div>
            </div>

            <div className="labour-summary-table-row total">
              <div className="labour-summary-table-label">
                Required Recovery Rate
              </div>
              <div className="labour-summary-table-value">
                {formatMoney(required_recovery_rate_hourly)} / hr
              </div>
            </div>
          </div>

          <div className="ui-help">
            The selected period changes the display scale only. The baseline is
            still built from total operating cost and operating recovery hours.
            This is your break-even cost baseline. Materials and profit sit on
            top.
          </div>
        </div>
      </div>
    </section>
  );
}