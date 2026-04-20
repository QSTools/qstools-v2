"use client";

export default function ProfitAndLossPeriodPanel({ state, actions }) {
  return (
    <div className="ui-panel ui-stack">
      <div className="ui-stack-sm">
        <span className="ui-kicker">Period</span>
        <div className="ui-section-title">Reporting Period</div>
      </div>

      <div className="ui-split-2">
        <div className="ui-stack-sm">
          <span className="ui-label">Financial Year</span>
          <p className="ui-help">
            NZ financial year. FY 2026 means 1 Apr 2025 to 31 Mar 2026.
          </p>
          <input
            type="number"
            className="ui-input"
            value={state.financial_year ?? ""}
            onChange={(event) =>
              actions.update_profit_and_loss_field(
                "financial_year",
                event.target.value,
              )
            }
          />
        </div>

        <div className="ui-stack-sm">
          <span className="ui-label">Month</span>
          <p className="ui-help">
            Optional. Leave blank for full-year input, or select a month for a
            monthly snapshot.
          </p>
          <select
            className="ui-select"
            value={state.period_month ?? ""}
            onChange={(event) =>
              actions.update_profit_and_loss_field(
                "period_month",
                event.target.value,
              )
            }
          >
            <option value="">Full Year</option>
            <option value="1">Jan</option>
            <option value="2">Feb</option>
            <option value="3">Mar</option>
            <option value="4">Apr</option>
            <option value="5">May</option>
            <option value="6">Jun</option>
            <option value="7">Jul</option>
            <option value="8">Aug</option>
            <option value="9">Sep</option>
            <option value="10">Oct</option>
            <option value="11">Nov</option>
            <option value="12">Dec</option>
          </select>
        </div>
      </div>
    </div>
  );
}