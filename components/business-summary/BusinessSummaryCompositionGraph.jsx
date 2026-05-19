"use client";

import {
  calculateShare,
  formatCurrency,
  formatDisplayPercent,
  hasAvailableChildren,
} from "@/components/business-summary/BusinessSummaryCardUtils";

export function BusinessCompositionBar({
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

export function BusinessCompositionRow({
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

  return <div {...commonProps}>{rowContent}</div>;
}

export function BusinessReferenceRow({ item }) {
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

export function BusinessSummaryBreadcrumb({ crumbs = [], onSelectCrumb }) {
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
