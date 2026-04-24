"use client";

import CollapsibleSection from "@/components/common/CollapsibleSection";
import ProfitAndLossHeaderPanel from "@/components/p-and-l/ProfitAndLossHeaderPanel";
import ProfitAndLossPeriodPanel from "@/components/p-and-l/ProfitAndLossPeriodPanel";
import ProfitAndLossAwarenessPanel from "@/components/p-and-l/ProfitAndLossAwarenessPanel";
import ProfitAndLossReconciliationPanel from "@/components/p-and-l/ProfitAndLossReconciliationPanel";
import ProfitAndLossSectionBlock from "@/components/p-and-l/ProfitAndLossSectionBlock";

function getEditingLabel(state) {
  const financial_year = Number(state?.financial_year) || null;
  const period_month = state?.period_month ? Number(state.period_month) : null;

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  if (!financial_year) return "";

  if (period_month) {
    return `${months[period_month - 1]} FY ${financial_year}`;
  }

  return `FY ${financial_year}`;
}

function SummaryRow({ label, value, total = false }) {
  return (
    <div className={`labour-summary-table-row ${total ? "total" : ""}`}>
      <div className="labour-summary-table-label">{label}</div>
      <div className="labour-summary-table-value">{value}</div>
    </div>
  );
}

function SummaryPanel({ summary, warnings = [], save_message = "", on_save }) {
  return (
    <CollapsibleSection
      title="P&L Summary"
      summary="Review, warnings, and save"
      defaultOpen={false}
    >
      <div className="ui-panel ui-stack">
        <div>
          <div className="ui-kicker">P&amp;L Summary</div>
          <h2 className="ui-card-title-sm">Current P&amp;L position</h2>
        </div>

        <div className="ui-panel ui-stack-sm">
          <div className="ui-kicker">Traditional P&amp;L</div>
          <div className="labour-summary-table">
            <SummaryRow
              label="Trading Income"
              value={summary.total_trading_income}
            />
            <SummaryRow
              label="Cost of Sales"
              value={summary.total_cost_of_sales}
            />
            <SummaryRow
              label="Gross Profit"
              value={summary.gross_profit}
              total
            />
            <SummaryRow
              label="Other Income"
              value={summary.total_other_income}
            />
            <SummaryRow
              label="Operating Expenses"
              value={summary.total_operating_expenses}
            />
            <SummaryRow
              label="Net Profit"
              value={summary.net_profit}
              total
            />
          </div>
        </div>

        <div className="ui-panel ui-stack-sm">
          <div className="ui-kicker">QS Benchmark View</div>
          <div className="labour-summary-table">
            <SummaryRow label="Revenue" value={summary.total_revenue} />
            <SummaryRow
              label="COGS - Materials"
              value={summary.materials_cost}
            />
            <SummaryRow
              label="COGS - Subcontract"
              value={summary.subcontract_cost}
            />
            <SummaryRow
              label="COGS - Hire"
              value={summary.hired_equipment_cost}
            />
            <SummaryRow
              label="Total COGS"
              value={summary.total_cogs}
              total
            />
            <SummaryRow
              label="Labour Benchmark"
              value={summary.labour_benchmark_total}
            />
            <SummaryRow
              label="Employee Overheads Benchmark"
              value={summary.employee_overheads_benchmark_total}
            />
            <SummaryRow
              label="Assets Benchmark"
              value={summary.assets_benchmark_total}
            />
            <SummaryRow
              label="General Overheads Benchmark"
              value={summary.general_overheads_benchmark_total}
            />
            <SummaryRow
              label="Total Business Costs"
              value={summary.total_business_costs}
              total
            />
          </div>
        </div>

        <div className="ui-panel ui-stack-sm">
          <div className="ui-kicker">Warnings / Checks</div>

          {warnings.length > 0 ? (
            <div className="ui-stack-sm">
              {warnings.map((warning) => (
                <div key={warning} className="ui-help">
                  {warning}
                </div>
              ))}
            </div>
          ) : (
            <p className="ui-help">No current warnings.</p>
          )}
        </div>

        <div className="ui-panel ui-stack-sm">
          <div className="ui-kicker">Save</div>
          <p className="ui-help">
            Save this P&amp;L after checking the totals against your actual
            accounting P&amp;L.
          </p>

          {save_message ? (
            <p className="ui-help">
              <strong>{save_message}</strong>
            </p>
          ) : null}

          <div className="ui-actions">
            <button
              type="button"
              className="ui-button-primary"
              onClick={on_save}
            >
              Save P&amp;L
            </button>
          </div>
        </div>
      </div>
    </CollapsibleSection>
  );
}

function AssignmentCheckPanel({ summary }) {
  return (
    <CollapsibleSection
      title="Assignment Check"
      summary="P&L readiness"
      defaultOpen={false}
    >
      <div className="ui-panel ui-stack">
        <div>
          <div className="ui-kicker">Assignment Check</div>
          <h2 className="ui-card-title-sm">P&amp;L readiness</h2>
        </div>

        <div className="ui-panel ui-stack-sm">
          <div className="labour-summary-table">
            <SummaryRow
              label="Total Business Costs"
              value={summary.total_business_costs}
            />
            <SummaryRow
              label="Total Assigned"
              value={summary.total_assigned_business_costs}
            />
            <SummaryRow
              label="Unassigned Balance"
              value={summary.unassigned_balance}
              total
            />
            <SummaryRow label="P&L Ready" value={summary.pnl_ready} total />
          </div>
        </div>
      </div>
    </CollapsibleSection>
  );
}

export default function ProfitAndLossMainCard({
  state,
  category_options,
  reconciliation,
  summary,
  actions,
  warnings = [],
  save_message = "",
}) {
  const editing_label = getEditingLabel(state);

  return (
    <section className="ui-section">
      <div className="ui-page-stack">
        <ProfitAndLossHeaderPanel
          title="Profit & Loss"
          subtitle="Enter the business P&L in the same section order it appears in your accounts, while classifying each line into the correct QS Tools benchmark bucket."
          editing_label={editing_label}
          on_reset={actions.reset_profit_and_loss_state}
        />

        <ProfitAndLossPeriodPanel state={state} actions={actions} />

        <ProfitAndLossAwarenessPanel />

        <ProfitAndLossReconciliationPanel reconciliation={reconciliation} />

        <ProfitAndLossSectionBlock
          section="trading_income"
          state={state}
          category_options={category_options}
          actions={actions}
          summary={summary}
        />

        <ProfitAndLossSectionBlock
          section="cost_of_sales"
          state={state}
          category_options={category_options}
          actions={actions}
          summary={summary}
        />

        <ProfitAndLossSectionBlock
          section="other_income"
          state={state}
          category_options={category_options}
          actions={actions}
          summary={summary}
        />

        <ProfitAndLossSectionBlock
          section="operating_expenses"
          state={state}
          category_options={category_options}
          actions={actions}
          summary={summary}
        />

        <SummaryPanel
          summary={summary}
          warnings={warnings}
          save_message={save_message}
          on_save={actions.on_save}
        />

        <AssignmentCheckPanel summary={summary} />
      </div>
    </section>
  );
}