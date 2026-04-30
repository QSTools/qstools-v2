"use client";

import { useMemo, useState } from "react";

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
          ? `${formatMoney(amount)} · ${formatPercent(share)}`
          : formatMoney(amount)}
      </div>
    </div>
  );
}

function StaffCostCard({ row }) {
  const gross_wages_annual = Number(
    row?.gross_wages_annual ?? row?.gross_wages_total ?? 0
  );
  const entitlements_annual = Number(
    row?.entitlements_annual ?? row?.entitlements_total ?? 0
  );
  const employer_kiwisaver_annual = Number(
    row?.employer_kiwisaver_annual ??
      row?.employer_kiwisaver_gross ??
      row?.employer_kiwisaver_total ??
      0
  );
  const esct_annual = Number(row?.esct_annual ?? row?.esct_total ?? 0);
  const acc_levy_annual = Number(
    row?.acc_levy_annual ?? row?.acc_work_levy_annual ?? 0
  );
  const total_people_cost_annual = Number(row?.total_people_cost_annual ?? 0);

  const staffLabel =
    row?.staff_name || row?.staff_label || row?.staff_role || "Unnamed Staff";

  const roleLabel = [row?.staff_role, row?.labour_class]
    .filter(Boolean)
    .join(" • ");

  return (
    <div className="ui-panel ui-stack-sm">
      <div className="ui-stack-sm">
        <div className="text-base font-semibold text-[var(--text-primary)]">
          {staffLabel}
        </div>
        {roleLabel ? <div className="ui-help">{roleLabel}</div> : null}
      </div>

      <div className="labour-summary-table">
        <TableRow label="Gross Wages" value={formatMoney(gross_wages_annual)} />
        <TableRow label="Entitlements" value={formatMoney(entitlements_annual)} />
        <TableRow
          label="Employer KiwiSaver"
          value={formatMoney(employer_kiwisaver_annual)}
        />
        <TableRow label="ESCT" value={formatMoney(esct_annual)} />
        <TableRow
          label="Employer ACC Levy"
          value={formatMoney(acc_levy_annual)}
        />
        <TableRow
          label="Total People Cost"
          value={formatMoney(total_people_cost_annual)}
          total
        />
      </div>
    </div>
  );
}

export default function CostSummaryCard({
  people_cost_total,
  gross_wages_total = 0,
  entitlements_total = 0,
  employer_kiwisaver_total = 0,
  esct_total = 0,
  acc_levy_total = 0,
  employer_contribution_total = 0,
  people_rows = [],

  business_cost_total,
  asset_cost_total = 0,
  general_overheads_total = 0,
  general_overhead_rows = [],
  asset_rows = [],

  total_cost_burden,
  required_revenue,
  required_recovery_rate,
  total_productive_output = 0,

  highlight_insight = "",
}) {
  const [peopleCostOpen, setPeopleCostOpen] = useState(true);
  const [staffDrilldownOpen, setStaffDrilldownOpen] = useState(false);
  const [businessCostOpen, setBusinessCostOpen] = useState(true);
  const [businessDrilldownOpen, setBusinessDrilldownOpen] = useState(false);

  const safePeopleRows = useMemo(() => {
    return [...(people_rows || [])].sort((a, b) => {
      const aTotal = Number(a?.total_people_cost_annual ?? 0);
      const bTotal = Number(b?.total_people_cost_annual ?? 0);
      return bTotal - aTotal;
    });
  }, [people_rows]);

  const safeGeneralOverheadRows = useMemo(() => {
    return [...(general_overhead_rows || [])];
  }, [general_overhead_rows]);

  const safeAssetRows = useMemo(() => {
    return [...(asset_rows || [])];
  }, [asset_rows]);

  const total_people_cost_annual = Number(people_cost_total || 0);
  const total_gross_wages_annual = Number(gross_wages_total || 0);
  const total_entitlements_annual = Number(entitlements_total || 0);
  const total_employer_kiwisaver_annual = Number(employer_kiwisaver_total || 0);
  const total_esct_annual = Number(esct_total || 0);
  const total_acc_levy_annual = Number(acc_levy_total || 0);
  const total_employer_contribution_annual = Number(
    employer_contribution_total || 0
  );

  const total_business_cost_annual = Number(business_cost_total || 0);
  const total_asset_cost_annual = Number(asset_cost_total || 0);
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

  const hasBusinessDrilldown =
    safeAssetRows.length > 0 || safeGeneralOverheadRows.length > 0;

  return (
    <section className="ui-section">
      <div className="ui-stack">
        <div className="ui-stack-sm">
          <div className="ui-kicker">Cost Baseline</div>
          <div className="ui-card-title">Cost Summary</div>
          <p className="ui-help">
            {insight || "Defines the current cost burden and required recovery rate."}
          </p>
        </div>

        <div className="ui-panel ui-stack-sm">
          <div className="ui-kicker">Total Cost Composition</div>
          <div className="ui-card-title-sm">Core cost split</div>
          <div className="ui-help">
            How the annual cost burden is split across the three core cost buckets.
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
              <div className="ui-kicker">Revenue per productive hour</div>
              <div className="ui-card-title">
                {formatMoney(required_recovery_rate_hourly)} / hr
              </div>
              <div className="ui-help">
                Based on {formatNumber(productive_output_total)} productive hours
              </div>
            </div>
          </div>
        </div>

        <div className="ui-panel ui-stack-sm">
          <SectionHeader
            kicker="People Cost"
            title="Annual people burden"
            summary="Active staff flowing into the current baseline."
            isOpen={peopleCostOpen}
            onToggle={() => setPeopleCostOpen((prev) => !prev)}
          />

          {peopleCostOpen ? (
            <div className="ui-stack-sm">
              <div className="ui-panel">
                <div className="labour-summary-table">
                  <TableRow
                    label="Total People Cost"
                    value={formatMoney(total_people_cost_annual)}
                    total
                  />
                  <TableRow
                    label="Gross Wages"
                    value={formatMoney(total_gross_wages_annual)}
                  />
                  <TableRow
                    label="Entitlements"
                    value={formatMoney(total_entitlements_annual)}
                  />
                  <TableRow
                    label="Employer KiwiSaver"
                    value={formatMoney(total_employer_kiwisaver_annual)}
                  />
                  <TableRow
                    label="ESCT"
                    value={formatMoney(total_esct_annual)}
                  />
                  <TableRow
                    label="Employer Contribution Total"
                    value={formatMoney(total_employer_contribution_annual)}
                  />
                  <TableRow
                    label="Employer ACC Levy"
                    value={formatMoney(total_acc_levy_annual)}
                  />
                </div>
              </div>

              <div className="ui-panel ui-stack-sm">
                <div className="ui-split">
                  <div className="ui-stack-sm">
                    <div className="ui-kicker">Staff Drilldown</div>
                    <div className="ui-help">
                      People cost by active staff, highest total first.
                    </div>
                  </div>

                  <div className="ui-actions">
                    <button
                      type="button"
                      onClick={() => setStaffDrilldownOpen((prev) => !prev)}
                      className="ui-button-secondary"
                    >
                      {staffDrilldownOpen ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                {staffDrilldownOpen ? (
                  <div className="ui-stack-sm">
                    {safePeopleRows.length > 0 ? (
                      safePeopleRows.map((row, index) => (
                        <StaffCostCard
                          key={
                            row?.staff_id ||
                            row?.id ||
                            `${row?.staff_name || "staff"}-${index}`
                          }
                          row={row}
                        />
                      ))
                    ) : (
                      <div className="ui-panel">
                        <div className="ui-help">
                          No active staff drilldown available.
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>

        <div className="ui-panel ui-stack-sm">
          <SectionHeader
            kicker="Business Cost"
            title="Non-people cost burden"
            summary="Assets and General Overheads included in Cost Summary."
            isOpen={businessCostOpen}
            onToggle={() => setBusinessCostOpen((prev) => !prev)}
          />

          {businessCostOpen ? (
            <div className="ui-stack-sm">
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
                    label="General Overheads"
                    value={formatMoney(total_business_overheads)}
                  />
                </div>
              </div>

              {hasBusinessDrilldown ? (
                <div className="ui-panel ui-stack-sm">
                  <div className="ui-split">
                    <div className="ui-stack-sm">
                      <div className="ui-kicker">Business Drilldown</div>
                      <div className="ui-help">
                        Asset and overhead rows where available.
                      </div>
                    </div>

                    <div className="ui-actions">
                      <button
                        type="button"
                        onClick={() => setBusinessDrilldownOpen((prev) => !prev)}
                        className="ui-button-secondary"
                      >
                        {businessDrilldownOpen ? "Hide" : "Show"}
                      </button>
                    </div>
                  </div>

                  {businessDrilldownOpen ? (
                    <div className="ui-stack-sm">
                      {safeAssetRows.length > 0 ? (
                        <div className="ui-panel ui-stack-sm">
                          <div className="ui-kicker">Assets</div>
                          <div className="labour-summary-table">
                            {safeAssetRows.map((row, index) => (
                              <TableRow
                                key={
                                  row?.asset_id ||
                                  row?.asset_name ||
                                  `asset-${index}`
                                }
                                label={row?.asset_name || `Asset ${index + 1}`}
                                value={formatMoney(
                                  row?.total_asset_cost_annual ?? 0
                                )}
                              />
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {safeGeneralOverheadRows.length > 0 ? (
                        <div className="ui-panel ui-stack-sm">
                          <div className="ui-kicker">General Overheads</div>
                          <div className="labour-summary-table">
                            {safeGeneralOverheadRows.map((row, index) => (
                              <TableRow
                                key={
                                  row?.overhead_id ||
                                  row?.label ||
                                  row?.name ||
                                  `overhead-${index}`
                                }
                                label={
                                  row?.label ||
                                  row?.name ||
                                  `Overhead ${index + 1}`
                                }
                                value={formatMoney(
                                  row?.amount ??
                                    row?.annual_amount ??
                                    row?.value ??
                                    0
                                )}
                              />
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ) : null}
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
                label="Break-even Revenue"
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
