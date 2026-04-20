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

function SummaryPanel({ summary }) {
  return (
    <CollapsibleSection
      title="Summary Panels"
      summary="Review the benchmark totals built from your classified P&L lines."
      defaultOpen={true}
    >
      <div className="ui-stack">
        <div className="ui-panel ui-stack-sm">
          <span className="ui-label">Traditional P&amp;L View</span>

          <div className="ui-help">Trading Income</div>
          <div>{summary.total_trading_income}</div>

          <div className="ui-help">Cost of Sales</div>
          <div>{summary.total_cost_of_sales}</div>

          <div className="ui-help">Gross Profit</div>
          <div>{summary.gross_profit}</div>

          <div className="ui-help">Other Income</div>
          <div>{summary.total_other_income}</div>

          <div className="ui-help">Operating Expenses</div>
          <div>{summary.total_operating_expenses}</div>

          <div className="ui-help">Net Profit</div>
          <div>{summary.net_profit}</div>
        </div>

        <div className="ui-panel ui-stack-sm">
          <span className="ui-label">QS Benchmark View</span>

          <div className="ui-help">Revenue</div>
          <div>{summary.total_revenue}</div>

          <div className="ui-help">COGS - Materials</div>
          <div>{summary.materials_cost}</div>

          <div className="ui-help">COGS - Subcontract</div>
          <div>{summary.subcontract_cost}</div>

          <div className="ui-help">COGS - Hire</div>
          <div>{summary.hired_equipment_cost}</div>

          <div className="ui-help">Total COGS</div>
          <div>{summary.total_cogs}</div>

          <div className="ui-help">Labour Benchmark</div>
          <div>{summary.labour_benchmark_total}</div>

          <div className="ui-help">Employee Overheads Benchmark</div>
          <div>{summary.employee_overheads_benchmark_total}</div>

          <div className="ui-help">Assets Benchmark</div>
          <div>{summary.assets_benchmark_total}</div>

          <div className="ui-help">General Overheads Benchmark</div>
          <div>{summary.general_overheads_benchmark_total}</div>

          <div className="ui-help">Total Business Costs</div>
          <div>{summary.total_business_costs}</div>
        </div>
      </div>
    </CollapsibleSection>
  );
}

function AssignmentCheckPanel({ summary }) {
  return (
    <CollapsibleSection
      title="Assignment Check"
      summary="Confirm all business costs are assigned before trusting downstream pages."
      defaultOpen={true}
    >
      <div className="ui-panel ui-stack-sm">
        <div className="ui-help">Total Business Costs</div>
        <div>{summary.total_business_costs}</div>

        <div className="ui-help">Total Assigned</div>
        <div>{summary.total_assigned_business_costs}</div>

        <div className="ui-help">Unassigned Balance</div>
        <div>{summary.unassigned_balance}</div>

        <div className="ui-help">P&amp;L Ready</div>
        <div>{summary.pnl_ready}</div>
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
          save_message={save_message}
          on_reset={actions.reset_profit_and_loss_state}
          on_save_snapshot={actions.on_save}
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

        <SummaryPanel summary={summary} />

        <AssignmentCheckPanel summary={summary} />
      </div>
    </section>
  );
}