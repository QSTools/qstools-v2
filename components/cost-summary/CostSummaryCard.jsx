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
          <div className="ui-card-title">Cost Summary</div>
          <p className="ui-help">
            {insight ||
              "Defines the current cost burden and required recovery rate."}
          </p>
        </div>

        <div className="ui-panel ui-stack-sm">
          <div className="ui-kicker">Total Cost Composition</div>
          <div className="ui-card-title-sm">Core cost split</div>
          <div className="ui-help">
            How the annual cost burden is split across the three core cost
            buckets.
          </div>

          <div className="ui-panel ui-stack">
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
                label="Total Cost Burden"
                amount={total_cost_burden_annual}
                share={null}
                total
              />
            </div>

            <div className="ui-panel ui-stack-sm">
              <div className="ui-kicker">Required recovery rate</div>
              <div className="ui-card-title">
                {formatMoney(required_recovery_rate_hourly)} / hr
              </div>
              <div className="ui-help">
                Based on {formatNumber(productive_output_total)} productive
                hours.
              </div>
            </div>
          </div>
        </div>

        <div className="ui-panel ui-stack-sm">
          <SectionHeader
            kicker="People Cost"
            title="Annual people burden"
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
            title="Non-people cost burden"
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
            </div>
          ) : null}
        </div>

        <div className="ui-panel ui-stack-sm">
          <div className="ui-kicker">Total Cost & Recovery</div>
          <div className="ui-card-title-sm">Commercial baseline</div>

          <div className="ui-panel">
            <div className="labour-summary-table">
              <TableRow
                label="Total Cost Burden"
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
            This page defines what the business currently costs to carry. It does
            not define the downstream recovery strategy.
          </p>
        </div>
      </div>
    </section>
  );
}
