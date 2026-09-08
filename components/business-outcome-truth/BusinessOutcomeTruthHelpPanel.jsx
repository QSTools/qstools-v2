"use client";

import CollapsibleSection from "@/components/common/CollapsibleSection";

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
    <CollapsibleSection title="About Business Outcome" defaultOpen={false}>
      <div className="business-outcome-help-panel">
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
        There are four toggle pairs on this page, tucked under &quot;Advanced options&quot; so the page stays
        simple by default. Here&apos;s what each one changes:
      </p>
      <ul className="business-outcome-help-panel-list">
        <li>
          <strong>Real capacity / Assumed capacity</strong> &mdash; how any shortfall gets shared. Real capacity
          shares it out based on who can afford to give something up; Assumed capacity shares it out evenly,
          the same percentage for everyone.
        </li>
        <li>
          <strong>Full cost / Contribution margin</strong> &mdash; whether overhead is included. Full cost is the
          number to use for pricing or quoting; Contribution margin leaves overhead out, useful only for
          comparing sources against each other.
        </li>
        <li>
          <strong>View A / View B</strong> &mdash; how materials/COG is treated. View A protects materials, giving
          it whatever&apos;s left after labour and assets are paid. View B treats materials as an equal peer,
          sharing in both the upside and the downside like everyone else.
        </li>
        <li>
          <strong>Rate Shortfall / Hours Shortfall</strong> (View B only) &mdash; two ways of describing the same
          gap. Rate Shortfall shows it as a lower effective rate; Hours Shortfall shows it as fewer paid hours.
          Same number, different framing &mdash; pick whichever makes more sense to your team.
        </li>
      </ul>
      <p>
        <strong>In plain terms:</strong> think of it like a shared lemonade stand jar &mdash; labour and
        equipment get paid first, and materials gets whatever&apos;s left, good or bad. When that leftover
        doesn&apos;t cover what materials actually cost, the app tops it up from whichever part of the
        business made the most money that period. It&apos;s not picking on that source &mdash; the numbers
        you see everywhere on this page already include that top-up, so they show who&apos;s really
        carrying the business right now.
      </p>

      <p>
        For a view of what rate you need to charge based on labour and asset recovery, see{" "}
        <a href="/recovery-outcome" className="underline">
          Recovery &amp; Rate Justification
        </a>
        .
      </p>
      </div>
    </CollapsibleSection>
  );
}
