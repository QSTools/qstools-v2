"use client";

import { useMemo, useState } from "react";
import CollapsibleSection from "@/components/common/CollapsibleSection";

function format_currency(value) {
  const safe_value = Number(value || 0);

  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    maximumFractionDigits: 0,
  }).format(safe_value);
}

function format_number(value, maximum_fraction_digits = 0) {
  return new Intl.NumberFormat("en-NZ", {
    maximumFractionDigits: maximum_fraction_digits,
  }).format(Number(value || 0));
}

function DetailRow({ label, value, strong = false }) {
  return (
    <div className={`ui-row-between ${strong ? "ui-row-strong" : ""}`}>
      <span className={strong ? "ui-text-semibold" : "ui-text-muted"}>{label}</span>
      <span>{format_currency(value)}</span>
    </div>
  );
}

function MetricRow({ label, value, suffix = "" }) {
  return (
    <div className="ui-row-between">
      <span className="ui-text-muted">{label}</span>
      <span>
        {value}
        {suffix}
      </span>
    </div>
  );
}

function StaffPeopleCostTable({ rows = [] }) {
  if (!rows.length) {
    return (
      <div className="ui-panel ui-help">
        No active staff records available for people-cost drilldown.
      </div>
    );
  }

  return (
    <div className="ui-stack-sm">
      {rows.map((row) => {
        const staff_key = row.staff_id || `${row.staff_name}-${row.staff_role}`;

        return (
          <div key={staff_key} className="ui-panel ui-stack-sm">
            <div className="ui-row-between">
              <div className="ui-stack-xs">
                <div className="ui-card-title-sm">{row.staff_name || "Unnamed staff"}</div>
                {row.staff_role ? <div className="ui-help">{row.staff_role}</div> : null}
              </div>
              <div className="ui-text-semibold">
                {format_currency(row.total_people_cost_annual)}
              </div>
            </div>

            <div className="ui-stack-xs">
              <DetailRow label="Gross Wages" value={row.gross_wages_annual} />
              <DetailRow label="Entitlements" value={row.entitlements_annual} />
              <DetailRow
                label="Employer KiwiSaver"
                value={row.employer_kiwisaver_annual}
              />
              <DetailRow label="ESCT" value={row.esct_annual} />
              <DetailRow
                label="Employee Overheads"
                value={row.employee_overheads_annual}
              />
              <DetailRow
                label="Total People Cost"
                value={row.total_people_cost_annual}
                strong
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function CostSummaryCard({
  highlight_insight,
  total_gross_wages_annual = 0,
  total_entitlements_annual = 0,
  total_employer_kiwisaver_annual = 0,
  total_esct_annual = 0,
  total_employee_overheads_annual = 0,
  total_people_cost_annual = 0,
  total_asset_cost_annual = 0,
  total_business_overheads = 0,
  total_business_cost_annual = 0,
  total_cost_burden = 0,
  required_revenue = 0,
  required_recovery_rate = 0,
  total_productive_output = 0,
  people_cost_rows = [],
  asset_rows = [],
  business_overhead_rows = [],
  structure_summary = null,
}) {
  const [is_people_open, set_is_people_open] = useState(true);
  const [is_people_staff_open, set_is_people_staff_open] = useState(false);
  const [is_business_open, set_is_business_open] = useState(false);
  const [is_structure_open, set_is_structure_open] = useState(false);

  const sorted_people_rows = useMemo(() => {
    return [...people_cost_rows].sort(
      (left, right) =>
        Number(right.total_people_cost_annual || 0) - Number(left.total_people_cost_annual || 0),
    );
  }, [people_cost_rows]);

  return (
    <section className="ui-section">
      <div className="ui-stack">
        <div className="ui-stack-sm">
          <div className="ui-kicker">Cost Baseline</div>
          <div className="ui-card-title">Cost Summary</div>
          <p className="ui-help">
            {highlight_insight ||
              "Internal cost burden and required recovery view."}
          </p>
        </div>

        {structure_summary ? (
          <CollapsibleSection
            title="Structure / Readiness"
            summary={`${structure_summary.summary_label || "Status"}: ${
              structure_summary.summary_value || "Not set"
            }`}
            defaultOpen={false}
          >
            <div className="ui-stack-xs">
              {structure_summary.active_revenue_model ? (
                <MetricRow
                  label="Recovery Model"
                  value={structure_summary.active_revenue_model}
                />
              ) : null}
              {structure_summary.linked_staff_count !== undefined ? (
                <MetricRow
                  label="Linked Staff"
                  value={format_number(structure_summary.linked_staff_count)}
                />
              ) : null}
              {structure_summary.linked_asset_count !== undefined ? (
                <MetricRow
                  label="Linked Assets"
                  value={format_number(structure_summary.linked_asset_count)}
                />
              ) : null}
              {structure_summary.unlinked_active_staff_count !== undefined ? (
                <MetricRow
                  label="Unlinked Active Staff"
                  value={format_number(
                    structure_summary.unlinked_active_staff_count,
                  )}
                />
              ) : null}
            </div>
          </CollapsibleSection>
        ) : null}

        <CollapsibleSection
          title="People Cost"
          summary={format_currency(total_people_cost_annual)}
          defaultOpen={true}
        >
          <div className="ui-stack-sm">
            <div className="ui-panel ui-stack-xs">
              <DetailRow label="Gross Wages" value={total_gross_wages_annual} />
              <DetailRow label="Entitlements" value={total_entitlements_annual} />
              <DetailRow
                label="Employer KiwiSaver"
                value={total_employer_kiwisaver_annual}
              />
              <DetailRow label="ESCT" value={total_esct_annual} />
              <DetailRow
                label="Employee Overheads"
                value={total_employee_overheads_annual}
              />
              <DetailRow
                label="Total People Cost"
                value={total_people_cost_annual}
                strong
              />
            </div>

            <CollapsibleSection
              title="Staff Drilldown"
              summary={`${format_number(sorted_people_rows.length)} active staff`}
              defaultOpen={false}
            >
              <StaffPeopleCostTable rows={sorted_people_rows} />
            </CollapsibleSection>
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          title="Business Cost"
          summary={format_currency(total_business_cost_annual)}
          defaultOpen={false}
        >
          <div className="ui-stack-sm">
            <div className="ui-panel ui-stack-xs">
              <DetailRow label="Assets" value={total_asset_cost_annual} />
              <DetailRow
                label="Business Overheads"
                value={total_business_overheads}
              />
              <DetailRow
                label="Total Business Cost"
                value={total_business_cost_annual}
                strong
              />
            </div>

            {asset_rows.length ? (
              <div className="ui-panel ui-stack-xs">
                <div className="ui-card-title-sm">Asset Drilldown</div>
                {asset_rows.map((row) => (
                  <DetailRow
                    key={row.asset_id || row.asset_name}
                    label={row.asset_name || "Asset"}
                    value={row.total_asset_cost_annual}
                  />
                ))}
              </div>
            ) : null}

            {business_overhead_rows.length ? (
              <div className="ui-panel ui-stack-xs">
                <div className="ui-card-title-sm">Overhead Drilldown</div>
                {business_overhead_rows.map((row) => (
                  <DetailRow
                    key={row.overhead_id || row.label}
                    label={row.label || "Overhead"}
                    value={row.amount}
                  />
                ))}
              </div>
            ) : null}
          </div>
        </CollapsibleSection>

        <div className="ui-panel ui-stack-sm">
          <div className="ui-kicker">Total Cost & Recovery</div>
          <div className="ui-card-title-sm">Annual commercial baseline</div>

          <div className="ui-stack-xs">
            <DetailRow label="Total Cost Burden" value={total_cost_burden} strong />
            <DetailRow label="Required Revenue" value={required_revenue} strong />
            <MetricRow
              label="Required Recovery Rate"
              value={format_currency(required_recovery_rate)}
              suffix=" / productive hour"
            />
            <MetricRow
              label="Total Productive Output"
              value={format_number(total_productive_output, 0)}
              suffix=" hrs"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
