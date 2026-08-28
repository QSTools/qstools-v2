"use client";

import { useEffect, useMemo, useState } from "react";

import useBusinessOutcomeLabourRecovery from "@/hooks/useBusinessOutcomeLabourRecovery";
import useCostAllocation from "@/hooks/useCostAllocation";
import useBusinessSummary from "@/hooks/useBusinessSummary";
import { loadRateBuilderCalculators } from "@/lib/storage/rateBuilderStorage";
import { calculateRateBuilderQuotePreview } from "@/lib/calculations/rateBuilderCalculations";

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

function to_number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function round_currency(value) {
  return Number(to_number(value).toFixed(2));
}

function verdict_for(net_profit) {
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

function build_asset_sources(operational_group_cost_rows, calculators) {
  const rows = [];

  operational_group_cost_rows.forEach((group) => {
    const asset_assignments = Array.isArray(group.asset_group_assignments)
      ? group.asset_group_assignments
      : [];

    if (asset_assignments.length === 0) {
      return;
    }

    const { blended_rate, reason } = get_group_blended_rate(group, calculators);
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

      rows.push({
        asset_id: assignment.asset_id || "",
        asset_name: assignment.asset_name || "Unnamed asset",
        group_id: group.group_id,
        group_name: group.group_name,
        hours: round_currency(asset_hours),
        direct_cost: round_currency(asset_cost),
        overhead_share: round_currency(overhead_share),
        true_cost: round_currency(true_cost),
        blended_rate: blended_rate !== null ? round_currency(blended_rate) : null,
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
function build_labour_sources(operational_group_cost_rows, labour_recovery_rows) {
  const charge_out_rate_by_id = new Map(
    labour_recovery_rows.map((row) => [row.labour_source_type_id, to_number(row.charge_out_rate)])
  );
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

export default function useBusinessOutcomePerSourceRevenue() {
  const labour_recovery = useBusinessOutcomeLabourRecovery();
  const cost_allocation = useCostAllocation();
  const business_summary = useBusinessSummary();

  const [rate_builder_calculators, set_rate_builder_calculators] = useState([]);

  useEffect(() => {
    set_rate_builder_calculators(loadRateBuilderCalculators([]));
  }, []);

  const bs = business_summary.output_contract ?? {};
  const allocation_contract = cost_allocation.output_contract ?? {};
  const operational_group_cost_rows = allocation_contract.operational_group_cost_rows ?? [];

  const result = useMemo(() => {
    const labour_sources = build_labour_sources(
      operational_group_cost_rows,
      labour_recovery.labour_recovery_rows ?? []
    );

    const asset_sources = build_asset_sources(
      operational_group_cost_rows,
      rate_builder_calculators
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

    const total_revenue_reference = to_number(bs.total_revenue);
    const total_cogs = to_number(bs.total_direct_costs ?? bs.total_cogs);

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

    const materials = {
      revenue: round_currency(
        total_revenue_reference - labour_modelled_revenue_total - asset_modelled_revenue_total
      ),
      true_cost: round_currency(total_cogs + Math.max(residual_overhead, 0)),
      is_modelled: true,
    };
    materials.net_profit = round_currency(materials.revenue - materials.true_cost);
    materials.verdict = verdict_for(materials.net_profit);

    const total_modelled_revenue =
      labour_sources.reduce((sum, row) => sum + to_number(row.modelled_revenue), 0) +
      asset_sources.reduce((sum, row) => sum + to_number(row.modelled_revenue), 0) +
      materials.revenue;

    const total_true_cost =
      labour_sources.reduce((sum, row) => sum + to_number(row.true_cost), 0) +
      asset_sources.reduce((sum, row) => sum + to_number(row.true_cost), 0) +
      materials.true_cost +
      unassigned_labour_cost +
      unassigned_asset_cost +
      unassigned_non_productive_labour_cost +
      unassigned_non_productive_asset_cost;

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
      residual_overhead: round_currency(residual_overhead),
      total_revenue_reference: round_currency(total_revenue_reference),
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
          message: g.labour_coverage_warning.message,
        })),
      labour_pool_over_allocated: allocation_contract.labour_pool_over_allocated === true,
      asset_pool_over_allocated: allocation_contract.asset_pool_over_allocated === true,
      total_modelled_revenue: round_currency(total_modelled_revenue), // display only, not a reconciliation
      reconciliation: {
        total_true_cost: round_currency(total_true_cost),
        total_cost_reference: round_currency(total_cost_reference),
        cost_variance,
        cost_reconciles,
      },
    };
  }, [operational_group_cost_rows, rate_builder_calculators, labour_recovery.labour_recovery_rows, bs, allocation_contract]);

  return result;
}


























