"use client";

import { useState } from "react";

import BusinessSummaryCalculationTable from "@/components/business-summary/BusinessSummaryCalculationTable";
import { format_currency } from "@/components/business-summary/businessSummaryFormatters";

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
  total_cost_burden = 0,
  net_position = 0,

  total_people_cost_annual = 0,
  total_asset_cost_annual = 0,
  total_business_overheads = 0,

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
      help: "Income before direct costs and operating cost baseline.",
      value: format_currency(total_revenue),
    },
    {
      id: "direct_costs",
      title: "Direct Costs",
      help: "COGS / direct costs removed before margin pool is calculated.",
      value: format_currency(total_direct_costs),
    },
    {
      id: "margin_pool",
      title: "Margin Pool",
      help: "Revenue left after direct costs.",
      value: format_currency(margin_pool),
      drilldown_key: "margin_pool",
    },
    {
      id: "total_cost_burden",
      title: "Total Cost Burden",
      help: "Annual operating cost burden from Cost Summary.",
      value: format_currency(total_cost_burden),
      drilldown_key: "total_cost_burden",
    },
    {
      id: "net_position",
      title: "Net Position",
      help: "Margin Pool minus Total Cost Burden.",
      value: format_currency(net_position),
      total: true,
    },
  ];

  const calculation_rows = [
    {
      label: "Margin Pool",
      value: format_currency(margin_pool),
      drilldown_key: "margin_pool",
    },
    {
      label: "Total Cost Burden",
      value: format_currency(total_cost_burden),
      drilldown_key: "total_cost_burden",
    },
    {
      label: "Net Position",
      value: format_currency(net_position),
      emphasis: true,
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
              This is the annual source trail behind the Business Summary
              result. It shows trading margin, operating cost burden, and net
              position without changing upstream calculations.
            </p>
          </div>

          <div className="business-summary-macro-grid">
            {rows.map((row) => (
              <MacroRow
                key={row.id}
                id={row.drilldown_key}
                title={row.title}
                help={row.help}
                value={row.value}
                total={row.total}
                active={active_breakdown === row.drilldown_key}
                onClick={
                  row.drilldown_key ? set_active_breakdown : undefined
                }
              />
            ))}
          </div>

          {active_breakdown ? (
            <div className="business-summary-macro-drilldown">
              <BusinessSummaryCalculationTable
                title="Annual cost position"
                rows={calculation_rows}
                formula="Margin Pool - Total Cost Burden = Net Position"
                values={values}
                active_breakdown={active_breakdown}
                on_active_breakdown_change={set_active_breakdown}
              />
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}