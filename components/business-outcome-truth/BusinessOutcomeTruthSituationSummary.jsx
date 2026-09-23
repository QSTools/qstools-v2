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
// its own as it grows.
//
// COLOUR CODING: every number with a clear good/bad direction is
// wrapped in a coloured segment (value-good/value-bad/value-neutral).
//
// ORDER (confirmed with user): 1) the headline (net profit,
// breakeven), 2) how that headline is built (Revenue/Net Profit
// table, Traditional Viability view), 3) who's healthy (merged with
// resilience into one paragraph - worst source deliberately NOT here,
// see below), 4) lever-by-lever deep dives (materials shortfall,
// Revenue Claim Test, Labour Recovery, worst-group rate gap), 5)
// closing, 6) "Things to check" - a grouped, headed section at the
// very end collecting the worst source, scheduling gaps, and the P&L
// cross-check together, since these are genuine flags to review
// rather than part of the steady-state narrative above.
function build_situation_summary({
  active_headline,
  capacity_mode,
  real_capacity,
  revenue_ceiling,
  capacity_coverage_gap,
  pnl_revenue,
  breakeven_revenue,
  labour_recovery_summary,
  traditional_viability_summary,
  pnl_net_profit_actual,
  pnl_trading_income_actual,
  view_b_modelled_revenue,
  balance_sheet_current_year_earnings,
  fixed_assets_reconciliation,
  balance_sheet_working_capital,
}) {
  const paragraphs = [];
  const things_to_check = [];

  if (!active_headline) return paragraphs;

  // === 1. THE HEADLINE ===

  const has_pnl_revenue = Number.isFinite(Number(pnl_revenue));
  const has_net_profit = Number.isFinite(Number(active_headline.total_net_profit));
  const has_breakeven = Number.isFinite(Number(breakeven_revenue));
  let net_profit_percent = null;

  if (has_pnl_revenue && has_net_profit) {
    const net_profit = Number(active_headline.total_net_profit);
    const net_profit_class = net_profit >= 0 ? "value-good" : "value-bad";
    net_profit_percent = Number(pnl_revenue) !== 0 ? (net_profit / Number(pnl_revenue)) * 100 : null;
    const revenue_class = has_breakeven
      ? Number(pnl_revenue) >= Number(breakeven_revenue)
        ? "value-good"
        : "value-bad"
      : "";

    const intro_segments = [];
    if (net_profit >= 0) {
      intro_segments.push({ type: "text", text: "Your business made " });
      intro_segments.push({ type: "text", text: format_currency(net_profit), class: net_profit_class });
      intro_segments.push({ type: "text", text: " in net profit" });
    } else {
      intro_segments.push({ type: "text", text: "Your business made a net loss of " });
      intro_segments.push({ type: "text", text: format_currency(Math.abs(net_profit)), class: net_profit_class });
    }
    if (Number.isFinite(net_profit_percent)) {
      intro_segments.push({ type: "text", text: " (" });
      intro_segments.push({ type: "text", text: `${net_profit_percent.toFixed(1)}%`, class: net_profit_class });
      intro_segments.push({ type: "text", text: ")" });
    }
    intro_segments.push({ type: "text", text: " on " });
    intro_segments.push({ type: "text", text: format_currency(pnl_revenue), class: revenue_class || undefined });
    intro_segments.push({ type: "text", text: " of revenue this year." });

    paragraphs.push(intro_segments);
  }

  // P&L cross-check - computed here (needs net_profit_percent from
  // above) but deferred into Things to check at the bottom, since a
  // drift here is a genuine flag to review, not part of the
  // steady-state narrative.
  if (
    Number.isFinite(Number(pnl_net_profit_actual)) &&
    Number.isFinite(Number(pnl_trading_income_actual)) &&
    Number(pnl_trading_income_actual) !== 0
  ) {
    const pnl_actual_profit = Number(pnl_net_profit_actual);
    const pnl_actual_percent = (pnl_actual_profit / Number(pnl_trading_income_actual)) * 100;
    const pnl_actual_class = pnl_actual_profit >= 0 ? "value-good" : "value-bad";

    const pnl_segments = [
      { type: "text", text: "Your P&L reports a net profit of " },
      { type: "text", text: format_currency(pnl_actual_profit), class: pnl_actual_class },
      { type: "text", text: " (" },
      { type: "text", text: `${pnl_actual_percent.toFixed(1)}%`, class: pnl_actual_class },
      { type: "text", text: ")." },
    ];

    const percent_diff = Number.isFinite(net_profit_percent)
      ? Math.abs(net_profit_percent - pnl_actual_percent)
      : null;
    if (percent_diff !== null && percent_diff > 0.1) {
      let severity_text;
      if (percent_diff <= 3) {
        severity_text = "a small difference, worth keeping an eye on";
      } else if (percent_diff <= 10) {
        severity_text = "a noticeable difference - often caused by Labour or Asset module inputs not yet matching the P&L, or an unresolved interest journal adjustment - worth checking Module Reconciliation, and Labour/Assets, for what's driving it";
      } else {
        severity_text = "a significant difference - often caused by Labour or Asset module inputs not yet matching the P&L, or an unresolved interest journal adjustment - worth checking Module Reconciliation, and Labour/Assets, for what's driving it";
      }
      pnl_segments.push({ type: "text", text: ` That's ${severity_text}.` });
    }

    things_to_check.push(pnl_segments);
  }

  // Balance Sheet Current Year Earnings cross-check (2026-09-12) - same
  // pattern as the P&L cross-check above: an independently-derived
  // figure (this time from the Balance Sheet's Equity section, via Xero)
  // compared against our own cascade-derived net profit. Deliberately
  // NOT reconciled or forced to match - a difference here is a genuine
  // signal worth checking (timing differences, unposted journals, or a
  // stale Balance Sheet import), not a bug to hide. Only shown if a
  // Balance Sheet has actually been imported (null otherwise).
  if (
    Number.isFinite(Number(balance_sheet_current_year_earnings)) &&
    has_net_profit
  ) {
    const bs_earnings = Number(balance_sheet_current_year_earnings);
    const our_net_profit = Number(active_headline.total_net_profit);
    const bs_class = bs_earnings >= 0 ? "value-good" : "value-bad";

    const bs_segments = [
      { type: "text", text: "Your imported Balance Sheet shows Current Year Earnings of " },
      { type: "text", text: format_currency(bs_earnings), class: bs_class },
      { type: "text", text: "." },
    ];

    const dollar_diff = Math.abs(our_net_profit - bs_earnings);
    if (dollar_diff > 1) {
      let severity_text;
      if (dollar_diff <= 1000) {
        severity_text = "a small difference, worth keeping an eye on";
      } else {
        severity_text = "a noticeable difference - often caused by timing (unposted journals, a Balance Sheet imported from a different date than this year's real data), or the two figures genuinely measuring slightly different things - worth checking against your accountant if it persists";
      }
      bs_segments.push({ type: "text", text: ` That's ${severity_text}.` });
    }

    things_to_check.push(bs_segments);
  }

  // Fixed Assets reconciliation (2026-09-12) - only rendered when a real
  // gross-to-gross comparison was possible (comparison_status === "compared").
  // The other statuses (net_only_cannot_compare, assets_total_not_available,
  // no_fixed_assets_in_balance_sheet) are non-issues, not flags - deliberately
  // silent rather than cluttering Things to check with technical status
  // messages nobody needs to act on. See calculateFixedAssetsReconciliation's
  // own docstring (lib/calculations/balanceSheetCalculations.js) for why the
  // gross/net distinction matters here.
  if (fixed_assets_reconciliation?.comparison_status === "compared") {
    const { balance_sheet_gross_total, assets_total_purchase_price, dollar_diff, has_meaningful_diff, partial_match } =
      fixed_assets_reconciliation;

    if (has_meaningful_diff) {
      const fa_segments = [
        { type: "text", text: "Your Balance Sheet's gross Fixed Assets total is " },
        { type: "text", text: format_currency(balance_sheet_gross_total), class: "value-neutral" },
        { type: "text", text: ", against " },
        { type: "text", text: format_currency(assets_total_purchase_price), class: "value-neutral" },
        { type: "text", text: " of purchase price recorded in Assets - a difference of " },
        { type: "text", text: format_currency(Math.abs(dollar_diff)), class: "value-bad" },
        { type: "text", text: ". Worth checking whether every asset on the Balance Sheet is also recorded in Assets, and vice versa." },
      ];
      if (partial_match) {
        fa_segments.push({ type: "text", text: " (Note: not every Fixed Assets line had a matching depreciation line, so this comparison may be incomplete.)" });
      }
      things_to_check.push(fa_segments);
    }
  }

  // Breakeven revenue - coloured neutral/blue: it's the reference
  // point everything else is measured against, not itself a good or
  // bad outcome.
  if (has_breakeven) {
    paragraphs.push([
      { type: "text", text: "Your breakeven revenue is " },
      { type: "text", text: `${format_currency(breakeven_revenue)} a year`, class: "value-neutral" },
      { type: "text", text: " - the exact amount that covers your real cost, no more, no less. " },
      { type: "link", label: "The Revenue Snapshot", target_id: "revenue-snapshot-panel", ancestor_ids: ["how-the-numbers-are-calculated", "independent-numbers-folder"], pre_toggle_labels: ["Show breakdown"] },
      { type: "text", text: " panel below compares that to what you're actually trading at and what your rates and volumes independently predict." },
    ]);
  }

  // === 2. HOW THAT HEADLINE IS BUILT ===

  paragraphs.push([
    { type: "text", text: "Want to see exactly how that adds up? The " },
    { type: "link", label: "Revenue / Net Profit table", target_id: "revenue-net-profit-panel", ancestor_ids: ["how-the-numbers-are-calculated", "independent-numbers-folder"], pre_toggle_labels: ["Show breakdown"] },
    { type: "text", text: " below walks through it source by source - your real revenue attributed across each source, then each source's real labour, asset and overhead cost subtracted to show what it actually contributes to profit." },
  ]);

  const traditional_viability_paragraph_segments = [
    { type: "text", text: "Looking at the traditional accounting way instead, the story holds up: the " },
    { type: "link", label: "Traditional viability view table", target_id: "traditional-viability-panel", ancestor_ids: ["how-the-numbers-are-calculated", "independent-numbers-folder"], pre_toggle_labels: ["Show breakdown"] },
    { type: "text", text: " below covers revenue, COGS, gross margin, cost burden, and bottom-line operating profit for the whole business - a different lens than the per-source breakdown above." },
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
        traditional_viability_paragraph_segments.push({
          type: "text",
          text: " Cost absorption status isn't available yet - Cost Summary data isn't fully trusted, so this label is being held back until that's resolved.",
        });
      }
    }
  }

  paragraphs.push(traditional_viability_paragraph_segments);

  // === 2.5 VIEW A / VIEW B MATERIALS MARKUP VARIANCE ===
  // View B prices Materials/COGS independently (real COGS x Rate
  // Builder's markup target) instead of as a leftover, so its total
  // revenue genuinely differs from the P&L figure above - by design,
  // not a bug (2026-09-10 decision, see brief). Surfaced here in
  // "how it's built" so nobody stumbles on View B's own total lower
  // down the page and assumes something's broken. Sign convention:
  // positive variance = actual outperforming the markup assumption
  // (headroom); negative = a signal worth investigating. Deliberately
  // avoids "budget" language - Mirra has no job-budget concept, only
  // rates, hours, COGS and markup.
  if (
    Number.isFinite(Number(pnl_revenue)) &&
    Number.isFinite(Number(view_b_modelled_revenue)) &&
    Number(view_b_modelled_revenue) !== 0
  ) {
    const markup_variance = Number(pnl_revenue) - Number(view_b_modelled_revenue);
    if (Math.abs(markup_variance) > 1) {
      const variance_segments = [
        { type: "text", text: "One thing worth knowing: switching to View B further down will show a different total revenue and net profit than the figures above. That's because View B prices Materials/COGS independently, from your real cost of sales and Rate Builder's markup target, rather than as whatever's left over once labour and assets are paid - see the " },
        { type: "link", label: "View A vs View B comparison table", target_id: "view-ab-comparison-panel", ancestor_ids: ["how-the-numbers-are-calculated", "views-folder"], pre_toggle_labels: ["Show breakdown"] },
        { type: "text", text: " below for the full breakdown. " },
      ];
      if (markup_variance > 0) {
        variance_segments.push(
          { type: "text", text: "Right now that shows " },
          { type: "text", text: `${format_currency(markup_variance)} of headroom`, class: "value-good" },
          { type: "text", text: " - your real results are outperforming that markup target, so there's room to move on price if the market softens." }
        );
      } else {
        variance_segments.push(
          { type: "text", text: "Right now that shows a " },
          { type: "text", text: `${format_currency(Math.abs(markup_variance))} gap`, class: "value-bad" },
          { type: "text", text: " worth investigating - it could mean your real effective markup differs from what's set, or that actual hours and materials used are running ahead of or behind what your rates and markup would predict." }
        );
      }
      paragraphs.push(variance_segments);
    }
  }

  // === 3. WHO'S HEALTHY (worst source deferred to Things to check) ===

  let worst = null;
  let options_added = false;
  let health_segments = null;

  if (active_headline.all_good) {
    health_segments = [
      { type: "text", text: "Zooming into individual sources, every part of the business is currently paying its way - no source is being propped up by the rest, so there's no cross-subsidy happening beneath the numbers above." },
    ];
  } else {
    const healthy_sources = (active_headline.all_sources || []).filter(
      (s) => s.verdict === "paying_its_way"
    );
    if (healthy_sources.length > 0) {
      const total_healthy = healthy_sources.reduce((sum, s) => sum + (s.net_profit ?? 0), 0);
      const best = [...healthy_sources].sort((a, b) => (b.net_profit ?? 0) - (a.net_profit ?? 0))[0];
      if (healthy_sources.length === 1) {
        health_segments = [
          { type: "text", text: `Zooming into individual sources, ${best.name} is fully paying its own way, earning ` },
          { type: "text", text: `${format_currency(best.net_profit)} a year`, class: "value-good" },
          { type: "text", text: "." },
        ];
      } else {
        health_segments = [
          { type: "text", text: `Zooming into individual sources, ${healthy_sources.length} sources are fully paying their own way, together earning ` },
          { type: "text", text: `${format_currency(total_healthy)} a year`, class: "value-good" },
          { type: "text", text: `. ${best.name} is the strongest, at ` },
          { type: "text", text: format_currency(best.net_profit), class: "value-good" },
          { type: "text", text: "." },
        ];
      }
    }

    worst = active_headline.being_carried?.[0];
    const count = active_headline.being_carried?.length ?? 0;
    const total = active_headline.total_group_count ?? 0;
    if (worst && count === 1) {
      if (Math.abs(worst.net_profit) < 1) {
        things_to_check.push([
          { type: "text", text: `${worst.name} is the only part of the business not covering its own cost right now - it's being kept at exactly $0, cross-subsidised by the rest of the business rather than genuinely breaking even.` },
        ]);
      } else {
        things_to_check.push([
          { type: "text", text: `${worst.name} is the only part of the business not covering its own cost right now, at ` },
          { type: "text", text: `${format_currency(worst.net_profit)} a year`, class: "value-bad" },
          { type: "text", text: "." },
        ]);
      }
    } else if (worst) {
      things_to_check.push([
        { type: "text", text: `${count} of ${total} sources aren't covering their own cost right now. ${worst.name} is carrying the largest shortfall, at ` },
        { type: "text", text: `${format_currency(worst.net_profit)} a year`, class: "value-bad" },
        { type: "text", text: "." },
      ]);
    }
  }

  // Deliberately always View A's real_capacity here, regardless of
  // the page's View A/B toggle (2026-09-10 decision: the blurb stays
  // stable to View A throughout, see stable_headline in the Card and
  // the variance paragraph above). This is not a bug - do not branch
  // this on view_mode_ab.
  const groups_with_margin = (real_capacity?.group_real_capacity || [])
    .filter((g) => (g.modelled_revenue ?? 0) > 0)
    .map((g) => ({ ...g, margin_pct: (g.modelled_revenue - g.true_cost) / g.modelled_revenue }));

  if (groups_with_margin.length > 1) {
    const most_resilient = [...groups_with_margin].sort((a, b) => b.margin_pct - a.margin_pct)[0];
    const least_resilient = [...groups_with_margin].sort((a, b) => a.margin_pct - b.margin_pct)[0];
    if (most_resilient.group_id !== least_resilient.group_id) {
      const resilience_segments = [
        { type: "text", text: `${most_resilient.group_name} is your most resilient source, with a ` },
        { type: "text", text: `${(most_resilient.margin_pct * 100).toFixed(0)}% margin buffer`, class: "value-neutral" },
        { type: "text", text: `. ${least_resilient.group_name} has the thinnest buffer, at ` },
        { type: "text", text: `${(least_resilient.margin_pct * 100).toFixed(0)}%`, class: "value-neutral" },
        { type: "text", text: `, so it's the first place to watch if revenue softens.` },
      ];

      if (health_segments) {
        health_segments.push({ type: "text", text: " " });
        health_segments.push(...resilience_segments);
      } else {
        health_segments = resilience_segments;
      }

      if (worst && worst.name === most_resilient.group_name && things_to_check.length > 0) {
        const last_check = things_to_check[things_to_check.length - 1];
        last_check.push({
          type: "text",
          text: ` That's largely because it also has the biggest revenue share in the business - once a shortfall is spread proportionally, the biggest source takes the biggest dollar hit, even though its underlying margin is still the strongest of any source.`,
        });
      }
    }
  }

  if (health_segments) {
    paragraphs.push(health_segments);
  }

  // === 4. LEVER-BY-LEVER DEEP DIVES ===

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

  // Deliberately always View A's real_capacity.materials here too,
  // same stability principle as above - do not branch this on
  // view_mode_ab. The View A/B variance is already explained
  // separately, see the paragraph above.
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

  const labour_recovery_paragraph_segments = [
    { type: "text", text: "One lever worth checking on its own is whether your labour rates actually cover cost: the " },
    { type: "link", label: "Labour recovery, by source table", target_id: "labour-recovery-panel", ancestor_ids: ["how-the-numbers-are-calculated", "independent-numbers-folder"], pre_toggle_labels: ["Show breakdown"] },
    { type: "text", text: " below compares each labour type's true cost per hour against its saved charge-out rate." },
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

  // Capacity coverage gap (2026-09-11, replaces the old labour_coverage_gaps
  // message - this supersedes it: same underlying hours, but bidirectional
  // (also catches overstaffing, not just shortfall) and includes a dollar
  // value, not just hours. Deferred to Things to check, sorted worst-first
  // by dollar value, with a link to the full per-group table.
  if (Array.isArray(capacity_coverage_gap)) {
    const flagged_gaps = capacity_coverage_gap
      .filter((g) => g.gap_type !== "none" && g.gap_dollar_value !== null)
      .sort((a, b) => Math.abs(b.gap_dollar_value) - Math.abs(a.gap_dollar_value));

    flagged_gaps.forEach((g) => {
      const abs_hours = Math.round(Math.abs(g.gap_hours));
      const abs_dollars = format_currency(Math.abs(g.gap_dollar_value));
      if (g.gap_type === "revenue_at_risk" && g.labour_hours === 0) {
        things_to_check.push([
          { type: "text", text: `${g.group_name} has no labour assigned, so ` },
          { type: "text", text: `${abs_dollars} a year`, class: "value-bad" },
          { type: "text", text: ` of potential revenue is not being counted: this asset could run ${abs_hours} hours a year, but nobody is there to run it, so it earns nothing here while its costs still count. Assign labour to this working unit in Cost Allocation, or confirm the asset isn't meant to be productive.` },
        ]);
      } else if (g.gap_type === "revenue_at_risk") {
        things_to_check.push([
          { type: "text", text: `${g.group_name} has a scheduling gap, not a pricing one: assigned labour covers about ${abs_hours} fewer hours than this asset runs each year, so ` },
          { type: "text", text: `${abs_dollars} a year`, class: "value-bad" },
          { type: "text", text: " of revenue is not being earned - those hours are left out of the figures above because nobody is assigned to cover them." },
        ]);
      } else if (g.gap_type === "wasted_cost") {
        things_to_check.push([
          { type: "text", text: `${g.group_name} is currently overstaffed relative to what it runs: assigned labour exceeds the asset's hours by about ${abs_hours}, costing about ` },
          { type: "text", text: `${abs_dollars} a year`, class: "value-bad" },
          { type: "text", text: " that current revenue doesn't account for." },
        ]);
      } else if (g.gap_type === "opportunity") {
        things_to_check.push([
          { type: "text", text: `${g.group_name}'s asset is running about ${abs_hours} more hours than assigned labour, worth ` },
          { type: "text", text: `${abs_dollars} a year`, class: "value-neutral" },
          { type: "text", text: " in capacity that isn't currently being converted to revenue." },
        ]);
      } else if (g.gap_type === "data_check") {
        things_to_check.push([
          { type: "text", text: `${g.group_name}'s assigned labour hours exceed the asset's actual running time by about ${abs_hours} - worth checking whether this is a data or scheduling oddity.` },
        ]);
      }
    });

    if (flagged_gaps.length > 0) {
      things_to_check.push([
        { type: "text", text: "See the " },
        { type: "link", label: "capacity coverage table", target_id: "capacity-coverage-gap-panel", ancestor_ids: ["how-the-numbers-are-calculated"], pre_toggle_labels: ["Show breakdown"] },
        { type: "text", text: " below for the full breakdown of every source." },
      ]);
      options_added = true;
    }

    // Liquidity-as-constraint cross-check (2026-09-12) - connects two
    // pieces of real data already shown separately on this page:
    // Balance Sheet's working capital, and a genuine "revenue_at_risk"
    // coverage gap (where the fix means ADDING labour cost, per Section
    // 9 of the original session brief - not the simple wasted_cost
    // case). Only fires when BOTH are real and negative-for-affordability -
    // a standalone insight, does not require Business Modelling to exist.
    const revenue_at_risk_gaps = flagged_gaps.filter((g) => g.gap_type === "revenue_at_risk");
    if (
      revenue_at_risk_gaps.length > 0 &&
      Number.isFinite(Number(balance_sheet_working_capital)) &&
      Number(balance_sheet_working_capital) < 0
    ) {
      const worst_gap = revenue_at_risk_gaps[0];
      things_to_check.push([
        { type: "text", text: `Fixing ${worst_gap.group_name}'s coverage gap the right way means adding real labour cost, before that revenue becomes genuinely achievable. But your working capital is currently ` },
        { type: "text", text: format_currency(Math.abs(balance_sheet_working_capital)), class: "value-bad" },
        { type: "text", text: " negative - meaning short-term bills already exceed what's available to cover them. Adding cost now, before the extra revenue arrives, could genuinely strain cash flow in the meantime, even though it's the right move long-term. Worth checking this is affordable right now, not just correct - see the Balance Sheet's working capital and liquidity ratios above." },
      ]);
    }
  }

  // === 5. CLOSING ===

  if (options_added) {
    paragraphs.push(
      "It's a picture of where things stand today, and a place to start if you want to explore what changing something would look like. The decisions from here are yours to make - Business Modelling is there when you want to test them out."
    );
  }

  // === 6. THINGS TO CHECK ===
  if (things_to_check.length > 0) {
    paragraphs.push({ is_header: true, text: "Things to check" });
    things_to_check.forEach((item) => paragraphs.push(item));
  }

  return paragraphs;
}

export function BusinessOutcomeTruthSituationBlurb({
  active_headline,
  capacity_mode,
  real_capacity,
  revenue_ceiling,
  capacity_coverage_gap,
  pnl_revenue,
  breakeven_revenue,
  labour_recovery_summary,
  traditional_viability_summary,
  pnl_net_profit_actual,
  pnl_trading_income_actual,
  view_b_modelled_revenue,
  balance_sheet_current_year_earnings,
  fixed_assets_reconciliation,
  balance_sheet_working_capital,
}) {
  const summary_paragraphs = build_situation_summary({
    active_headline,
    capacity_mode,
    real_capacity,
    revenue_ceiling,
    capacity_coverage_gap,
    pnl_revenue,
    breakeven_revenue,
    labour_recovery_summary,
    traditional_viability_summary,
    pnl_net_profit_actual,
    pnl_trading_income_actual,
    view_b_modelled_revenue,
    balance_sheet_current_year_earnings,
    fixed_assets_reconciliation,
    balance_sheet_working_capital,
  });

  if (summary_paragraphs.length === 0) return null;

  return (
    <div className="ui-card theme-card-muted business-outcome-help-panel">
      <h2>Your business, right now</h2>
      {summary_paragraphs.map((paragraph, index) =>
        paragraph && paragraph.is_header ? (
          <div key={index} className="business-outcome-ledger-section-title" style={{ marginTop: "1.25rem" }}>
            {paragraph.text}
          </div>
        ) : (
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
        )
      )}
    </div>
  );
}
