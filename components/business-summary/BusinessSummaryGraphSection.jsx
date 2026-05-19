"use client";

import {
  BusinessCompositionBar,
  BusinessCompositionRow,
  BusinessReferenceRow,
  BusinessSummaryBreadcrumb,
} from "@/components/business-summary/BusinessSummaryCompositionGraph";
import { formatCurrency } from "@/components/business-summary/BusinessSummaryCardUtils";

export default function BusinessSummaryGraphSection({
  active_bar_items = [],
  active_bar_total = 0,
  active_children = [],
  active_level_helper = "",
  active_level_title = "",
  active_node,
  active_share_label = "revenue",
  breadcrumbs = [],
  hoveredItemKey = "",
  onClearHover,
  onHoverItem,
  onSelectBreadcrumb,
  onSelectItem,
  product_mode_active = false,
}) {
  return (
    <div className="ui-stack-sm">
      <BusinessSummaryBreadcrumb
        crumbs={breadcrumbs}
        onSelectCrumb={onSelectBreadcrumb}
      />
      <div className="ui-kicker">{active_level_title}</div>
      {active_level_helper ? (
        <div className="ui-help">{active_level_helper}</div>
      ) : null}
      <div className="cost-summary-level-total">
        <span className="cost-summary-level-total-label">
          {active_node.key === "business-result"
            ? product_mode_active
              ? "Revenue"
              : "Revenue Generated"
            : active_node.label}
        </span>
        <span className="cost-summary-level-total-value">
          {formatCurrency(active_node.value)}
          <span className="cost-summary-level-total-suffix">
            {active_node.suffix}
          </span>
        </span>
      </div>

      <BusinessCompositionBar
        items={active_bar_items}
        total={active_bar_total}
        hoveredItemKey={hoveredItemKey}
        onHoverItem={onHoverItem}
        onClearHover={onClearHover}
        onSelectItem={onSelectItem}
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
              onHoverItem={onHoverItem}
              onClearHover={onClearHover}
              onSelectItem={onSelectItem}
              shareLabel={active_share_label}
            />
          )
        )}
      </div>
    </div>
  );
}
