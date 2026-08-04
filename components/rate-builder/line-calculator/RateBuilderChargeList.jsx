import { formatCurrency } from "@/lib/calculations/rateBuilderCalculations";

import { UNIT_OPTIONS } from "./rateBuilderLineCalculatorConstants";

export default function RateBuilderChargeList({
  deleteRateLine,
  display_calculator_name,
  rate_lines,
  setOutputDriver,
  updateRateLine,
}) {
  return (
      <article className="rate-builder-calculator__right ui-section">

        <h2 className="ui-section-title">{display_calculator_name}</h2>

        <p className="ui-help">
          Select one line as the primary output driver. The total charge will be
          divided by that line quantity to calculate the effective rate.
        </p>

        <div className="rate-builder-charge-list mt-5">
          {rate_lines.map((line) => (
            <div
              key={line.id}
              className={`rate-builder-charge-card ${
                line.is_output_driver
                  ? "rate-builder-charge-card--selected"
                  : ""
              }`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Output driver
                  </p>

                  <button
                    type="button"
                    onClick={() => setOutputDriver(line.id)}
                    className={`rate-builder-output-pill mt-2 ${
                      line.is_output_driver
                        ? "rate-builder-output-pill--selected"
                        : ""
                    }`}
                  >
                    {line.is_output_driver
                      ? "Selected output driver"
                      : "Click to use as output driver"}
                  </button>
                </div>

                <span
                  role="button"
                  tabIndex={0}
                  onClick={(event) => {
                    event.stopPropagation();
                    deleteRateLine(line.id);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      event.stopPropagation();
                      deleteRateLine(line.id);
                    }
                  }}
                  className="rate-builder-delete-action"
                >
                  Delete
                </span>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-[1.5fr_1fr]">
                <label
                  className="ui-field"
                  onClick={(event) => event.stopPropagation()}
                >
                  <span className="ui-label">Line item</span>

                  <input
                    type="text"
                    value={line.name}
                    onChange={(event) =>
                      updateRateLine(line.id, "name", event.target.value)
                    }
                    className="ui-input"
                  />
                </label>

                <label
                  className="ui-field"
                  onClick={(event) => event.stopPropagation()}
                >
                  <span className="ui-label">Unit</span>

                  <select
                    value={line.unit}
                    onChange={(event) =>
                      updateRateLine(line.id, "unit", event.target.value)
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
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_1fr]">
                <label
                  className="ui-field"
                  onClick={(event) => event.stopPropagation()}
                >
                  <span className="ui-label">Rate</span>

                  <input
                    type="number"
                    value={line.rate}
                    onChange={(event) =>
                      updateRateLine(line.id, "rate", event.target.value)
                    }
                    className="ui-input"
                  />
                </label>

                <label
                  className="ui-field"
                  onClick={(event) => event.stopPropagation()}
                >
                  <span className="ui-label">Example job quantity</span>

                  <input
                    type="number"
                    value={line.quantity}
                    onChange={(event) =>
                      updateRateLine(line.id, "quantity", event.target.value)
                    }
                    className="ui-input"
                  />
                </label>

                <div
                  className="ui-field"
                  onClick={(event) => event.stopPropagation()}
                >
                  <span className="ui-label">Line total</span>

                  <div className="ui-readonly">
                    {formatCurrency(Number(line.rate) * Number(line.quantity))}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {rate_lines.length === 0 ? (
            <div className="ui-panel text-sm text-slate-400">
              No charge lines have been added yet.
            </div>
          ) : null}
        </div>
      </article>
  );
}
