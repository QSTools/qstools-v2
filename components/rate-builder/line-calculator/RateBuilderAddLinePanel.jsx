import { UNIT_OPTIONS } from "./rateBuilderLineCalculatorConstants";

export default function RateBuilderAddLinePanel({
  addRateLine,
  draft_line,
  updateDraftField,
}) {
  return (
        <article className="ui-section">
          <p className="ui-kicker">Rate setup</p>

          <h2 className="ui-section-title">Add customer charge line</h2>

          <p className="ui-help">
            Create the charge lines this calculator uses. Each line has a name,
            unit, rate, and example quantity.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="ui-field sm:col-span-2">
              <span className="ui-label">Line item name</span>

              <input
                type="text"
                value={draft_line.name}
                onChange={(event) =>
                  updateDraftField("name", event.target.value)
                }
                placeholder="Example: Setup fee"
                className="ui-input"
              />
            </label>


            <label className="ui-field">
              <span className="ui-label">Unit</span>

              <select
                value={draft_line.unit}
                onChange={(event) =>
                  updateDraftField("unit", event.target.value)
                }
                className="ui-select"
              >
                {UNIT_OPTIONS.map((unit) => (
                  <option key={unit.value} value={unit.value}>
                    {unit.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="ui-field">
              <span className="ui-label">Rate</span>

              <input
                type="number"
                value={draft_line.rate}
                onChange={(event) =>
                  updateDraftField("rate", event.target.value)
                }
                placeholder="Example: 135"
                className="ui-input"
              />
            </label>

            <label className="ui-field">
              <span className="ui-label">Example job quantity</span>

              <input
                type="number"
                value={draft_line.quantity ?? ""}
                onChange={(event) =>
                  updateDraftField("quantity", event.target.value)
                }
                placeholder="Example: 3"
                className="ui-input"
              />
            </label>
          </div>

          <button
            type="button"
            onClick={addRateLine}
            className="ui-button-primary mt-5"
          >
            Add line item
          </button>
        </article>
  );
}
