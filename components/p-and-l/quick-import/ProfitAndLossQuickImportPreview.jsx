export default function ProfitAndLossQuickImportPreview({
  draft_import,
  handle_confirm_import,
  section_counts,
}) {
  if (!draft_import) {
    return null;
  }

  return (
    <div className="ui-panel ui-stack-sm">
      <div className="ui-kicker">Import preview</div>

      {draft_import.source_file ? (
        <p className="ui-help">
          Source: <strong>{draft_import.source_file}</strong>
        </p>
      ) : null}

      <div className="labour-summary-table">
        <div className="labour-summary-table-row">
          <div className="labour-summary-table-label">Trading income</div>
          <div className="labour-summary-table-value">
            {section_counts.trading_income}
          </div>
        </div>

        <div className="labour-summary-table-row">
          <div className="labour-summary-table-label">Cost of sales</div>
          <div className="labour-summary-table-value">
            {section_counts.cost_of_sales}
          </div>
        </div>

        <div className="labour-summary-table-row">
          <div className="labour-summary-table-label">Other income</div>
          <div className="labour-summary-table-value">
            {section_counts.other_income}
          </div>
        </div>

        <div className="labour-summary-table-row">
          <div className="labour-summary-table-label">
            Operating expenses
          </div>
          <div className="labour-summary-table-value">
            {section_counts.operating_expenses}
          </div>
        </div>
      </div>

      <div className="ui-stack-sm">
        {draft_import.pnl_lines.slice(0, 12).map((line) => (
          <div key={line.pnl_line_id} className="ui-panel ui-stack-sm">
            <div className="ui-label">{line.line_name}</div>
            <div className="ui-help">
              {line.section} · {line.category}
              {line.direct_cost_category_id
                ? ` · ${line.direct_cost_category_id}`
                : ""}
            </div>
            <div className="ui-help">Amount: {line.amount}</div>
          </div>
        ))}
      </div>

      {draft_import.pnl_lines.length > 12 ? (
        <p className="ui-help">
          Showing first 12 of {draft_import.pnl_lines.length} imported
          lines.
        </p>
      ) : null}

      {draft_import.unmatched_lines?.length > 0 ? (
        <div className="ui-panel ui-stack-sm theme-warn-soft">
          <div className="ui-kicker theme-warn">Import warnings</div>
          {draft_import.unmatched_lines.slice(0, 8).map((line, index) => (
            <div key={`${line}_${index}`} className="ui-help">
              {line}
            </div>
          ))}
        </div>
      ) : null}

      <div className="ui-actions">
        <button
          type="button"
          className="ui-button-primary"
          onClick={handle_confirm_import}
        >
          Confirm Import
        </button>
      </div>
    </div>
  );
}
