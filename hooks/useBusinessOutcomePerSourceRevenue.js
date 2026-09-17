"use client";

import { useEffect, useMemo, useState } from "react";

import useBusinessOutcomeLabourRecovery from "@/hooks/useBusinessOutcomeLabourRecovery";
import useCostAllocation from "@/hooks/useCostAllocation";
import useBusinessSummary from "@/hooks/useBusinessSummary";
import useAssets from "@/hooks/useAssets";
import useOpeningHours from "@/hooks/useOpeningHours";
import { loadRateBuilderCalculators } from "@/lib/storage/rateBuilderStorage";
import { calculateRateBuilderQuotePreview } from "@/lib/calculations/rateBuilderCalculations";
import { readRateBuilderMaterialsMarkup } from "@/lib/storage/rateBuilderMaterialsMarkupStorage";
import { readNonProductiveCostPolicy } from "@/lib/storage/businessOutcomeNonProductivePolicyStorage";
import { build_materials_source, apply_revenue_ceiling_v2, apply_real_capacity_v2 } from "@/lib/calculations/businessOutcomeViewBCalculations";
import { calculateGaugeInput } from "@/lib/calculations/businessModellingIndependentCalculations";

// Business Outcome - Per-Source Revenue Attribution (S26/S27/S29).
//
// Every labour source and every priced asset shown individually: real
// modelled revenue, real true cost, paying-its-way verdict. See S29 for
// the full mechanism trace - this hook is pure composition of numbers
// that already exist and are already independently correct elsewhere
// (useBusinessOutcomeLabourRecovery for labour, Cost Allocation's
// enriched per-source assignment arrays for asset hours/cost, Rate
// Builder's existing calculator preview for group blended rate).
//
// CRITICAL FRAMING (S29 Section 3): per-source revenue here is a MODEL -
// real charge-out rate x real EXPECTED hours (Assets/Labour module
// utilisation assumption) - NOT a measurement of actual invoiced
// revenue. It will not equal actual P&L revenue and is not meant to.
// The variance IS the diagnostic. Never force it to reconcile.
//
// Cost, by contrast, IS real on both sides (per-source true cost vs
// P&L cost burden) and SHOULD reconcile - a variance there is a genuine
// leak, not a diagnostic finding. Do not treat these two variances the
// same way anywhere downstream of this hook.

export function to_number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function round_currency(value) {
  return Number(to_number(value).toFixed(2));
}

export function verdict_for(net_profit) {
  return net_profit >= 0 ? "paying_its_way" : "being_carried";
}

// Duplicated intentionally from businessOutcomeAssetSplitCalculations.js
// rather than importing/exporting it, per S29's final principle - that
// file's own group-split logic is being left alone (still in use
// elsewhere, still correct for what it does), not modified to serve
// this new, independent calculation. Same driver-quantity logic, exact
// copy.
function getRecoveryDriverQuantity(lineTotals, outputDriverQuantity) {
  const timeLineQuantity = lineTotals
    .filter((line) => line.type === "time")
    .reduce((total, line) => total + to_number(line.quantity), 0);

  return timeLineQuantity > 0 ? timeLineQuantity : outputDriverQuantity;
}

// Group's blended $/hr rate, computed fresh and independently here -
// deliberately NOT reusing businessOutcomeAssetSplitCalculations.js's
// asset revenue figure, since that figure is derived by subtraction
// against the stale labour rate (S29 Section confirming this
// contamination) and must not be propagated into this new, corrected
// view.
function get_group_blended_rate(group, calculators) {
  const calculator = calculators.find(
    (calc) => calc?.linked_cost_allocation_group_id === group.group_id
  );

  if (!calculator || !Array.isArray(calculator.lines) || calculator.lines.length === 0) {
    return { blended_rate: null, reason: "No Rate Builder calculator linked to this group" };
  }

  const preview = calculateRateBuilderQuotePreview(calculator.lines);
  const recovery_driver_quantity = getRecoveryDriverQuantity(
    preview.line_totals,
    preview.output_driver_quantity
  );

  if (recovery_driver_quantity <= 0 || !to_number(preview.total_charge)) {
    return { blended_rate: null, reason: "Calculator recovery driver not set" };
  }

  return {
    blended_rate: to_number(preview.total_charge) / recovery_driver_quantity,
    reason: null,
  };
}

// S29 Section 4, CONFIRMED (corrected from the routed-to-one-side draft):
// a mixed group's overhead is split between labour and asset by each
// side's share of the group's own cost - assigned_labour_cost vs
// assigned_asset_burden - then combined with each side's other true
// cost, per the user's confirmation this session. This mirrors how
// group_cost_stacks already keeps labour and asset cost as separate
// figures on the same row, never blended - overhead now follows the
// same pattern instead of being routed all-or-nothing by the group's
// (unrelated) recovery-hours driver choice. Cost Allocation has already
// computed assigned_overhead_amount for the group upstream of this hook
// - this only divides that already-correct figure, it does not
// recalculate overhead itself.
function split_group_overhead(group) {
  const overhead = to_number(group.assigned_overhead_amount);
  const labour_cost = to_number(group.assigned_labour_cost);
  const asset_cost = to_number(group.assigned_asset_burden);
  const total_cost = labour_cost + asset_cost;

  if (total_cost <= 0) {
    return { labour_overhead_pool: 0, asset_overhead_pool: 0 };
  }

  return {
    labour_overhead_pool: overhead * (labour_cost / total_cost),
    asset_overhead_pool: overhead * (asset_cost / total_cost),
  };
}

function build_asset_sources(operational_group_cost_rows, calculators, operational_group_recovery_rows = [], asset_interest_by_id = new Map(), asset_depreciation_by_id = new Map(), blended_rate_overrides = {}) {
  const rows = [];
  const recovery_rate_by_group_id = new Map(operational_group_recovery_rows.map((r) => [r.group_id, r.minimum_recoverable_rate_per_hour]));

  operational_group_cost_rows.forEach((group) => {
    const asset_assignments = Array.isArray(group.asset_group_assignments)
      ? group.asset_group_assignments
      : [];

    if (asset_assignments.length === 0) {
      return;
    }

    // Business Modelling override (2026-09-17): if a modelled blended
    // rate is supplied for this working unit, it replaces Rate
    // Builder's live calculator result - real cost is untouched, only
    // the revenue-side rate changes. Falls back to the real live value
    // whenever no override is present, so every existing page (which
    // never passes blended_rate_overrides) is byte-identical to before
    // this change.
    const override_blended_rate = blended_rate_overrides[group.group_id];
    const has_blended_rate_override =
      override_blended_rate !== undefined && override_blended_rate !== null && override_blended_rate !== "";
    const live_blended_rate_result = get_group_blended_rate(group, calculators);
    const blended_rate = has_blended_rate_override
      ? to_number(override_blended_rate)
      : live_blended_rate_result.blended_rate;
    const reason = has_blended_rate_override ? null : live_blended_rate_result.reason;
    const { asset_overhead_pool } = split_group_overhead(group);

    // Real sum of this group's own per-asset hours - deliberately NOT
    // group.assigned_asset_hours, which is a MAX across assignments
    // (costAllocationGroupCostBuilder.js), not a sum, and would silently
    // under- or over-share overhead if used as the split denominator.
    const group_asset_hours_sum = asset_assignments.reduce(
      (sum, assignment) => sum + to_number(assignment.assigned_asset_hours),
      0
    );

    // Real sum of this group's own per-asset direct costs - the
    // denominator for the revenue cost-share split above (Fix 1).
    const group_asset_cost_sum = asset_assignments.reduce(
      (sum, assignment) => sum + to_number(assignment.assigned_asset_cost),
      0
    );

    asset_assignments.forEach((assignment) => {
      const asset_hours = to_number(assignment.assigned_asset_hours);
      const asset_cost = to_number(assignment.assigned_asset_cost);

      const overhead_share =
        group_asset_hours_sum > 0
          ? asset_overhead_pool * (asset_hours / group_asset_hours_sum)
          : 0;

      const true_cost = asset_cost + overhead_share;

      // Revenue split across co-deployed assets by direct-cost share,
      // NOT full-credit per asset. Assets in the same group sharing the
      // same recovery hours (e.g. a pump + its tow vehicle, both
      // deployed for the full job) do not each independently earn the
      // group's full charge - the job is charged once. This IS an
      // allocation (unlike direct cost, which is real per-asset), using
      // the same cost-share basis already used for the labour/asset
      // overhead split, for consistency - must be labelled as an
      // allocation wherever shown, not presented as directly measured.
      // FIX: group revenue must use the group's own real recovery hours
      // (the job's actual duration), NOT a sum of individual assets'
      // hours - two assets co-deployed on the same job (e.g. pump + tow
      // vehicle) don't each add their hours to the job length. Summing
      // them re-introduced the same double-count this fix was meant to
      // remove, just one level up.
      const group_asset_revenue =
        blended_rate !== null ? blended_rate * to_number(group.group_recovery_hours) : null;

      const asset_cost_share =
        group_asset_cost_sum > 0 ? asset_cost / group_asset_cost_sum : 0;

      const modelled_revenue =
        group_asset_revenue !== null ? group_asset_revenue * asset_cost_share : null;

      const net_profit =
        modelled_revenue !== null ? modelled_revenue - true_cost : null;

      // Added 2026-09-12 for per-source EBIT - a real, already-computed
      // per-asset figure (see asset_finance_breakdown on
      // /module-reconciliation), scaled by this assignment's share
      // (assignment_percent), same basis as assigned_asset_cost above.
      // Purely additive - not used anywhere in the true_cost/net_profit
      // math above or below.
      const assignment_percent_num = to_number(assignment.assignment_percent);
      const interest_share = Number.isFinite(assignment_percent_num) ? assignment_percent_num / 100 : 1;
      const asset_interest_annual = (asset_interest_by_id.get(assignment.asset_id) || 0) * interest_share;
      const asset_depreciation_annual = (asset_depreciation_by_id.get(assignment.asset_id) || 0) * interest_share;

      rows.push({
        asset_id: assignment.asset_id || "",
        asset_name: assignment.asset_name || "Unnamed asset",
        group_id: group.group_id,
        group_name: group.group_name,
        hours: round_currency(asset_hours),
        direct_cost: round_currency(asset_cost),
        overhead_share: round_currency(overhead_share),
        true_cost: round_currency(true_cost),
        asset_interest_annual: round_currency(asset_interest_annual),
        asset_depreciation_annual: round_currency(asset_depreciation_annual),
        blended_rate: blended_rate !== null ? round_currency(blended_rate) : null,
        minimum_recoverable_rate_per_hour: recovery_rate_by_group_id.get(group.group_id) ?? null,
        modelled_revenue: modelled_revenue !== null ? round_currency(modelled_revenue) : null,
        net_profit: net_profit !== null ? round_currency(net_profit) : null,
        verdict: net_profit !== null ? verdict_for(net_profit) : null,
        is_modelled: true,
        available: modelled_revenue !== null,
        unavailable_reason: modelled_revenue === null ? reason : null,
      });
    });
  });

  return rows.sort((a, b) => (b.modelled_revenue ?? -Infinity) - (a.modelled_revenue ?? -Infinity));
}

// FIX (confirmed live, $2,435 gap traced): labour true_cost was
// double-counting overhead - useBusinessOutcomeLabourRecovery's
// true_cost_per_hour already bakes in Rate Builder's own overhead
// figure (~$51,186, nearly the WHOLE business overhead pool), while
// this hook was separately adding Cost Allocation's overhead share on
// top. Only one source can own overhead here. Cost Allocation is the
// correct one - its assigned_overhead_amount is the pool AFTER direct
// costs (insurance, ACC, running costs) already assigned straight to a
// labour/asset source have reduced it, confirmed via
// remaining_overhead_pool_amount (S27) - it is built to sum to real
// total_business_overheads, and does (confirmed, near-zero residual).
// Rate Builder's embedded overhead answers a different question (is
// THIS hourly rate recovering) and must not be summed business-wide.
//
// Labour now mirrors asset exactly: real per-source direct cost (from
// Cost Allocation's own assigned_cost, NOT the blended
// true_cost_per_hour) + this source's own hours-share slice of its
// group's Cost-Allocation-sourced labour_overhead_pool. charge_out_rate
// is still reused from useBusinessOutcomeLabourRecovery (that hook
// remains correct and unchanged for its own purpose - rate recovery,
// not whole-business cost totalling) - only the COST side changes here.
function build_labour_sources(operational_group_cost_rows, labour_recovery_rows, operational_group_recovery_rows = [], rate_overrides = {}) {
  const recovery_rate_by_group_id = new Map(operational_group_recovery_rows.map((r) => [r.group_id, r.minimum_recoverable_rate_per_hour]));
  const charge_out_rate_by_id = new Map(
    labour_recovery_rows.map((row) => [row.labour_source_type_id, to_number(row.charge_out_rate)])
  );
  // Business Modelling override (2026-09-17): a modelled charge-out
  // rate for this specific labour type, keyed by staff_type_id,
  // replaces the live Rate Builder rate. Real cost is untouched - only
  // the revenue-side rate changes. Falls back to the real live map
  // whenever rate_overrides is empty, so every existing page is
  // byte-identical to before this change.
  Object.entries(rate_overrides).forEach(([staff_type_id, override_rate]) => {
    if (override_rate !== undefined && override_rate !== null && override_rate !== "") {
      charge_out_rate_by_id.set(staff_type_id, to_number(override_rate));
    }
  });
  const staff_type_name_by_id = new Map(
    labour_recovery_rows.map((row) => [row.labour_source_type_id, row.labour_source_type_name])
  );

  // FIX (confirmed live): labour was pooled globally by staff_type_id,
  // hiding group-specific performance - e.g. a "Foreman" group containing
  // Owner/Director + Senior Operator had those staff types' Foreman hours
  // merged with the SAME staff types' hours from every other group they
  // also appear in, averaging away whether Foreman specifically is
  // profitable. Now keyed by (group_id, staff_type_id) - same pattern
  // asset_sources already uses - so a staff type appearing in multiple
  // groups gets a separate, correctly-attributed row per group.
  //
  // SEAT-HOURS FIX (confirmed with user): when a group's recovery driver
  // is asset hours (group_recovery_hour_source === "asset_hours"), the
  // ASSET defines the seat's real operating hours - labour covers that
  // seat in shifts/rotation (holidays, sick leave, relief cover), so the
  // seat earns revenue for its full real running hours regardless of
  // whose individual hours filled it. If MULTIPLE labour sources share
  // one seat, each gets a SHARE of the seat's hours proportional to their
  // own assigned-hours share - never the full seat hours each, which
  // would double-count revenue (same class of bug already fixed for
  // co-deployed assets earlier this session). For labour-hours-driven
  // groups (no asset - e.g. Site Crew, Foreman), there is no seat to
  // cover - the person themselves is what's being charged out, so their
  // own real assigned hours remain the correct basis.
  const accumulated = new Map(); // "group_id::staff_type_id" -> row data

  operational_group_cost_rows.forEach((group) => {
    const labour_assignments = Array.isArray(group.labour_group_assignments)
      ? group.labour_group_assignments
      : [];

    if (labour_assignments.length === 0) {
      return;
    }

    const { labour_overhead_pool } = split_group_overhead(group);
    const group_labour_hours_sum = labour_assignments.reduce(
      (sum, assignment) => sum + to_number(assignment.assigned_hours),
      0
    );

    const use_seat_hours = group.group_recovery_hour_source === "asset_hours";
    const group_seat_hours = to_number(group.group_recovery_hours);

    labour_assignments.forEach((assignment) => {
      const staff_type_id = assignment.staff_type_id;
      if (!staff_type_id) {
        return;
      }

      const own_hours = to_number(assignment.assigned_hours);
      const hours_share = group_labour_hours_sum > 0 ? own_hours / group_labour_hours_sum : 0;
      const revenue_hours = use_seat_hours ? group_seat_hours * hours_share : own_hours;

      const direct_cost = to_number(assignment.assigned_cost);
      const overhead_share =
        group_labour_hours_sum > 0 ? labour_overhead_pool * hours_share : 0;

      const key = `${group.group_id}::${staff_type_id}`;
      const prior = accumulated.get(key) || {
        group_id: group.group_id,
        group_name: group.group_name,
        staff_type_id,
        direct_cost: 0,
        hours: 0,
        revenue_hours: 0,
        overhead_share: 0,
      };
      accumulated.set(key, {
        ...prior,
        direct_cost: prior.direct_cost + direct_cost,
        hours: prior.hours + own_hours,
        revenue_hours: prior.revenue_hours + revenue_hours,
        overhead_share: prior.overhead_share + overhead_share,
      });
    });
  });

  return Array.from(accumulated.values())
    .map((agg) => {
      const charge_out_rate = to_number(charge_out_rate_by_id.get(agg.staff_type_id));
      const true_cost = agg.direct_cost + agg.overhead_share;
      const modelled_revenue = charge_out_rate > 0 ? charge_out_rate * agg.revenue_hours : null;
      const net_profit = modelled_revenue !== null ? modelled_revenue - true_cost : null;

      return {
        staff_type_id: agg.staff_type_id,
        staff_type_name: staff_type_name_by_id.get(agg.staff_type_id) || "Unnamed labour source",
        group_id: agg.group_id,
        group_name: agg.group_name,
        hours: round_currency(agg.revenue_hours),
        direct_cost: round_currency(agg.direct_cost),
        overhead_share: round_currency(agg.overhead_share),
        true_cost: round_currency(true_cost),
        charge_out_rate: round_currency(charge_out_rate),
        minimum_recoverable_rate_per_hour: recovery_rate_by_group_id.get(agg.group_id) ?? null,
        modelled_revenue: modelled_revenue !== null ? round_currency(modelled_revenue) : null,
        net_profit: net_profit !== null ? round_currency(net_profit) : null,
        verdict: net_profit !== null ? verdict_for(net_profit) : null,
        is_modelled: true,
        available: modelled_revenue !== null,
        unavailable_reason: modelled_revenue === null ? "No charge-out rate set for this labour source" : null,
      };
    })
    .sort((a, b) => (b.modelled_revenue ?? -Infinity) - (a.modelled_revenue ?? -Infinity));
}

// CAPACITY COVERAGE GAP (2026-09-11, prerequisite: asset utilisation/
// downtime fix, commit 6c8995f, confirmed group.group_recovery_hours is
// now trustworthy). Diagnostic only - does not change any revenue or
// cost figure used elsewhere. Bidirectional, all groups: compares the
// asset's seat hours (group.group_recovery_hours) against labour's own
// raw assigned hours (summed BEFORE the seat-hours override applied in
// build_labour_sources above, so this never double-counts the seat
// allowance already built into Real Capacity). Sign and meaning depend
// on which side actually drives that group's revenue
// (group_recovery_hour_source === "asset_hours" or not):
//   asset-driven, gap > 0: revenue already counted is riding on the
//     seat, not on someone actually covering it (revenue_at_risk).
//   asset-driven, gap < 0: genuinely overstaffed - extra labour paid,
//     revenue capped at seat hours regardless of headcount (wasted_cost).
//   labour-driven, gap > 0: asset capacity not being converted to
//     revenue - a genuine opportunity (opportunity).
//   labour-driven, gap < 0: labour logged beyond the asset's actual
//     running time - a data/scheduling oddity, not a cost claim
//     (data_check).
function calculate_capacity_coverage_gap(operational_group_cost_rows, calculators) {
  return operational_group_cost_rows
    .filter((group) => {
      const asset_assignments = Array.isArray(group.asset_group_assignments)
        ? group.asset_group_assignments
        : [];
      return asset_assignments.length > 0;
    })
    .map((group) => {
    const labour_assignments = Array.isArray(group.labour_group_assignments)
      ? group.labour_group_assignments
      : [];
    const labour_hours = labour_assignments.reduce(
      (sum, a) => sum + to_number(a.assigned_hours),
      0
    );
    const labour_cost = labour_assignments.reduce(
      (sum, a) => sum + to_number(a.assigned_cost),
      0
    );
    const labour_true_cost_rate = labour_hours > 0 ? labour_cost / labour_hours : null;

    const asset_hours = to_number(group.group_recovery_hours);
    const { blended_rate } = get_group_blended_rate(group, calculators);

    const is_asset_driven = group.group_recovery_hour_source === "asset_hours";
    const gap_hours = round_currency(asset_hours - labour_hours);

    let gap_type = "none";
    let gap_dollar_value = null;

    if (gap_hours !== 0 && blended_rate !== null) {
      if (is_asset_driven) {
        if (gap_hours > 0) {
          gap_type = "revenue_at_risk";
          gap_dollar_value = round_currency(gap_hours * blended_rate);
        } else {
          gap_type = "wasted_cost";
          gap_dollar_value =
            labour_true_cost_rate !== null
              ? round_currency(Math.abs(gap_hours) * labour_true_cost_rate)
              : null;
        }
      } else {
        if (gap_hours > 0) {
          gap_type = "opportunity";
          gap_dollar_value = round_currency(gap_hours * blended_rate);
        } else {
          gap_type = "data_check";
          gap_dollar_value =
            labour_true_cost_rate !== null
              ? round_currency(Math.abs(gap_hours) * labour_true_cost_rate)
              : null;
        }
      }
    }

    return {
      group_id: group.group_id,
      group_name: group.group_name,
      is_asset_driven,
      asset_hours,
      labour_hours,
      gap_hours,
      gap_type,
      gap_dollar_value,
    };
  });
}

// STEP 3/4 (S30 brief, hand-verified against real breach data before
// this was coded): when labour_modelled_revenue_total +
// asset_modelled_revenue_total exceeds total_revenue_reference, that is
// a hard mathematical impossibility - materials revenue can never be
// negative in reality. This function does NOT change any assumed
// figure (charge_out_rate, hours, true_cost all stay exactly as
// modelled elsewhere) - it computes a SECOND, parallel set of figures
// (implied_revenue, implied_net_profit, implied_verdict) showing what
// each source would earn if real total revenue is honestly capped and
// shared out proportional to each source's current assumed share.
//
// This is not an instruction to go fix the inputs - the true cost
// figures are real and correct (wages/asset cost are owed regardless).
// This is a diagnostic: does this specific labour type or asset still
// cover its own true cost once real billing capacity is accounted for.
// Two sources can look identical under assumed-hours net profit and
// diverge completely here - that divergence is the point.
//
// Materials floor = export default function useBusinessOutcomePerSourceRevenue() { when breached (confirmed with user: margin is an
// OUTPUT of revenue minus cost, not an input - assuming materials
// retains any margin here would be inventing revenue that was never
// earned). All real revenue in this state goes to labour+assets.
function apply_revenue_ceiling(labour_sources, asset_sources, total_revenue_reference) {
  const labour_total = labour_sources.reduce(
    (sum, row) => sum + to_number(row.modelled_revenue),
    0
  );
  const asset_total = asset_sources.reduce(
    (sum, row) => sum + to_number(row.modelled_revenue),
    0
  );
  const combined_total = labour_total + asset_total;

  const is_breached = combined_total > total_revenue_reference;

  if (!is_breached || combined_total <= 0) {
    return {
      is_breached: false,
      overage: 0,
      labour_asset_modelled_total: round_currency(combined_total),
      scale_factor: 1,
    };
  }

  const overage = round_currency(combined_total - total_revenue_reference);
  const scale_factor = total_revenue_reference / combined_total;

  [...labour_sources, ...asset_sources].forEach((row) => {
    if (row.modelled_revenue === null) {
      row.implied_revenue = null;
      row.implied_net_profit = null;
      row.implied_verdict = null;
      return;
    }

    const implied_revenue = round_currency(row.modelled_revenue * scale_factor);
    const implied_net_profit = round_currency(implied_revenue - row.true_cost);

    row.implied_revenue = implied_revenue;
    row.implied_net_profit = implied_net_profit;
    row.implied_verdict = verdict_for(implied_net_profit);
  });

  return {
    is_breached: true,
    overage,
    labour_asset_modelled_total: round_currency(combined_total),
    scale_factor,
  };
}

// REAL CAPACITY MODEL (two-phase cascade, hand-verified in a spreadsheet
// before this was coded - matched to the cent against a 200,000-step
// numerical simulation across seven scenarios, plus six exact boundary
// tests confirmed live). Parallel, ADDITIVE alternative to the ceiling
// model above - never touches implied_revenue/implied_net_profit/
// implied_verdict or anything else apply_revenue_ceiling already wrote.
//
// Phase 0 (naive): every source's own existing net_profit (already
// computed above, rate/cost based, revenue-independent) is the
// starting point. Unlike the spreadsheet's what-if scaling, this page
// only ever calculates for today's real total_revenue_reference, once
// - no separate baseline, no scale factor (confirmed with user: this is
// not a modelling page, that is Business Modelling's job).
//
// Materials floor: Materials can never show a loss - its naive
// (unfloored) revenue share is compared against its true cost; any
// shortfall this floor creates must come from somewhere else, since
// real cost is real regardless of how it gets allocated.
//
// Phase 1: that shortfall is absorbed only by sources currently
// naively profitable, weighted by their CURRENT net_profit - proven
// (spreadsheet, this session) to mean every eligible source's margin
// shrinks by the exact same percentage simultaneously, so a single
// phase1_factor captures this for all of them at once.
//
// Phase 2 (fallback): if the shortfall exceeds the total margin
// available among Phase-1-eligible sources, the leftover - meaning
// every eligible source's margin has now hit exactly zero - spreads
// across ALL labour and asset sources proportional to modelled_revenue
// share, since there is no more margin difference left to justify
// weighting by resilience.
//
// Sources have NO floor of their own - unlike Materials, a source's
// real_capacity_net_profit can go as negative as needed, because
// nothing stops real cost being incurred even when no revenue is
// allocated to cover it. Required for the total to always reconcile
// exactly to total_revenue_reference minus total true cost.
// GROUP -> INDIVIDUAL HIERARCHY (confirmed with user, this session, after
// the first individual-source-only version produced numbers that diverged
// from the hand-verified spreadsheet - group "Foreman" containing both a
// deeply-negative Owner/Director and a still-positive Senior Operator
// showed the mismatch clearly). Two nested passes of the identical
// two-phase cascade:
//
// STEP 1 (outer): the 5 real operating groups + Materials go through
// Phase 1/2 exactly as the spreadsheet did - a group's OWN combined
// modelled_revenue/true_cost is what determines whether it's naively
// profitable, not any one of its individual members. This produces each
// group's correct, verified final net profit.
//
// STEP 2 (inner): whatever total dollar adjustment a group received in
// Step 1 (naive minus final) becomes a SECOND, smaller shortfall, pushed
// down across just that group's own individual sources via the identical
// two-phase logic - a member still individually healthy absorbs more of
// their group's adjustment, a member already underwater takes less. This
// guarantees a group's children always sum exactly to that group's own
// Step 1 total, at every revenue level, by the same invariant-preserving
// math proven at the outer level.
export function group_rows_by_group_id(rows) {
  const map = new Map();
  rows.forEach((row) => {
    const key = row.group_id || `ungrouped_${row.group_name}`;
    if (!map.has(key)) {
      map.set(key, {
        group_id: row.group_id,
        group_name: row.group_name,
        rows: [],
        modelled_revenue: 0,
        true_cost: 0,
        // Added 2026-09-12 for per-source EBIT - purely additive, not
        // read anywhere in the real_capacity cascade below. Labour rows
        // never have asset_interest_annual, so ?? 0 is always correct
        // for them, not a fallback masking a real gap.
        asset_interest_annual: 0,
        asset_depreciation_annual: 0,
      });
    }
    const g = map.get(key);
    g.rows.push(row);
    g.modelled_revenue += row.modelled_revenue ?? 0;
    g.true_cost += row.true_cost ?? 0;
    g.asset_interest_annual += row.asset_interest_annual ?? 0;
    g.asset_depreciation_annual += row.asset_depreciation_annual ?? 0;
  });
  return Array.from(map.values());
}

// NON-PRODUCTIVE COST DISTRIBUTION (2026-09-17) - decides, per working
// unit, how its own assigned non-productive cost (support labour/
// assets, e.g. an office team or the Foreman's company car) actually
// affects true_cost. Two genuinely different cases, confirmed with
// user:
//   PURE-SUPPORT working unit (zero productive labour cost AND zero
//   productive asset cost - e.g. an Office Staff unit with no billable
//   member at all) - ALWAYS spread across productive working units,
//   weighted the same way General Overheads already spreads its own
//   pool (build_overhead_pool, lib/calculations/cost-allocation/
//   costAllocationOverheadPoolBuilder.js). Charging this to itself
//   would produce a permanent, structurally negative number with no
//   possible fix - there is no revenue stream to ever recover it from,
//   so spreading is not a policy choice here, it is the only
//   meaningful option.
//   MIXED working unit (has real productive members AND a
//   non-productive item riding along) - a genuine business choice,
//   controlled by mixed_unit_policy (businessOutcomeNonProductivePolicyStorage.js):
//   "charge_to_self" (default) or "spread_as_overhead".
//
// Verified safe against double-counting with real code, 2026-09-17:
// total_business_overheads (costSummaryCalculations.js) is an EXPLICIT
// pass-through of General Overheads' own total, not a residual - and
// generalOverheadPnlSync.js's P&L sync explicitly excludes both
// "labour" and "assets" categories from what it pulls in. Non-productive
// labour/asset cost has no existing route into total_business_overheads -
// this distribution is genuinely additive, not a duplicate of anything
// already spread.
function distribute_non_productive_cost(operational_group_cost_rows, mixed_unit_policy) {
  const result_by_group_id = new Map();
  const pool_payers = [];
  const recipients = [];
  // Added 2026-09-17, second pass - pure-support working units never
  // get a row of their own anywhere (build_labour_sources/
  // build_asset_sources only ever read PRODUCTIVE assignments, so a
  // unit like "Accountant" with zero productive members contributes
  // nothing to group_rows_by_group_id and is architecturally invisible
  // everywhere downstream). Tracked here, separately, with its own RAW
  // (undistributed) cost, so "Each Part On Its Own" can show it as its
  // own real row instead of it just vanishing into everyone else's
  // numbers with no visible trace.
  const pure_support_groups = [];

  operational_group_cost_rows.forEach((group) => {
    const own_non_productive_cost =
      to_number(group.assigned_non_productive_labour_cost) +
      to_number(group.assigned_non_productive_asset_cost);

    const productive_labour_cost = to_number(group.assigned_labour_cost);
    const productive_asset_cost = to_number(group.assigned_asset_burden);
    const is_pure_support = productive_labour_cost <= 0 && productive_asset_cost <= 0;

    if (productive_labour_cost > 0 || productive_asset_cost > 0) {
      recipients.push({
        group_id: group.group_id,
        productive_labour_cost,
        productive_asset_cost,
      });
    }

    if (own_non_productive_cost <= 0) {
      return;
    }

    if (is_pure_support) {
      pure_support_groups.push({
        group_id: group.group_id,
        group_name: group.group_name,
        own_non_productive_cost: round_currency(own_non_productive_cost),
      });
    }

    const should_spread = is_pure_support || mixed_unit_policy === "spread_as_overhead";

    if (should_spread) {
      pool_payers.push(own_non_productive_cost);
    } else {
      // Mixed unit, charge_to_self policy.
      result_by_group_id.set(
        group.group_id,
        (result_by_group_id.get(group.group_id) ?? 0) + own_non_productive_cost
      );
    }
  });

  const pool_total = pool_payers.reduce((sum, v) => sum + v, 0);

  if (pool_total > 0 && recipients.length > 0) {
    const total_labour_cost = recipients.reduce((sum, r) => sum + r.productive_labour_cost, 0);
    const total_asset_cost = recipients.reduce((sum, r) => sum + r.productive_asset_cost, 0);

    let weight_basis = "equal_split";
    if (total_labour_cost > 0) weight_basis = "labour_cost_weighted";
    else if (total_asset_cost > 0) weight_basis = "asset_burden_weighted";

    recipients.forEach((r) => {
      let weight = 0;
      if (weight_basis === "labour_cost_weighted") {
        weight = total_labour_cost > 0 ? r.productive_labour_cost / total_labour_cost : 0;
      } else if (weight_basis === "asset_burden_weighted") {
        weight = total_asset_cost > 0 ? r.productive_asset_cost / total_asset_cost : 0;
      } else {
        weight = 1 / recipients.length;
      }

      const share = pool_total * weight;
      result_by_group_id.set(r.group_id, (result_by_group_id.get(r.group_id) ?? 0) + share);
    });
  }

  return {
    cost_by_group_id: result_by_group_id,
    pure_support_groups,
    pool_total: round_currency(pool_total),
  };
}

function apply_real_capacity(labour_sources, asset_sources, materials_naive_revenue, materials_true_cost, non_productive_cost_by_group_id = new Map()) {
  const all_sources = [...labour_sources, ...asset_sources];
  const groups = group_rows_by_group_id(all_sources);

  // FIX (2026-09-17) - genuinely missing from the system, not a coding
  // bug: non-productive labour/assets assigned to a working unit (e.g.
  // the Foreman's company car, admin staff working within a group) are
  // real cost that unit must actually recover, same as its own direct
  // cost. Added directly into the SAME true_cost the cascade already
  // uses, through its normal front door - the hand-verified sharing
  // mechanism below handles it exactly like any other real cost, no
  // new parallel calculation. If a working unit's own margin can't
  // absorb it, the existing shortfall-sharing logic spreads it exactly
  // as it already does for any other real cost overrun.
  groups.forEach((g) => {
    const non_productive_cost = to_number(non_productive_cost_by_group_id.get(g.group_id));
    g.non_productive_cost = round_currency(non_productive_cost);
    g.true_cost = round_currency(g.true_cost + non_productive_cost);
  });

  groups.forEach((g) => {
    g.naive_net_profit = g.modelled_revenue - g.true_cost;
  });

  const shortfall = Math.max(0, materials_true_cost - materials_naive_revenue);

  // STEP 1 - outer cascade across the 5 groups (matches the spreadsheet).
  const v0 = groups.reduce((sum, g) => (g.naive_net_profit > 0 ? sum + g.naive_net_profit : sum), 0);
  const phase1_absorbed = Math.min(shortfall, v0);
  const phase1_factor = v0 > 0 ? phase1_absorbed / v0 : 0;
  const leftover = round_currency(shortfall - phase1_absorbed);

  const total_group_modelled_revenue = groups.reduce((sum, g) => sum + g.modelled_revenue, 0);

  groups.forEach((g) => {
    const after_phase1 = g.naive_net_profit > 0 ? g.naive_net_profit * (1 - phase1_factor) : g.naive_net_profit;
    const phase2_deduction =
      leftover > 0 && total_group_modelled_revenue > 0
        ? leftover * (g.modelled_revenue / total_group_modelled_revenue)
        : 0;
    g.final_net_profit = round_currency(after_phase1 - phase2_deduction);
    // Always >= 0 in practice - Real Capacity only ever pulls margin away
    // from a group relative to its naive figure, never adds to it.
    g.total_adjustment = round_currency(g.naive_net_profit - g.final_net_profit);
  });

  // STEP 2 - inner cascade, pushing each group's own total_adjustment down
  // across just that group's own individual sources.
  //
  // FIX (2026-09-17, diagnosed live): non_productive_cost belongs to
  // the WORKING UNIT, not any specific row - it was only ever added to
  // g.true_cost (the group aggregate), never to any individual row.
  // group-level naive_net_profit therefore already reflects it, but
  // inner_v0 below was still being computed from raw, UNADJUSTED
  // row.net_profit - understating how much the rows' own margin had
  // really shrunk, so Step 2 under-absorbed g.total_adjustment into the
  // rows, leaving non-productive cost's effect sitting incorrectly in
  // one row instead of properly reflected. Confirmed live: a $1,421.79
  // non-productive cost added at group level left almost exactly $1,421
  // sitting unrecovered in a single row. Fix: give each row its
  // proportional share of non_productive_cost (by revenue share, same
  // basis phase2's leftover already uses) BEFORE running the inner
  // cascade, so rows start from the same non-productive-cost-inclusive
  // basis the group level already used. Provably restores the cascade's
  // own invariant: sum(row.net_profit) across a group always equals
  // g.naive_net_profit + g.non_productive_cost (by construction, since
  // group_rows_by_group_id sums row net_profit BEFORE the non-productive
  // injection runs), so subtracting each row's own share here makes the
  // adjusted rows sum exactly to g.naive_net_profit - the same starting
  // point Step 1 already used.
  groups.forEach((g) => {
    const group_row_revenue_total = g.rows.reduce((sum, row) => sum + (row.modelled_revenue ?? 0), 0);

    const row_non_productive_share_by_row = new Map(
      g.rows.map((row) => {
        const share =
          g.non_productive_cost > 0
            ? group_row_revenue_total > 0
              ? g.non_productive_cost * ((row.modelled_revenue ?? 0) / group_row_revenue_total)
              : g.non_productive_cost / g.rows.length
            : 0;
        return [row, round_currency(share)];
      })
    );

    const inner_v0 = g.rows.reduce((sum, row) => {
      if (row.net_profit === null) return sum;
      const adjusted_net_profit = to_number(row.net_profit) - (row_non_productive_share_by_row.get(row) ?? 0);
      if (adjusted_net_profit <= 0) return sum;
      return sum + adjusted_net_profit;
    }, 0);

    const inner_absorbed = Math.min(Math.max(g.total_adjustment, 0), inner_v0);
    const inner_factor = inner_v0 > 0 ? inner_absorbed / inner_v0 : 0;
    const inner_leftover = round_currency(g.total_adjustment - inner_absorbed);

    g.rows.forEach((row) => {
      if (row.net_profit === null) {
        row.real_capacity_net_profit = null;
        row.real_capacity_verdict = null;
        return;
      }

      const row_non_productive_share = row_non_productive_share_by_row.get(row) ?? 0;
      const adjusted_net_profit = to_number(row.net_profit) - row_non_productive_share;

      const inner_after_phase1 =
        adjusted_net_profit > 0 ? adjusted_net_profit * (1 - inner_factor) : adjusted_net_profit;

      const inner_phase2_deduction =
        inner_leftover > 0 && group_row_revenue_total > 0
          ? inner_leftover * ((row.modelled_revenue ?? 0) / group_row_revenue_total)
          : 0;

      const real_capacity_net_profit = round_currency(inner_after_phase1 - inner_phase2_deduction);
      row.real_capacity_net_profit = real_capacity_net_profit;
      row.real_capacity_verdict = verdict_for(real_capacity_net_profit);
    });
  });

  const materials_final_revenue = Math.max(materials_naive_revenue, materials_true_cost);
  const materials_real_capacity_net_profit = round_currency(materials_final_revenue - materials_true_cost);

  return {
    shortfall: round_currency(shortfall),
    v0: round_currency(v0),
    phase1_absorbed: round_currency(phase1_absorbed),
    phase1_factor,
    leftover,
    materials_real_capacity_net_profit,
    materials_real_capacity_naive_revenue: round_currency(materials_naive_revenue),
    // FIX (confirmed with user): materials floored at exactly $0 net
    // profit still needed real help to get there - its naive figure
    // was genuinely negative, and the floor exists precisely to hide
    // that. That is a "being carried" state, not a healthy "paying its
    // way" one, even though the displayed number is >= 0. Only
    // materials that never needed the floor at all (shortfall === 0)
    // genuinely counts as paying its way.
    materials_real_capacity_verdict:
      shortfall > 0 ? "being_carried" : verdict_for(materials_real_capacity_net_profit),
    // Exposed for verification against the spreadsheet - group-level
    // final figures, before the inner per-source split.
    group_real_capacity: groups.map((g) => ({
      group_id: g.group_id,
      group_name: g.group_name,
      modelled_revenue: round_currency(g.modelled_revenue),
      true_cost: round_currency(g.true_cost),
      naive_net_profit: round_currency(g.naive_net_profit),
      final_net_profit: g.final_net_profit,
      total_adjustment: g.total_adjustment,
      // Added 2026-09-12 for per-source EBIT - real per-group interest,
      // purely additive, not read anywhere in this function's own math.
      asset_interest_annual: round_currency(g.asset_interest_annual ?? 0),
      asset_depreciation_annual: round_currency(g.asset_depreciation_annual ?? 0),
      // Added 2026-09-17 - exposed per working unit so the UI can
      // eventually show "$X of this includes non-productive support
      // cost" as its own line, rather than a hidden catch-all.
      non_productive_cost: g.non_productive_cost ?? 0,
    })),
  };
}

export default function useBusinessOutcomePerSourceRevenue({ overrides } = {}) {
  const labour_recovery = useBusinessOutcomeLabourRecovery();
  const cost_allocation = useCostAllocation();
  const business_summary = useBusinessSummary();
  const opening_hours = useOpeningHours();

  // Added 2026-09-12 for per-source EBIT (Earnings Before Interest and
  // Tax - deliberately NOT EBITDA, since the Assets module has no
  // depreciation tracking, confirmed during the Balance Sheet Fixed
  // Assets reconciliation work earlier this session). asset_interest_annual
  // is a real, already-computed per-asset field (confirmed live on
  // /module-reconciliation's asset_finance_breakdown), joined here
  // against each group's existing asset_group_assignments[].asset_id
  // (confirmed present via costAllocationAssetPoolBuilders.js's
  // enriched_assignments) to get a real per-source interest figure.
  // Purely additive - does not touch the real_capacity cascade math.
  const { active_assets: assets_for_interest } = useAssets();
  const asset_interest_by_id = useMemo(() => {
    const map = new Map();
    (assets_for_interest || []).forEach((asset) => {
      map.set(asset.asset_id, to_number(asset.asset_interest_annual) || 0);
    });
    return map;
  }, [assets_for_interest]);

  // Added for EBITDA (2026-09-12, same session as the Include
  // Depreciation feature and the EBIT interest join) - per scoping
  // brief decision: EBITDA always uses REAL depreciation regardless of
  // each asset's own include_depreciation_in_cost toggle (that toggle
  // only affects pricing/true_cost, not this informational figure).
  // null when unavailable (unlinked assets, or non-Diminishing-Value
  // methods) - summed as 0 downstream, same pattern as interest.
  const asset_depreciation_by_id = useMemo(() => {
    const map = new Map();
    (assets_for_interest || []).forEach((asset) => {
      const dep = to_number(asset.estimated_annual_depreciation);
      map.set(asset.asset_id, dep === null ? 0 : dep);
    });
    return map;
  }, [assets_for_interest]);

  function get_group_asset_interest_annual(asset_assignments) {
    return (asset_assignments || []).reduce((sum, assignment) => {
      const asset_interest = asset_interest_by_id.get(assignment.asset_id) || 0;
      const percent = to_number(assignment.assignment_percent);
      const share = Number.isFinite(percent) ? percent / 100 : 1;
      return sum + asset_interest * share;
    }, 0);
  }

  const [rate_builder_calculators, set_rate_builder_calculators] = useState([]);

  useEffect(() => {
    set_rate_builder_calculators(loadRateBuilderCalculators([]));
  }, []);
  const [materials_markup_percent, set_materials_markup_percent] = useState(0);
  useEffect(() => {
    set_materials_markup_percent(readRateBuilderMaterialsMarkup().materials_markup_percent ?? 0);
  }, []);
  const [mixed_unit_non_productive_policy, set_mixed_unit_non_productive_policy] = useState("charge_to_self");
  useEffect(() => {
    set_mixed_unit_non_productive_policy(
      readNonProductiveCostPolicy().mixed_unit_non_productive_policy
    );
  }, []);

  const bs = business_summary.output_contract ?? {};
  const allocation_contract = cost_allocation.output_contract ?? {};
  const operational_group_cost_rows = allocation_contract.operational_group_cost_rows ?? [];
  const operational_group_recovery_rows = allocation_contract.operational_group_recovery_rows ?? [];

  const result = useMemo(() => {
    // Business Modelling override (2026-09-17): when overrides is
    // passed (only Business Modelling ever passes this - every other
    // page calls this hook exactly as before, receiving undefined),
    // effective_materials_markup_percent and the two rate-override maps
    // below replace the live values feeding build_labour_sources/
    // build_asset_sources. Real cost is never touched here - only the
    // revenue side, via the same real functions every live page uses.
    const effective_materials_markup_percent =
      overrides?.materials_markup_percent_override !== undefined &&
      overrides?.materials_markup_percent_override !== null &&
      overrides?.materials_markup_percent_override !== ""
        ? to_number(overrides.materials_markup_percent_override)
        : materials_markup_percent;

    const labour_sources = build_labour_sources(
      operational_group_cost_rows,
      labour_recovery.labour_recovery_rows ?? [],
      operational_group_recovery_rows,
      overrides?.labour_charge_out_rate_overrides
    );

    const asset_sources = build_asset_sources(
      operational_group_cost_rows,
      rate_builder_calculators,
      operational_group_recovery_rows,
      asset_interest_by_id,
      asset_depreciation_by_id,
      overrides?.asset_blended_rate_overrides
    );

    const total_assigned_overhead = operational_group_cost_rows.reduce(
      (sum, group) => sum + to_number(group.assigned_overhead_amount),
      0
    );



    const total_business_overheads = to_number(bs.total_business_overheads);
    const residual_overhead = total_business_overheads - total_assigned_overhead;

    const unassigned_labour_cost = to_number(allocation_contract.unassigned_labour_cost);
    const unassigned_asset_cost = to_number(allocation_contract.unassigned_asset_cost);
    // Separate, real buckets for non-productive labour/assets that exist
    // but are not assigned to any group - distinct from the productive
    // unassigned figures above. Confirmed live: Van Nissan (support
    // asset, $1,450 annual cost) sits here, not in unassigned_asset_cost,
    // because it was never counted by the productive pool to begin with.
    const unassigned_non_productive_labour_cost = to_number(
      allocation_contract.unassigned_non_productive_labour_cost
    );
    const unassigned_non_productive_asset_cost = to_number(
      allocation_contract.unassigned_non_productive_asset_cost
    );

    // FIX (confirmed live, 2026-09-17): a non-productive labour/asset
    // item's real cost was only ever counted while UNASSIGNED (via
    // unassigned_non_productive_labour_cost/unassigned_non_productive_asset_cost
    // above). The moment it gets assigned to a working unit, Cost
    // Allocation correctly tracks its real cost as
    // assigned_non_productive_labour_cost/assigned_non_productive_asset_cost
    // on that working unit's own row (costAllocationGroupCostBuilder.js) -
    // but nothing here ever read those fields, so that real cost
    // silently disappeared from total_true_cost the moment it stopped
    // being "unassigned". Non-productive cost is real either way -
    // always counted now, regardless of assignment status.
    const assigned_non_productive_labour_cost = operational_group_cost_rows.reduce(
      (sum, group) => sum + to_number(group.assigned_non_productive_labour_cost),
      0
    );
    const assigned_non_productive_asset_cost = operational_group_cost_rows.reduce(
      (sum, group) => sum + to_number(group.assigned_non_productive_asset_cost),
      0
    );

    const total_revenue_reference = to_number(bs.total_revenue);
    const total_cogs = to_number(bs.total_direct_costs ?? bs.total_cogs);
    // === S26 VIEW B - "Materials shares equally" (additive, parallel to
    // View A above; nothing above this block is read from or altered) ===
    const view_b_labour_sources = labour_sources.map((row) => ({ ...row }));
    const view_b_asset_sources = asset_sources.map((row) => ({ ...row }));
    const view_b_materials_source = build_materials_source(
      total_cogs,
      residual_overhead,
      effective_materials_markup_percent
    );
    const view_b_ceiling = apply_revenue_ceiling_v2(
      view_b_labour_sources,
      view_b_asset_sources,
      view_b_materials_source,
      total_revenue_reference
    );
    const view_b_real_capacity = apply_real_capacity_v2(
      view_b_labour_sources,
      view_b_asset_sources,
      view_b_materials_source,
      total_revenue_reference
    );
    // Additive only (same pattern as View A's own group_recovery_hours
    // enrichment, further below in this file): attaches each group's
    // real recovery hours to View B's cascade output too, needed to
    // derive an "achieved rate" or "achieved hours" figure per group -
    // see ViewBGroupsDrill / merge_view_b_groups on the display side.
    const view_b_recovery_hours_by_group_id = new Map(
      operational_group_cost_rows.map((g) => [g.group_id, to_number(g.group_recovery_hours)])
    );
    view_b_real_capacity.group_real_capacity = view_b_real_capacity.group_real_capacity.map((g) => ({
      ...g,
      group_recovery_hours: view_b_recovery_hours_by_group_id.get(g.group_id) ?? 0,
    }));
    const view_b = {
      labour_sources: view_b_labour_sources,
      asset_sources: view_b_asset_sources,
      materials: view_b_materials_source,
      revenue_ceiling: view_b_ceiling,
      real_capacity: view_b_real_capacity,
    };
    // CONFIRMED (traced to source): bs.total_revenue is
    // profitAndLossCalculations.js's sum_qs_line_amounts(revenue_lines)
    // - every P&L revenue line summed together, unchanged all the way
    // through useRevenueCogs -> useBusinessSummary. There is no
    // material-only revenue field anywhere in the codebase - total_revenue
    // IS the single blended figure S23 Section 4 describes (material +
    // labour charge-out + asset charge-out, already mixed at P&L source).
    // Material revenue is therefore genuinely derived, not looked up:
    // whatever of total_revenue is not accounted for by labour's and
    // asset's own MODELLED revenue above. Because labour/asset revenue
    // here are models (S29 Section 3), materials.revenue inherits that
    // same modelled status by construction - it is not a directly-known
    // fact either, and must carry the same disclosure.
    const labour_modelled_revenue_total = labour_sources.reduce(
      (sum, row) => sum + to_number(row.modelled_revenue),
      0
    );
    const asset_modelled_revenue_total = asset_sources.reduce(
      (sum, row) => sum + to_number(row.modelled_revenue),
      0
    );

    const ceiling = apply_revenue_ceiling(labour_sources, asset_sources, total_revenue_reference);

    const materials = ceiling.is_breached
      ? {
          revenue: 0,
          true_cost: round_currency(total_cogs + Math.max(residual_overhead, 0)),
          is_modelled: true,
          is_floored: true,
        }
      : {
          revenue: round_currency(
            total_revenue_reference - labour_modelled_revenue_total - asset_modelled_revenue_total
          ),
          true_cost: round_currency(total_cogs + Math.max(residual_overhead, 0)),
          is_modelled: true,
          is_floored: false,
        };
    materials.net_profit = round_currency(materials.revenue - materials.true_cost);
    materials.verdict = verdict_for(materials.net_profit);

    const materials_naive_revenue = round_currency(
      total_revenue_reference - labour_modelled_revenue_total - asset_modelled_revenue_total
    );
    // Non-productive cost per working unit (2026-09-17, revised same
    // day) - pure-support units always spread, mixed units follow the
    // stored policy. See distribute_non_productive_cost's own comment
    // for the full reasoning.
    const non_productive_distribution = distribute_non_productive_cost(
      operational_group_cost_rows,
      mixed_unit_non_productive_policy
    );
    const non_productive_cost_by_group_id = non_productive_distribution.cost_by_group_id;

    const real_capacity = apply_real_capacity(
      labour_sources,
      asset_sources,
      materials_naive_revenue,
      materials.true_cost,
      non_productive_cost_by_group_id
    );

    // Additive only (S26 Business Modelling rate-lever prep): attach each
    // group's real recovery hours, sourced from Cost Allocation's own
    // operational_group_cost_rows - the same figure asset revenue is
    // already built from (group_asset_revenue = blended_rate *
    // group.group_recovery_hours, above). Does not change any existing
    // field or behaviour.
    const recovery_hours_by_group_id = new Map(
      operational_group_cost_rows.map((g) => [g.group_id, to_number(g.group_recovery_hours)])
    );
    real_capacity.group_real_capacity = real_capacity.group_real_capacity.map((g) => ({
      ...g,
      group_recovery_hours: recovery_hours_by_group_id.get(g.group_id) ?? 0,
    }));
    materials.real_capacity_net_profit = real_capacity.materials_real_capacity_net_profit;
    materials.real_capacity_naive_revenue = real_capacity.materials_real_capacity_naive_revenue;
    materials.real_capacity_verdict = real_capacity.materials_real_capacity_verdict;

    // FIX (confirmed live this session): materials.revenue is a
    // View-A leftover (total_revenue_reference - labour - assets),
    // which made total_modelled_revenue below a pure algebraic
    // identity always equal to total_revenue_reference, no matter
    // what rates/hours actually were - confirmed by testing at two
    // different P&L revenue levels and getting an exact match both
    // times. Genuinely independent materials revenue instead uses
    // Rate Builder's own stored markup against real COGS, same
    // formula already used and tested for View B's materials source
    // (lib/calculations/businessOutcomeViewBCalculations.js
    // build_materials_source) - zero reference to total_revenue_reference.
    const materials_independent_revenue = round_currency(
      total_cogs * (1 + effective_materials_markup_percent / 100)
    );

    const total_modelled_revenue =
      labour_sources.reduce((sum, row) => sum + to_number(row.modelled_revenue), 0) +
      asset_sources.reduce((sum, row) => sum + to_number(row.modelled_revenue), 0) +
      materials_independent_revenue;

    const total_true_cost =
      labour_sources.reduce((sum, row) => sum + to_number(row.true_cost), 0) +
      asset_sources.reduce((sum, row) => sum + to_number(row.true_cost), 0) +
      materials.true_cost +
      unassigned_labour_cost +
      unassigned_asset_cost +
      unassigned_non_productive_labour_cost +
      unassigned_non_productive_asset_cost +
      assigned_non_productive_labour_cost +
      assigned_non_productive_asset_cost;

    // Revenue reconciliation deliberately NOT included here. Removed
    // (this session) after confirming it is tautological, not a real
    // check: materials.revenue is defined as
    // total_revenue - labour_modelled - asset_modelled, so
    // labour + asset + materials always equals total_revenue by
    // construction, every time, regardless of whether the underlying
    // model is any good. The P&L never recorded material/labour/asset
    // revenue separately in the first place (confirmed - total_revenue
    // is one blended sum_qs_line_amounts() figure, source:
    // profitAndLossCalculations.js) - there is no independent "actual"
    // per stream to check the modelled split against, so no revenue
    // reconciliation can ever be a genuine data-integrity check here.
    // Showing one anyway would look like validation and would not be.
    // The real diagnostic this page provides is per-source: does THIS
    // labour type or THIS asset individually pay its way (net_profit
    // sign), not whether the streams sum back to a total they are
    // mathematically guaranteed to sum back to.
    //
    // Cost reconciliation is different and IS kept: true_cost is real
    // on both sides (per-source actual cost vs total_cost_burden), so a
    // variance here is a genuine leak, not a modelling artefact.

    // CONFIRMED (2026-08-28 live data): bs.total_cost_burden structurally
    // EXCLUDES COGS by design (Cost Summary spec Section 4.4 -
    // total_cost_burden = labour + asset + overheads only, COGS sits
    // above operating costs in the P&L). This hook's total_true_cost
    // includes materials.true_cost, which includes COGS - so the
    // reference must include COGS too, or the comparison is structurally
    // apples-to-oranges. Confirmed against live data: total_direct_costs
    // ($1,240,090.70) exactly matched the prior unexplained variance.
    const total_cost_reference =
      to_number(bs.total_cost_burden) + to_number(bs.total_direct_costs);
    const cost_variance = round_currency(total_true_cost - total_cost_reference);
    const cost_reconciles = Math.abs(cost_variance) < 1;

    return {
      data_status: labour_sources.length > 0 || asset_sources.length > 0 ? "ready" : "no_sources",
      labour_sources,
      asset_sources,
      materials,
      unassigned_labour_cost: round_currency(unassigned_labour_cost),
      unassigned_asset_cost: round_currency(unassigned_asset_cost),
      unassigned_non_productive_labour_cost: round_currency(unassigned_non_productive_labour_cost),
      unassigned_non_productive_asset_cost: round_currency(unassigned_non_productive_asset_cost),
      // FIX (2026-09-17) - exposed alongside the unassigned figures
      // above for the same reason those are: real cost, now counted
      // consistently regardless of assignment status.
      assigned_non_productive_labour_cost: round_currency(assigned_non_productive_labour_cost),
      assigned_non_productive_asset_cost: round_currency(assigned_non_productive_asset_cost),
      // Added 2026-09-17, second pass - pure-support working units
      // (e.g. Accountant, Office Staff) with their own raw, undistributed
      // cost, and the total amount actually spread across productive
      // units - both needed so the UI can show these units as their own
      // visible row (Each Part On Its Own) and signal the distribution
      // that's already happening under the hood (How the Business Runs).
      pure_support_groups: non_productive_distribution.pure_support_groups,
      non_productive_cost_distributed_total: non_productive_distribution.pool_total,
      residual_overhead: round_currency(residual_overhead),
      total_revenue_reference: round_currency(total_revenue_reference),
      labour_modelled_revenue_total: round_currency(labour_modelled_revenue_total),
      asset_modelled_revenue_total: round_currency(asset_modelled_revenue_total),
      net_annual_business_open_hours: to_number(bs.net_annual_business_open_hours),
      labour_pool_over_allocated: allocation_contract.labour_pool_over_allocated === true,
      asset_pool_over_allocated: allocation_contract.asset_pool_over_allocated === true,
      // Already computed by costAllocationGroupCostBuilder.js on every
      // group row - never wired anywhere before now. Different question
      // from labour_pool_over_allocated above: that checks whether a
      // staff type exceeds their OWN total hours across all groups this
      // checks whether the labour assigned WITHIN one group covers the
      // hours the asset in that same group actually needs to run.
      // "Two sides of the same coin" (user, this session) - the asset
      // cannot run without the labour, and the labour hours assigned
      // may not be enough for the asset's real schedule, even when
      // neither individual number is itself over 100%.
      // Only real coverage GAPS - labour assigned but insufficient for
      // the asset's hours. A group with ZERO labour assigned at all
      // (e.g. PC15 - single asset, no shared labour) is a different
      // situation entirely, not a scheduling gap, and must not be
      // conflated with one. This distinction lives here, not in Cost
      // Allocation's own labour_coverage_warning logic, deliberately -
      // that logic is shared by other pages and was not touched.
      labour_coverage_gaps: operational_group_cost_rows
        .filter((g) => {
          const has_labour_assigned =
            Array.isArray(g.labour_group_assignments) && g.labour_group_assignments.length > 0;
          return g.labour_coverage_warning && has_labour_assigned;
        })
        .map((g) => ({
          group_id: g.group_id,
          group_name: g.group_name,
          gap_hours: round_currency(g.labour_coverage_gap_hours),
          gap_days: opening_hours.calculated.standard_daily_open_hours > 0 ? Math.round(g.labour_coverage_gap_hours / opening_hours.calculated.standard_daily_open_hours) : 0,
          message: g.labour_coverage_warning.message,
        })),
      labour_pool_over_allocated: allocation_contract.labour_pool_over_allocated === true,
      asset_pool_over_allocated: allocation_contract.asset_pool_over_allocated === true,
      total_modelled_revenue: round_currency(total_modelled_revenue), // display only, not a reconciliation
      revenue_ceiling: ceiling,
      real_capacity: {
        shortfall: real_capacity.shortfall,
        v0: real_capacity.v0,
        phase1_absorbed: real_capacity.phase1_absorbed,
        phase1_factor: real_capacity.phase1_factor,
        leftover: real_capacity.leftover,
        group_real_capacity: real_capacity.group_real_capacity,
        materials: { cogs: total_cogs, true_cost: materials.true_cost, modelled_revenue: materials.revenue },
      },
      reconciliation: {
        total_true_cost: round_currency(total_true_cost),
        total_cost_reference: round_currency(total_cost_reference),
        cost_variance,
        cost_reconciles,
      },
      view_b,
      capacity_coverage_gap: calculate_capacity_coverage_gap(operational_group_cost_rows, rate_builder_calculators),
      // Health gauge baseline (2026-09-11, moved here from Business Modelling
      // per user decision - Outcome computes the trusted baseline once,
      // Modelling consumes it downstream, same "reuse the engine" principle
      // as the rest of this session). health_ratio = smoothed_net_profit
      // (the real, cascade-adjusted total, after cross-subsidy) divided by
      // independent_net_profit_floored (what each source would have earned
      // on its own, floored at $0, before any subsidy) - a ratio well
      // below 1 signals heavy cross-subsidy being masked by the smoothed
      // total. Uses naive_net_profit (pre-cascade) via calculateGaugeInput's
      // own modelled_revenue - true_cost fallback, NOT final_net_profit.
      health_gauge: calculateGaugeInput({
        groups: real_capacity.group_real_capacity,
        materials: { modelled_revenue: materials.revenue, true_cost: materials.true_cost },
        // REVERTED (2026-09-17): assigned_non_productive_*_cost is no
        // longer subtracted here - g.final_net_profit already includes
        // it now, via apply_real_capacity's own true_cost injection
        // above. Subtracting it again here would double-count it.
        smoothed_net_profit: round_currency(
          (real_capacity.group_real_capacity || []).reduce((sum, g) => sum + (g.final_net_profit ?? 0), 0) +
          (materials.real_capacity_net_profit ?? 0) -
          (unassigned_labour_cost + unassigned_asset_cost + unassigned_non_productive_labour_cost + unassigned_non_productive_asset_cost)
        ),
      }),
    };
  }, [operational_group_cost_rows, rate_builder_calculators, labour_recovery.labour_recovery_rows, bs, allocation_contract, materials_markup_percent, overrides, mixed_unit_non_productive_policy]);

  return result;
}




























