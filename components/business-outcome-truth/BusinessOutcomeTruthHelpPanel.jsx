"use client";

function format_currency(value) {
  if (value === null || value === undefined) return "N/A";
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  return `${sign}${new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    maximumFractionDigits: 0,
  }).format(abs)}`;
}

// SITUATION-DEPENDENT SUMMARY - unchanged logic, split out of the old
// single HelpPanel component so the blurb and the "About" text can be
// rendered separately, with other content (the Net Profit build-up
// card) placed between them.
function build_situation_summary({ active_headline, capacity_mode, real_capacity, revenue_ceiling }) {
  const paragraphs = [];

  if (!active_headline) return paragraphs;

  let worst = null;
  if (active_headline.all_good) {
    paragraphs.push(
      "Every part of the business is currently paying its way - no source is being propped up by the rest."
    );
  } else {
    worst = active_headline.being_carried?.[0];
    const count = active_headline.being_carried?.length ?? 0;
    const total = active_headline.total_group_count ?? 0;
    if (worst && count === 1) {
      if (Math.abs(worst.net_profit) < 1) {
        paragraphs.push(
          `${worst.name} is the only part of the business not covering its own cost right now - it's being kept at exactly $0, propped up by the rest of the business rather than genuinely breaking even.`
        );
      } else {
        paragraphs.push(
          `${worst.name} is the only part of the business not covering its own cost right now, at ${format_currency(worst.net_profit)} a year.`
        );
      }
    } else if (worst) {
      paragraphs.push(
        `${count} of ${total} sources aren't covering their own cost right now. ${worst.name} is carrying the largest shortfall, at ${format_currency(worst.net_profit)} a year.`
      );
    }
  }

  const groups_with_margin = (real_capacity?.group_real_capacity || [])
    .filter((g) => (g.modelled_revenue ?? 0) > 0)
    .map((g) => ({ ...g, margin_pct: (g.modelled_revenue - g.true_cost) / g.modelled_revenue }));

  if (groups_with_margin.length > 1) {
    const most_resilient = [...groups_with_margin].sort((a, b) => b.margin_pct - a.margin_pct)[0];
    const least_resilient = [...groups_with_margin].sort((a, b) => a.margin_pct - b.margin_pct)[0];
    if (most_resilient.group_id !== least_resilient.group_id) {
      paragraphs.push(
        `${most_resilient.group_name} is your most resilient source, with a ${(most_resilient.margin_pct * 100).toFixed(0)}% margin buffer. ${least_resilient.group_name} has the thinnest buffer, at ${(least_resilient.margin_pct * 100).toFixed(0)}%, so it's the first place to watch if revenue softens.`
      );

      if (worst && worst.name === most_resilient.group_name) {
        paragraphs.push(
          `${worst.name}'s large dollar shortfall above is because it also has the biggest revenue share in the business - once a shortfall is spread proportionally, the biggest source takes the biggest dollar hit, even though its underlying margin is still the strongest of any source.`
        );
      }
    }
  }

  if (capacity_mode === "real" && (real_capacity?.shortfall ?? 0) > 0) {
    paragraphs.push(
      `Materials/COG can't cover its real cost from what's left over once labour and assets are paid - the ${format_currency(real_capacity.shortfall)} shortfall is being spread across the rest of the business.`
    );
  } else if (capacity_mode === "assumed" && revenue_ceiling?.is_breached) {
    const scale_pct = ((revenue_ceiling.scale_factor ?? 1) * 100).toFixed(0);
    paragraphs.push(
      `Combined labour and asset claims exceed total revenue, so every labour and asset source has been scaled down by ${scale_pct}% at once - Materials absorbs whatever's left over.`
    );
  }

  return paragraphs;
}

export function BusinessOutcomeTruthSituationBlurb({
  active_headline,
  capacity_mode,
  real_capacity,
  revenue_ceiling,
}) {
  const summary_paragraphs = build_situation_summary({
    active_headline,
    capacity_mode,
    real_capacity,
    revenue_ceiling,
  });

  if (summary_paragraphs.length === 0) return null;

  return (
    <div className="ui-card theme-card-muted business-outcome-help-panel">
      <h2>Your business, right now</h2>
      {summary_paragraphs.map((text, index) => (
        <p key={index}>{text}</p>
      ))}
    </div>
  );
}

export function BusinessOutcomeTruthAboutPanel() {
  return (
    <div className="ui-card theme-card-muted business-outcome-help-panel">
      <h2>About Business Outcome</h2>
      <p>
        Business Outcome is the current commercial truth layer. It answers whether the business is
        commercially viable right now, using real revenue, cost, and margin data - not a forecast or a
        what-if scenario.
      </p>
      <p>
        It reads from Business Summary, Revenue/COG truth, and Revenue Summary. It does not recalculate
        those modules - it describes the current, actual business state exactly as those modules already
        report it.
      </p>
      <p>
        The headline shows whether every part of the business is covering its own real cost. Click any
        source in the breakdown below to see exactly why it is, or isn&apos;t.
      </p>
      <p>
        <strong>Real capacity</strong> and <strong>Assumed capacity</strong> are two different, both
        mathematically honest ways of answering the same question. Assumed capacity checks whether
        committed labour and asset costs, taken together, exceed what the business actually billed. Real
        capacity goes further: if materials/COG can&apos;t cover its own real cost from what&apos;s left
        over, it shows exactly which parts of the business are absorbing that shortfall, and by how much.
      </p>
      <p>
        For a view of what rate you need to charge based on labour and asset recovery, see{" "}
        <a href="/recovery-outcome" className="underline">
          Recovery &amp; Rate Justification
        </a>
        .
      </p>
    </div>
  );
}
