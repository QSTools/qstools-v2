"use client";

import { useState } from "react";

function formatCurrency(value) {
  const number = Number(value) || 0;

  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    maximumFractionDigits: 0,
  }).format(number);
}

function formatPercent(value) {
  const number = Number(value) || 0;

  return new Intl.NumberFormat("en-NZ", {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(number);
}

function TableRow({ label, value, total = false }) {
  return (
    <div className={`labour-summary-table-row${total ? " total" : ""}`}>
      <div className="labour-summary-table-label">{label}</div>
      <div className="labour-summary-table-value">{value}</div>
    </div>
  );
}

function DetailList({ title, empty_message, items = [] }) {
  return (
    <div className="ui-panel ui-stack-sm">
      <div className="ui-card-title-sm">{title}</div>
      {items.length > 0 ? (
        <div className="labour-summary-table">
          {items.map((item) => (
            <TableRow
              key={item.line_id || item.category_id}
              label={item.label}
              value={formatCurrency(item.amount)}
            />
          ))}
        </div>
      ) : (
        <p className="ui-help">{empty_message}</p>
      )}
    </div>
  );
}

export default function RevenueCogsCard({
  total_revenue = 0,
  total_direct_costs = 0,
  margin_pool = 0,
  gross_margin_percent = 0,
  revenue_line_items = [],
  direct_cost_categories = [],
  business_type = "labour_based",
  is_product_based = false,
  is_labour_based = true,
  units_sold_annual = 0,
  updateRevenueCogsField,
}) {
  const [detailsOpen, setDetailsOpen] = useState(true);

  return (
    <section className="ui-section">
      <div className="ui-stack">
        <div className="ui-stack-sm">
          <div className="ui-kicker">Revenue / COGS</div>
          <div className="ui-card-title">Trading margin pool</div>
          <p className="ui-help">
            Revenue less Direct Costs shows what is left before operating costs.
          </p>
        </div>

        <div className="ui-panel ui-stack-sm">
          <div className="ui-kicker">Business mode</div>
          <div className="ui-card-title-sm">
            {is_product_based
              ? "Product / Unit-based business"
              : "Service / Labour-based business"}
          </div>
          <p className="ui-help">
            {is_product_based
              ? "Revenue / COGS is using units sold as the product activity driver."
              : "Revenue / COGS is using the standard labour-based flow. Units sold is hidden in this mode."}
          </p>
          <p className="ui-help">Current stored mode: {business_type}</p>
        </div>

        {is_product_based ? (
          <div className="ui-panel ui-stack-sm">
            <div>
              <div className="ui-kicker">Product activity driver</div>
              <div className="ui-card-title-sm">Units sold per year</div>
              <p className="ui-help">
                Use the total number of products, units, subscriptions, or
                productised outputs sold in a year.
              </p>
            </div>

            <label className="form-field ui-stack-sm">
              <span>Units sold per year</span>
              <input
                className="ui-input"
                type="number"
                min="0"
                step="1"
                value={units_sold_annual}
                onChange={(event) =>
                  updateRevenueCogsField(
                    "units_sold_annual",
                    event.target.value
                  )
                }
              />
            </label>
          </div>
        ) : null}

        <div className="ui-panel ui-stack-sm">
          <div className="ui-kicker">Macro Result</div>
          <div className="labour-summary-table">
            <TableRow label="Revenue" value={formatCurrency(total_revenue)} />
            <TableRow
              label="Direct Costs"
              value={formatCurrency(total_direct_costs)}
            />
            <TableRow
              label="Margin Pool"
              value={formatCurrency(margin_pool)}
              total
            />
            <TableRow
              label="Gross Margin %"
              value={formatPercent(gross_margin_percent)}
            />
          </div>
        </div>

        <div className="ui-panel ui-stack-sm">
          <div className="ui-split">
            <div className="ui-stack-sm">
              <div className="ui-kicker">Supporting Detail</div>
              <div className="ui-card-title-sm">P&amp;L classification view</div>
              <p className="ui-help">
                Display-only detail from P&amp;L revenue lines and direct cost
                category totals.
              </p>
            </div>

            <div className="ui-actions">
              <button
                type="button"
                onClick={() => setDetailsOpen((prev) => !prev)}
                className="ui-button-secondary"
              >
                {detailsOpen ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {detailsOpen ? (
            <div className="ui-stack">
              <DetailList
                title="Revenue Lines"
                items={revenue_line_items}
                empty_message="No revenue lines are available from P&L."
              />
              <DetailList
                title="Direct Cost Categories"
                items={direct_cost_categories}
                empty_message="No direct cost category totals are available from P&L."
              />
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}