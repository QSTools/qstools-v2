"use client";

function format_currency(value) {
  return `$${Math.round(Number(value || 0)).toLocaleString()}`;
}

function format_percent(value) {
  return `${Number(value || 0).toFixed(1)}%`;
}

function Pill({ text, tone = "ok" }) {
  return <span className={`ui-pill ui-pill-${tone}`}>{text}</span>;
}

export default function RevenueSummarySummaryCard({
  current_revenue = 0,
  total_cost_burden = 0,
  actual_profit_model = 0,
  actual_profit_percent = 0,
  required_revenue = 0,
  revenue_gap = 0,
  health = "ok",

  total_delivery_cost = 0,
  material_cost_total_output = 0,
  operating_expenses_total_output = 0,
  gross_margin_before_operating_expenses = 0,
  pnl_net_result = 0,

  material_cost_percent_of_sales = 0,
  delivery_cost_percent_of_sales = 0,
  operating_expense_percent_of_sales = 0,
}) {
  return (
    <section className="ui-section">
      <div className="ui-panel">
        <div className="ui-stack">
          <div>
            <p className="ui-kicker">Current picture</p>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              Business baseline summary
            </h2>
            <p className="text-sm text-[var(--text-secondary)]">
              This is the high-level baseline that later pricing pages will use
              to build sustainable rates.
            </p>
          </div>

          <div className="ui-actions">
            <Pill text={`Health: ${health}`} tone={health} />
          </div>

          <div className="ui-stack">
            <div className="ui-readonly">
              <span className="ui-label">Current Revenue</span>
              <div className="text-sm font-medium text-[var(--text-primary)]">
                {format_currency(current_revenue)}
              </div>
            </div>

            <div className="ui-readonly">
              <span className="ui-label">Total Cost Burden (model)</span>
              <div className="text-sm font-medium text-[var(--text-primary)]">
                {format_currency(total_cost_burden)}
              </div>
            </div>

            <div className="ui-readonly">
              <span className="ui-label">Actual Profit (model)</span>
              <div className="text-sm font-medium text-[var(--text-primary)]">
                {format_currency(actual_profit_model)} ·{" "}
                {format_percent(actual_profit_percent)}
              </div>
            </div>

            <div className="ui-readonly">
              <span className="ui-label">Total Delivery Cost</span>
              <div className="text-sm font-medium text-[var(--text-primary)]">
                {format_currency(total_delivery_cost)}
              </div>
            </div>

            <div className="ui-readonly">
              <span className="ui-label">Material Cost</span>
              <div className="text-sm font-medium text-[var(--text-primary)]">
                {format_currency(material_cost_total_output)}
              </div>
            </div>

            <div className="ui-readonly">
              <span className="ui-label">Operating Expenses</span>
              <div className="text-sm font-medium text-[var(--text-primary)]">
                {format_currency(operating_expenses_total_output)}
              </div>
            </div>

            <div className="ui-readonly">
              <span className="ui-label">Gross Margin Before Operating Expenses</span>
              <div className="text-sm font-medium text-[var(--text-primary)]">
                {format_currency(gross_margin_before_operating_expenses)}
              </div>
            </div>

            <div className="ui-readonly">
              <span className="ui-label">P&amp;L Net Result</span>
              <div className="text-sm font-medium text-[var(--text-primary)]">
                {format_currency(pnl_net_result)}
              </div>
            </div>

            <div className="ui-readonly">
              <span className="ui-label">Material Cost % of Sales</span>
              <div className="text-sm font-medium text-[var(--text-primary)]">
                {format_percent(material_cost_percent_of_sales)}
              </div>
            </div>

            <div className="ui-readonly">
              <span className="ui-label">Delivery Cost % of Sales</span>
              <div className="text-sm font-medium text-[var(--text-primary)]">
                {format_percent(delivery_cost_percent_of_sales)}
              </div>
            </div>

            <div className="ui-readonly">
              <span className="ui-label">Operating Expense % of Sales</span>
              <div className="text-sm font-medium text-[var(--text-primary)]">
                {format_percent(operating_expense_percent_of_sales)}
              </div>
            </div>

            <div className="ui-readonly">
              <span className="ui-label">Required Revenue</span>
              <div className="text-sm font-medium text-[var(--text-primary)]">
                {format_currency(required_revenue)}
              </div>
            </div>

            <div className="ui-readonly">
              <span className="ui-label">Revenue Gap</span>
              <div className="text-sm font-medium text-[var(--text-primary)]">
                {format_currency(revenue_gap)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}