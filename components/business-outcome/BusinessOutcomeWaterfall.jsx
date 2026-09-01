"use client";
import useBusinessOutcomePerSourceRevenue from "@/hooks/useBusinessOutcomePerSourceRevenue";
import { selectBusinessOutcomePerSourceRevenue } from "@/lib/selectors/business-outcome/businessOutcomePerSourceRevenueSelectors";
import { buildNetProfitBuildUpRows } from "@/lib/selectors/business-outcome/businessOutcomeNetProfitBuildUpSelectors";

function formatCurrency(value) {
  if (value === null || value === undefined) return "N/A";
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  return `${sign}${new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    maximumFractionDigits: 0,
  }).format(abs)}`;
}

function WaterfallRow({ row }) {
  const isNegative = row.value < 0 && !row.isTotal;
  const isSurplus = row.isSurplus === true;
  const color = row.isTotal
    ? "var(--text-primary)"
    : isSurplus
    ? "var(--success)"
    : isNegative
    ? "var(--danger)"
    : "var(--text-secondary)";

  return (
    <div
      className={`business-outcome-buildup-row ${row.isTotal ? "contribution" : ""}`}
      style={{ paddingLeft: row.indent > 0 ? `${1.5 + row.indent * 1}rem` : undefined }}
    >
      <span style={{ color: row.isTotal ? "var(--text-primary)" : "var(--text-secondary)" }}>
        {row.label}
      </span>
      <span style={{ color }}>{formatCurrency(row.value)}</span>
    </div>
  );
}

function CrossCheck({ waterfall_net_profit }) {
  const per_source_result = useBusinessOutcomePerSourceRevenue();
  const selected_output = selectBusinessOutcomePerSourceRevenue(per_source_result);
  const build_up = buildNetProfitBuildUpRows(selected_output);

  if (!build_up || waterfall_net_profit === null || waterfall_net_profit === undefined) return null;

  const variance = Math.round((waterfall_net_profit - build_up.total_net_profit) * 100) / 100;
  const matches = Math.abs(variance) < 1;

  return (
    <div className={matches ? "theme-success" : "theme-danger"} style={{ fontSize: "0.75rem", marginTop: "0.4rem" }}>
      {matches
        ? `✓ Matches the source-by-source build-up (${formatCurrency(build_up.total_net_profit)})`
        : `⚠ Differs from the source-by-source build-up by ${formatCurrency(variance)} - two independent calculations disagree, worth investigating`}
    </div>
  );
}

export default function BusinessOutcomeWaterfall({ outcome }) {
  const { waterfallRows, waterfallAvailable, waterfallUnavailableReason, waterfallReconciles } = outcome;

  if (!waterfallAvailable) {
    return (
      <div className="business-outcome-ledger">
        <div className="business-outcome-ledger-section-title">Reconstructed P&amp;L</div>
        <div style={{ color: "var(--text-muted)" }}>Not available</div>
        <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{waterfallUnavailableReason}</div>
      </div>
    );
  }

  const total_row = [...waterfallRows].reverse().find((r) => r.isTotal);

  return (
    <div className="business-outcome-ledger">
      <div className="business-outcome-ledger-section-title">Reconstructed P&amp;L</div>
      <div style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.25rem" }}>
        Where does Net Profit actually come from?
      </div>
      <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginBottom: "0.75rem" }}>
        Same Revenue, Overheads, and Net Profit as your P&amp;L - now split by what each part of the
        business actually earns versus what material margin has to carry.
      </p>

      <div className="business-outcome-ledger-table">
        {waterfallRows.map((row) => (
          <WaterfallRow key={row.id} row={row} />
        ))}
      </div>

      <div style={{ marginTop: "0.5rem" }}>
        {waterfallReconciles === true && (
          <div className="theme-success" style={{ fontSize: "0.75rem" }}>
            ✓ Reconciles to Recovery Summary&apos;s net position
          </div>
        )}
        {waterfallReconciles === false && (
          <div className="theme-danger" style={{ fontSize: "0.75rem", fontWeight: 600 }}>
            ⚠ Does not reconcile to Recovery Summary&apos;s net position - see warnings above
          </div>
        )}
        <CrossCheck waterfall_net_profit={total_row ? total_row.value : null} />
      </div>
    </div>
  );
}

