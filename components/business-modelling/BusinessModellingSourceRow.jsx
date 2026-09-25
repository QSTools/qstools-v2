// components/business-modelling/BusinessModellingSourceRow.jsx
// One lever-able source: breakeven (floor) / achieved today (start) /
// entered rate (ceiling), a target input, and that source's effect on net
// profit. Effect = (target - achieved) x covered hours (materials: % of COGS).
import { formatRate, formatSignedMoney } from "@/components/business-modelling/businessModellingFormat";

const STATUS_PILLS = {
  carrying_loss: { className: "ui-pill ui-pill-warning", text: "Carrying a loss today" },
  no_covered_hours: { className: "ui-pill ui-pill-bad", text: "No covered hours" },
  no_cogs: { className: "ui-pill ui-pill-bad", text: "No cost of goods" },
};

function Line({ label, children }) {
  return (
    <div className="ui-row-between">
      <span className="theme-text-secondary">{label}</span>
      <span className="ui-collapsible-value">{children}</span>
    </div>
  );
}

function format_dollars(v) {
  const x = Number(v);
  if (!Number.isFinite(x)) return "-";
  return x.toLocaleString("en-NZ", { style: "currency", currency: "NZD", maximumFractionDigits: 0 });
}

export default function BusinessModellingSourceRow({ row, value, effect, onChange }) {
  const unit = row.kind === "materials" ? "percent" : "hour";
  const is_overhead = row.kind === "overhead";
  const pill = STATUS_PILLS[row.status] || null;
  const target = value === undefined || String(value).trim() === "" ? null : Number(value);
  const above_ceiling =
    target !== null && Number.isFinite(target) && row.ceiling_rate !== null && target > row.ceiling_rate;
  const ceiling_below_floor =
    row.ceiling_rate !== null && row.floor_rate !== null && row.ceiling_rate < row.floor_rate;
  const input_id = "bm-lever-" + row.row_id;

  return (
    <div className="ui-section-muted ui-stack-sm">
      <div className="ui-row-between">
        <div className="ui-card-title-sm">{row.label}</div>
        {pill ? <span className={pill.className}>{pill.text}</span> : null}
      </div>
      {row.kind === "assets" ? (
        <p className="ui-help">{row.source_name} - one rate for the unit, priced on the hours its labour covers.</p>
      ) : null}

      {is_overhead ? (
        <>
          <p className="ui-help">
            Annual cost from General Overheads. Lower it to see what a cut does to net profit - your real overhead
            figures are not changed.
          </p>
          <Line label="Current annual cost">{format_dollars(row.start_rate)}</Line>
        </>
      ) : (
        <>
          <Line label="Breakeven (floor)">{formatRate(row.floor_rate, unit)}</Line>
          <Line label={row.kind === "materials" ? "Achieved today (paid at cost)" : "Achieved today (start)"}>
            {formatRate(row.start_rate, unit)}
          </Line>
          <Line label="Entered rate (ceiling)">{formatRate(row.ceiling_rate, unit)}</Line>
        </>
      )}

      {ceiling_below_floor ? (
        <p className="ui-help">Your entered rate is below breakeven - billing every hour at it still loses money.</p>
      ) : null}
      {row.status === "carrying_loss" ? (
        <p className="ui-help">
          This source carries part of its unit&apos;s loss, so what it achieves today is negative. Raising it to $0/hr only
          clears that loss.
        </p>
      ) : null}

      {row.leverable ? (
        <div className="ui-field">
          <label className="ui-label" htmlFor={input_id}>
            {is_overhead ? "Modelled annual cost ($)" : unit === "percent" ? "Target markup (%)" : "Target rate ($/hr)"}
          </label>
          <input
            id={input_id}
            className="ui-input"
            type="number"
            inputMode="decimal"
            step={is_overhead ? "100" : unit === "percent" ? "0.5" : "1"}
            value={value ?? ""}
            placeholder={row.start_rate === null ? "" : Number(row.start_rate).toFixed(2)}
            onChange={(event) => onChange(row.row_id, event.target.value)}
          />
        </div>
      ) : (
        <p className="ui-help">
          {row.kind === "materials"
            ? "No cost of goods recorded - nothing to mark up."
            : "No lever - this source earns nothing until labour covers its hours."}
        </p>
      )}

      {effect !== undefined ? (
        <Line label="Effect on net profit">
          <span className={effect >= 0 ? "value-good" : "value-bad"}>{formatSignedMoney(effect)}</span>
        </Line>
      ) : null}
      {above_ceiling ? (
        <p className="ui-help">Above your entered rate: a real price rise, assumed billed in full.</p>
      ) : null}
    </div>
  );
}