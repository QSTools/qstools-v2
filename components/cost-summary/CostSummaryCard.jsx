"use client";

import { useMemo, useState } from "react";

function formatMoney(value) {
  const n = Number(value || 0);
  return `$${n.toLocaleString(undefined, {
    maximumFractionDigits: 0,
  })}`;
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}

function SectionHeader({ title, summary, isOpen, onToggle, value }) {
  return (
    <div className="ui-split">
      <div>
        <div className="text-base font-semibold text-[var(--text-primary)]">
          {title}
        </div>
        {summary ? <div className="ui-help">{summary}</div> : null}
        {value ? (
          <div className="mt-1 text-sm font-medium text-[var(--text-primary)]">
            {value}
          </div>
        ) : null}
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
  );
}

function SummaryMetric({ label, value, tone = "default" }) {
  const valueClass =
    tone === "success"
      ? "text-[var(--success)]"
      : tone === "warning"
        ? "text-[var(--warning)]"
        : tone === "danger"
          ? "text-[var(--danger)]"
          : "text-[var(--text-primary)]";

  return (
    <div className="ui-panel">
      <div className="ui-kicker">{label}</div>
      <div className={`mt-2 text-lg font-semibold ${valueClass}`}>{value}</div>
    </div>
  );
}

function BreakdownRow({ label, value, tone = "default" }) {
  const valueClass =
    tone === "success"
      ? "text-[var(--success)]"
      : tone === "warning"
        ? "text-[var(--warning)]"
        : tone === "danger"
          ? "text-[var(--danger)]"
          : "text-[var(--text-primary)]";

  return (
    <div className="ui-panel">
      <div className="text-sm text-[var(--text-secondary)]">{label}</div>
      <div className={`mt-1 text-base font-semibold ${valueClass}`}>{value}</div>
    </div>
  );
}

function WarningList({ warnings = [] }) {
  if (!warnings.length) {
    return (
      <div className="ui-panel">
        <div className="ui-kicker">Current Warnings</div>
        <div className="mt-2 text-sm text-[var(--text-secondary)]">None</div>
      </div>
    );
  }

  return (
    <div className="ui-panel">
      <div className="ui-kicker">Current Warnings</div>
      <div className="mt-3 space-y-2">
        {warnings.map((warning) => (
          <div key={warning} className="text-sm text-[var(--warning)]">
            {warning}
          </div>
        ))}
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
  const employee_overheads_annual = Number(
    row?.employee_overheads_annual ?? row?.employee_overheads_total ?? 0
  );
  const total_people_cost_annual = Number(row?.total_people_cost_annual ?? 0);

  const staffLabel =
    row?.staff_name || row?.staff_label || row?.staff_role || "Unnamed Staff";

  const roleLabel = [row?.staff_role, row?.labour_class].filter(Boolean).join(" • ");

  return (
    <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-input)] p-4">
      <div className="ui-stack">
        <div className="text-base font-semibold text-[var(--text-primary)]">
          {staffLabel}
        </div>
        {roleLabel ? (
          <div className="text-sm text-[var(--text-muted)]">{roleLabel}</div>
        ) : null}
      </div>

      <div className="mt-4 space-y-3">
        <BreakdownRow label="Gross Wages" value={formatMoney(gross_wages_annual)} />
        <BreakdownRow label="Entitlements" value={formatMoney(entitlements_annual)} />
        <BreakdownRow
          label="Employer KiwiSaver"
          value={formatMoney(employer_kiwisaver_annual)}
        />
        <BreakdownRow label="ESCT" value={formatMoney(esct_annual)} />
        <BreakdownRow
          label="Employee Overheads"
          value={formatMoney(employee_overheads_annual)}
        />
        <BreakdownRow
          label="Total People Cost"
          value={formatMoney(total_people_cost_annual)}
          tone="success"
        />
      </div>
    </div>
  );
}

export default function CostSummaryCard({
  recovery_model_label,
  linked_staff_count,
  linked_asset_count,
  unlinked_active_staff_count = 0,
  recovery_warnings = [],

  people_cost_total,
  gross_wages_total = 0,
  entitlements_total = 0,
  employer_kiwisaver_total = 0,
  esct_total = 0,
  employee_overheads_total = 0,
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
  const [recoveryBlockOpen, setRecoveryBlockOpen] = useState(true);
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
  const total_employee_overheads_annual = Number(employee_overheads_total || 0);

  const total_business_cost_annual = Number(business_cost_total || 0);
  const total_asset_cost_annual = Number(asset_cost_total || 0);
  const total_business_overheads = Number(general_overheads_total || 0);

  const employerContributionTotal =
    total_employer_kiwisaver_annual + total_esct_annual;

  const hasBusinessDrilldown =
    safeAssetRows.length > 0 || safeGeneralOverheadRows.length > 0;

  return (
    <section className="ui-section">
      <div>
        <h2 className="text-2xl font-semibold text-[var(--text-primary)]">
          Cost Summary
        </h2>
        <p className="ui-help">
          Internal cost burden and required recovery view.
        </p>
      </div>

      {highlight_insight ? (
        <div className="mt-4 ui-panel">
          <div className="ui-kicker">Insight</div>
          <div className="mt-2 text-sm text-[var(--text-primary)]">
            {highlight_insight}
          </div>
        </div>
      ) : null}

      <div className="mt-6 space-y-4">
        <div className="ui-panel">
          <SectionHeader
            title="Recovery Model Block"
            summary="Active structural recovery settings from Cost Allocation."
            isOpen={recoveryBlockOpen}
            onToggle={() => setRecoveryBlockOpen((prev) => !prev)}
            value={recovery_model_label}
          />

          {recoveryBlockOpen ? (
            <div className="mt-4 ui-stack">
              <SummaryMetric
                label="Recovery Model"
                value={recovery_model_label}
                tone="success"
              />
              <SummaryMetric
                label="Linked Staff"
                value={formatNumber(linked_staff_count)}
              />
              <SummaryMetric
                label="Linked Assets"
                value={formatNumber(linked_asset_count)}
              />
              <SummaryMetric
                label="Unlinked Active Staff"
                value={formatNumber(unlinked_active_staff_count)}
                tone={Number(unlinked_active_staff_count) > 0 ? "warning" : "default"}
              />
              <WarningList warnings={recovery_warnings} />
            </div>
          ) : null}
        </div>

        <div className="ui-panel">
          <SectionHeader
            title="People Cost"
            summary="Annual people burden with staff drilldown."
            isOpen={peopleCostOpen}
            onToggle={() => setPeopleCostOpen((prev) => !prev)}
            value={formatMoney(total_people_cost_annual)}
          />

          {peopleCostOpen ? (
            <div className="mt-4 space-y-3">
              <BreakdownRow
                label="Gross Wages"
                value={formatMoney(total_gross_wages_annual)}
              />
              <BreakdownRow
                label="Entitlements"
                value={formatMoney(total_entitlements_annual)}
              />
              <BreakdownRow
                label="Employer KiwiSaver"
                value={formatMoney(total_employer_kiwisaver_annual)}
              />
              <BreakdownRow label="ESCT" value={formatMoney(total_esct_annual)} />
              <BreakdownRow
                label="Employer Contribution Total"
                value={formatMoney(employerContributionTotal)}
              />
              <BreakdownRow
                label="Employee Overheads"
                value={formatMoney(total_employee_overheads_annual)}
              />
              <BreakdownRow
                label="Total People Cost"
                value={formatMoney(total_people_cost_annual)}
                tone="success"
              />

              <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card-muted)] p-4">
                <SectionHeader
                  title="Staff Drilldown"
                  summary="People cost by active staff, highest total first."
                  isOpen={staffDrilldownOpen}
                  onToggle={() => setStaffDrilldownOpen((prev) => !prev)}
                  value={formatNumber(safePeopleRows.length)}
                />

                {staffDrilldownOpen ? (
                  <div className="mt-4 space-y-3">
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
                        <div className="text-sm text-[var(--text-secondary)]">
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

        <div className="ui-panel">
          <SectionHeader
            title="Business Cost"
            summary="Non-people annual business burden included in Cost Summary."
            isOpen={businessCostOpen}
            onToggle={() => setBusinessCostOpen((prev) => !prev)}
            value={formatMoney(total_business_cost_annual)}
          />

          {businessCostOpen ? (
            <div className="mt-4 space-y-3">
              <BreakdownRow
                label="Asset Cost"
                value={formatMoney(total_asset_cost_annual)}
              />
              <BreakdownRow
                label="General Overheads"
                value={formatMoney(total_business_overheads)}
              />
              <BreakdownRow
                label="Total Business Cost"
                value={formatMoney(total_business_cost_annual)}
                tone="success"
              />

              {hasBusinessDrilldown ? (
                <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card-muted)] p-4">
                  <SectionHeader
                    title="Business Cost Drilldown"
                    summary="Supporting rows from linked assets and general overheads."
                    isOpen={businessDrilldownOpen}
                    onToggle={() => setBusinessDrilldownOpen((prev) => !prev)}
                    value={formatNumber(
                      safeAssetRows.length + safeGeneralOverheadRows.length
                    )}
                  />

                  {businessDrilldownOpen ? (
                    <div className="mt-4 space-y-4">
                      {safeAssetRows.length > 0 ? (
                        <div className="ui-stack">
                          <div className="text-sm font-medium text-[var(--text-primary)]">
                            Asset Rows
                          </div>
                          {safeAssetRows.map((row, index) => (
                            <BreakdownRow
                              key={row?.asset_id || row?.key || `asset-${index}`}
                              label={row?.label || row?.asset_name || "Asset"}
                              value={formatMoney(
                                row?.amount ??
                                  row?.total_asset_cost_annual ??
                                  row?.value ??
                                  0
                              )}
                            />
                          ))}
                        </div>
                      ) : null}

                      {safeGeneralOverheadRows.length > 0 ? (
                        <div className="ui-stack">
                          <div className="text-sm font-medium text-[var(--text-primary)]">
                            General Overhead Rows
                          </div>
                          {safeGeneralOverheadRows.map((row, index) => (
                            <BreakdownRow
                              key={row?.key || `overhead-${index}`}
                              label={row?.label || "General Overhead"}
                              value={formatMoney(row?.amount ?? row?.value ?? 0)}
                            />
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="ui-panel">
          <div className="text-base font-semibold text-[var(--text-primary)]">
            Total Cost & Recovery
          </div>
          <div className="ui-help">
            Final annual burden and required recovery outputs.
          </div>

          <div className="mt-4 space-y-3">
            <BreakdownRow
              label="Total Cost Burden"
              value={formatMoney(total_cost_burden)}
              tone="success"
            />
            <BreakdownRow
              label="Required Revenue"
              value={formatMoney(required_revenue)}
            />
            <BreakdownRow
              label="Required Recovery Rate"
              value={formatMoney(required_recovery_rate)}
            />
            <BreakdownRow
              label="Total Productive Output"
              value={formatNumber(total_productive_output)}
            />
          </div>
        </div>
      </div>
    </section>
  );
}