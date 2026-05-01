"use client";

import { useState } from "react";

function formatMoney(value) {
  const number = Number(value || 0);
  return `$${number.toLocaleString(undefined, {
    maximumFractionDigits: 0,
  })}`;
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}

function formatPercent(value) {
  const number = Number(value || 0);
  return `${Math.round(number)}%`;
}

function calculateShare(part, total) {
  const safePart = Number(part || 0);
  const safeTotal = Number(total || 0);

  if (safeTotal <= 0) return 0;
  return (safePart / safeTotal) * 100;
}

function SectionHeader({ kicker, title, summary, isOpen, onToggle }) {
  return (
    <div className="ui-stack-sm">
      <div className="ui-split">
        <div className="ui-stack-sm">
          <div className="ui-kicker">{kicker}</div>
          <div className="ui-card-title-sm">{title}</div>
          {summary ? <div className="ui-help">{summary}</div> : null}
        </div>

        <div className="ui-actions">
          <button
            type="button"
            onClick={onToggle}
            className="ui-button-secondary"
          >
            {isOpen ? "Hide" : "Show"}
          </button>
        </div>
      </div>
    </div>
  );
}

function TableRow({ label, value, total = false }) {
  return (
    <div className={`labour-summary-table-row${total ? " total" : ""}`}>
      <div className="labour-summary-table-label">{label}</div>
      <div className="labour-summary-table-value">{value}</div>
    </div>
  );
}

function CompositionRow({ label, amount, share, total = false }) {
  return (
    <div className={`labour-summary-table-row${total ? " total" : ""}`}>
      <div className="labour-summary-table-label">{label}</div>
      <div className="labour-summary-table-value">
        {share !== null
          ? `${formatMoney(amount)} / ${formatPercent(share)}`
          : formatMoney(amount)}
      </div>
    </div>
  );
}

function HeadlineMetric({ label, value, helper, emphasis = false }) {
  return (
    <div className="ui-panel ui-stack-sm">
      <div className="ui-kicker">{label}</div>
      <div className={emphasis ? "ui-display" : "ui-card-title-sm"}>
        {value}
      </div>
      {helper ? <div className="ui-help">{helper}</div> : null}
    </div>
  );
}

export default function CostSummaryCard({
  people_cost_total,
  business_cost_total,
  asset_cost_total = 0,
  total_asset_interest_annual = 0,
  general_overheads_total = 0,
  total_cost_burden,
  required_revenue,
  required_recovery_rate,
  total_productive_output = 0,
  highlight_insight = "",
}) {
  const [peopleCostOpen, setPeopleCostOpen] = useState(true);
  const [businessCostOpen, setBusinessCostOpen] = useState(true);

  const total_people_cost_annual = Number(people_cost_total || 0);
  const total_business_cost_annual = Number(business_cost_total || 0);
  const total_asset_cost_annual = Number(asset_cost_total || 0);
  const total_asset_interest = Number(total_asset_interest_annual || 0);
  const total_business_overheads = Number(general_overheads_total || 0);

  const total_cost_burden_annual = Number(total_cost_burden || 0);
  const required_revenue_annual = Number(required_revenue || 0);
  const required_recovery_rate_hourly = Number(required_recovery_rate || 0);
  const productive_output_total = Number(total_productive_output || 0);

  const people_share = calculateShare(
    total_people_cost_annual,
    total_cost_burden_annual
  );
  const asset_share = calculateShare(
    total_asset_cost_annual,
    total_cost_burden_annual
  );
  const overhead_share = calculateShare(
    total_business_overheads,
    total_cost_burden_annual
  );

  const insight =
    highlight_insight ||
    (people_share > asset_share && people_share > overhead_share
      ? "Labour is the dominant cost driver."
      : asset_share > overhead_share
        ? "Assets are a major cost driver."
        : "General overheads are a significant cost driver.");

  return (
    <section className="ui-section">
      <div className="ui-stack">
        <div className="ui-stack-sm">
          <div className="ui-kicker">Cost Baseline</div>
          <div className="ui-card-title">Forward operating cost</div>
          <p className="ui-help">
            {insight ||
              "Defines the current cost burden and required recovery rate."}
          </p>
        </div>

        <div className="ui-panel ui-stack-sm">
          <div className="ui-kicker">Headline Summary</div>
          <div className="ui-card-title-sm">What the business costs to run</div>
          <div className="ui-help">
            Result first: annual operating cost, productive hours carrying that
            cost, and the required recovery rate.
          </div>

          <div className="ui-stack-sm">
            <div className="ui-split-2">
              <HeadlineMetric
                label="Total Operating Cost"
                value={formatMoney(total_cost_burden_annual)}
                helper="Labour, Assets, and General Overheads."
              />
              <HeadlineMetric
                label="Productive Hours"
                value={`${formatNumber(productive_output_total)} hrs`}
                helper="Final Labour productive output."
              />
            </div>
            <HeadlineMetric
              label="Required Recovery Rate"
              value={`${formatMoney(required_recovery_rate_hourly)} / hr`}
              helper="Operating cost per productive hour."
              emphasis
            />
          </div>
        </div>

        <div className="ui-panel ui-stack-sm">
          <div className="ui-kicker">Cost Composition</div>
          <div className="ui-card-title-sm">Core cost split</div>
          <div className="ui-help">
            Display-only view of the annual cost burden by source module.
          </div>

          <div className="labour-summary-table">
            <CompositionRow
              label="Labour / People Cost"
              amount={total_people_cost_annual}
              share={people_share}
            />
            <CompositionRow
              label="Assets"
              amount={total_asset_cost_annual}
              share={asset_share}
            />
            <CompositionRow
              label="General Overheads"
              amount={total_business_overheads}
              share={overhead_share}
            />
            <CompositionRow
              label="Total Operating Cost"
              amount={total_cost_burden_annual}
              share={null}
              total
            />
          </div>
        </div>

        <div className="ui-panel ui-stack-sm">
          <SectionHeader
            kicker="People Cost"
            title="Labour output"
            summary="Consumed from Labour's total_labour_cost_annual output."
            isOpen={peopleCostOpen}
            onToggle={() => setPeopleCostOpen((prev) => !prev)}
          />

          {peopleCostOpen ? (
            <div className="ui-panel">
              <div className="labour-summary-table">
                <TableRow
                  label="Total People Cost"
                  value={formatMoney(total_people_cost_annual)}
                  total
                />
              </div>
            </div>
          ) : null}
        </div>

        <div className="ui-panel ui-stack-sm">
          <SectionHeader
            kicker="Business Cost"
            title="Assets and overheads"
            summary="Consumed from Assets and General Overheads output contracts."
            isOpen={businessCostOpen}
            onToggle={() => setBusinessCostOpen((prev) => !prev)}
          />

          {businessCostOpen ? (
            <div className="ui-panel">
              <div className="labour-summary-table">
                <TableRow
                  label="Total Business Cost"
                  value={formatMoney(total_business_cost_annual)}
                  total
                />
                <TableRow
                  label="Asset Cost"
                  value={formatMoney(total_asset_cost_annual)}
                />
                <TableRow
                  label="Asset Finance Interest"
                  value={formatMoney(total_asset_interest)}
                />
                <TableRow
                  label="General Overheads"
                  value={formatMoney(total_business_overheads)}
                />
              </div>
              <p className="ui-help">
                Asset finance interest is shown as supporting detail only. It is
                already included inside Asset Cost where applicable.
              </p>
            </div>
          ) : null}
        </div>

        <div className="ui-panel ui-stack-sm">
          <div className="ui-kicker">Downstream Handoff</div>
          <div className="ui-card-title-sm">Operating cost baseline</div>

          <div className="ui-panel">
            <div className="labour-summary-table">
              <TableRow
                label="Total Operating Cost"
                value={formatMoney(total_cost_burden_annual)}
              />
              <TableRow
                label="Required Revenue"
                value={formatMoney(required_revenue_annual)}
              />
              <TableRow
                label="Required Recovery Rate"
                value={formatMoney(required_recovery_rate_hourly)}
              />
              <TableRow
                label="Total Productive Output"
                value={`${formatNumber(productive_output_total)} hrs`}
              />
            </div>
          </div>

          <p className="ui-help">
            Next step after a trusted Cost Summary: Revenue / COGS can compare
            trading revenue and direct costs against this operating cost burden.
          </p>
        </div>
      </div>
    </section>
  );
}
