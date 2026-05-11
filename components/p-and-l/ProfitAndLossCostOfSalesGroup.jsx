"use client";

import CollapsibleSection from "@/components/common/CollapsibleSection";
import ProfitAndLossCostOfSalesLineRow from "@/components/p-and-l/ProfitAndLossCostOfSalesLineRow";
import {
  format_money,
  get_line_amount_total,
} from "@/lib/p-and-l/profitAndLossFormatters";

export default function ProfitAndLossCostOfSalesGroup({
  group,
  state,
  actions,
  handle_line_name_change,
}) {
  const subtotal = get_line_amount_total(group.lines);
  const line_label = group.lines.length === 1 ? "line" : "lines";
  const can_delete_category = group.is_custom && group.lines.length === 0;

  function handle_delete_category() {
    if (!can_delete_category) return;

    const next_categories = (state.direct_cost_categories ?? []).filter(
      (category) => category.category_id !== group.group_key,
    );

    actions.update_profit_and_loss_field(
      "direct_cost_categories",
      next_categories,
    );
  }

  return (
    <CollapsibleSection
      title={group.title}
      summary={`${format_money(subtotal)} · ${group.lines.length} ${line_label}`}
      defaultOpen={group.defaultOpen}
    >
      <div className="ui-stack-sm">
        <div className="ui-panel ui-stack-sm">
          <div className="ui-row-between">
            <div className="ui-stack-sm">
              <span className="ui-label">{group.title}</span>
              <p className="ui-help">{group.help}</p>
            </div>

            {group.is_custom ? (
              <button
                type="button"
                className="ui-button-secondary"
                onClick={handle_delete_category}
                disabled={!can_delete_category}
                title={
                  can_delete_category
                    ? "Delete this custom category"
                    : "Move or remove all lines before deleting this category"
                }
              >
                Delete Category
              </button>
            ) : null}
          </div>

          {group.is_custom && !can_delete_category ? (
            <p className="ui-help">
              This custom category cannot be deleted while it still contains
              lines. Move those lines to another Cost of Sales category first.
            </p>
          ) : null}
        </div>

        {group.lines.map((line) => (
          <ProfitAndLossCostOfSalesLineRow
            key={line.pnl_line_id}
            line={line}
            state={state}
            actions={actions}
            handle_line_name_change={handle_line_name_change}
          />
        ))}

        <div className="ui-panel ui-row-between">
          <span className="ui-label">{group.title} subtotal</span>
          <strong>{format_money(subtotal)}</strong>
        </div>
      </div>
    </CollapsibleSection>
  );
}