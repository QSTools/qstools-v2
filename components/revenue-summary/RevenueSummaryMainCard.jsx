"use client";

function format_currency(value) {
  return `$${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function format_percent(value) {
  return `${Number(value || 0).toFixed(1)}%`;
}

function FieldHelp({ children }) {
  return (
    <p className="text-sm text-[var(--text-secondary)]">
      {children}
    </p>
  );
}

function Field({ label, value, onChange, help_text }) {
  return (
    <div className="ui-stack">
      <label className="ui-stack">
        <span className="ui-label">{label}</span>
        <input
          className="ui-input"
          type="number"
          value={value ?? 0}
          onChange={(event) => onChange(event.target.value)}
        />
      </label>
      <FieldHelp>{help_text}</FieldHelp>
    </div>
  );
}

export default function RevenueSummaryMainCard({
  sales_revenue = 0,

  pnl_direct_labour = 0,
  subcontract_labour_cost = 0,
  subcontract_general_cost = 0,
  equipment_hire_cost = 0,
  trade_delivery_other_cost = 0,

  material_cost_total = 0,
  operating_expenses_total = 0,

  target_profit_percent = 0,
  target_profit_amount_override = 0,
  target_material_percent = 0,
  target_labour_percent = 0,

  total_cost_burden = 0,
  total_people_cost_annual = 0,

  current_revenue = 0,
  actual_profit_model = 0,
  actual_profit_percent = 0,

  total_delivery_cost = 0,
  material_cost_total_output = 0,
  operating_expenses_total_output = 0,
  gross_margin_before_operating_expenses = 0,
  pnl_net_result = 0,

  required_revenue = 0,
  target_profit_amount = 0,
  revenue_gap = 0,
  profit_gap = 0,

  material_cost_percent_of_sales = 0,
  delivery_cost_percent_of_sales = 0,
  operating_expense_percent_of_sales = 0,

  labour_variance = 0,
  labour_variance_percent = 0,
  labour_variance_note = "",

  target_split_total = 0,
  warnings = [],

  on_sales_revenue_change = () => {},
  on_pnl_direct_labour_change = () => {},
  on_subcontract_labour_cost_change = () => {},
  on_subcontract_general_cost_change = () => {},
  on_equipment_hire_cost_change = () => {},
  on_trade_delivery_other_cost_change = () => {},
  on_material_cost_total_change = () => {},
  on_operating_expenses_total_change = () => {},
  on_target_profit_percent_change = () => {},
  on_target_profit_amount_override_change = () => {},
  on_target_material_percent_change = () => {},
  on_target_labour_percent_change = () => {},
  on_reset = () => {},
}) {
  return (
    <section className="ui-section">
      <div className="ui-panel">
        <div className="ui-stack">
          <div>
            <p className="ui-kicker">High-level P&amp;L buckets</p>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              Enter only the critical numbers
            </h2>
          </div>

          <div className="ui-stack">
            <Field
              label="Sales Revenue"
              value={sales_revenue}
              onChange={on_sales_revenue_change}
              help_text="Total income from all jobs for the year. Usually the top sales or trading income number."
            />
          </div>

          <div>
            <p className="ui-kicker">Labour reconciliation</p>
            <div className="ui-stack">
              <div className="ui-readonly">
                <span className="ui-label">
                  Model Direct Labour (from Cost Summary)
                </span>
                <div className="text-sm font-medium text-[var(--text-primary)]">
                  {format_currency(total_people_cost_annual)}
                </div>
                <FieldHelp>
                  This is the labour cost already built from your labour pages.
                </FieldHelp>
              </div>

              <Field
                label="P&L Direct Labour"
                value={pnl_direct_labour}
                onChange={on_pnl_direct_labour_change}
                help_text="Usually salary and wages on your P&L. This is used for comparison only."
              />

              <div className="ui-readonly">
                <span className="ui-label">Labour Variance</span>
                <div className="text-sm font-medium text-[var(--text-primary)]">
                  {format_currency(labour_variance)} ·{" "}
                  {format_percent(labour_variance_percent)}
                </div>
                <FieldHelp>{labour_variance_note}</FieldHelp>
              </div>
            </div>
          </div>

          <div>
            <p className="ui-kicker">Direct delivery cost</p>
            <div className="ui-stack">
              <Field
                label="Subcontract Labour"
                value={subcontract_labour_cost}
                onChange={on_subcontract_labour_cost_change}
                help_text="Labour you pay other companies or contractors to help deliver work."
              />

              <Field
                label="Subcontract General"
                value={subcontract_general_cost}
                onChange={on_subcontract_general_cost_change}
                help_text="Other subcontracted services that are not direct labour."
              />

              <Field
                label="Equipment Hire"
                value={equipment_hire_cost}
                onChange={on_equipment_hire_cost_change}
                help_text="Cost of hired machines or equipment used on jobs."
              />

              <Field
                label="Trade / Delivery Cost (Other)"
                value={trade_delivery_other_cost}
                onChange={on_trade_delivery_other_cost_change}
                help_text="Any other direct job costs such as pumping, cartage, disposal, or similar."
              />
            </div>
          </div>

          <div>
            <p className="ui-kicker">Materials and overhead</p>
            <div className="ui-stack">
              <Field
                label="Material Cost (Total)"
                value={material_cost_total}
                onChange={on_material_cost_total_change}
                help_text="Combine all material purchases into one total. It does not need to match your P&L layout exactly."
              />

              <Field
                label="Operating Expenses (Total)"
                value={operating_expenses_total}
                onChange={on_operating_expenses_total_change}
                help_text="Total operating overheads not directly tied to jobs. Usually total operating expenses on your P&L."
              />
            </div>
          </div>

          <div>
            <p className="ui-kicker">Current picture</p>
            <div className="ui-stack">
              <div className="ui-readonly">
                <span className="ui-label">Total Cost Burden (model)</span>
                <div className="text-sm font-medium text-[var(--text-primary)]">
                  {format_currency(total_cost_burden)}
                </div>
              </div>

              <div className="ui-readonly">
                <span className="ui-label">Current Revenue</span>
                <div className="text-sm font-medium text-[var(--text-primary)]">
                  {format_currency(current_revenue)}
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
            </div>
          </div>

          <div>
            <p className="ui-kicker">Simple percentages</p>
            <div className="ui-stack">
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
            </div>
          </div>

          <div>
            <p className="ui-kicker">Target state</p>
            <div className="ui-stack">
              <Field
                label="Target Profit %"
                value={target_profit_percent}
                onChange={on_target_profit_percent_change}
                help_text="The profit you want the business to make."
              />

              <Field
                label="Target Profit $ Override"
                value={target_profit_amount_override}
                onChange={on_target_profit_amount_override_change}
                help_text="Optional fixed dollar target if you do not want to use a percentage."
              />

              <Field
                label="Target Material %"
                value={target_material_percent}
                onChange={on_target_material_percent_change}
                help_text="Optional target mix for materials as a percentage of sales."
              />

              <Field
                label="Target Labour %"
                value={target_labour_percent}
                onChange={on_target_labour_percent_change}
                help_text="Optional target mix for labour or delivery as a percentage of sales."
              />
            </div>
          </div>

          <div>
            <p className="ui-kicker">Gap analysis</p>
            <div className="ui-stack">
              <div className="ui-readonly">
                <span className="ui-label">Target Profit Amount</span>
                <div className="text-sm font-medium text-[var(--text-primary)]">
                  {format_currency(target_profit_amount)}
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

              <div className="ui-readonly">
                <span className="ui-label">Profit Gap</span>
                <div className="text-sm font-medium text-[var(--text-primary)]">
                  {format_currency(profit_gap)}
                </div>
              </div>

              <div className="ui-readonly">
                <span className="ui-label">Target Split Total</span>
                <div className="text-sm font-medium text-[var(--text-primary)]">
                  {format_percent(target_split_total)}
                </div>
              </div>
            </div>
          </div>

          <div className="ui-actions">
            <button
              type="button"
              className="ui-button-secondary"
              onClick={on_reset}
            >
              Reset
            </button>
          </div>

          <div>
            <p className="ui-kicker">Warnings</p>
            <div className="ui-stack">
              {warnings.length === 0 ? (
                <div className="ui-readonly">
                  <div className="text-sm text-[var(--text-secondary)]">
                    No warnings at the moment.
                  </div>
                </div>
              ) : (
                warnings.map((warning, index) => (
                  <div key={`${warning}-${index}`} className="ui-readonly">
                    <div className="text-sm text-[var(--text-primary)]">
                      {warning}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}