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
function build_situation_summary({
  active_headline,
  capacity_mode,
  real_capacity,
  revenue_ceiling,
  labour_coverage_gaps,
  pnl_revenue,
  breakeven_revenue,
  labour_recovery_summary,
}) {
  const paragraphs = [];

  if (!active_headline) return paragraphs;

  // Top-line intro - net profit and revenue together, as a genuine
  // opening statement of overall health (confirmed with user - the
  // headline card above this panel shows the same net profit number,
  // but the blurb itself never actually stated it in a sentence before
  // jumping into breakeven and per-source detail).
  if (
    Number.isFinite(Number(pnl_revenue)) &&
    Number.isFinite(Number(active_headline.total_net_profit))
  ) {
    const net_profit = Number(active_headline.total_net_profit);
    if (net_profit >= 0) {
      paragraphs.push(
        `Your business made ${format_currency(net_profit)} in net profit on ${format_currency(pnl_revenue)} of revenue this year.`
      );
    } else {
      paragraphs.push(
        `Your business made a net loss of ${format_currency(Math.abs(net_profit))} on ${format_currency(pnl_revenue)} of revenue this year.`
      );
    }
  }

  // Revenue / Net Profit table - shows exactly how the net profit
  // above is actually built, source by source: real revenue
  // attributed across each source, then each source's real labour,
  // asset and overhead cost subtracted to show what it actually
  // contributes to profit. Always shown - this is the mechanical
  // detail behind the top-line net profit figure above.
  paragraphs.push([
    { type: "text", text: "The " },
    { type: "link", label: "Revenue / Net Profit table", target_id: "revenue-net-profit-panel", ancestor_ids: ["how-the-numbers-are-calculated", "independent-numbers-folder"], pre_toggle_labels: ["Show breakdown"] },
    { type: "text", text: " below shows exactly how that net profit is actually built - your real revenue attributed across each source, then each source's real labour, asset and overhead cost subtracted to show what it actually contributes to profit." },
  ]);

  // Breakeven revenue - shown next, regardless of business health,
  // since it's the single most useful standalone number on this page
  // (confirmed with user) - the exact revenue level that covers real
  // cost, no more, no less. Full comparison against actual (P&L) and
  // modelled (rates x volumes) revenue lives in the Revenue Snapshot
  // panel below, kept out of the blurb itself to avoid cluttering it
  // with a full table - this is a "click to see the numbers" pattern
  // matching the Revenue Claim Test link below.
  if (Number.isFinite(Number(breakeven_revenue))) {
    paragraphs.push([
      { type: "text", text: `Your breakeven revenue is ${format_currency(breakeven_revenue)} a year - the exact amount that covers your real cost, no more, no less. ` },
      { type: "link", label: "The Revenue Snapshot", target_id: "revenue-snapshot-panel", ancestor_ids: ["how-the-numbers-are-calculated", "independent-numbers-folder"], pre_toggle_labels: ["Show breakdown"] },
      { type: "text", text: " panel below compares that to what you're actually trading at and what your rates and volumes independently predict." },
    ]);
  }

  // Labour recovery, by source - a different lens than group-level
  // breakeven: this compares each individual labour TYPE's true cost
  // per hour (labour + allocated overhead) against its saved
  // charge-out rate, showing whether that rate actually covers the
  // cost - a rate-setting question, not a whole-group one.
  const labour_recovery_paragraph_segments = [
    { type: "text", text: "The " },
    { type: "link", label: "Labour recovery, by source table", target_id: "labour-recovery-panel", ancestor_ids: ["how-the-numbers-are-calculated", "independent-numbers-folder"], pre_toggle_labels: ["Show breakdown"] },
    { type: "text", text: " below compares each labour type's true cost per hour against its saved charge-out rate, showing whether that rate actually covers the cost." },
  ];

  // Labour recovery results - situation-dependent (confirmed with
  // user): names the weakest source if there's a shortfall, but
  // also always states the overall weighted markup % (colour-coded
  // green/red, confirmed with user) regardless of good or bad -
  // previously this was only shown in the "all good" branch, dropped
  // entirely in the shortfall branch, which is exactly the situation
  // where the overall number matters most. Appended to the SAME
  // paragraph as the table explanation above rather than pushed as
  // its own paragraph, so there's no visual gap between them.
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
        labour_recovery_paragraph_segments.push({
          type: "text",
          text: ` ${weakest.labour_source_type_name} is under-recovering by ${format_currency(Math.abs(weakest.rate_gap))}/hr - worth reviewing that rate.`,
        });
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
        labour_recovery_paragraph_segments.push({
          type: "text",
          text: ` ${strongest.labour_source_type_name} is still recovering well, at +${format_currency(strongest.rate_gap)}/hr.`,
        });
      }
    } else if (strongest) {
      labour_recovery_paragraph_segments.push({ type: "text", text: " Every labour source is recovering its true cost" });
      if (has_markup) {
        labour_recovery_paragraph_segments.push({ type: "text", text: ", at an overall labour markup of " });
        labour_recovery_paragraph_segments.push({ type: "text", text: `${markup_percent}%`, class: markup_class });
      }
      labour_recovery_paragraph_segments.push({
        type: "text",
        text: ` - ${strongest.labour_source_type_name} has the strongest margin, at +${format_currency(strongest.rate_gap)}/hr.`,
      });
    }

    if (not_ready_row_count > 0) {
      labour_recovery_paragraph_segments.push({
        type: "text",
        text: ` ${not_ready_row_count} labour source${not_ready_row_count === 1 ? " has" : "s have"} no saved charge-out rate yet, so ${not_ready_row_count === 1 ? "it" : "they"} can't be checked.`,
      });
    }
  }

  paragraphs.push(labour_recovery_paragraph_segments);


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
        paragraphs.push(
          `${best.name} is fully paying its own way, earning ${format_currency(best.net_profit)} a year.`
        );
      } else {
        paragraphs.push(
          `${healthy_sources.length} sources are fully paying their own way, together earning ${format_currency(total_healthy)} a year. ${best.name} is the strongest, at ${format_currency(best.net_profit)}.`
        );
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
      `Materials/COGS can't cover its real cost from what's left over once labour and assets are paid - the ${format_currency(real_capacity.shortfall)} shortfall is being spread across the rest of the business.`
    );
  } else if (capacity_mode === "assumed" && revenue_ceiling?.is_breached) {
    const scale_pct = ((revenue_ceiling.scale_factor ?? 1) * 100).toFixed(0);
    paragraphs.push(
      `Combined labour and asset claims exceed total revenue, so every labour and asset source has been scaled down by ${scale_pct}% at once - Materials absorbs whatever's left over.`
    );
  }

  // Materials markup - always shown, regardless of overall business
  // health, since it's a genuine, separate lever worth knowing about
  // either way (confirmed with user).
  const materials_breakeven = calculateIndependentMaterialsBreakeven({
    materials: real_capacity?.materials,
  });
  if (materials_breakeven.available) {
    const rounded_markup = Math.round(materials_breakeven.current_markup_percent);
    if (rounded_markup > 0) {
      paragraphs.push([
        { type: "text", text: `Under the revenue claim test (Labour and Assets paid their real cost first), Materials/COGS still comes out marked up at ${materials_breakeven.current_markup_percent.toFixed(0)}%, earning ${format_currency(materials_breakeven.current_net_profit)} a year - Labour and Assets aren't claiming more than the business can currently support. ` },
        { type: "link", label: "The Revenue Claim Test", target_id: "independent-breakeven-panel", ancestor_ids: ["how-the-numbers-are-calculated", "independent-numbers-folder"], pre_toggle_labels: ["Show breakdown"] },
        { type: "text", text: " panel below breaks down the full workings." },
      ]);
    } else if (rounded_markup === 0) {
      paragraphs.push([
        { type: "text", text: `Under the revenue claim test (Labour and Assets paid their real cost first), Materials/COGS lands exactly at breakeven - covering its true cost with nothing left over. Labour and Assets are claiming exactly as much of total revenue as the business can currently support, with no margin to spare. ` },
        { type: "link", label: "The Revenue Claim Test", target_id: "independent-breakeven-panel", ancestor_ids: ["how-the-numbers-are-calculated", "independent-numbers-folder"], pre_toggle_labels: ["Show breakdown"] },
        { type: "text", text: " panel below breaks down the full workings." },
      ]);
      options_added = true;
    } else {
      paragraphs.push([
        { type: "text", text: `Under the revenue claim test (Labour and Assets paid their real cost first), Materials/COGS works out to a ${materials_breakeven.current_markup_percent.toFixed(0)}% markup - below the 0% breakeven point. That's a signal that Labour and Assets are currently claiming more of total revenue than the business can support, not that Materials itself is mispriced. ` },
        { type: "link", label: "The Revenue Claim Test", target_id: "independent-breakeven-panel", ancestor_ids: ["how-the-numbers-are-calculated", "independent-numbers-folder"], pre_toggle_labels: ["Show breakdown"] },
        { type: "text", text: " panel below breaks down the full workings." },
      ]);
      options_added = true;
    }
  }

  // Options worth knowing about - the worst group (not Materials, which
  // is always covered above), only when it's a genuine rate shortfall
  // with matching group data available.
  if (worst && worst.type === "group") {
    const group_match = (real_capacity?.group_real_capacity || []).find(
      (g) => g.group_id === worst.key
    );
    if (group_match) {
      const breakeven = calculateIndependentGroupBreakeven({ group: group_match });
      if (breakeven.available && !breakeven.is_at_or_above_breakeven) {
        paragraphs.push(
          `${worst.name} is charging ${format_currency(breakeven.current_rate_per_hour)}/hr and needs about ${format_currency(breakeven.breakeven_rate_per_hour)}/hr to break even - a gap of about ${format_currency(Math.abs(breakeven.required_rate_delta_per_hour))}/hr, or ${format_currency(Math.abs(breakeven.required_revenue_delta))} a year. Business Modelling lets you explore rate changes like this.`
        );
        options_added = true;
      }
    }
  }

  // Scheduling gaps - a different lever than rate, worth naming
  // separately so it isn't mistaken for a pricing problem.
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
