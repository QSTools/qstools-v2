function to_number(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function format_currency(value) {
  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(to_number(value));
}

function format_number(value) {
  return new Intl.NumberFormat("en-NZ", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(to_number(value));
}

function format_percent(value) {
  return `${format_number(value)}%`;
}

function display_value(value, type = "text") {
  if (value === undefined || value === null || value === "") return "n/a";

  if (Array.isArray(value)) {
    return value.length ? value.join(", ") : "none";
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  if (type === "currency") return format_currency(value);
  if (type === "number") return format_number(value);
  if (type === "percent") return format_percent(value);

  return String(value);
}

function DiagnosticRow({ label, value, type = "text" }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[var(--border-primary)] py-3 last:border-b-0">
      <span className="ui-label">{label}</span>
      <span className="max-w-[60%] break-words text-right text-sm font-semibold text-[var(--text-primary)]">
        {display_value(value, type)}
      </span>
    </div>
  );
}

export default function ModelReadinessDiagnosticSection({
  kicker,
  description,
  rows = [],
}) {
  return (
    <section className="ui-section">
      <div className="ui-panel ui-stack-sm">
        <div>
          <div className="ui-kicker">{kicker}</div>
          <p className="ui-help">{description}</p>
        </div>

        <div className="ui-panel">
          {rows.map(([label, value, type]) => (
            <DiagnosticRow
              key={label}
              label={label}
              value={value}
              type={type}
            />
          ))}
        </div>
      </div>
    </section>
  );
}