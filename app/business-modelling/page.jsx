"use client";
import Link from "next/link";
import NextStepFooter from "@/components/navigation/NextStepFooter";
import useCostAllocation from "@/hooks/useCostAllocation";
import useBusinessOutcomePerSourceRevenue from "@/hooks/useBusinessOutcomePerSourceRevenue";
import { selectBusinessOutcomePerSourceRevenue } from "@/lib/selectors/business-outcome/businessOutcomePerSourceRevenueSelectors";
import { calculateWholeBusinessFromContracts } from "@/lib/calculations/wholeBusinessGroupInputs";
import { buildWholeBusinessGapWording } from "@/lib/calculations/wholeBusinessGapWording";

// R3 slice 5 batch 1 (BM Addendum 8 items 1, 2, 5). Per working group, three numbers side by side. This page holds NO calculation of its own:
//   Group minimum rate = minimum_recoverable_rate_per_hour (Cost Allocation recovery rows; labour + asset + overhead, productive cost only)
//   Full cost rate     = group_cost_per_hour (Cost Allocation cost rows; also includes non-productive cost assigned to the group)
//   Revenue per hour   = current_rate_per_hour from calculateIndependentGroupBreakeven (modelled revenue / recovery hours; Business Outcome)
// Totals underneath are plain sums of the figures shown. In Model mode the hooks already return the modelled values.
// Whole business row (batch A, BM Addendum 37): calculateWholeBusinessRateGap in lib/calculations/wholeBusinessRateGap.js does the weighting;
// this page only passes the per-group figures in and displays what comes back. Seat hours (Cost Allocation recovery hours) are the one
// denominator for all three whole-business rates; the per-group revenue figure stays on covered hours and a Covered hours column shows the difference.
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
  const capacity_rows = per_source?.real_capacity?.group_real_capacity;
  // Batch B (BM Addendum 42 item 3): ONE shared function builds the per-group rows and the whole-business result for this page and for the trace nodes.
  const { rows, whole } = calculateWholeBusinessFromContracts({ cost_rows, recovery_rows, capacity_rows });

  const total_cost = rows.reduce((sum, r) => sum + r.total_group_cost, 0);
  const total_hours = rows.reduce((sum, r) => sum + r.hours, 0);
  const support_cost = rows.reduce((sum, r) => sum + (r.has_hours ? 0 : r.total_group_cost), 0);

  const hours_text = (value) => Number(value).toLocaleString("en-NZ", { maximumFractionDigits: 1 });
  // Batch C (BM Addendum 42 item 6): the gap and left-out sentences come from one tested pure function; the page holds no wording logic.
  const wording = buildWholeBusinessGapWording(whole);

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
                      <th style={head_style}>Covered hours</th>
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
                        <td style={cell_style}>{r.has_hours && r.covered_hours !== null ? hours_text(r.covered_hours) : "-"}</td>
                        <td style={cell_style}>{r.has_hours ? money(r.min_rate) : "-"}</td>
                        <td style={cell_style}>{r.has_hours ? money(r.full_cost_rate) : "-"}</td>
                        <td style={cell_style}>{r.revenue_rate === null ? "-" : money(r.revenue_rate)}</td>
                      </tr>
                    ))}
                    <tr style={{ borderTop: "2px solid currentColor", fontWeight: 600 }}>
                      <td style={{ ...cell_style, textAlign: "left" }}>Whole business (earning groups)</td>
                      <td style={cell_style}>{whole.available ? hours_text(whole.total_seat_hours) : "-"}</td>
                      <td style={cell_style}>{whole.available ? hours_text(whole.total_covered_hours) : "-"}</td>
                      <td style={cell_style}>{whole.available ? money(whole.min_rate) : "-"}</td>
                      <td style={cell_style}>{whole.available ? money(whole.full_cost_rate) : "-"}</td>
                      <td style={cell_style}>{whole.available ? money(whole.revenue_per_seat_hour) : "-"}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
            {rows.length > 0 ? (
              <div className="ui-stack-sm">
                <p className="ui-help">
                  Whole business (earning groups): each rate is the average of the groups&apos; rates weighted by recovery hours; revenue per hour is
                  total modelled revenue divided by total recovery hours (recovery hours are the paid-for seat hours). Support groups are left out.
                  {whole.covered_differs ? " In at least one group the hours covered by labour differ from the recovery hours, so the revenue figure in this row is per recovery hour, not per covered hour." : ""}
                </p>
                {wording.two_rate_sentence ? <p className="ui-help">{wording.two_rate_sentence}</p> : null}
                {wording.no_earning_sentence ? <p className="ui-help">{wording.no_earning_sentence}</p> : null}
                {wording.left_out_sentence ? <p className="ui-help">{wording.left_out_sentence}</p> : null}
              </div>
            ) : null}
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