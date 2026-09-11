"use client";

import { SCALE_MIN, SCALE_MAX, zone_for_ratio } from "@/components/business-outcome-truth/BusinessOutcomeHealthGauge";
import ScrollToSectionLink from "@/components/common/ScrollToSectionLink";

function format_currency(value) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return "N/A";
  const sign = Number(value) < 0 ? "-" : "";
  const abs = Math.abs(Number(value));
  return `${sign}${new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    maximumFractionDigits: 0,
  }).format(abs)}`;
}

/**
 * BusinessOutcomeHealthGaugeExplainer
 *
 * Lives under "How the Numbers Are Calculated" as its own
 * CollapsibleSection, linked from the gauge itself (click the gauge to
 * jump here - see scroll_to_section wiring in the Card). Built
 * 2026-09-12 as the first of the two flagged Health Gauge follow-ups
 * (legend + terminology). Deliberately does NOT claim health_ratio is a
 * named industry metric - it's a custom ratio built for this page - but
 * it IS built from real, per-source tracked data (direct_cost and
 * overhead_share, summed to true_cost, in useBusinessOutcomePerSourceRevenue.js),
 * not an invented number.
 *
 * Zone thresholds are read directly from BusinessOutcomeHealthGauge.jsx
 * (SCALE_MIN/SCALE_MAX/zone_for_ratio) so the legend can never drift
 * out of sync with the actual gauge.
 *
 * The "N of M sources not paying their way" line reuses
 * active_headline.being_carried / total_group_count - the SAME View A
 * fields the main blurb's "who's healthy" paragraph already uses - so
 * this explainer and the blurb tell one consistent story instead of two
 * disconnected ones (this was the specific gap flagged 2026-09-11: the
 * gauge and the "N of M" sentence existed in two separate places on the
 * page with no link between them).
 */
export default function BusinessOutcomeHealthGaugeExplainer({ health_gauge, active_headline }) {
  const being_carried_count = active_headline?.being_carried?.length ?? 0;
  const total_group_count = active_headline?.total_group_count ?? 0;
  const ratio = Number(health_gauge?.health_ratio);
  const has_ratio = Number.isFinite(ratio);

  const zones = [
    { range: `${SCALE_MIN.toFixed(1)} to 0`, ...zone_for_ratio(SCALE_MIN) },
    { range: "0 to 0.7", ...zone_for_ratio(0.35) },
    { range: `0.7 to ${SCALE_MAX.toFixed(1)}`, ...zone_for_ratio(SCALE_MAX) },
  ];

  return (
    <div className="business-outcome-ledger">
      <p style={{ marginTop: 0 }}>
        <strong>What it measures:</strong> your real, smoothed net profit (the actual total, after any
        cross-subsidy between sources) divided by what every source would have earned entirely on its
        own, with any underperformer floored at $0 rather than allowed to drag the comparison negative.
        A ratio near 1 means little real drag from underperforming sources; well below 1, or negative,
        means meaningful cross-subsidy is happening beneath the smoothed total shown elsewhere on this
        page.
      </p>
      <p>
        It&apos;s built from real, per-source cost data already tracked here: each source&apos;s direct
        cost and its share of overhead, summed to a true cost, compared against what that source earns.
      </p>
      {has_ratio && (
        <p>
          Right now that ratio is <strong>{ratio.toFixed(2)}</strong>
          {total_group_count > 0 && (
            <>
              . {being_carried_count} of {total_group_count} source{total_group_count === 1 ? "" : "s"}{" "}
              {being_carried_count === 1 ? "isn't" : "aren't"} currently covering its own real cost - the
              same sources reflected in the ratio above.
            </>
          )}
        </p>
      )}
      <div className="business-outcome-ledger-metrics" style={{ marginTop: "0.75rem" }}>
        <div className="business-outcome-ledger-metric">
          <div className="business-outcome-ledger-metric-label">Real, smoothed net profit</div>
          <div className="business-outcome-ledger-metric-value">
            {format_currency(health_gauge?.smoothed_net_profit)}
          </div>
          <div className="business-outcome-ledger-metric-description">
            The actual total, after any cross-subsidy between sources.
          </div>
        </div>
        <div className="business-outcome-ledger-metric">
          <div className="business-outcome-ledger-metric-label">Independent total (floored)</div>
          <div className="business-outcome-ledger-metric-value">
            {format_currency(health_gauge?.independent_net_profit_floored)}
          </div>
          <div className="business-outcome-ledger-metric-description">
            What every source would earn entirely on its own, with underperformers floored at $0.
          </div>
        </div>
      </div>
      <p style={{ marginTop: "0.75rem" }}>
        For the full source-by-source numbers behind both figures above, see the{" "}
        <ScrollToSectionLink
          label="Revenue / Net Profit table"
          target_id="revenue-net-profit-panel"
          ancestor_ids={["how-the-numbers-are-calculated", "independent-numbers-folder"]}
          pre_toggle_labels={["Show breakdown"]}
        />
        .
      </p>
      <div className="business-outcome-ledger-section-title" style={{ marginTop: "1rem" }}>
        Reading the scale
      </div>
      <div className="business-outcome-health-gauge-legend-table">
        <div className="business-outcome-health-gauge-legend-row business-outcome-health-gauge-legend-header">
          <div>Range</div>
          <div>Meaning</div>
        </div>
        {zones.map((zone) => (
          <div className="business-outcome-health-gauge-legend-row" key={zone.range}>
            <div>
              <span
                className="business-outcome-health-gauge-legend-dot"
                style={{ backgroundColor: zone.color }}
              />
              {zone.range}
            </div>
            <div>{zone.label}</div>
          </div>
        ))}
      </div>
      <p className="ui-help" style={{ marginTop: "0.75rem" }}>
        This scale is a first pass, not yet validated against a range of real businesses - expect it to
        be revisited as it&apos;s seen against more real data.
      </p>
    </div>
  );
}