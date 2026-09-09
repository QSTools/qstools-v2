"use client";

import CollapsibleSection from "@/components/common/CollapsibleSection";

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
        capacity goes further: if materials/COGS can&apos;t cover its own real cost from what&apos;s left
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
          <strong>View A / View B</strong> &mdash; how materials/COGS is treated. View A protects materials, giving
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
