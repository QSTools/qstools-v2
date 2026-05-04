"use client";

const QUOTE_STATUSES = [
  "draft",
  "issued",
  "revised",
  "accepted",
  "rejected",
  "expired",
  "cancelled",
  "archived",
];

function quoteFieldValue(value) {
  return value === undefined || value === null ? "" : value;
}

export default function QuoteEngineMainCard({ quote_state, update_field }) {
  return (
    <section className="ui-section">
      <div className="ui-card ui-stack-sm">
        <div className="ui-card-title">Quote entry</div>
        <p className="ui-help">
          Enter the key quote details and cost build-up. This remains a quick
          quote review flow, not a full estimating system.
        </p>

        <div className="ui-panel ui-grid-2">
          <div>
            <span className="ui-label">Quote ID</span>
            <input
              className="ui-input"
              value={quoteFieldValue(quote_state.quote_id)}
              onChange={(event) => update_field("quote_id", event.target.value)}
              placeholder="Quote ID"
            />
          </div>

          <div>
            <span className="ui-label">Job ID</span>
            <input
              className="ui-input"
              value={quoteFieldValue(quote_state.job_id)}
              onChange={(event) => update_field("job_id", event.target.value)}
              placeholder="Job ID"
            />
          </div>

          <div>
            <span className="ui-label">Job name</span>
            <input
              className="ui-input"
              value={quoteFieldValue(quote_state.job_name)}
              onChange={(event) => update_field("job_name", event.target.value)}
              placeholder="Job name"
            />
          </div>

          <div>
            <span className="ui-label">Quote name</span>
            <input
              className="ui-input"
              value={quoteFieldValue(quote_state.quote_name)}
              onChange={(event) => update_field("quote_name", event.target.value)}
              placeholder="Quote name"
            />
          </div>

          <div>
            <span className="ui-label">Quote reference</span>
            <input
              className="ui-input"
              value={quoteFieldValue(quote_state.quote_reference)}
              onChange={(event) =>
                update_field("quote_reference", event.target.value)
              }
              placeholder="Quote reference"
            />
          </div>

          <div>
            <span className="ui-label">Quote date</span>
            <input
              className="ui-input"
              type="date"
              value={quoteFieldValue(quote_state.quote_date)}
              onChange={(event) => update_field("quote_date", event.target.value)}
            />
          </div>

          <div>
            <span className="ui-label">Quote status</span>
            <select
              className="ui-input"
              value={quoteFieldValue(quote_state.quote_status)}
              onChange={(event) => update_field("quote_status", event.target.value)}
            >
              {QUOTE_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div>
            <span className="ui-label">Quote version</span>
            <input
              className="ui-input"
              value={quoteFieldValue(quote_state.quote_version)}
              onChange={(event) => update_field("quote_version", event.target.value)}
              placeholder="Version"
            />
          </div>
        </div>

        <div className="ui-panel ui-grid-2">
          <div>
            <span className="ui-label">Quote price total</span>
            <input
              className="ui-input"
              type="number"
              step="0.01"
              value={quoteFieldValue(quote_state.quote_price_total)}
              onChange={(event) => update_field("quote_price_total", event.target.value)}
              placeholder="0"
            />
          </div>

          <div>
            <span className="ui-label">Material cost total</span>
            <input
              className="ui-input"
              type="number"
              step="0.01"
              value={quoteFieldValue(quote_state.material_cost_total)}
              onChange={(event) => update_field("material_cost_total", event.target.value)}
              placeholder="0"
            />
          </div>

          <div>
            <span className="ui-label">Material sell total</span>
            <input
              className="ui-input"
              type="number"
              step="0.01"
              value={quoteFieldValue(quote_state.material_sell_total)}
              onChange={(event) => update_field("material_sell_total", event.target.value)}
              placeholder="0"
            />
          </div>

          <div>
            <span className="ui-label">Material markup %</span>
            <input
              className="ui-input"
              type="number"
              step="0.01"
              value={quoteFieldValue(quote_state.material_markup_percent)}
              onChange={(event) => update_field("material_markup_percent", event.target.value)}
              placeholder="0"
            />
          </div>

          <div>
            <span className="ui-label">Labour charge-out rate</span>
            <input
              className="ui-input"
              type="number"
              step="0.01"
              value={quoteFieldValue(quote_state.labour_charge_out_rate)}
              onChange={(event) => update_field("labour_charge_out_rate", event.target.value)}
              placeholder="0"
            />
          </div>

          <div>
            <span className="ui-label">Labour sell total</span>
            <input
              className="ui-input"
              type="number"
              step="0.01"
              value={quoteFieldValue(quote_state.labour_sell_total)}
              onChange={(event) => update_field("labour_sell_total", event.target.value)}
              placeholder="0"
            />
          </div>

          <div>
            <span className="ui-label">Base labour hours allowed</span>
            <input
              className="ui-input"
              type="number"
              step="1"
              value={quoteFieldValue(quote_state.base_labour_hours_allowed)}
              onChange={(event) => update_field("base_labour_hours_allowed", event.target.value)}
              placeholder="0"
            />
          </div>

          <div>
            <span className="ui-label">Direct cost package allowance</span>
            <input
              className="ui-input"
              type="number"
              step="0.01"
              value={quoteFieldValue(quote_state.direct_cost_package_allowance_total)}
              onChange={(event) =>
                update_field("direct_cost_package_allowance_total", event.target.value)
              }
              placeholder="0"
            />
          </div>

          <div>
            <span className="ui-label">Direct cost package cost</span>
            <input
              className="ui-input"
              type="number"
              step="0.01"
              value={quoteFieldValue(quote_state.direct_cost_package_cost_total)}
              onChange={(event) =>
                update_field("direct_cost_package_cost_total", event.target.value)
              }
              placeholder="0"
            />
          </div>
        </div>

        <div className="ui-panel ui-stack-sm">
          <p className="ui-help">
            Labour sell total is derived from the charge-out rate and allowed hours when left blank.
          </p>
          <p className="ui-help">
            The Quote Engine uses material cost, labour cost, direct cost packages, and the business recovery rate to test whether this quote can carry the model.
          </p>
          <div className="ui-row-between">
            <div>
              <span className="ui-label">Created</span>
              <div>{quoteFieldValue(quote_state.created_at)}</div>
            </div>
            <div>
              <span className="ui-label">Updated</span>
              <div>{quoteFieldValue(quote_state.updated_at)}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
