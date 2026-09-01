"use client";
import { useState } from "react";
import useBusinessOutcomePerSourceRevenue from "@/hooks/useBusinessOutcomePerSourceRevenue";
import { selectBusinessOutcomePerSourceRevenue } from "@/lib/selectors/business-outcome/businessOutcomePerSourceRevenueSelectors";
import { buildNetProfitBuildUpRows } from "@/lib/selectors/business-outcome/businessOutcomeNetProfitBuildUpSelectors";

function format_currency(value) {
  const n = Number(value) || 0;
  const sign = n < 0 ? "-" : "";
  return `${sign}$${Math.abs(Math.round(n)).toLocaleString()}`;
}

function contribution_color(net_profit) {
  return net_profit > 0 ? "var(--success)" : "var(--danger)";
}

export default function BusinessOutcomeNetProfitBuildUp() {
  const [view_mode, set_view_mode] = useState("revenue");

  const per_source_result = useBusinessOutcomePerSourceRevenue();
  const selected_output = selectBusinessOutcomePerSourceRevenue(per_source_result);
  const build_up = buildNetProfitBuildUpRows(selected_output);

  if (!build_up) {
    return (
      <div className="business-outcome-ledger">
        <div className="business-outcome-ledger-section-title">How Net Profit Is Actually Built</div>
        <p>Not available yet - upstream sources aren&apos;t ready.</p>
      </div>
    );
  }

  const {
    rows,
    unassigned_lines,
    total_unassigned,
    total_net_profit,
    reconciles_to_headline,
    headline_variance,
    naive_reconciles_to_headline,
    naive_headline_variance,
  } = build_up;

  const total_revenue = rows.reduce((sum, r) => sum + r.modelled_revenue, 0);

  return (
    <div className="business-outcome-ledger">
      <div className="business-outcome-ledger-section-title">How Net Profit Is Actually Built</div>
      <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", margin: "0 0 0.5rem" }}>
        Here&apos;s how it&apos;s built, source by source.
      </p>

      <div className="business-outcome-view-toggle" aria-label="Build-up view" style={{ marginBottom: "0.75rem" }}>
        <button
          type="button"
          className={`business-outcome-view-toggle-btn ${view_mode === "revenue" ? "active" : ""}`}
          onClick={() => set_view_mode("revenue")}
        >
          Revenue
        </button>
        <button
          type="button"
          className={`business-outcome-view-toggle-btn ${view_mode === "profit" ? "active" : ""}`}
          onClick={() => set_view_mode("profit")}
        >
          Net Profit
        </button>
        <button
          type="button"
          className={`business-outcome-view-toggle-btn ${view_mode === "naive" ? "active" : ""}`}
          onClick={() => set_view_mode("naive")}
        >
          As Priced (no smoothing)
        </button>
      </div>

      {view_mode === "naive" && (
        <p style={{ color: "var(--text-muted)", fontSize: "0.78rem", margin: "0 0 0.75rem", fontStyle: "italic" }}>
          Each source shown at what it earns on its own, before any group subsidises another. The total
          below is identical either way - this view only changes which line item carries the shortfall,
          not whether the business made money overall.
        </p>
      )}

      <div className="business-outcome-ledger-table">
        {view_mode === "revenue" ? (
          <>
            {rows.map((row) => (
              <div key={row.key}>
                <div className="business-outcome-buildup-source-title">
                  {row.name}
                  {row.is_materials && (
                    <span className="business-outcome-ledger-status-tag neutral">materials</span>
                  )}
                </div>

                {row.revenue_members.length > 0 ? (
                  row.revenue_members.map((member) => (
                    <div className="business-outcome-buildup-row" key={member.name}>
                      <span>{member.name}</span>
                      <span>{format_currency(member.modelled_revenue)}</span>
                    </div>
                  ))
                ) : (
                  <div className="business-outcome-buildup-row">
                    <span>{row.name}</span>
                    <span>{format_currency(row.modelled_revenue)}</span>
                  </div>
                )}

                <div className="business-outcome-buildup-row contribution">
                  <span>Subtotal</span>
                  <span>{format_currency(row.modelled_revenue)}</span>
                </div>
              </div>
            ))}
          </>
        ) : view_mode === "profit" ? (
          <>
            {rows.map((row) => (
              <div key={row.key}>
                <div className="business-outcome-buildup-source-title">
                  {row.name}
                  {!row.is_materials && !row.true_cost_reconciles && (
                    <span className="business-outcome-ledger-status-tag bad">check</span>
                  )}
                </div>

                {row.is_materials ? (
                  <div className="business-outcome-buildup-row negative">
                    <span>Material cost</span>
                    <span>-{format_currency(row.modelled_revenue - row.net_profit)}</span>
                  </div>
                ) : (
                  <>
                    <div className="business-outcome-buildup-row negative">
                      <span>Labour cost</span>
                      <span>-{format_currency(row.labour_direct_cost)}</span>
                    </div>
                    <div className="business-outcome-buildup-row negative">
                      <span>Asset cost</span>
                      <span>-{format_currency(row.asset_direct_cost)}</span>
                    </div>
                    <div className="business-outcome-buildup-row negative">
                      <span>Overhead share</span>
                      <span>-{format_currency(row.total_overhead)}</span>
                    </div>
                    {!row.true_cost_reconciles && (
                      <div className="business-outcome-buildup-row negative">
                        <span>
                          Check: doesn&apos;t match Cost Allocation&apos;s own total by{" "}
                          {format_currency(row.true_cost_variance)}.
                        </span>
                      </div>
                    )}
                  </>
                )}

                <div className="business-outcome-buildup-row contribution">
                  <span>Contribution to profit</span>
                  <span style={{ color: contribution_color(row.net_profit) }}>
                    {format_currency(row.net_profit)}
                  </span>
                </div>
              </div>
            ))}

            <div className="business-outcome-buildup-source-title">Not yet assigned to a group</div>
            {unassigned_lines.map((line) => (
              <div className="business-outcome-buildup-row negative" key={line.label}>
                <span>{line.label}</span>
                <span>-{format_currency(line.amount)}</span>
              </div>
            ))}
            <div className="business-outcome-buildup-row contribution">
              <span>Total not yet assigned</span>
              <span>-{format_currency(total_unassigned)}</span>
            </div>
          </>
        ) : (
          <>
            {rows.map((row) => (
              <div key={row.key}>
                <div className="business-outcome-buildup-source-title">
                  {row.name}
                  {row.is_materials && (
                    <span className="business-outcome-ledger-status-tag neutral">materials</span>
                  )}
                </div>
                <div className="business-outcome-buildup-row">
                  <span>Revenue</span>
                  <span>{format_currency(row.modelled_revenue)}</span>
                </div>
                <div className="business-outcome-buildup-row contribution">
                  <span>Net profit, as priced (no smoothing)</span>
                  <span style={{ color: row.naive_net_profit === null ? "var(--text-muted)" : contribution_color(row.naive_net_profit) }}>
                    {row.naive_net_profit === null ? "Not available" : format_currency(row.naive_net_profit)}
                  </span>
                </div>
              </div>
            ))}

            <div className="business-outcome-buildup-source-title">Not yet assigned to a group</div>
            {unassigned_lines.map((line) => (
              <div className="business-outcome-buildup-row negative" key={line.label}>
                <span>{line.label}</span>
                <span>-{format_currency(line.amount)}</span>
              </div>
            ))}
            <div className="business-outcome-buildup-row contribution">
              <span>Total not yet assigned</span>
              <span>-{format_currency(total_unassigned)}</span>
            </div>
          </>
        )}

        <div className="business-outcome-buildup-row contribution" style={{ borderTop: "2px solid var(--info)", color: "var(--info)", fontSize: "0.95rem" }}>
          <span>TOTAL REVENUE</span>
          <span>{format_currency(total_revenue)}</span>
        </div>
        <div className="business-outcome-buildup-row contribution" style={{ fontSize: "0.95rem" }}>
          <span style={{ color: "var(--text-primary)" }}>NET PROFIT</span>
          <span style={{ color: contribution_color(total_net_profit) }}>
            {view_mode === "naive" ? (
              naive_reconciles_to_headline ? (
                `✓ ${format_currency(total_net_profit)}`
              ) : (
                <span style={{ color: "var(--danger)" }}>Variance {format_currency(naive_headline_variance)}</span>
              )
            ) : reconciles_to_headline ? (
              `✓ ${format_currency(total_net_profit)}`
            ) : (
              <span style={{ color: "var(--danger)" }}>Variance {format_currency(headline_variance)}</span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
