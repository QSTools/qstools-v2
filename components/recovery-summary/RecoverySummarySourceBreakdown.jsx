"use client";

import { useState } from "react";

import RecoverySummaryComponentBreakdown from "@/components/recovery-summary/RecoverySummaryComponentBreakdown";
import { format_currency } from "@/components/recovery-summary/recoverySummaryFormatters";

function SourceRow({ id, label, value, active, onClick }) {
  return (
    <button
      type="button"
      onClick={() => onClick(active ? null : id)}
      className={`recovery-summary-interactive recovery-summary-row ${
        active ? "is-active" : ""
      }`}
    >
      <div className="recovery-summary-row-label">{label}</div>
      <div className="recovery-summary-row-value">{value}</div>
    </button>
  );
}

export default function RecoverySummarySourceBreakdown({
  active_breakdown,
  values,
}) {
  const [active_component, set_active_component] = useState(null);

  if (!active_breakdown) {
    return null;
  }

  if (active_breakdown === "margin_pool") {
    return (
      <div className="ui-readonly">
        <div className="ui-stack-sm">
          <p className="ui-kicker">Margin Pool breakdown</p>

          <p className="ui-help">
            Margin Pool comes from Revenue / COGS. It shows what is left after
            direct costs before the operating cost burden is recovered.
          </p>

          <div className="labour-summary-table">
            <div className="labour-summary-table-row">
              <div className="labour-summary-table-label">Revenue</div>
              <div className="labour-summary-table-value">
                {format_currency(values.total_revenue)}
              </div>
            </div>

            <div className="labour-summary-table-row">
              <div className="labour-summary-table-label">Direct Costs</div>
              <div className="labour-summary-table-value">
                {format_currency(values.total_direct_costs)}
              </div>
            </div>

            <div className="labour-summary-table-row total">
              <div className="labour-summary-table-label">Margin Pool</div>
              <div className="labour-summary-table-value">
                {format_currency(values.margin_pool)}
              </div>
            </div>
          </div>

          <p className="ui-help">Revenue - Direct Costs = Margin Pool</p>
        </div>
      </div>
    );
  }

  if (active_breakdown === "total_cost_burden") {
    return (
      <div className="ui-readonly">
        <div className="ui-stack-sm">
          <p className="ui-kicker">Total Cost Burden breakdown</p>

          <p className="ui-help">
            Total Cost Burden comes from Cost Summary. It is the annual cost the
            business must recover.
          </p>

          <div className="ui-stack-sm">
            <SourceRow
              id="people_cost"
              label="People Cost"
              value={format_currency(values.total_people_cost_annual)}
              active={active_component === "people_cost"}
              onClick={set_active_component}
            />

            {active_component === "people_cost" ? (
              <RecoverySummaryComponentBreakdown
                active_component={active_component}
                values={values}
              />
            ) : null}

            <SourceRow
              id="asset_cost"
              label="Asset Cost"
              value={format_currency(values.total_asset_cost_annual)}
              active={active_component === "asset_cost"}
              onClick={set_active_component}
            />

            {active_component === "asset_cost" ? (
              <RecoverySummaryComponentBreakdown
                active_component={active_component}
                values={values}
              />
            ) : null}

            <SourceRow
              id="business_overheads"
              label="Business Overheads"
              value={format_currency(values.total_business_overheads)}
              active={active_component === "business_overheads"}
              onClick={set_active_component}
            />

            {active_component === "business_overheads" ? (
              <RecoverySummaryComponentBreakdown
                active_component={active_component}
                values={values}
              />
            ) : null}

            <div className="recovery-summary-row recovery-summary-row-total">
              <div className="recovery-summary-row-label">
                Total Cost Burden
              </div>
              <div className="recovery-summary-row-value">
                {format_currency(values.total_cost_burden)}
              </div>
            </div>
          </div>

          <p className="ui-help">
            People Cost + Asset Cost + Business Overheads = Total Cost Burden
          </p>
        </div>
      </div>
    );
  }

  return null;
}