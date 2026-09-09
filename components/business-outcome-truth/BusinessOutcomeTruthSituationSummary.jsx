"use client";

import {
  calculateIndependentGroupBreakeven,
  calculateIndependentMaterialsBreakeven,
} from "@/lib/calculations/businessModellingIndependentCalculations";
import ScrollToSectionLink from "@/components/common/ScrollToSectionLink";

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

// SITUATION-DEPENDENT SUMMARY
// Moved out of BusinessOutcomeTruthHelpPanel.jsx into its own file
// (this session, Phase 3) so this logic is easier to find and edit on
// its own as it grows - it's now a materially bigger piece of logic
// than a "help panel" component, with real calculation calls
// (calculateIndependentGroupBreakeven, calculateIndependentMaterialsBreakeven)
// rather than just static explanatory text.
//
// COLOUR CODING (this session, per user request): every number with a
// clear good/bad direction is wrapped in a coloured segment
// (value-good/value-bad). Deliberately left uncoloured: breakeven
// revenue itself (a target, not a verdict), the exact-0% materials
// markup case (genuinely neutral), margin-buffer comparison
// percentages (both are positive margins, just compared to each
// other), and scheduling-gap hours (explicitly framed elsewhere as
// "not a profit issue").
function build_situation_summary({
  active_headline,
  capacity_mode,
  real_capacity,
  revenue_ceiling,
  labour_coverage_gaps,
  pnl_revenue,
  breakeven_revenue,
  labour_recovery_summary,
  traditional_viability_summary,
}) {
  const paragraphs = [];

  if (!active_headline) return paragraphs;

  // Top-line intro - net profit and revenue together, as a genuine
  // opening statement of overall health.
  if (
    Number.isFinite(Number(pnl_revenue)) &&
    Number.isFinite(Number(active_headline.total_net_profit))
  ) {
    const net_profit = Number(active_headline.total_net_profit);
    const net_profit_class = net_profit >= 0 ? "value-good" : "value-bad";
    if (net_profit >= 0) {
      paragraphs.push([
        { type: "text", text: "Your business made " },
        { type: "text", text: format_currency(net_profit), class: net_profit_class },
        { type: "text", text: ` in net profit on ${format_currency(pnl_revenue)} of revenue this year.` },
      ]);
    } else {
      paragraphs.push([
        { type: "text", text: "Your business made a net loss of " },
        { type: "text", text: format_currency(Math.abs(net_profit)), class: net_profit_class },
        { type: "text", text: ` on ${format_currency(pnl_revenue)} of revenue this year.` },
      ]);
    }
  }

  // Revenue / Net Profit table - shows exactly how the net profit
  // above is actually built, source by source.
  paragraphs.push([
    { type: "text", text: "The " },
    { type: "link", label: "Revenue / Net Profit table", target_id: "revenue-net-profit-panel", ancestor_ids: ["how-the-numbers-are-calculated", "independent-numbers-folder"], pre_toggle_labels: ["Show breakdown"] },
    { type: "text", text: " below shows exactly how that net profit is actually built - your real revenue attributed across each source, then each source's real labour, asset and overhead cost subtracted to show what it actually contributes to profit." },
  ]);

  // Breakeven revenue - a target, not a verdict, so left uncoloured.
  if (Number.isFinite(Number(breakeven_revenue))) {
    paragraphs.push([
      { type: "text", text: `Your breakeven revenue is ${format_currency(breakeven_revenue)} a year - the exact amount that covers your real cost, no more, no less. ` },
      { type: "link", label: "The Revenue Snapshot", target_id: "revenue-snapshot-panel", ancestor_ids: ["how-the-numbers-are-calculated", "independent-numbers-folder"], pre_toggle_labels: ["Show breakdown"] },
      { type: "text", text: " panel below compares that to what you're actually trading at and what your rates and volumes independently predict." },
    ]);
  }

  // Labour recovery, by source.
  const labour_recovery_paragraph_segments = [
    { type: "text", text: "The " },
    { type: "link", label: "Labour recovery, by source table", target_id: "labour-recovery-panel", ancestor_ids: ["how-the-numbers-are-calculated", "independent-numbers-folder"], pre_toggle_labels: ["Show breakdown"] },
    { type: "text", text: " below compares each labour type's true cost per hour against its saved charge-out rate, showing whether that rate actually covers the cost." },
  ];

  if (labour_recovery_summary && labour_recovery_summary.data_status === "ready") {
    const {
      shortfall_row_count = 0,
      not_ready_row_count = 0,
      weakest_contribution_area,
      strongest_contribution_area,
      weighted_summary: labour_weighted_summary,
    } = labour_recovery_summary;

    const weakest = weakest_contribution_area?.value;
    const strongest = strongest_contribution_area?.value;
    const markup_percent = labour_weighted_summary?.weighted_markup_percent;
    const has_markup = Number.isFinite(markup_percent);
    const markup_class = has_markup ? (markup_percent >= 0 ? "value-good" : "value-bad") : "";

    if (shortfall_row_count > 0) {
      if (weakest) {
        labour_recovery_paragraph_segments.push({ type: "text", text: ` ${weakest.labour_source_type_name} is under-recovering by ` });
        labour_recovery_paragraph_segments.push({ type: "text", text: `${format_currency(Math.abs(weakest.rate_gap))}/hr`, class: "value-bad" });
        labour_recovery_paragraph_segments.push({ type: "text", text: " - worth reviewing that rate." });
      } else {
        labour_recovery_paragraph_segments.push({
          type: "text",
          text: ` ${shortfall_row_count} labour source${shortfall_row_count === 1 ? "" : "s"} aren't recovering their true cost.`,
        });
      }

      if (has_markup) {
        labour_recovery_paragraph_segments.push({ type: "text", text: " Overall labour markup is currently " });
        labour_recovery_paragraph_segments.push({ type: "text", text: `${markup_percent}%`, class: markup_class });
        labour_recovery_paragraph_segments.push({ type: "text", text: "." });
      }

      if (strongest && weakest && strongest.labour_source_type_name !== weakest.labour_source_type_name) {
        labour_recovery_paragraph_segments.push({ type: "text", text: ` ${strongest.labour_source_type_name} is still recovering well, at ` });
        labour_recovery_paragraph_segments.push({ type: "text", text: `+${format_currency(strongest.rate_gap)}/hr`, class: "value-good" });
        labour_recovery_paragraph_segments.push({ type: "text", text: "." });
      }
    } else if (strongest) {
      labour_recovery_paragraph_segments.push({ type: "text", text: " Every labour source is recovering its true cost" });
      if (has_markup) {
        labour_recovery_paragraph_segments.push({ type: "text", text: ", at an overall labour markup of " });
        labour_recovery_paragraph_segments.push({ type: "text", text: `${markup_percent}%`, class: markup_class });
      }
      labour_recovery_paragraph_segments.push({ type: "text", text: ` - ${strongest.labour_source_type_name} has the strongest margin, at ` });
      labour_recovery_paragraph_segments.push({ type: "text", text: `+${format_currency(strongest.rate_gap)}/hr`, class: "value-good" });
      labour_recovery_paragraph_segments.push({ type: "text", text: "." });
    }

    if (not_ready_row_count > 0) {
      labour_recovery_paragraph_segments.push({
        type: "text",
        text: ` ${not_ready_row_count} labour source${not_ready_row_count === 1 ? " has" : "s have"} no saved charge-out rate yet, so ${not_ready_row_count === 1 ? "it" : "they"} can't be checked.`,
      });
    }
  }

  paragraphs.push(labour_recovery_paragraph_segments);

  // Traditional viability view.
  const traditional_viability_paragraph_segments = [
    { type: "text", text: "The " },
    { type: "link", label: "Traditional viability view table", target_id: "traditional-viability-panel", ancestor_ids: ["how-the-numbers-are-calculated", "independent-numbers-folder"], pre_toggle_labels: ["Show breakdown"] },
    { type: "text", text: " below shows the whole business in standard accounting terms - revenue, COGS, gross margin, cost burden, and bottom-line operating profit - a different lens than the per-source breakdown above." },
  ];

  if (traditional_viability_summary) {
    const {
      operating_profit_before_tax,
      net_operating_margin,
      cost_absorption_status,
      recovery_surplus_or_gap,
    } = traditional_viability_summary;

    const profit_value = Number(operating_profit_before_tax?.value);
    const has_profit = Number.isFinite(profit_value);
    const margin_value = Number(net_operating_margin?.value);
    const has_margin = Number.isFinite(margin_value);

    if (has_profit) {
      const profit_class = profit_value >= 0 ? "value-good" : "value-bad";

      traditional_viability_paragraph_segments.push({
        type: "text",
        text: ` In standard accounting terms, the business made an operating ${profit_value >= 0 ? "profit" : "loss"} of `,
      });
      traditional_viability_paragraph_segments.push({
        type: "text",
        text: format_currency(Math.abs(profit_value)),
        class: profit_class,
      });
      if (has_margin) {
        const margin_class = margin_value >= 0 ? "value-good" : "value-bad";
        traditional_viability_paragraph_segments.push({ type: "text", text: " before tax " });
        traditional_viability_paragraph_segments.push({ type: "text", text: `(a ${margin_value.toFixed(1)}% net margin)`, class: margin_class });
        traditional_viability_paragraph_segments.push({ type: "text", text: "." });
      } else {
        traditional_viability_paragraph_segments.push({ type: "text", text: " before tax." });
      }

      const status = cost_absorption_status?.value;
      const gap_value = Number(recovery_surplus_or_gap?.value);
      const has_gap = Number.isFinite(gap_value);

      if (status === "not_absorbed" && has_gap) {
        traditional_viability_paragraph_segments.push({ type: "text", text: " Costs aren't being fully absorbed by revenue - a " });
        traditional_viability_paragraph_segments.push({ type: "text", text: `${format_currency(Math.abs(gap_value))} gap`, class: "value-bad" });
        traditional_viability_paragraph_segments.push({ type: "text", text: "." });
      } else if (status === "absorbed" && has_gap) {
        traditional_viability_paragraph_segments.push({ type: "text", text: " All costs are being fully absorbed by revenue, with " });
        traditional_viability_paragraph_segments.push({ type: "text", text: `${format_currency(gap_value)} to spare`, class: "value-good" });
        traditional_viability_paragraph_segments.push({ type: "text", text: "." });
      } else if (status === "unavailable") {
        // Genuinely gated, not broken - all 3 upstream sources
        // (Revenue/COGS, Cost Summary, Business Summary) must each
        // independently report ready before this label is shown, even
        // though recovery_surplus_or_gap itself is already correctly
        // computed underneath.
        traditional_viability_paragraph_segments.push({
          type: "text",
          text: " Cost absorption status isn't available yet - Cost Summary data isn't fully trusted, so this label is being held back until that's resolved.",
        });
      }
    }
  }

  paragraphs.push(traditional_viability_paragraph_segments);

  let worst = null;
  let options_added = false;

  if (active_headline.all_good) {
    paragraphs.push(
      "Every part of the business is currently paying its way - no source is being propped up by the rest."
    );
  } else {
    // What's working - healthy sources, shown before the shortfall
    // detail so the picture isn't only what's failing.
    const healthy_sources = (active_headline.all_sources || []).filter(
      (s) => s.verdict === "paying_its_way"
    );
    if (healthy_sources.length > 0) {
      const total_healthy = healthy_sources.reduce((sum, s) => sum + (s.net_profit ?? 0), 0);
      const best = [...healthy_sources].sort((a, b) => (b.net_profit ?? 0) - (a.net_profit ?? 0))[0];
      if (healthy_sources.length === 1) {
        paragraphs.push([
          { type: "text", text: `${best.name} is fully paying its own way, earning ` },
          { type: "text", text: `${format_currency(best.net_profit)} a year`, class: "value-good" },
          { type: "text", text: "." },
        ]);
      } else {
        paragraphs.push([
          { type: "text", text: `${healthy_sources.length} sources are fully paying their own way, together earning ` },
          { type: "text", text: `${format_currency(total_healthy)} a year`, class: "value-good" },
          { type: "text", text: `. ${best.name} is the strongest, at ` },
          { type: "text", text: format_currency(best.net_profit), class: "value-good" },
          { type: "text", text: "." },
        ]);
      }
    }

    worst = active_headline.being_carried?.[0];
    const count = active_headline.being_carried?.length ?? 0;
    const total = active_headline.total_group_count ?? 0;
    if (worst && count === 1) {
      if (Math.abs(worst.net_profit) < 1) {
        paragraphs.push(
          `${worst.name} is the only part of the business not covering its own cost right now - it's being kept at exactly $0, propped up by the rest of the business rather than genuinely breaking even.`
        );
      } else {
        paragraphs.push([
          { type: "text", text: `${worst.name} is the only part of the business not covering its own cost right now, at ` },
          { type: "text", text: `${format_currency(worst.net_profit)} a year`, class: "value-bad" },
          { type: "text", text: "." },
        ]);
      }
    } else if (worst) {
      paragraphs.push([
        { type: "text", text: `${count} of ${total} sources aren't covering their own cost right now. ${worst.name} is carrying the largest shortfall, at ` },
        { type: "text", text: `${format_currency(worst.net_profit)} a year`, class: "value-bad" },
        { type: "text", text: "." },
      ]);
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
    paragraphs.push([
      { type: "text", text: "Materials/COGS can't cover its real cost from what's left over once labour and assets are paid - the " },
      { type: "text", text: `${format_currency(real_capacity.shortfall)} shortfall`, class: "value-bad" },
      { type: "text", text: " is being spread across the rest of the business." },
    ]);
  } else if (capacity_mode === "assumed" && revenue_ceiling?.is_breached) {
    const scale_pct = ((revenue_ceiling.scale_factor ?? 1) * 100).toFixed(0);
    paragraphs.push([
      { type: "text", text: "Combined labour and asset claims exceed total revenue, so every labour and asset source has been scaled down by " },
      { type: "text", text: `${scale_pct}%`, class: "value-bad" },
      { type: "text", text: " at once - Materials absorbs whatever's left over." },
    ]);
  }

  // Materials markup - always shown, regardless of overall business
  // health, since it's a genuine, separate lever worth knowing about
  // either way.
  const materials_breakeven = calculateIndependentMaterialsBreakeven({
    materials: real_capacity?.materials,
  });
  if (materials_breakeven.available) {
    const rounded_markup = Math.round(materials_breakeven.current_markup_percent);
    if (rounded_markup > 0) {
      paragraphs.push([
        { type: "text", text: "Under the revenue claim test (Labour and Assets paid their real cost first), Materials/COGS still comes out marked up at " },
        { type: "text", text: `${materials_breakeven.current_markup_percent.toFixed(0)}%`, class: "value-good" },
        { type: "text", text: ", earning " },
        { type: "text", text: `${format_currency(materials_breakeven.current_net_profit)} a year`, class: "value-good" },
        { type: "text", text: " - Labour and Assets aren't claiming more than the business can currently support. " },
        { type: "link", label: "The Revenue Claim Test", target_id: "independent-breakeven-panel", ancestor_ids: ["how-the-numbers-are-calculated", "independent-numbers-folder"], pre_toggle_labels: ["Show breakdown"] },
        { type: "text", text: " panel below breaks down the full workings." },
      ]);
    } else if (rounded_markup === 0) {
      paragraphs.push([
        { type: "text", text: "Under the revenue claim test (Labour and Assets paid their real cost first), Materials/COGS lands exactly at breakeven - covering its true cost with nothing left over. Labour and Assets are claiming exactly as much of total revenue as the business can currently support, with no margin to spare. " },
        { type: "link", label: "The Revenue Claim Test", target_id: "independent-breakeven-panel", ancestor_ids: ["how-the-numbers-are-calculated", "independent-numbers-folder"], pre_toggle_labels: ["Show breakdown"] },
        { type: "text", text: " panel below breaks down the full workings." },
      ]);
      options_added = true;
    } else {
      paragraphs.push([
        { type: "text", text: "Under the revenue claim test (Labour and Assets paid their real cost first), Materials/COGS works out to a " },
        { type: "text", text: `${materials_breakeven.current_markup_percent.toFixed(0)}%`, class: "value-bad" },
        { type: "text", text: " markup - below the 0% breakeven point. That's a signal that Labour and Assets are currently claiming more of total revenue than the business can support, not that Materials itself is mispriced. " },
        { type: "link", label: "The Revenue Claim Test", target_id: "independent-breakeven-panel", ancestor_ids: ["how-the-numbers-are-calculated", "independent-numbers-folder"], pre_toggle_labels: ["Show breakdown"] },
        { type: "text", text: " panel below breaks down the full workings." },
      ]);
      options_added = true;
    }
  }

  // Options worth knowing about - the worst group (not Materials,
  // which is always covered above).
  if (worst && worst.type === "group") {
    const group_match = (real_capacity?.group_real_capacity || []).find(
      (g) => g.group_id === worst.key
    );
    if (group_match) {
      const breakeven = calculateIndependentGroupBreakeven({ group: group_match });
      if (breakeven.available && !breakeven.is_at_or_above_breakeven) {
        paragraphs.push([
          { type: "text", text: `${worst.name} is charging ${format_currency(breakeven.current_rate_per_hour)}/hr and needs about ${format_currency(breakeven.breakeven_rate_per_hour)}/hr to break even - a gap of about ` },
          { type: "text", text: `${format_currency(Math.abs(breakeven.required_rate_delta_per_hour))}/hr`, class: "value-bad" },
          { type: "text", text: `, or ${format_currency(Math.abs(breakeven.required_revenue_delta))} a year. Business Modelling lets you explore rate changes like this.` },
        ]);
        options_added = true;
      }
    }
  }

  // Scheduling gaps - hours, not dollars, and explicitly framed
  // elsewhere as "not a profit issue" - left uncoloured.
  if (labour_coverage_gaps && labour_coverage_gaps.length > 0) {
    labour_coverage_gaps.forEach((gap) => {
      paragraphs.push(
        `${gap.group_name} has a scheduling gap, not a pricing one: assigned labour covers about ${gap.gap_hours} fewer hours (${gap.gap_days} days) than this asset runs each year - a different lever than rate.`
      );
    });
    options_added = true;
  }

  if (options_added) {
    paragraphs.push(
      "It's a picture of where things stand today, and a place to start if you want to explore what changing something would look like. The decisions from here are yours to make - Business Modelling is there when you want to test them out."
    );
  }

  return paragraphs;
}

export function BusinessOutcomeTruthSituationBlurb({
  active_headline,
  capacity_mode,
  real_capacity,
  revenue_ceiling,
  labour_coverage_gaps,
  pnl_revenue,
  breakeven_revenue,
  labour_recovery_summary,
  traditional_viability_summary,
}) {
  const summary_paragraphs = build_situation_summary({
    active_headline,
    capacity_mode,
    real_capacity,
    revenue_ceiling,
    labour_coverage_gaps,
    pnl_revenue,
    breakeven_revenue,
    labour_recovery_summary,
    traditional_viability_summary,
  });

  if (summary_paragraphs.length === 0) return null;

  return (
    <div className="ui-card theme-card-muted business-outcome-help-panel">
      <h2>Your business, right now</h2>
      {summary_paragraphs.map((paragraph, index) => (
        <p key={index}>
          {Array.isArray(paragraph)
            ? paragraph.map((segment, seg_index) =>
                segment.type === "link" ? (
                  <ScrollToSectionLink
                    key={seg_index}
                    label={segment.label}
                    target_id={segment.target_id}
                    ancestor_ids={segment.ancestor_ids || []}
                    pre_toggle_labels={segment.pre_toggle_labels || []}
                  />
                ) : (
                  <span key={seg_index} className={segment.class || undefined}>{segment.text}</span>
                )
              )
            : paragraph}
        </p>
      ))}
    </div>
  );
}
