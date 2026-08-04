export function formatMoney(value) {
  return `$${Number(value || 0).toLocaleString("en-NZ", {
    maximumFractionDigits: 0,
  })}`;
}

export function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-NZ", {
    maximumFractionDigits: 0,
  });
}

export function formatPercent(value) {
  return `${Number(value || 0).toFixed(1)}%`;
}

export function yesNo(value) {
  return value ? "Yes" : "No";
}

export function TableSectionHeading({ label }) {
  return (
    <div className="labour-summary-table-row total">
      <div className="labour-summary-table-label">
        <div>{label}</div>
      </div>
      <div className="labour-summary-table-value" />
    </div>
  );
}

export function TableRow({ label, value, help, total = false, highlight = false }) {
  return (
    <div
      className={`labour-summary-table-row ${total ? "total" : ""} ${
        highlight ? "highlight" : ""
      }`}
    >
      <div className="labour-summary-table-label">
        <div>{label}</div>
        {help ? <div className="ui-help">{help}</div> : null}
      </div>

      <div
        className={`labour-summary-table-value ${
          highlight ? "text-cyan-300 font-semibold" : ""
        }`}
      >
        {value ?? "Not available"}
      </div>
    </div>
  );
}

export function TableBlock({ title, help_text, children }) {
  return (
    <div className="ui-readonly">
      <div className="ui-stack-sm">
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            {title}
          </p>
          {help_text ? <p className="ui-help">{help_text}</p> : null}
        </div>

        <div className="labour-summary-table">{children}</div>
      </div>
    </div>
  );
}

export function WarningList({ warnings = [], empty_message }) {
  if (!Array.isArray(warnings) || warnings.length === 0) {
    return (
      <div className="ui-readonly">
        <p className="text-sm font-medium text-[var(--text-primary)]">
          {empty_message}
        </p>
      </div>
    );
  }

  return (
    <div className="ui-stack-sm">
      {warnings.map((warning, index) => (
        <div key={`warning-${index}`} className="ui-readonly">
          <div className="text-sm font-medium text-[var(--text-primary)]">
            {warning?.title ||
              warning?.label ||
              warning?.warning_key ||
              warning?.key ||
              "Warning"}
          </div>

          <div className="mt-1 text-sm text-[var(--text-secondary)]">
            {warning?.message || warning?.description || String(warning)}
          </div>
        </div>
      ))}
    </div>
  );
}
