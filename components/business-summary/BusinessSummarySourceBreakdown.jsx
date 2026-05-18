"use client";

import { useState } from "react";

import BusinessSummaryComponentBreakdown from "@/components/business-summary/BusinessSummaryComponentBreakdown";
import { format_currency } from "@/components/business-summary/businessSummaryFormatters";

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

export default function BusinessSummarySourceBreakdown({
  active_breakdown,
  values,
}) {
  const [active_component, set_active_component] = useState(null);

  if (!active_breakdown) {
    return null;
  }

  if (active_breakdown === "margin_pool") {
    const direct_cost_categories = Array.isArray(
      values.direct_cost_category_totals
    )
      ? values.direct_cost_category_totals
      : [];

    return (
      <div className="ui-readonly">
        <div className="ui-stack-sm">
          <p className="ui-kicker">Margin Pool breakdown</p>
          <p className="ui-help">
            Margin Pool comes from Revenue / COGS. It shows what remains after
            direct costs before the operating cost burden is tested.
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

          {direct_cost_categories.length > 0 ? (
            <div className="ui-stack-sm">
              <p className="ui-label">Direct cost categories</p>
              {direct_cost_categories.map((category, index) => (
                <div
                  key={`${category.category_id || category.label || "direct-cost"}-${index}`}
                  className="labour-summary-table-row"
                >
                  <div className="labour-summary-table-label">
                    {category.label || category.category_name || "Direct cost"}
                  </div>
                  <div className="labour-summary-table-value">
                    {format_currency(category.amount ?? category.total ?? 0)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="ui-help">
              Direct cost category totals are not exposed to this section yet.
            </p>
          )}

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
            Total Cost Burden comes from Cost Summary. The rows below display
            upstream-owned source values only.
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
              <BusinessSummaryComponentBreakdown
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
              <BusinessSummaryComponentBreakdown
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
              <BusinessSummaryComponentBreakdown
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
