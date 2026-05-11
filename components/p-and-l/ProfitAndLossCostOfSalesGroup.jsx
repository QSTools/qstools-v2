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

  return (
    <CollapsibleSection
      title={group.title}
      summary={`${format_money(subtotal)} · ${group.lines.length} ${line_label}`}
      defaultOpen={group.defaultOpen}
    >
      <div className="ui-stack-sm">
        <div className="ui-panel ui-stack-sm">
          <span className="ui-label">{group.title}</span>
          <p className="ui-help">{group.help}</p>
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
