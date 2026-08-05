export default function ProfitAndLossQuickImportJsonPanel({
  error_message,
  handle_clear,
  handle_parse,
  import_message,
  raw_text,
  set_raw_text,
}) {
  return (
    <div className="ui-panel ui-stack-sm">
      <div className="ui-label">Optional: paste extracted P&amp;L JSON</div>
      <textarea
        className="ui-input"
        rows={8}
        value={raw_text}
        onChange={(event) => set_raw_text(event.target.value)}
        placeholder={`{
  "financial_year": 2026,
  "period_month": "",
  "line_items": [
    { "line_name": "Sales", "amount": 1250000 },
    { "line_name": "Concrete Testing", "amount": 8500, "section": "cost_of_sales" }
  ]
}`}
      />

      <div className="ui-actions">
        <button
          type="button"
          className="ui-button-secondary"
          onClick={handle_parse}
        >
          Parse JSON
        </button>

        <button
          type="button"
          className="ui-button-secondary"
          onClick={handle_clear}
        >
          Clear
        </button>
      </div>

      {error_message ? (
        <p className="ui-help theme-danger">{error_message}</p>
      ) : null}

      {import_message ? (
        <p className="ui-help">
          <strong>{import_message}</strong>
        </p>
      ) : null}
    </div>
  );
}
