"use client";

function formatCurrency(value) {
  return Number(value || 0).toLocaleString("en-NZ", {
    style: "currency",
    currency: "NZD",
    maximumFractionDigits: 0,
  });
}

function formatPercent(value) {
  return `${Number(value || 0).toLocaleString("en-NZ", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`;
}

export default function QuoteEngineRepairPanel({
  repair_state = {},
  update_repair_field,
  repair = {},
}) {
  return (
    <section className="ui-section">
      <div className="ui-card ui-stack-sm">
        <div className="ui-card-title">Quote repair</div>
        <p className="ui-help">
          Try changes and watch the gap close.
        </p>

        <div className="ui-panel ui-grid-2">
          <div>
            <span className="ui-label">Price adjustment amount</span>
            <input
              className="ui-input"
              type="number"
              step="0.01"
              value={repair_state.price_adjustment_amount ?? 0}
              onChange={(event) =>
                update_repair_field("price_adjustment_amount", event.target.value)
              }
            />
          </div>

          <div>
            <span className="ui-label">Labour hours adjustment</span>
            <input
              className="ui-input"
              type="number"
              step="1"
              value={repair_state.labour_hours_adjustment ?? 0}
              onChange={(event) =>
                update_repair_field("labour_hours_adjustment", event.target.value)
              }
            />
          </div>

          <div>
            <span className="ui-label">Material margin adjustment %</span>
            <input
              className="ui-input"
              type="number"
              step="0.1"
              value={repair_state.material_margin_adjustment_percent ?? 0}
              onChange={(event) =>
                update_repair_field(
                  "material_margin_adjustment_percent",
                  event.target.value
                )
              }
            />
          </div>

          <div>
            <span className="ui-label">Direct cost package adjustment</span>
            <input
              className="ui-input"
              type="number"
              step="0.01"
              value={repair_state.direct_cost_package_adjustment_amount ?? 0}
              onChange={(event) =>
                update_repair_field(
                  "direct_cost_package_adjustment_amount",
                  event.target.value
                )
              }
            />
          </div>
        </div>

        <div className="ui-panel ui-row-between">
          <div>
            <span className="ui-label">Original quote gap</span>
            <div>{formatCurrency(repair.original_quote_gap)}</div>
          </div>
          <div>
            <span className="ui-label">Adjusted quote gap</span>
            <div>{formatCurrency(repair.adjusted_quote_gap)}</div>
          </div>
        </div>

        <div className="ui-panel ui-row-between">
          <div>
            <span className="ui-label">Remaining quote gap</span>
            <div>{formatCurrency(repair.remaining_quote_gap)}</div>
          </div>
          <div>
            <span className="ui-label">Gap closed amount</span>
            <div>{formatCurrency(repair.gap_closed_amount)}</div>
          </div>
        </div>

        <div className="ui-panel">
          <span className="ui-label">Gap closed percent</span>
          <div>{formatPercent(repair.gap_closed_percent)}</div>
        </div>
      </div>
    </section>
  );
}
