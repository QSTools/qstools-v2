"use client";

function format_currency(value) {
  const n = Number(value) || 0;
  const sign = n < 0 ? "-" : "";
  return `${sign}$${Math.abs(Math.round(n)).toLocaleString()}`;
}

function sum_group_modelled_revenue(rows) {
  return (rows || []).reduce((sum, r) => sum + (r.group_modelled_revenue ?? 0), 0);
}

function sum_source_modelled_revenue(rows) {
  return (rows || []).reduce((sum, r) => sum + (r.modelled_revenue ?? 0), 0);
}

/**
 * BusinessOutcomeViewABComparisonTable
 *
 * Side-by-side comparison of View A and View B, by category (Labour /
 * Assets / Materials), so the mechanism behind the two views'
 * differing totals is directly visible rather than something a user
 * has to take on faith from the blurb's variance paragraph alone.
 *
 * Confirmed mechanism (2026-09-10): View B's labour and asset rows
 * are literal clones of View A's, so those two rows will always show
 * $0 variance. Only Materials/COGS differs - View A prices it as a
 * residual (total_revenue - labour - assets), View B prices it
 * independently (real COGS x Rate Builder's markup target). This
 * table exists specifically to make that visible, not to suggest the
 * two views are supposed to reconcile.
 *
 * Deliberately does not take active_headline or view_mode_ab as a
 * prop - always shows both views side by side regardless of which
 * toggle is currently selected elsewhere on the page.
 */
export default function BusinessOutcomeViewABComparisonTable({
  labour_groups,
  asset_groups,
  materials,
  view_b,
}) {
  if (!view_b) {
    return (
      <div className="business-outcome-ledger">
        <div className="business-outcome-ledger-section-title">View A vs View B - Comparison</div>
        <p>Not available yet - View B data isn&apos;t ready.</p>
      </div>
    );
  }

  const rows = [
    {
      key: "labour",
      label: "Labour",
      view_a: sum_group_modelled_revenue(labour_groups),
      view_b: sum_source_modelled_revenue(view_b.labour_sources),
    },
    {
      key: "assets",
      label: "Assets",
      view_a: sum_group_modelled_revenue(asset_groups),
      view_b: sum_source_modelled_revenue(view_b.asset_sources),
    },
    {
      key: "materials",
      label: "Materials / COGS",
      view_a: materials?.revenue ?? 0,
      view_b: view_b.materials?.modelled_revenue ?? 0,
    },
  ];

  const total_view_a = rows.reduce((sum, r) => sum + r.view_a, 0);
  const total_view_b = rows.reduce((sum, r) => sum + r.view_b, 0);

  return (
    <div className="business-outcome-ledger">
      <div className="business-outcome-ledger-section-title">View A vs View B - Comparison</div>
      <div className="ui-help">
        Same business, two different ways of pricing Materials/COGS. Labour and Assets are
        identical in both views by design - only Materials/COGS differs, which is why its
        variance is the only one that isn&apos;t $0. These are modelled figures (rate x assumed
        hours, or Rate Builder&apos;s markup for Materials) - not capped to real P&amp;L revenue,
        same basis as &quot;Best Case (100% of Entered Rates &amp; Hours)&quot; elsewhere on this
        page. Real revenue is one single number regardless of view - it does not appear here.
      </div>

      <div className="business-outcome-ledger-table">
        <div className="business-outcome-ledger-row business-outcome-ledger-header">
          <span>Source</span>
          <span>View A (modelled)</span>
          <span>View B (modelled)</span>
          <span>Variance</span>
        </div>

        {rows.map((row) => {
          const variance = row.view_a - row.view_b;
          const is_zero = Math.abs(variance) < 1;
          const variance_color = is_zero ? "var(--text-secondary)" : variance > 0 ? "var(--success)" : "var(--danger)";
          return (
            <div className="business-outcome-ledger-row" key={row.key}>
              <span>{row.label}</span>
              <span>{format_currency(row.view_a)}</span>
              <span>{format_currency(row.view_b)}</span>
              <span style={{ color: variance_color }}>
                {is_zero ? "$0" : format_currency(variance)}
              </span>
            </div>
          );
        })}

        <div className="business-outcome-ledger-row business-outcome-ledger-total">
          <span>TOTAL</span>
          <span>{format_currency(total_view_a)}</span>
          <span>{format_currency(total_view_b)}</span>
          <span style={{ color: total_view_a - total_view_b > 0 ? "var(--success)" : total_view_a - total_view_b < 0 ? "var(--danger)" : "var(--text-secondary)" }}>
            {format_currency(total_view_a - total_view_b)}
          </span>
        </div>
      </div>
    </div>
  );
}