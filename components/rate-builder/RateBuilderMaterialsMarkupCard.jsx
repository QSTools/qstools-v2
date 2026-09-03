"use client";

import {
  format_currency,
  format_percent,
} from "@/lib/calculations/rateBuilderLabourRateCalculations";

export default function RateBuilderMaterialsMarkupCard({
  total_cogs,
  materials_markup_percent,
  materials_margin_percent,
  sell_revenue,
  profit,
  has_cogs,
  actions,
}) {
  return (
    <div className="rate-builder-result-card">
      <p className="rate-builder-result-label">Materials &amp; subcontractor markup</p>
      <p className="rate-builder-help-text">
        Markup is the % you add on top of cost to set your price. Margin is
        the % of that final price that ends up as profit. They describe the
        same profit in two different ways &mdash; a 10% markup always works
        out to a slightly lower margin %, because margin is measured against
        the bigger sell price, not the smaller cost.
      </p>

      {!has_cogs && (
        <p className="rate-builder-help-text">
          No Cost of Sales found in your P&amp;L yet. Add direct costs on the
          P&amp;L page to see a markup calculation here.
        </p>
      )}

      <div className="rate-builder-labour-breakdown">
        <div className="rate-builder-labour-breakdown__row">
          <span>Total Cost of Sales (from P&amp;L)</span>
          <strong>{format_currency(total_cogs)}</strong>
        </div>

        <div className="rate-builder-labour-breakdown__row">
          <span>
            Markup %
            <br />
            <small>The number you enter. Drives the calculation.</small>
          </span>
          <input
            type="number"
            step="0.01"
            className="rate-builder-input"
            value={materials_markup_percent === 0 ? "" : materials_markup_percent}
            onChange={(event) =>
              actions.update_markup_percent(event.target.value)
            }
          />
        </div>

        <div className="rate-builder-labour-breakdown__row">
          <span>
            Margin %
            <br />
            <small>Calculated from markup. Read-only.</small>
          </span>
          <strong>{format_percent(materials_margin_percent)}</strong>
        </div>

        <div className="rate-builder-labour-breakdown__row">
          <span>Sell revenue</span>
          <strong>{format_currency(sell_revenue)}</strong>
        </div>

        <div className="rate-builder-labour-breakdown__row">
          <span>Profit</span>
          <strong>{format_currency(profit)}</strong>
        </div>
      </div>
    </div>
  );
}
