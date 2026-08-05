import { formatCostSummaryPercent } from "@/lib/selectors/costSummarySelectors";
import {
  calculateShare,
  formatMoney,
  getTimeScaleSuffix,
  scaleAnnualValue,
  toNumber,
} from "@/components/cost-summary/cost-summary-card/costSummaryFormatters";

export function CostBar({
  items,
  total,
  timeScale,
  totalRecoveryHours,
  openHours = 0,
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
          totalRecoveryHours,
          openHours
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

export function DrillRow({
  item,
  parentTotal,
  total_cost_burden,
  timeScale,
  totalRecoveryHours,
  openHours = 0,
  hoveredItemKey,
  onHoverItem,
  onClearHover,
  onSelect,
}) {
  const hasChildren = Array.isArray(item.children) && item.children.length > 0;
  const scaledValue = scaleAnnualValue(
    item.amount,
    timeScale,
    totalRecoveryHours,
    openHours
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

export function Breadcrumb({ path, onSelect }) {
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
