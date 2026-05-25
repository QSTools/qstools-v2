"use client";

import { useState } from "react";

import BusinessSummarySourceBreakdown from "@/components/business-summary/BusinessSummarySourceBreakdown";
import {
  format_currency,
  format_percent,
} from "@/components/business-summary/businessSummaryFormatters";

function to_number(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

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

function BridgeRow({
  title,
  help,
  benchmark,
  module_total,
  variance,
  benchmark_label = "P&L benchmark",
  module_label = "QS Tools total",
}) {
  return (
    <div className="ui-panel ui-stack-sm">
      <div className="ui-row-between">
        <div>
          <div className="ui-kicker">{title}</div>
          {help ? <p className="ui-help">{help}</p> : null}
        </div>

        <span className="ui-pill">
          {Math.abs(to_number(variance)) < 1 ? "Reconciled" : "Review"}
        </span>
      </div>

      <div className="labour-summary-table">
        <div className="labour-summary-table-row">
          <div className="labour-summary-table-label">{benchmark_label}</div>
          <div className="labour-summary-table-value">
            {format_currency(benchmark)}
          </div>
        </div>

        <div className="labour-summary-table-row">
          <div className="labour-summary-table-label">{module_label}</div>
          <div className="labour-summary-table-value">
            {format_currency(module_total)}
          </div>
        </div>

        <div className="labour-summary-table-row">
          <div className="labour-summary-table-label">Variance</div>
          <div className="labour-summary-table-value">
            {format_currency(variance)}
          </div>
        </div>
      </div>
    </div>
  );
}

function OtherIncomeBridgeRow({ other_income = 0 }) {
  const other_income_amount = to_number(other_income);

  return (
    <div className="ui-panel ui-stack-sm">
      <div className="ui-row-between">
        <div>
          <div className="ui-kicker">Other income treatment</div>
          <p className="ui-help">
            Traditional P&amp;L net profit includes Other Income. Business
            Summary excludes Other Income from the operating margin pool so the
            recovery model is based on core trading performance.
          </p>
        </div>

        <span className="ui-pill">
          {Math.abs(other_income_amount) < 1 ? "No adjustment" : "Bridge"}
        </span>
      </div>

      <div className="labour-summary-table">
        <div className="labour-summary-table-row">
          <div className="labour-summary-table-label">P&amp;L Other Income</div>
          <div className="labour-summary-table-value">
            {format_currency(other_income_amount)}
          </div>
        </div>

        <div className="labour-summary-table-row">
          <div className="labour-summary-table-label">
            Business Summary operating margin treatment
          </div>
          <div className="labour-summary-table-value">
            {format_currency(0)}
          </div>
        </div>

        <div className="labour-summary-table-row">
          <div className="labour-summary-table-label">Bridge impact</div>
          <div className="labour-summary-table-value">
            {format_currency(other_income_amount)}
          </div>
        </div>
      </div>
    </div>
  );
}

function BridgeProofRow({ label, value, is_total = false }) {
  return (
    <div
      className={`labour-summary-table-row ${
        is_total ? "border-t border-[var(--border-primary)] pt-3" : ""
      }`}
    >
      <div className="labour-summary-table-label">{label}</div>
      <div className="labour-summary-table-value">{format_currency(value)}</div>
    </div>
  );
}

function BridgeReconciliationProof({
  pnl_net_profit = 0,
  labour_variance = 0,
  asset_finance_variance = 0,
  overhead_variance = 0,
  other_income_treatment = 0,
  qs_tools_operating_position = 0,
}) {
  return (
    <div className="ui-panel ui-stack-sm">
      <div>
        <div className="ui-kicker">Reconciliation proof</div>
        <p className="ui-help">
          This confirms how traditional P&amp;L net profit bridges to the QS
          Tools operating position. Cost-burden movements and Other Income
          treatment are shown separately so income and expenses are not treated
          as one category.
        </p>
      </div>

      <div className="labour-summary-table">
        <BridgeProofRow
          label="Traditional P&L Net Profit"
          value={pnl_net_profit}
        />

        <BridgeProofRow
          label="Less labour variance"
          value={-Math.abs(to_number(labour_variance))}
        />

        <BridgeProofRow
          label="Less asset finance variance"
          value={-Math.abs(to_number(asset_finance_variance))}
        />

        <BridgeProofRow
          label="Less overhead variance"
          value={-Math.abs(to_number(overhead_variance))}
        />

        <BridgeProofRow
          label="Less Other Income excluded"
          value={-Math.abs(to_number(other_income_treatment))}
        />

        <BridgeProofRow
          label="QS Tools Operating Position"
          value={qs_tools_operating_position}
          is_total
        />
      </div>
    </div>
  );
}

function OperationalRealityBridge({
  labour_benchmark_total = 0,
  total_people_cost_annual = 0,

  asset_finance_benchmark_total = 0,
  total_asset_interest_annual = 0,

  general_overheads_benchmark_total = 0,
  total_business_overheads = 0,

  other_income = 0,
  pnl_net_profit = 0,
  qs_tools_operating_position = 0,
}) {
  const labour_variance =
    to_number(total_people_cost_annual) - to_number(labour_benchmark_total);

  const asset_finance_variance =
    to_number(total_asset_interest_annual) -
    to_number(asset_finance_benchmark_total);

  const adjusted_overheads_benchmark =
    to_number(general_overheads_benchmark_total) -
    to_number(asset_finance_benchmark_total);

  const overhead_variance =
    to_number(total_business_overheads) - adjusted_overheads_benchmark;

  const operational_pressure_adjustment =
    labour_variance + asset_finance_variance + overhead_variance;

  const other_income_treatment = to_number(other_income);

  const total_bridge_adjustment =
    operational_pressure_adjustment + other_income_treatment;

  return (
    <div className="ui-panel ui-stack">
      <div>
        <p className="ui-kicker">P&amp;L to Operational Reality Bridge</p>

        <h3 className="ui-card-title-sm text-[var(--text-primary)]">
          Why this position differs from the P&amp;L benchmark
        </h3>

        <p className="ui-help">
          The P&amp;L shows the historical accounting position. QS Tools shows
          the operating burden the business is currently carrying. This bridge
          explains the difference before downstream recovery and outcome
          decisions are trusted.
        </p>
      </div>

      <div className="ui-stack-sm">
        <BridgeRow
          title="Labour variance"
          help="Labour variance is a review signal, not a conclusion. It may reflect current pay assumptions, staff mix, timing, classification differences, or actual labour movement."
          benchmark={labour_benchmark_total}
          module_total={total_people_cost_annual}
          variance={labour_variance}
          benchmark_label="P&L labour benchmark"
          module_label="People Cost from Cost Summary"
        />

        <BridgeRow
          title="Asset finance variance"
          help="This highlights asset finance / ownership cost that may not yet be fully visible in the P&L until interest, depreciation, or journal timing is complete."
          benchmark={asset_finance_benchmark_total}
          module_total={total_asset_interest_annual}
          variance={asset_finance_variance}
          benchmark_label="P&L interest marked as asset finance"
          module_label="Assets finance / interest cost"
        />

        <BridgeRow
          title="General overheads reconciliation"
          help="General Overheads is checked after asset finance interest is removed from the P&L overhead benchmark, because asset finance is reviewed separately against Assets."
          benchmark={adjusted_overheads_benchmark}
          module_total={total_business_overheads}
          variance={overhead_variance}
          benchmark_label="Adjusted P&L overhead benchmark"
          module_label="Net General Overheads"
        />

        <OtherIncomeBridgeRow other_income={other_income_treatment} />
      </div>

      <div className="business-summary-macro-row total">
        <div className="business-summary-macro-row-label">
          <div className="business-summary-macro-row-title">
            Total difference to P&amp;L net profit
          </div>
          <div className="business-summary-macro-row-help">
            Cost-burden movements and Other Income treatment explain why the QS
            Tools operating position differs from traditional P&amp;L net
            profit.
          </div>
        </div>

        <div className="business-summary-macro-row-value">
          {format_currency(total_bridge_adjustment)}
        </div>
      </div>

      <BridgeReconciliationProof
        pnl_net_profit={pnl_net_profit}
        labour_variance={labour_variance}
        asset_finance_variance={asset_finance_variance}
        overhead_variance={overhead_variance}
        other_income_treatment={other_income_treatment}
        qs_tools_operating_position={qs_tools_operating_position}
      />
    </div>
  );
}

export default function BusinessSummaryMacroPositionCard({
  total_revenue = 0,
  total_direct_costs = 0,
  margin_pool = 0,
  gross_margin_percent = 0,
  total_cost_burden = 0,
  net_position = 0,
  pnl_net_profit = 0,

  total_people_cost_annual = 0,
  total_asset_cost_annual = 0,
  total_business_overheads = 0,
  margin_after_labour = 0,
  non_people_cost_burden = 0,
  people_cost_per_recovery_hour = 0,
  asset_cost_per_recovery_hour = 0,
  business_overheads_per_recovery_hour = 0,
  margin_after_labour_per_recovery_hour = 0,
  non_people_cost_burden_per_recovery_hour = 0,

  labour_benchmark_total = 0,
  asset_finance_benchmark_total = 0,
  total_asset_interest_annual = 0,
  general_overheads_benchmark_total = 0,
  other_income = 0,

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
    people_cost_per_recovery_hour,
    asset_cost_per_recovery_hour,
    business_overheads_per_recovery_hour,
    margin_after_labour_per_recovery_hour,
    non_people_cost_burden_per_recovery_hour,

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

          <OperationalRealityBridge
            labour_benchmark_total={labour_benchmark_total}
            total_people_cost_annual={total_people_cost_annual}
            asset_finance_benchmark_total={asset_finance_benchmark_total}
            total_asset_interest_annual={total_asset_interest_annual}
            general_overheads_benchmark_total={
              general_overheads_benchmark_total
            }
            total_business_overheads={total_business_overheads}
            other_income={other_income}
            pnl_net_profit={pnl_net_profit}
            qs_tools_operating_position={net_position}
          />
        </div>
      </div>
    </section>
  );
}