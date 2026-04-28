"use client";

import CollapsibleSection from "@/components/common/CollapsibleSection";

function format_currency(value) {
  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function SummaryRow({ label, amount_display }) {
  return (
    <div className="labour-summary-table-row">
      <div className="labour-summary-table-label">{label}</div>
      <div className="labour-summary-table-value">{amount_display}</div>
    </div>
  );
}

export default function GeneralOverheadSummaryCard({
  total_general_overheads,
  total_general_overheads_display,
  grouped_overhead_rows = [],
  output_contract,
}) {
  return (
    <div className="ui-card ui-stack">
      <div className="ui-stack-sm">
        <div className="ui-kicker">Summary</div>
        <div className="ui-card-title">General Overheads Summary</div>
        <p className="ui-help">
          Locked downstream total for Cost Summary consumption.
        </p>
      </div>

      <div className="ui-panel ui-stack-sm">
        <div className="ui-label">Total General Overheads</div>
        <div className="ui-display">{total_general_overheads_display}</div>
      </div>

      <div className="ui-stack-sm">
        {grouped_overhead_rows.map((group) => (
          <CollapsibleSection
            key={group.category_key}
            title={group.category_label}
            summary={group.total_amount_display}
            defaultOpen={false}
          >
            <div className="ui-panel ui-stack-sm">
              {group.rows.length === 0 ? (
                <div className="ui-help">No items in this category yet.</div>
              ) : (
                <div className="labour-summary-table">
                  {group.rows.map((row) => (
                    <SummaryRow
                      key={row.key}
                      label={row.label}
                      amount_display={row.amount_display}
                    />
                  ))}
                </div>
              )}
            </div>
          </CollapsibleSection>
        ))}
      </div>

      <div className="ui-panel ui-stack-sm">
        <div className="ui-label">Output Contract</div>
        <div className="ui-readonly">
          total_general_overheads = {format_currency(total_general_overheads)}
        </div>

        {output_contract?.overhead_rows ? (
          <div className="ui-help">
            {output_contract.overhead_rows.length} overhead rows included in the
            current output.
          </div>
        ) : null}
      </div>
    </div>
  );
}