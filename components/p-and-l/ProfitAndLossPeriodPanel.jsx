"use client";

import CollapsibleSection from "@/components/common/CollapsibleSection";

export default function ProfitAndLossPeriodPanel({ state, actions }) {
  return (
    <CollapsibleSection
      title="Reporting Period"
      summary="Financial year and reporting period"
      defaultOpen={false}
    >
      <div className="ui-panel ui-stack">
        <div>
          <div className="ui-kicker">Period</div>
          <h2 className="ui-card-title-sm">Reporting Period</h2>
        </div>

        <div className="ui-stack-sm">
          <div className="ui-field">
            <label className="ui-label">Financial Year</label>
            <input
              type="number"
              className="ui-input"
              value={state.financial_year ?? ""}
              onChange={(e) =>
                actions.update_profit_and_loss_field(
                  "financial_year",
                  Number(e.target.value),
                )
              }
            />
            <div className="ui-help">
              NZ financial year runs from 1 Apr to 31 Mar.
            </div>
          </div>

          <div className="ui-field">
            <label className="ui-label">Month</label>
            <select
              className="ui-select"
              value={state.period_month ?? ""}
              onChange={(e) =>
                actions.update_profit_and_loss_field(
                  "period_month",
                  e.target.value ? Number(e.target.value) : "",
                )
              }
            >
              <option value="">Full Year</option>
              <option value={1}>January</option>
              <option value={2}>February</option>
              <option value={3}>March</option>
              <option value={4}>April</option>
              <option value={5}>May</option>
              <option value={6}>June</option>
              <option value={7}>July</option>
              <option value={8}>August</option>
              <option value={9}>September</option>
              <option value={10}>October</option>
              <option value={11}>November</option>
              <option value={12}>December</option>
            </select>

            <div className="ui-help">
              Leave blank for full-year view or select a month for a monthly
              snapshot.
            </div>
          </div>
        </div>
      </div>
    </CollapsibleSection>
  );
}