"use client";
import Link from "next/link";
import NextStepFooter from "@/components/navigation/NextStepFooter";
import useCostAllocation from "@/hooks/useCostAllocation";
import useBusinessOutcomePerSourceRevenue from "@/hooks/useBusinessOutcomePerSourceRevenue";
import { selectBusinessOutcomePerSourceRevenue } from "@/lib/selectors/business-outcome/businessOutcomePerSourceRevenueSelectors";
import { calculateIndependentGroupBreakeven } from "@/lib/calculations/businessModellingIndependentCalculations";

// R3 slice 5 batch 1 (BM Addendum 8 items 1, 2, 5). Per working group, three numbers side by side. This page holds NO calculation of its own:
//   Group minimum rate = minimum_recoverable_rate_per_hour (Cost Allocation recovery rows; labour + asset + overhead, productive cost only)
//   Full cost rate     = group_cost_per_hour (Cost Allocation cost rows; also includes non-productive cost assigned to the group)
//   Revenue per hour   = current_rate_per_hour from calculateIndependentGroupBreakeven (modelled revenue / recovery hours; Business Outcome)
// Totals underneath are plain sums of the figures shown. In Model mode the hooks already return the modelled values.
function money(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "-";
  return n.toLocaleString("en-NZ", { style: "currency", currency: "NZD", maximumFractionDigits: 2 });
}

function money0(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "-";
  return n.toLocaleString("en-NZ", { style: "currency", currency: "NZD", maximumFractionDigits: 0 });
}

const cell_style = { textAlign: "right", padding: "0.35rem 0.6rem" };
const head_style = { textAlign: "right", padding: "0.35rem 0.6rem", fontWeight: 600 };

export default function BusinessModellingPage() {
  const cost_allocation = useCostAllocation();
  const per_source_calculation = useBusinessOutcomePerSourceRevenue();
  const per_source = selectBusinessOutcomePerSourceRevenue(per_source_calculation);

  const contract = cost_allocation?.output_contract ?? {};
  const cost_rows = Array.isArray(contract.operational_group_cost_rows) ? contract.operational_group_cost_rows : [];
  const recovery_rows = Array.isArray(contract.operational_group_recovery_rows) ? contract.operational_group_recovery_rows : [];
  const min_rate_by_id = new Map(recovery_rows.map((r) => [r.group_id, r.minimum_recoverable_rate_per_hour]));
  const capacity_rows = per_source?.real_capacity?.group_real_capacity;
  const capacity_by_id = new Map((Array.isArray(capacity_rows) ? capacity_rows : []).map((g) => [g.group_id, g]));

  const rows = cost_rows.map((cost) => {
    const hours = Number(cost.group_recovery_hours) || 0;
    const capacity = capacity_by_id.get(cost.group_id);
    const charged = capacity ? calculateIndependentGroupBreakeven({ group: capacity }) : null;
    return {
      group_id: cost.group_id,
      group_name: cost.group_name,
      hours,
      has_hours: hours > 0,
      total_group_cost: Number(cost.total_group_cost) || 0,
      min_rate: min_rate_by_id.get(cost.group_id),
      full_cost_rate: cost.group_cost_per_hour,
      revenue_rate: charged && charged.available ? charged.current_rate_per_hour : null,
    };
  });

  const total_cost = rows.reduce((sum, r) => sum + r.total_group_cost, 0);
  const total_hours = rows.reduce((sum, r) => sum + r.hours, 0);
  const support_cost = rows.reduce((sum, r) => sum + (r.has_hours ? 0 : r.total_group_cost), 0);

  return (
    <main className="ui-page">
      <div className="ui-page-stack">
        <section className="ui-section">
          <div className="ui-panel ui-stack-sm">
            <div className="ui-kicker">Business Modelling</div>
            <div className="ui-card-title-sm">What each working group costs per hour, and what it earns per hour</div>
            <p className="ui-help">
              Group minimum rate: labour, asset and overhead cost per recovery hour, productive cost only. Full cost rate: the
              same plus any non-productive cost assigned to the group. Revenue per hour: modelled revenue divided by the
              group&apos;s recovery hours, at your charged rates (a group with several staff types shows a blend). In Model mode these
              show the modelled figures.
            </p>
            {rows.length === 0 ? (
              <p className="ui-help">No working groups to show yet. Set them up on Cost Allocation.</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={{ ...head_style, textAlign: "left" }}>Working group</th>
                      <th style={head_style}>Recovery hours</th>
                      <th style={head_style}>Group minimum rate /hr</th>
                      <th style={head_style}>Full cost rate /hr</th>
                      <th style={head_style}>Revenue per hour</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.group_id || r.group_name}>
                        <td style={{ ...cell_style, textAlign: "left" }}>{r.group_name}</td>
                        <td style={cell_style}>{r.has_hours ? r.hours.toLocaleString("en-NZ", { maximumFractionDigits: 1 }) : "none"}</td>
                        <td style={cell_style}>{r.has_hours ? money(r.min_rate) : "-"}</td>
                        <td style={cell_style}>{r.has_hours ? money(r.full_cost_rate) : "-"}</td>
                        <td style={cell_style}>{r.revenue_rate === null ? "-" : money(r.revenue_rate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {rows.length > 0 ? (
              <p className="ui-help">
                Whole business: group cost {money0(total_cost)} across {total_hours.toLocaleString("en-NZ", { maximumFractionDigits: 1 })} recovery
                hours. Of that cost, {money0(support_cost)} sits in groups with no recovery hours (support groups); Business Outcome spreads
                that cost across the groups that earn, so its group cost figures are higher than the ones here.
              </p>
            ) : null}
            <div className="ui-actions">
              <Link href="/model-readiness" className="ui-inline-link">Model Readiness (lock the baseline)</Link>
              <Link href="/dev/model-mode" className="ui-inline-link">Model mode switch</Link>
              <Link href="/business-outcome" className="ui-inline-link">Business Outcome (detail)</Link>
            </div>
          </div>
        </section>
        <NextStepFooter nextHref="/quote-checker" nextLabel="Next: Quote Checker" />
      </div>
    </main>
  );
}