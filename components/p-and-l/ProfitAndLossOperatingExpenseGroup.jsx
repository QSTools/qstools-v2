"use client";

import CollapsibleSection from "@/components/common/CollapsibleSection";
import ProfitAndLossLineEditor from "@/components/p-and-l/operating-expenses/ProfitAndLossLineEditor";
import {
  format_money,
  get_line_amount_total,
} from "@/components/p-and-l/operating-expenses/operatingExpenseFormatting";

export default function ProfitAndLossOperatingExpenseGroup({
  title,
  help,
  lines = [],
  actions,
  handle_line_name_change,
  get_suggested_category_text,
  defaultOpen = false,
}) {
  const subtotal = get_line_amount_total(lines);

  if (lines.length === 0) return null;

  return (
    <CollapsibleSection
      title={title}
      summary={format_money(subtotal)}
      defaultOpen={defaultOpen}
    >
      <div className="ui-stack-sm">
        <div className="ui-panel ui-stack-sm">
          <span className="ui-label">Group Guidance</span>
          <p className="ui-help">{help}</p>
        </div>

        {lines.map((line) => (
          <ProfitAndLossLineEditor
            key={line.pnl_line_id}
            line={line}
            actions={actions}
            handle_line_name_change={handle_line_name_change}
            get_suggested_category_text={get_suggested_category_text}
          />
        ))}

        <div className="ui-panel ui-row-between">
          <span className="ui-label">{title} subtotal</span>
          <strong>{format_money(subtotal)}</strong>
        </div>
      </div>
    </CollapsibleSection>
  );
}
