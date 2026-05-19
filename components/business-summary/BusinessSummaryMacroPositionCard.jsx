"use client";

import { useState } from "react";

import BusinessSummarySourceBreakdown from "@/components/business-summary/BusinessSummarySourceBreakdown";
import {
  format_currency,
  format_percent,
} from "@/components/business-summary/businessSummaryFormatters";

function MacroRow({
  id,
  title,
  help,
  value,
  active,
  total = false,
  onClick,
}) {
  const is_clickable = Boolean(onClick);

  const class_name = `business-summary-macro-row ${
    active ? "is-active" : ""
  } ${total ? "total" : ""}`;

  if (!is_clickable) {
    return (
      <div className={class_name}>
        <div className="business-summary-macro-row-label">
          <div className="business-summary-macro-row-title">{title}</div>
          {help ? (
            <div className="business-summary-macro-row-help">{help}</div>
          ) : null}
        </div>

        <div className="business-summary-macro-row-value">{value}</div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onClick(active ? null : id)}
      className={class_name}
    >
      <div className="business-summary-macro-row-label">
        <div className="business-summary-macro-row-title">{title}</div>
        {help ? (
          <div className="business-summary-macro-row-help">{help}</div>
        ) : null}
      </div>

      <div className="business-summary-macro-row-value">{value}</div>
    </button>
  );
}

export default function BusinessSummaryMacroPositionCard({
  total_revenue = 0,
  total_direct_costs = 0,
  margin_pool = 0,
  gross_margin_percent = 0,
  total_cost_burden = 0,
  net_position = 0,

  total_people_cost_annual = 0,
  total_asset_cost_annual = 0,
  total_business_overheads = 0,
  margin_after_labour = 0,
  non_people_cost_burden = 0,

  direct_cost_category_totals = [],
  cost_burden_breakdown = {
    people: {},
    assets: {},
    business_overheads: {},
  },
}) {
  const [active_breakdown, set_active_breakdown] = useState(null);

  const rows = [
    {
      id: "revenue",
      title: "Revenue",
      help: "Income before COGS / direct costs and operating cost burden.",
      value: format_currency(total_revenue),
    },
    {
      id: "direct_costs",
      title: "Less COGS / direct costs",
      help: "Materials, subcontract costs, hired plant, freight, tipping, consumables, and other direct costs.",
      value: `-${format_currency(total_direct_costs)}`,
      drilldown_key: "direct_costs",
    },
    {
      id: "margin_pool",
      title: "Gross Profit / Margin Pool",
      help: `${format_percent(
        gross_margin_percent
      )} of revenue after COGS / direct costs. This must still cover people cost, assets, business overheads, and profit.`,
      value: format_currency(margin_pool),
    },
    {
      id: "people_cost",
      title: "Less People Cost",
      help: "Annual people cost from Cost Summary.",
      value: `-${format_currency(total_people_cost_annual)}`,
      drilldown_key: "people_cost",
    },
    {
      id: "margin_after_labour",
      title: "Margin after Labour",
      help: "Gross Profit / Margin Pool minus People Cost. This shows whether the business is positive or negative before assets and overheads.",
      value: format_currency(margin_after_labour),
      total: true,
    },
    {
      id: "asset_cost",
      title: "Less Asset Cost",
      help: "Annual asset cost from Cost Summary.",
      value: `-${format_currency(total_asset_cost_annual)}`,
      drilldown_key: "asset_cost",
    },
    {
      id: "business_overheads",
      title: "Less Business Overheads",
      help: "Annual business overheads from Cost Summary.",
      value: `-${format_currency(total_business_overheads)}`,
      drilldown_key: "business_overheads",
    },
    {
      id: "net_position",
      title: "Net Position",
      help: "Final position after Gross Profit / Margin Pool is reduced by People Cost, Asset Cost, and Business Overheads.",
      value: format_currency(net_position),
      total: true,
    },
  ];

  const values = {
    total_revenue,
    total_direct_costs,
    margin_pool,
    total_cost_burden,
    net_position,

    total_people_cost_annual,
    total_asset_cost_annual,
    total_business_overheads,
    margin_after_labour,
    non_people_cost_burden,

    direct_cost_category_totals,
    cost_burden_breakdown,
  };

  return (
    <section className="business-summary-macro">
      <div className="business-summary-macro-inner">
        <div className="ui-stack">
          <div>
            <p className="ui-kicker">Macro position</p>

            <h2 className="ui-card-title-sm text-[var(--text-primary)]">
              Where this position comes from
            </h2>

            <p className="ui-help">
              This shows the current business position before recovery strategy.
              Gross Profit / Margin Pool is what remains after COGS / direct
              costs. It must still cover People Cost, Asset Cost, Business
              Overheads, and profit.
            </p>
          </div>

          <div className="business-summary-macro-grid">
            {rows.map((row) => {
              const is_active = active_breakdown === row.drilldown_key;

              return (
                <div key={row.id} className="ui-stack-sm">
                  <MacroRow
                    id={row.drilldown_key}
                    title={row.title}
                    help={row.help}
                    value={row.value}
                    total={row.total}
                    active={is_active}
                    onClick={
                      row.drilldown_key ? set_active_breakdown : undefined
                    }
                  />

                  {is_active ? (
                    <div className="business-summary-macro-drilldown">
                      <BusinessSummarySourceBreakdown
                        active_breakdown={active_breakdown}
                        values={values}
                      />
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}