"use client";

import { useState, useEffect, useRef } from "react";
import CollapsibleSection from "@/components/common/CollapsibleSection";
import {
  TIME_SCALES,
  scaleAnnualValue,
  getTimeScaleSuffix,
} from "@/components/cost-summary/cost-summary-card/costSummaryFormatters";
import { merge_groups_by_id, merge_groups_by_id_real_capacity } from "@/lib/selectors/business-outcome/businessOutcomePerSourceRevenueSelectors";
import BusinessOutcomeTruthLabourRecoveryCard from "@/components/business-outcome-truth/BusinessOutcomeTruthLabourRecoveryCard";
import BusinessOutcomeTruthWarningsPanel from "@/components/business-outcome-truth/BusinessOutcomeTruthWarningsPanel";
import { BusinessOutcomeTruthAboutPanel } from "@/components/business-outcome-truth/BusinessOutcomeTruthHelpPanel";
import { BusinessOutcomeTruthSituationBlurb } from "@/components/business-outcome-truth/BusinessOutcomeTruthSituationSummary";
import BusinessOutcomeNetProfitBuildUp from "@/components/business-outcome-truth/BusinessOutcomeNetProfitBuildUp";
import BusinessOutcomeViewABComparisonTable from "@/components/business-outcome-truth/BusinessOutcomeViewABComparisonTable";
import BusinessOutcomeCapacityCoverageGapTable from "@/components/business-outcome-truth/BusinessOutcomeCapacityCoverageGapTable";
import BusinessOutcomeHealthGauge from "@/components/business-outcome-truth/BusinessOutcomeHealthGauge";
import BusinessOutcomeHealthGaugeExplainer from "@/components/business-outcome-truth/BusinessOutcomeHealthGaugeExplainer";
import BusinessOutcomeEbitByUnitTable from "@/components/business-outcome-truth/BusinessOutcomeEbitByUnitTable";
import { scroll_to_section } from "@/lib/utils/scrollToSection";
import BusinessOutcomeIndependentBreakevenLedger from "@/components/business-outcome-truth/BusinessOutcomeIndependentBreakevenLedger";
import BusinessOutcomeRevenueSnapshotTable from "@/components/business-outcome-truth/BusinessOutcomeRevenueSnapshotTable";
import useProfitAndLoss from "@/hooks/useProfitAndLoss";

function format_currency(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "$0";
  return n.toLocaleString("en-NZ", {
    style: "currency",
    currency: "NZD",
    maximumFractionDigits: 0,
  });
}

function VerdictTag({ verdict, label }) {
  const key = verdict || "unavailable";
  return <span className={`business-outcome-verdict-tag ${key}`}>{label}</span>;
}

function ModelledTag() {
  return <span className="business-outcome-modelled-tag">Modelled</span>;
}

function primary_value(row, view_mode) {
  return view_mode === "profit" ? row.net_profit : row.modelled_revenue;
}

function SourceRow({ row, view_mode }) {
  const primary = primary_value(row, view_mode);
  const secondary_label = view_mode === "profit" ? "Revenue" : "Net profit";
  const secondary_value = view_mode === "profit" ? row.modelled_revenue : row.net_profit;

  return (
    <div className="business-outcome-source-row" style={{ "--indent-level": 1 }}>
      <span className="business-outcome-source-row-name">{row.name}</span>
      <span className="business-outcome-source-row-figures-stack">
        <ModelledTag />
        <VerdictTag verdict={row.verdict} label={row.verdict_label} />
        <span className="business-outcome-source-row-values">
          <span className="business-outcome-source-row-value">
            {row.available ? format_currency(primary) : row.unavailable_reason || "Not available"}
          </span>
          {row.available && (
            <span className="business-outcome-source-row-secondary-value">
              {secondary_label}: {format_currency(secondary_value)}
            </span>
          )}
        </span>
      </span>
    </div>
  );
}

function group_primary(group, view_mode) {
  return view_mode === "profit" ? group.group_net_profit : group.group_modelled_revenue;
}

function GroupBlock({ group_name, group_id, primary_total, secondary_total, secondary_label, rows, view_mode }) {
  const summary = (
    <span className="business-outcome-source-group-values">
      <span className="business-outcome-source-group-total">{format_currency(primary_total)}</span>
      <span className="business-outcome-source-group-secondary-value">
        {secondary_label}: {format_currency(secondary_total)}
      </span>
    </span>
  );

  return (
    <div className="business-outcome-collapsible-group" key={group_id || group_name}>
      <CollapsibleSection title={group_name} summary={summary} defaultOpen={false}>
        <div className="business-outcome-source-group-body">
          {rows.map((row) => (
            <SourceRow key={row.staff_type_id || row.asset_id} row={row} view_mode={view_mode} />
          ))}
        </div>
      </CollapsibleSection>
    </div>
  );
}

function LabourGroupsSection({ labour_groups, view_mode }) {
  if (!labour_groups || labour_groups.length === 0) return null;

  return (
    <>
      {labour_groups.map((group) => (
        <GroupBlock
          key={group.group_id || group.group_name}
          group_id={group.group_id}
          group_name={group.group_name}
          primary_total={group_primary(group, view_mode)}
          secondary_total={view_mode === "profit" ? group.group_modelled_revenue : group.group_net_profit}
          secondary_label={view_mode === "profit" ? "Revenue" : "Net profit"}
          rows={group.staff.map((s) => ({ ...s, name: s.staff_type_name }))}
          view_mode={view_mode}
        />
      ))}
    </>
  );
}

function AssetGroupsSection({ asset_groups, view_mode }) {
  if (!asset_groups || asset_groups.length === 0) return null;

  return (
    <>
      {asset_groups.map((group) => (
        <GroupBlock
          key={group.group_id || group.group_name}
          group_id={group.group_id}
          group_name={group.group_name}
          primary_total={group_primary(group, view_mode)}
          secondary_total={view_mode === "profit" ? group.group_modelled_revenue : group.group_net_profit}
          secondary_label={view_mode === "profit" ? "Revenue" : "Net profit"}
          rows={group.assets.map((a) => ({ ...a, name: a.asset_name }))}
          view_mode={view_mode}
        />
      ))}
    </>
  );
}

function MaterialsBuildUp({ build_up, view_mode, time_scale, open_hours, open_days, open_weeks }) {
  if (!build_up) return null;

  const scale = (v) => scaleAnnualValue(v, time_scale, null, open_hours, open_days, open_weeks);
  const money = (v) => format_currency(scale(v));

  return (
    <div className="business-outcome-buildup">
      <div className="business-outcome-buildup-title">How this is derived - not a P&L line</div>

      <div className="business-outcome-buildup-row">
        <span>Total P&L revenue</span>
        <span className="business-outcome-buildup-value">{money(build_up.total_pnl_revenue)}</span>
      </div>
      <div className="business-outcome-buildup-row is-subtract">
        <span>− Labour modelled revenue (all sources)</span>
        <span className="business-outcome-buildup-value">{money(build_up.labour_modelled_revenue)}</span>
      </div>
      <div className="business-outcome-buildup-row is-subtract">
        <span>− Asset modelled revenue (all groups)</span>
        <span className="business-outcome-buildup-value">{money(build_up.asset_modelled_revenue)}</span>
      </div>
      <div className="business-outcome-buildup-row is-total">
        <span>= Materials revenue share</span>
        <span className="business-outcome-buildup-value">
          {money(
            build_up.total_pnl_revenue - build_up.labour_modelled_revenue - build_up.asset_modelled_revenue
          )}
        </span>
      </div>
      {view_mode === "profit" && (
        <>

      <div className="business-outcome-buildup-row" style={{ marginTop: "0.5rem" }}>
        <span>Materials revenue share</span>
        <span className="business-outcome-buildup-value">
          {money(
            build_up.total_pnl_revenue - build_up.labour_modelled_revenue - build_up.asset_modelled_revenue
          )}
        </span>
      </div>
      <div className="business-outcome-buildup-row is-subtract">
        <span>− COGS (P&L)</span>
        <span className="business-outcome-buildup-value">{money(build_up.cogs)}</span>
      </div>
      <div className="business-outcome-buildup-row is-subtract">
        <span>− Residual overhead (not distributed to labour/asset groups)</span>
        <span className="business-outcome-buildup-value">{money(build_up.residual_overhead)}</span>
      </div>
      <div className="business-outcome-buildup-row is-total">
        <span>= Materials net profit (Adjusted GP)</span>
        <span className="business-outcome-buildup-value">
          {money(
            build_up.total_pnl_revenue -
              build_up.labour_modelled_revenue -
              build_up.asset_modelled_revenue -
              build_up.cogs -
              build_up.residual_overhead
          )}
        </span>
      </div>

      <div className="business-outcome-buildup-percent-row">
        <div className="business-outcome-buildup-percent">
          <span className="business-outcome-buildup-percent-label">P&amp;L GP %</span>
          <span className="business-outcome-buildup-percent-value">
            {(
              ((build_up.total_pnl_revenue - build_up.cogs) / build_up.total_pnl_revenue) * 100
            ).toFixed(1)}
            %
          </span>
        </div>
        <div className="business-outcome-buildup-percent">
          <span className="business-outcome-buildup-percent-label">Adjusted GP %</span>
          <span className="business-outcome-buildup-percent-value">
            {(
              ((build_up.total_pnl_revenue -
                build_up.labour_modelled_revenue -
                build_up.asset_modelled_revenue -
                build_up.cogs -
                build_up.residual_overhead) /
                (build_up.total_pnl_revenue - build_up.labour_modelled_revenue - build_up.asset_modelled_revenue)) *
              100
            ).toFixed(1)}
            %
          </span>
        </div>
        </div>
        </>
      )}
    </div>
  );
}

function MaterialsSection({ materials, view_mode, capacity_mode, time_scale, open_hours, open_days, open_weeks }) {
  if (!materials) return null;

  const scale = (v) => scaleAnnualValue(v, time_scale, null, open_hours, open_days, open_weeks);

  const net_profit_value =
    capacity_mode === "real" ? materials.real_capacity_net_profit : materials.net_profit;
  const verdict =
    capacity_mode === "real" ? materials.real_capacity_verdict : materials.verdict;
  const verdict_label =
    capacity_mode === "real" ? materials.real_capacity_verdict_label : materials.verdict_label;

  const primary = view_mode === "profit" ? net_profit_value : materials.revenue;
  const secondary = view_mode === "profit" ? materials.revenue : net_profit_value;
  const secondary_label = view_mode === "profit" ? "Revenue" : "Net profit";

  const summary = (
    <span className="business-outcome-source-group-values">
      <span className="business-outcome-source-group-total">{format_currency(scale(primary))}</span>
      <span className="business-outcome-source-group-secondary-value">
        {secondary_label}: {format_currency(scale(secondary))}
      </span>
    </span>
  );

  return (
    <div className="business-outcome-collapsible-group">
      <CollapsibleSection title="Materials — Adjusted GP after labour & asset revenue removed" summary={summary} defaultOpen={false}>
        <div className="business-outcome-source-group-body">
          <div className="business-outcome-source-row" style={{ "--indent-level": 1 }}>
            <span className="business-outcome-source-row-name">
              {view_mode === "profit" ? "Net profit" : "Revenue"}
            </span>
            <span className="business-outcome-source-row-figures-stack">
              <ModelledTag />
              {view_mode === "profit" && <VerdictTag verdict={verdict} label={verdict_label} />}
              <span className="business-outcome-source-row-values">
                <span className="business-outcome-source-row-value">
                  {format_currency(scale(view_mode === "profit" ? net_profit_value : materials.revenue))}
                </span>
              </span>
            </span>
          </div>
          <MaterialsBuildUp build_up={materials.build_up} view_mode={view_mode} time_scale={time_scale} open_hours={open_hours} open_days={open_days} open_weeks={open_weeks} />
        </div>
      </CollapsibleSection>
    </div>
  );
}

// COMBINED (this session): "Not yet assigned" and "Warnings & data
// quality" now share one collapsed section, so the "Blocked - upstream
// data not trusted" banner at the top of the page has a single, stable
// target to open and scroll to. Deliberately does NOT early-return when
// there are no unassigned gaps - Warnings/Data Quality content is
// independent of that (real warnings can exist with nothing unassigned)
// and must never be hidden as a side effect of a different check.
function UnassignedBlock({ unassigned, output_contract, labour_coverage_gaps }) {
  const has_unassigned = unassigned && unassigned.has_gaps;
  const has_coverage_gaps = labour_coverage_gaps && labour_coverage_gaps.length > 0;

  return (
    <CollapsibleSection
      id="business-outcome-warnings-section"
      title="Not yet assigned & data quality"
      defaultOpen={false}
    >
      {has_unassigned && (
        <div className="business-outcome-unassigned-block">
          <div className="business-outcome-unassigned-title">Not yet assigned</div>
          {unassigned.lines.map((line) => (
            <div key={line.label}>
              <div className="business-outcome-unassigned-line">
                <span>{line.label}</span>
                <span className="business-outcome-unassigned-line-amount">
                  {format_currency(line.amount)}
                </span>
              </div>
              <div className="business-outcome-unassigned-hint">{line.hint}</div>
            </div>
          ))}
        </div>
      )}
      {has_coverage_gaps && (
        <div className="business-outcome-coverage-gap-block">
          <div className="business-outcome-coverage-gap-title">Scheduling gap - not a profit issue</div>
          {labour_coverage_gaps.map((gap) => (
            <div className="business-outcome-coverage-gap-row" key={gap.group_id}>
              <strong>{gap.group_name}</strong> - assigned labour covers {gap.gap_hours} fewer
              hours ({gap.gap_days} days) than this asset runs each year. This is a real scheduling gap worth weighing up in
              Business Modelling - not something to fix on this page.
            </div>
          ))}
        </div>
      )}
      <BusinessOutcomeTruthWarningsPanel output_contract={output_contract} />
    </CollapsibleSection>
  );
}

function ReconciliationBanner({ reconciliation }) {
  if (!reconciliation) return null;

  const status_class = reconciliation.cost_reconciles ? "ok" : "warning";

  return (
    <div className={`business-outcome-reconciliation-banner ${status_class}`}>
      <strong>{reconciliation.cost_status_label}</strong>
      <div>
        Real cost across every source: {format_currency(reconciliation.total_true_cost)} vs.
        {" "}
        {format_currency(reconciliation.total_cost_reference)} reported.
        {!reconciliation.cost_reconciles && (
          <> Variance: {format_currency(reconciliation.cost_variance)} - see Cost Allocation for unassigned items.</>
        )}
      </div>
    </div>
  );
}

function CostBuildUpTable({ labour_groups, asset_groups, materials, time_scale, open_hours, open_days, open_weeks, use_implied, capacity_mode, real_capacity }) {
  const scale = (v) => scaleAnnualValue(v, time_scale, null, open_hours, open_days, open_weeks);
  const suffix = time_scale !== "year" ? getTimeScaleSuffix(time_scale) : "";
  const entries =
    capacity_mode === "real"
      ? merge_groups_by_id_real_capacity(labour_groups, asset_groups, materials, real_capacity?.group_real_capacity)
      : merge_groups_by_id(labour_groups, asset_groups, materials, use_implied);
  // FIX (2026-09-18): mirrors the same fix just applied to View B's
  // merge_view_b_groups - the selector's own group_true_cost is summed
  // from raw, UNINJECTED row.true_cost, missing non-productive cost
  // entirely. real_capacity.group_real_capacity has the correct,
  // already-injected figure (same trusted source the page headline's
  // own breakeven number comes from) - used for BOTH capacity modes
  // here, since real true cost doesn't change based on which cascade
  // phase is being displayed, only net profit does. net_profit itself
  // needs no correction - entries' own net_profit already correctly
  // reads from the injected cascade.
  const true_cost_by_group_id = new Map(
    (real_capacity?.group_real_capacity || []).map((g) => [g.group_id, g.true_cost])
  );
  const rows = entries.filter((e) => e.type === "group").map((e) => {
    const correct_total_cost = true_cost_by_group_id.get(e.key);
    if (correct_total_cost === undefined) return e;
    const updated = { ...e, total_cost: correct_total_cost };
    // FIX (2026-09-18): Assumed Capacity's net_profit comes from a
    // completely separate mechanism (the ceiling/implied model) never
    // touched by the non-productive injection fix. This table never
    // shows any row scaled down here - revenue is always each source's
    // own full assumed claim - so net profit for this mode is simply
    // revenue minus this row's own (now-corrected) cost, recomputed
    // directly rather than trusting the old, uninjected field.
    if (capacity_mode === "assumed") {
      updated.net_profit = (e.modelled_revenue ?? 0) - correct_total_cost;
    }
    return updated;
  });
  const totals = rows.reduce(
    (acc, r) => {
      const overhead = r.overhead_share ?? 0;
      const full_cost = r.total_cost ?? 0;
      acc.no_overhead += full_cost - overhead;
      acc.overhead += overhead;
      acc.full_cost += full_cost;
      acc.revenue += r.modelled_revenue ?? 0;
      acc.net_profit += r.net_profit ?? 0;
      return acc;
    },
    { no_overhead: 0, overhead: 0, full_cost: 0, revenue: 0, net_profit: 0 }
  );
  return (
    <div className="business-outcome-cost-buildup-table">
      <div className="business-outcome-cost-buildup-row header">
        <span>Description</span>
        <span className="value">Min recoverable (no overhead)</span>
        <span className="value">Overhead pool distribution</span>
        <span className="value">Min rec (full cost)</span>
        <span className="value">Revenue</span>
        <span className="value">Net profit</span>
      </div>
      {rows.map((r) => {
        const overhead = r.overhead_share ?? 0;
        const no_overhead = (r.total_cost ?? 0) - overhead;
        const full_cost = r.total_cost ?? 0;
        return (
          <div className="business-outcome-cost-buildup-row" key={r.key}>
            <span className="label">{r.label}</span>
            <span className="value">{formatCurrencyTruth(scale(no_overhead))}{suffix}</span>
            <span className="value">{formatCurrencyTruth(scale(overhead))}{suffix}</span>
            <span className="value">{formatCurrencyTruth(scale(full_cost))}{suffix}</span>
            <span className="value">{formatCurrencyTruth(scale(r.modelled_revenue ?? 0))}{suffix}</span>
            <span className="value">{formatCurrencyTruth(scale(r.net_profit ?? 0))}{suffix}</span>
          </div>
        );
      })}
      <div className="business-outcome-cost-buildup-row header">
        <span>Total</span>
        <span className="value">{formatCurrencyTruth(scale(totals.no_overhead))}{suffix}</span>
        <span className="value">{formatCurrencyTruth(scale(totals.overhead))}{suffix}</span>
        <span className="value">{formatCurrencyTruth(scale(totals.full_cost))}{suffix}</span>
        <span className="value">{formatCurrencyTruth(scale(totals.revenue))}{suffix}</span>
        <span className="value">{formatCurrencyTruth(scale(totals.net_profit))}{suffix}</span>
      </div>
    </div>
  );
}
// View B equivalent of CostBuildUpTable above. Unlike View A's table -
// which deliberately excludes materials, per S25's original brief
// ("Materials/COGS NOT included - overhead distribution is
// operating-group-specific") - View B's table genuinely includes
// materials as a sixth row, since that is the entire premise of View
// B: materials is a real peer, not a special case. Uses
// achieved_revenue (the reconciled figure) rather than raw modelled
// revenue for the Revenue column, same as ViewBGroupsDrill already
// does, so this table's totals reconcile to real revenue too.
function ViewBCostBuildUpTable({ view_b, time_scale, open_hours, open_days, open_weeks, capacity_mode }) {
  const scale = (v) => scaleAnnualValue(v, time_scale, null, open_hours, open_days, open_weeks);
  const suffix = time_scale !== "year" ? getTimeScaleSuffix(time_scale) : "";
  if (!view_b) return null;
  const rows = merge_view_b_groups(view_b, capacity_mode);
  const totals = rows.reduce(
    (acc, r) => {
      const overhead = r.overhead_share ?? 0;
      const full_cost = r.total_cost ?? 0;
      acc.no_overhead += full_cost - overhead;
      acc.overhead += overhead;
      acc.full_cost += full_cost;
      acc.revenue += r.achieved_revenue ?? 0;
      acc.net_profit += r.net_profit ?? 0;
      return acc;
    },
    { no_overhead: 0, overhead: 0, full_cost: 0, revenue: 0, net_profit: 0 }
  );
  return (
    <div className="business-outcome-cost-buildup-table">
      <div className="business-outcome-cost-buildup-row header">
        <span>Description</span>
        <span className="value">Min recoverable (no overhead)</span>
        <span className="value">Overhead pool distribution</span>
        <span className="value">Min rec (full cost)</span>
        <span className="value">Revenue</span>
        <span className="value">Net profit</span>
      </div>
      {rows.map((r) => {
        const overhead = r.overhead_share ?? 0;
        const no_overhead = (r.total_cost ?? 0) - overhead;
        const full_cost = r.total_cost ?? 0;
        return (
          <div className="business-outcome-cost-buildup-row" key={r.key}>
            <span className="label">{r.label}</span>
            <span className="value">{formatCurrencyTruth(scale(no_overhead))}{suffix}</span>
            <span className="value">{formatCurrencyTruth(scale(overhead))}{suffix}</span>
            <span className="value">{formatCurrencyTruth(scale(full_cost))}{suffix}</span>
            <span className="value">{formatCurrencyTruth(scale(r.achieved_revenue ?? 0))}{suffix}</span>
            <span className="value">{formatCurrencyTruth(scale(r.net_profit ?? 0))}{suffix}</span>
          </div>
        );
      })}
      <div className="business-outcome-cost-buildup-row header">
        <span>Total</span>
        <span className="value">{formatCurrencyTruth(scale(totals.no_overhead))}{suffix}</span>
        <span className="value">{formatCurrencyTruth(scale(totals.overhead))}{suffix}</span>
        <span className="value">{formatCurrencyTruth(scale(totals.full_cost))}{suffix}</span>
        <span className="value">{formatCurrencyTruth(scale(totals.revenue))}{suffix}</span>
        <span className="value">{formatCurrencyTruth(scale(totals.net_profit))}{suffix}</span>
      </div>
    </div>
  );
}
function RankedGroupsDrill({ headline, real_capacity, labour_groups, asset_groups, materials, view_mode, time_scale, open_hours, open_days, open_weeks, use_implied, capacity_mode, cost_mode, selected_key, set_selected_key }) {
  const scale = (v) => scaleAnnualValue(v, time_scale, null, open_hours, open_days, open_weeks);
  const suffix = time_scale !== "year" ? getTimeScaleSuffix(time_scale) : "";
  const [hovered_key, set_hovered_key] = useState("");

  const entries =
    capacity_mode === "real"
      ? merge_groups_by_id_real_capacity(labour_groups, asset_groups, materials, real_capacity?.group_real_capacity)
      : merge_groups_by_id(labour_groups, asset_groups, materials, use_implied);

  // S25: contribution-margin lens - overhead_share removed from each
  // group cost, added back to net_profit (pure re-attribution, same
  // totals). Materials/COGS is excluded - S25 concerns operating-group
  // overhead only.
  const total_group_overhead_share = entries.reduce(
    (sum, e) => sum + (e.type === "group" ? (e.overhead_share ?? 0) : 0),
    0
  );
  const cost_adjusted_entries =
    cost_mode === "contribution"
      ? entries.map((e) =>
          e.type === "group"
            ? {
                ...e,
                total_cost: (e.total_cost ?? 0) - (e.overhead_share ?? 0),
                net_profit: (e.net_profit ?? 0) + (e.overhead_share ?? 0),
              }
            : e
        )
      : entries;
  const metric = (e) => (view_mode === "profit" ? e.net_profit : e.modelled_revenue);
  const total = view_mode === "profit" ? headline.total_net_profit : headline.total_modelled_revenue;

  const sorted_top_level = [...cost_adjusted_entries].sort((a, b) => metric(b) - metric(a));
  const selected_entry = cost_adjusted_entries.find((e) => e.key === selected_key) || null;

  // FIX (this session): the top-level cost_adjusted_entries mapping
  // above only ever touched group-level total_cost/net_profit -
  // .children was carried through unchanged from the original
  // (unadjusted) entries, so drilling into a group always showed full-
  // cost figures regardless of the Full cost/Contribution margin
  // toggle. Same adjustment now applied here, per child, using each
  // child's own overhead_share.
  const active_list = selected_entry
    ? [...selected_entry.children]
        .map((c) =>
          cost_mode === "contribution"
            ? {
                ...c,
                total_cost: (c.total_cost ?? 0) - (c.overhead_share ?? 0),
                net_profit: (c.net_profit ?? 0) + (c.overhead_share ?? 0),
              }
            : c
        )
        .sort((a, b) => metric(b) - metric(a))
    : sorted_top_level;

  const sum_abs_total = active_list.reduce((sum, e) => sum + Math.abs(metric(e)), 0);
  const breadcrumbs = selected_entry
    ? [
        { key: "root", label: "All operating groups" },
        { key: selected_entry.key, label: selected_entry.label },
      ]
    : [{ key: "root", label: "All operating groups" }];

  return (
    <div className="ui-panel ui-stack-sm">
      <div className="cost-summary-breadcrumb">
        {breadcrumbs.map((crumb, index) => (
          <button
            key={crumb.key}
            type="button"
            className="cost-summary-breadcrumb-item"
            onClick={() => set_selected_key(index === 0 ? null : selected_key)}
          >
            {crumb.label}
          </button>
        ))}
      </div>

      <div className="ui-kicker">
        {selected_entry ? `${selected_entry.label} - breakdown by ${view_mode === "profit" ? "net profit" : "revenue"}` : `Ranked by ${view_mode === "profit" ? "net profit" : "revenue"}`}
      </div>

      {selected_entry?.key === "materials" ? (
        <MaterialsSection materials={materials} view_mode={view_mode} capacity_mode={capacity_mode} time_scale={time_scale} open_hours={open_hours} open_days={open_days} open_weeks={open_weeks} />
      ) : (
      <div className="cost-summary-drill-list">
        {active_list.map((item) => {
          const has_children =
            !selected_entry &&
            (entries.find((e) => e.key === item.key)?.children.length > 0 || item.key === "materials");
          const is_active = hovered_key === item.key;
          const is_muted = Boolean(hovered_key) && !is_active;
          const value = metric(item);
          const share = sum_abs_total > 0 && Math.abs(total) / sum_abs_total > 0.001 ? ((value / total) * 100).toFixed(1) : "N/A";

          const row_class = [
            "cost-summary-drill-row",
            has_children ? "clickable" : "static",
            is_active ? "active" : "",
            is_muted ? "muted" : "",
          ]
            .filter(Boolean)
            .join(" ");

          const content = (
            <>
              <div className="ui-stack-sm">
                <div className="cost-summary-drill-label">{item.label}</div>
                {item.type === "group" && (
                  <div className="ui-help">
                    Cost {formatCurrencyTruth(item.total_cost)} &middot; Group min rate {item.minimum_recoverable_rate !== null && item.minimum_recoverable_rate !== undefined ? `${formatCurrencyTruth(item.minimum_recoverable_rate)}/hr` : "N/A"} &middot; Current rate {item.current_rate !== null && item.current_rate !== undefined ? `${formatCurrencyTruth(item.current_rate)}/hr` : "N/A"}
                  </div>
                )}
                {item.type !== "group" && item.type !== "materials" && item.total_cost !== undefined && (
                  <div className="ui-help">
                    Cost {formatCurrencyTruth(item.total_cost)} &middot; Current rate {item.current_rate !== null && item.current_rate !== undefined ? `${formatCurrencyTruth(item.current_rate)}/hr` : "N/A"} &middot; Achieved rate {item.achieved_rate !== null && item.achieved_rate !== undefined ? `${formatCurrencyTruth(item.achieved_rate)}/hr` : "N/A"}
                  </div>
                )}
                {item.available === false && <div className="ui-help">{item.unavailable_reason || "Not available"}</div>}
              </div>
              <div className="cost-summary-drill-value">
                <span className="business-outcome-drill-tags">
                  <ModelledTag />
                  {item.type !== "materials" && cost_mode === "contribution" && (<span className="business-outcome-overhead-excluded-tag">Excl. overhead</span>)}
                  {/* FIX (this session): verdict is a profitability
                      claim, not a revenue-share claim - showing it next
                      to a dollar figure that never changes between
                      capacity models produced a real contradiction under
                      Real Capacity (large revenue figure next to a red
                      "Being carried" badge). Only meaningful in Net
                      Profit view, where the figure itself reflects the
                      selected capacity model. */}
                  {view_mode === "profit" && item.verdict && (
                    <VerdictTag verdict={item.verdict} label={item.verdict_label} />
                  )}
                </span>
                <div style={{ fontSize: "1.2em" }}>
                  {format_currency(scale(value))}
                  {suffix}
                  <span className="ui-help"> ({share}%)</span>
                </div>
              </div>
            </>
          );

          return (
            <div
              key={item.key}
              className={row_class}
              onMouseEnter={() => set_hovered_key(item.key)}
              onMouseLeave={() => set_hovered_key("")}
              {...(has_children ? { onClick: () => set_selected_key(item.key), role: "button", tabIndex: 0 } : {})}
            >
              {content}
            </div>
          );
        })}
      </div>
      )}

      {cost_mode === "contribution" && (
        <div className="business-outcome-capacity-warning">
          <strong>
            This view excludes overhead. Do not use these figures to set prices or quotes
            &mdash; switch to Full cost for that. Total overhead not shown per group above:{" "}
            {formatCurrencyTruth(total_group_overhead_share)}.
          </strong>
        </div>
      )}
    </div>
  );
}

// === S26 VIEW B DISPLAY - "Materials shares equally" ===
// Deliberately NOT routed through merge_groups_by_id/RankedGroupsDrill -
// View B's data (view_b.real_capacity.group_real_capacity) already
// contains materials as a genuine flat peer alongside every operating
// group, computed the same way, no bolt-on merge needed. Routing it
// through the View A merge machinery (built specifically to bolt
// materials on afterward) would be fighting the shape of the data
// rather than using it. Static list only for now - no drill-down into
// individual labour/asset sources within each group; that can be added
// later if wanted, following the same pattern as RankedGroupsDrill.
// Groups View B's flat labour_sources/asset_sources/materials rows by
// group_id, mirroring group_sources_by_group's rollup (cost, current
// rate, min recoverable rate, modelled revenue), then merges in each
// group's RECONCILED final_net_profit from the real-capacity cascade
// (view_b.real_capacity.group_real_capacity) - the number that actually
// answers "does what you're charging match what you're achieving".
// Materials included as a genuine peer, same shape as every operating
// group, with markup % standing in for $/hr rate (materials has no
// hours to rate against, so it can't carry a $/hr figure).
//
// achieved_rate / achieved_hours (this session): the same shortfall can
// be read two ways - either the rate you were actually able to charge
// was lower than Rate Builder's stated rate (hours held fixed, since
// staff/assets are paid/committed regardless of revenue), or the hours
// that revenue actually covers were fewer than what was worked (rate
// held fixed at the stated figure). Neither reading is more "correct"
// than the other - both are genuine, so both are computed here and the
// display toggle (view_b_shortfall_mode) picks which one to show.
// Materials has no hours at all, so neither applies to it - it keeps
// its own achieved-markup figure regardless of this toggle.
// Groups View B's flat labour_sources/asset_sources/materials rows by
// group_id, mirroring group_sources_by_group's rollup (cost, current
// rate, min recoverable rate, modelled revenue), then merges in each
// group's RECONCILED figures from whichever capacity model is active:
//   - "real": the two-phase real-capacity cascade
//     (view_b.real_capacity.group_real_capacity) - shortfall shared
//     proportional to who can actually afford to give something up.
//   - "assumed": the flat ceiling scale-down
//     (view_b.revenue_ceiling's implied_revenue/implied_net_profit,
//     set directly on each row) - shortfall shared evenly, same
//     percentage cut for everyone regardless of margin. Falls back to
//     each row's own modelled_revenue/net_profit when no breach
//     occurred (revenue_ceiling.is_breached === false), matching the
//     same safe-fallback convention View A's own group_sources_by_group
//     already uses.
// Materials included as a genuine peer throughout, same shape as every
// operating group, with markup % standing in for $/hr rate (materials
// has no hours to rate against, so it can't carry a $/hr figure).
//
// achieved_rate / achieved_hours (this session): the same shortfall can
// be read two ways - either the rate you were actually able to charge
// was lower than Rate Builder's stated rate (hours held fixed, since
// staff/assets are paid/committed regardless of revenue), or the hours
// that revenue actually covers were fewer than what was worked (rate
// held fixed at the stated figure). Neither reading is more "correct"
// than the other - both are genuine, so both are computed here and the
// display toggle (view_b_shortfall_mode) picks which one to show. Both
// are derived from whichever capacity model (real/assumed) is active.
// Materials has no hours at all, so neither applies to it - it keeps
// its own achieved-markup figure regardless of this toggle.
function merge_view_b_groups(view_b, capacity_mode) {
  if (!view_b) return [];

  const by_group_id = new Map();

  function get_or_create(group_id, group_name) {
    const key = group_id || `unkeyed_${group_name}`;
    if (!by_group_id.has(key)) {
      by_group_id.set(key, {
        key,
        label: group_name,
        modelled_revenue: 0,
        total_cost: 0,
        current_rate: null,
        minimum_recoverable_rate: null,
        is_materials: key === "materials",
        assumed_revenue: 0,
        assumed_net_profit: 0,
        overhead_share: 0,
        children: [],
      });
    }
    return by_group_id.get(key);
  }

  // Per-row children (this session, drill-down support): each
  // individual labour/asset source within a group, computed the same
  // way as the group-level figures above but at the row level. Not
  // pushed for materials - materials has no sub-sources to drill into,
  // same convention as View A (materials never has children either).
  [...view_b.labour_sources, ...view_b.asset_sources].forEach((row) => {
    const entry = get_or_create(row.group_id, row.group_name);
    entry.modelled_revenue += row.modelled_revenue ?? 0;
    entry.total_cost += row.true_cost ?? 0;
    entry.overhead_share += row.overhead_share ?? 0;
    entry.assumed_revenue += row.implied_revenue ?? row.modelled_revenue ?? 0;
    entry.assumed_net_profit += row.implied_net_profit ?? row.net_profit ?? 0;
    const row_rate = row.blended_rate ?? row.charge_out_rate ?? null;
    if (entry.current_rate === null && row_rate !== null && row_rate !== undefined) entry.current_rate = row_rate;
    if (
      entry.minimum_recoverable_rate === null &&
      row.minimum_recoverable_rate_per_hour !== null &&
      row.minimum_recoverable_rate_per_hour !== undefined
    ) {
      entry.minimum_recoverable_rate = row.minimum_recoverable_rate_per_hour;
    }

    const child_net_profit =
      capacity_mode === "assumed"
        ? row.implied_net_profit ?? row.net_profit ?? 0
        : row.real_capacity_net_profit ?? row.net_profit ?? 0;
    const child_achieved_revenue =
      capacity_mode === "assumed"
        ? row.implied_revenue ?? row.modelled_revenue ?? 0
        : (row.true_cost ?? 0) + (row.non_productive_share ?? 0) + child_net_profit;
    const child_verdict = child_net_profit >= 0 ? "paying_its_way" : "being_carried";
    // Labour children get their own genuinely distinct, individually-
    // set rate (e.g. Owner/Director $120/hr vs Senior Operator $75/hr -
    // confirmed real, separately-set numbers). Asset children within a
    // co-deployed group (e.g. a pump + its tow vehicle) share ONE
    // blended group rate (current_rate is the same number on every
    // asset in that group) - the rate itself is real, just shared, not
    // independently set per asset. achieved_rate for assets is still
    // computed per-asset (own hours, own cost-share-allocated revenue),
    // same as labour - confirmed with user this session as an accepted
    // basis, matching the same allocation logic already used for the
    // group-level asset revenue split elsewhere in this codebase.
    const is_labour_row = Boolean(row.staff_type_id);
    const child_hours = row.hours ?? 0;
    const child_current_rate = row.charge_out_rate ?? row.blended_rate ?? null;

    entry.children.push({
      key: row.staff_type_id || row.asset_id,
      label: row.staff_type_name || row.asset_name,
      net_profit: child_net_profit,
      modelled_revenue: row.modelled_revenue ?? 0,
      achieved_revenue: child_achieved_revenue,
      available: row.available ?? true,
      unavailable_reason: row.unavailable_reason ?? null,
      verdict: child_verdict,
      verdict_label: child_verdict === "being_carried" ? "Being carried" : "Paying its way",
      is_labour: is_labour_row,
      total_cost: (row.true_cost ?? 0) + (row.non_productive_share ?? 0),
      current_rate: child_current_rate,
      minimum_recoverable_rate: row.minimum_recoverable_rate_per_hour ?? null,
      achieved_rate: child_hours > 0 ? child_achieved_revenue / child_hours : null,
      achieved_hours: child_current_rate > 0 ? child_achieved_revenue / child_current_rate : null,
      overhead_share: row.overhead_share ?? 0,
    });
  });

  if (view_b.materials) {
    const m = view_b.materials;
    const entry = get_or_create(m.group_id, m.group_name);
    entry.modelled_revenue += m.modelled_revenue ?? 0;
    entry.total_cost += m.true_cost ?? 0;
    entry.overhead_share += m.overhead_share ?? 0;
    entry.assumed_revenue += m.implied_revenue ?? m.modelled_revenue ?? 0;
    entry.assumed_net_profit += m.implied_net_profit ?? m.net_profit ?? 0;
    entry.current_rate = m.current_markup_percent ?? null;
    entry.minimum_recoverable_rate = m.minimum_recoverable_markup_percent ?? null;
  }

  const cascade_by_group_id = new Map(
    (view_b.real_capacity?.group_real_capacity || []).map((g) => [g.group_id, g])
  );

  return Array.from(by_group_id.values()).map((entry) => {
    const cascade_entry = cascade_by_group_id.get(entry.key);
    const group_recovery_hours = cascade_entry?.group_recovery_hours ?? 0;

    // FIX (2026-09-18): entry.total_cost above was summed from raw,
    // UNINJECTED row.true_cost - non-productive cost (e.g. Accountant's
    // distributed wage) was never included. Confirmed live: Foreman's
    // true cost shown here didn't match the real, already-correct
    // figure in real_capacity.group_real_capacity by exactly the
    // non-productive cost total. cascade_entry.true_cost IS correct
    // (this same lookup already correctly feeds group_recovery_hours
    // above) - use it here too. Falls back to the raw sum only if
    // genuinely unavailable (materials never receives a non-productive
    // share, so its raw sum is already correct either way).
    const true_cost = cascade_entry?.true_cost ?? entry.total_cost;

    // FIX (2026-09-18, second pass): entry.assumed_net_profit was still
    // using the old, uninjected figure (accumulated from row.implied_net_profit,
    // itself computed by apply_revenue_ceiling_v2 from raw, uninjected
    // true_cost - a completely separate mechanism never touched by the
    // non-productive fix). Recomputed directly from assumed_revenue
    // minus the now-corrected true_cost instead of trusting that field.
    const net_profit =
      capacity_mode === "assumed"
        ? entry.assumed_revenue - true_cost
        : cascade_entry?.final_net_profit ?? entry.modelled_revenue - true_cost;
    const achieved_revenue =
      capacity_mode === "assumed" ? entry.assumed_revenue : true_cost + net_profit;

    const verdict = net_profit >= 0 ? "paying_its_way" : "being_carried";

    const achieved_rate =
      !entry.is_materials && group_recovery_hours > 0 ? achieved_revenue / group_recovery_hours : null;
    const achieved_hours =
      !entry.is_materials && entry.current_rate > 0 ? achieved_revenue / entry.current_rate : null;

    return {
      ...entry,
      total_cost: true_cost,
      net_profit,
      verdict,
      verdict_label: verdict === "being_carried" ? "Being carried" : "Paying its way",
      achieved_rate,
      achieved_hours,
      achieved_revenue,
      group_recovery_hours,
    };
  });
}

// === S26 VIEW B DISPLAY - "Materials shares equally" ===
// Mirrors RankedGroupsDrill's row layout/metadata exactly (Cost / Min
// rate / Current rate subtitle, MODELLED tag, verdict tag, revenue-share
// percentage) so switching between View A and View B changes only the
// underlying numbers, not the visual language. Materials' subtitle shows
// markup % instead of $/hr, since it has no hours to rate against - the
// only structural difference from an operating group's row. Also honors
// the page-wide Real/Assumed capacity toggle, same as View A - this is
// the whole point of the page (per user, this session): whichever lens
// is active should apply everywhere, not just to View A.
//
// DRILL-DOWN (this session): clicking a group shows its individual
// labour/asset sources, mirroring RankedGroupsDrill's selected_key/
// breadcrumb pattern. Materials has no children (same convention as
// View A - materials is never drillable). Child rows show label +
// verdict + value only, no Cost/Rate subtitle - that detail is
// group-level only, same as View A's own children.
//
// KNOWN LIMITATION: the surplus-distribution hypothetical credit
// (show_surplus_distributed below) only applies at the group level.
// Drilling into a group while that toggle is active shows each
// source's REAL, uncredited figures, not a proportional share of the
// credit - building that correctly needs real design thought on how
// to split a group-level credit across its own children, not a quick
// bolt-on, so it is left as an honest, documented gap rather than an
// unverified guess.
//
// UNATTRIBUTED SURPLUS (this session): when real revenue exceeds every
// source's combined target, that extra money is real but its SOURCE is
// unknown - the model has no way to tell whether it came from operating
// groups running more hours than assumed, or materials achieving a
// higher real markup than stated. Flagged, never silently distributed,
// same principle as the existing "Not yet assigned" costs elsewhere on
// this page (reused CSS classes for visual consistency). An optional,
// off-by-default toggle lets the user see a HYPOTHETICAL proportional
// distribution (same proportional logic the shortfall cascade already
// uses, just crediting instead of debiting) - clearly labelled as a
// guess, never blended into the real figures silently. achieved_rate/
// achieved_hours are recomputed under the credited figures too, using
// each entry's own group_recovery_hours, so the Rate/Hours Shortfall
// toggle stays internally consistent even in the hypothetical view.
function ViewBGroupsDrill({ view_b, view_mode, time_scale, open_hours, open_days, open_weeks, shortfall_mode, capacity_mode, selected_key, set_selected_key, cost_mode }) {
  const [show_surplus_distributed, set_show_surplus_distributed] = useState(false);

  if (!view_b || !view_b.real_capacity) return null;

  const scale = (v) => scaleAnnualValue(v, time_scale, null, open_hours, open_days, open_weeks);
  const surplus = view_b.real_capacity.surplus ?? 0;
  const raw_entries = merge_view_b_groups(view_b, capacity_mode);

  const total_positive_profit = raw_entries.reduce(
    (sum, e) => (e.net_profit > 0 ? sum + e.net_profit : sum),
    0
  );

  const entries =
    show_surplus_distributed && surplus > 0
      ? raw_entries.map((e) => {
          const credit =
            total_positive_profit > 0 && e.net_profit > 0
              ? surplus * (e.net_profit / total_positive_profit)
              : 0;
          const credited_net_profit = e.net_profit + credit;
          const credited_achieved_revenue = e.achieved_revenue + credit;
          const credited_verdict = credited_net_profit >= 0 ? "paying_its_way" : "being_carried";
          const credited_achieved_rate =
            !e.is_materials && e.group_recovery_hours > 0
              ? credited_achieved_revenue / e.group_recovery_hours
              : null;
          const credited_achieved_hours =
            !e.is_materials && e.current_rate > 0 ? credited_achieved_revenue / e.current_rate : null;
          return {
            ...e,
            net_profit: credited_net_profit,
            achieved_revenue: credited_achieved_revenue,
            achieved_rate: credited_achieved_rate,
            achieved_hours: credited_achieved_hours,
            verdict: credited_verdict,
            verdict_label: credited_verdict === "being_carried" ? "Being carried" : "Paying its way",
          };
        })
      : raw_entries;

  const metric = (e) => (view_mode === "profit" ? e.net_profit : e.achieved_revenue);

  // Contribution margin adjustment (S25 pattern, extended to View B
  // this session - was never wired up here at all before, confirmed
  // by searching the file for cost_mode and finding nothing near this
  // function). Subtracts each source's own overhead_share from
  // total_cost, adds it back to net_profit - pure re-attribution, same
  // total either way, exactly matching RankedGroupsDrill's version.
  // Unlike View A (which deliberately excludes materials, since S25
  // was scoped to operating-group overhead only), View B includes
  // materials too - consistent with treating it as a genuine peer
  // everywhere else in this view. In practice this makes almost no
  // difference, since materials' own overhead_share is confirmed
  // near-zero (residual_overhead ~ $0), but applying the logic
  // uniformly is more honest than special-casing it here alone.
  const total_overhead_share = entries.reduce((sum, e) => sum + (e.overhead_share ?? 0), 0);
  const cost_adjusted_entries =
    cost_mode === "contribution"
      ? entries.map((e) => ({
          ...e,
          total_cost: (e.total_cost ?? 0) - (e.overhead_share ?? 0),
          net_profit: (e.net_profit ?? 0) + (e.overhead_share ?? 0),
        }))
      : entries;

  const selected_entry = cost_adjusted_entries.find((e) => e.key === selected_key) || null;
  const sorted_top_level = [...cost_adjusted_entries].sort((a, b) => metric(b) - metric(a));
  const active_list = selected_entry
    ? [...selected_entry.children]
        .map((c) =>
          cost_mode === "contribution"
            ? {
                ...c,
                total_cost: (c.total_cost ?? 0) - (c.overhead_share ?? 0),
                net_profit: (c.net_profit ?? 0) + (c.overhead_share ?? 0),
              }
            : c
        )
        .sort((a, b) => metric(b) - metric(a))
    : sorted_top_level;

  const breadcrumbs = selected_entry
    ? [
        { key: "root", label: "All sources" },
        { key: selected_entry.key, label: selected_entry.label },
      ]
    : [{ key: "root", label: "All sources" }];

  const total = active_list.reduce((sum, e) => sum + metric(e), 0);
  const sum_abs_total = active_list.reduce((sum, e) => sum + Math.abs(metric(e)), 0);
  const being_carried_count = entries.filter((e) => e.verdict === "being_carried").length;
  const total_final_profit = entries.reduce((sum, e) => sum + e.net_profit, 0);

  return (
    <div className="ui-panel ui-stack-sm">
      <div className="cost-summary-breadcrumb">
        {breadcrumbs.map((crumb, index) => (
          <button
            key={crumb.key}
            type="button"
            className="cost-summary-breadcrumb-item"
            onClick={() => set_selected_key(index === 0 ? null : selected_key)}
          >
            {crumb.label}
          </button>
        ))}
      </div>
      <div className="ui-kicker">
        {selected_entry
          ? `${selected_entry.label} - breakdown by ${view_mode === "profit" ? "net profit" : "revenue"}`
          : `Ranked by ${view_mode === "profit" ? "net profit" : "revenue"}`}{" "}
        - View B (materials shares equally) - {capacity_mode === "real" ? "Real capacity" : "Assumed capacity"}
      </div>
      {!selected_entry && (
        <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", margin: "0 0 0.75rem", lineHeight: "1.5" }}>
          Materials is treated as a genuine peer here, not protected - it can fall short or help carry
          others exactly like any operating group. Your business made{" "}
          {formatCurrencyTruth(scale(total_final_profit))} in net profit once every source&apos;s target is
          reconciled against real revenue. {being_carried_count} of {entries.length} source
          {entries.length === 1 ? "" : "s"}{" "}
          {being_carried_count === 1 ? "isn't paying its way" : "aren't paying their way"} - the rest of the
          business is cross-subsidising {being_carried_count === 1 ? "it" : "them"}.
        </p>
      )}
      {!selected_entry && surplus > 0 && (
        <div className="business-outcome-unassigned-block">
          <div className="business-outcome-unassigned-title">Unattributed surplus</div>
          <div className="business-outcome-unassigned-line">
            <span>
              Real revenue exceeds every source&apos;s combined target (labour + assets + materials)
            </span>
            <span className="business-outcome-unassigned-line-amount" style={{ fontSize: "1.05rem", fontWeight: 600 }}>
              {formatCurrencyTruth(show_surplus_distributed ? 0 : scale(surplus))}
            </span>
          </div>
          <div className="business-outcome-unassigned-hint">
            This can only mean one of two things: operating groups ran more hours than the system
            currently assumes, or materials achieved a higher real markup than the{" "}
            {view_b.materials?.current_markup_percent ?? "?"}% stated here - most often because a
            job was quoted with more margin on materials/cost rates than what&apos;s recorded. Not
            distributed to any source until confirmed against real data.
          </div>
          <button
            type="button"
            className="ui-button-secondary"
            style={{ marginTop: "0.5rem" }}
            onClick={() => set_show_surplus_distributed(!show_surplus_distributed)}
          >
            {show_surplus_distributed ? "Hide hypothetical distribution" : "Show distributed anyway"}
          </button>
          {show_surplus_distributed && (
            <div className="business-outcome-unassigned-hint" style={{ marginTop: "0.5rem" }}>
              <strong>Hypothetical only</strong> - the figures below now include a proportional
              share of the surplus, credited to each source in proportion to its own profit share,
              the same rule the shortfall cascade uses in reverse. This is a guess about who earned
              it, not a fact - do not treat it as confirmed until checked against real hours or
              real materials cost data.
            </div>
          )}
        </div>
      )}
      {active_list.map((item) => {
        const value = metric(item);
        const share = sum_abs_total > 0 && Math.abs(total) / sum_abs_total > 0.001 ? ((value / total) * 100).toFixed(1) : "N/A";
        const has_children = !selected_entry && item.children && item.children.length > 0;
        return (
          <div
            key={item.key}
            className={`cost-summary-drill-row ${has_children ? "clickable" : "static"}`}
            {...(has_children ? { onClick: () => set_selected_key(item.key), role: "button", tabIndex: 0 } : {})}
          >
            <div className="ui-stack-sm">
              <div className="cost-summary-drill-label">{item.label}</div>
                <div className="ui-help">
                  {item.is_materials ? (
                    <>
                      Cost {formatCurrencyTruth(scale(item.total_cost))} &middot; Achieved markup{" "}
                      {item.minimum_recoverable_rate !== null && item.minimum_recoverable_rate !== undefined
                        ? formatPercentTruth(item.minimum_recoverable_rate)
                        : "N/A"}{" "}
                      &middot; Current markup{" "}
                      {item.current_rate !== null && item.current_rate !== undefined
                        ? formatPercentTruth(item.current_rate)
                        : "N/A"}
                    </>
                  ) : shortfall_mode === "hours" ? (
                    <>
                      Cost {formatCurrencyTruth(scale(item.total_cost))} &middot; Current rate{" "}
                      {item.current_rate !== null && item.current_rate !== undefined
                        ? `${formatCurrencyTruth(item.current_rate)}/hr`
                        : "N/A"}{" "}
                      &middot; Achieved hours{" "}
                      {item.achieved_hours !== null ? `${item.achieved_hours.toFixed(0)} hrs` : "N/A"}
                    </>
                  ) : (
                    <>
                      Cost {formatCurrencyTruth(scale(item.total_cost))} &middot; Current rate{" "}
                      {item.current_rate !== null && item.current_rate !== undefined
                        ? `${formatCurrencyTruth(item.current_rate)}/hr`
                        : "N/A"}{" "}
                      &middot; Achieved rate{" "}
                      {item.achieved_rate !== null ? `${formatCurrencyTruth(item.achieved_rate)}/hr` : "N/A"}
                    </>
                  )}
                </div>
              {item.available === false && <div className="ui-help">{item.unavailable_reason || "Not available"}</div>}
            </div>
            <div className="cost-summary-drill-value">
              <span className="business-outcome-drill-tags">
                <ModelledTag />
                {cost_mode === "contribution" && (<span className="business-outcome-overhead-excluded-tag">Excl. overhead</span>)}
                {view_mode === "profit" && <VerdictTag verdict={item.verdict} label={item.verdict_label} />}
              </span>
              <div style={{ fontSize: "1.2em" }}>
                {formatCurrencyTruth(scale(value))} <span className="ui-help">({share}%)</span>
              </div>
            </div>
          </div>
        );
      })}

      {cost_mode === "contribution" && (
        <div className="business-outcome-capacity-warning">
          <strong>
            This view excludes overhead. Do not use these figures to set prices or quotes
            &mdash; switch to Full cost for that. Total overhead not shown above:{" "}
            {formatCurrencyTruth(total_overhead_share)}.
          </strong>
        </div>
      )}
    </div>
  );
}

function formatCurrencyTruth(value) {
  if (value === null || value === undefined) return "N/A";
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  return `${sign}${new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    maximumFractionDigits: 0,
  }).format(abs)}`;
}

function formatPercentTruth(value) {
  if (value === null || value === undefined) return "N/A";
  return `${value.toFixed(1)}%`;
}

function TruthFieldRow({ label, field, format = formatCurrencyTruth }) {
  const is_deferred = field?.status === "deferred";
  return (
    <div className="business-outcome-truth-summary-row">
      <div className="business-outcome-truth-summary-row-label">{label}</div>
      <div>
        {is_deferred ? (
          <span className="business-outcome-truth-summary-row-value deferred" title={field.reason}>
            Not yet available
          </span>
        ) : (
          <span className="business-outcome-truth-summary-row-value">{format(field.value)}</span>
        )}
      </div>
    </div>
  );
}

// Level 2/3 "see this a different way" view - the original Truth Summary
// Card content, now nested inside this card rather than sitting as its
// own separate top-level card. Same numbers, same logic, just moved into
// the reveal-little-by-little hierarchy per the user's request.
function TraditionalViabilityView({ output_contract }) {
  if (!output_contract) return null;

  const {
    total_revenue,
    total_COG,
    gross_profit,
    gross_margin_percent,
    total_cost_burden,
    required_revenue,
    revenue_surplus_or_gap,
    required_recovery,
    achieved_recovery,
    recovery_surplus_or_gap,
    operating_profit_before_tax,
    net_operating_margin,
    productive_output,
    cost_absorption_status,
  } = output_contract;

  return (
    <div className="business-outcome-truth-summary">
      <div>
        <div className="business-outcome-truth-summary-section-title">Revenue &amp; Margin</div>
        <TruthFieldRow label="Total Revenue" field={total_revenue} />
        <TruthFieldRow label="Total COGS" field={total_COG} />
        <TruthFieldRow label="Gross Profit" field={gross_profit} />
        <TruthFieldRow
          label="Gross Margin %"
          field={
            gross_margin_percent?.status === "available"
              ? { ...gross_margin_percent, value: gross_margin_percent.value * 100 }
              : gross_margin_percent
          }
          format={formatPercentTruth}
        />
      </div>

      <div>
        <div className="business-outcome-truth-summary-section-title">Cost Burden &amp; Recovery</div>
        <TruthFieldRow label="Total Cost Burden" field={total_cost_burden} />
        <TruthFieldRow label="Required Revenue" field={required_revenue} />
        <TruthFieldRow label="Revenue Surplus / (Gap)" field={revenue_surplus_or_gap} />
        <TruthFieldRow label="Required Recovery" field={required_recovery} />
        <TruthFieldRow label="Achieved Recovery" field={achieved_recovery} />
        <TruthFieldRow label="Recovery Surplus / (Gap)" field={recovery_surplus_or_gap} />
      </div>

      <div>
        <div className="business-outcome-truth-summary-section-title">Bottom Line</div>
        <TruthFieldRow label="Operating Profit Before Tax" field={operating_profit_before_tax} />
        <TruthFieldRow label="Net Operating Margin %" field={net_operating_margin} format={formatPercentTruth} />
        <TruthFieldRow
          label="Productive Output (hours)"
          field={productive_output}
          format={(v) => v?.toLocaleString?.("en-NZ") ?? "N/A"}
        />
        <TruthFieldRow
          label="Cost Absorption Status"
          field={cost_absorption_status}
          format={(v) => (v ? v.replace(/_/g, " ") : "N/A")}
        />
      </div>
    </div>
  );
}

// LEDGER (this session): shows the Real Capacity two-phase cascade
// step by step, using today's real numbers - no baseline, no what-ifs.
// Starting point (naive, unscaled) -> cascade metrics -> final
// allocation, so a group hitting exactly $0 and the next group
// starting to absorb the remainder is visible, not just implied by
// the final headline figure.

// ASSUMED CAPACITY ledger (this session) - shows Assumed Capacity's own,
// genuinely simpler mechanism: one business-wide ceiling check, and if
// breached, ONE scale factor applied uniformly to every labour/asset
// source at once - no cascade, no per-group margin-weighting, no
// group hitting exactly $0 before the next one absorbs. Deliberately a
// different shape from the Real Capacity ledger below, not a re-skin
// of it, so it never implies a mechanism that isn't actually happening.
function AssumedCapacityLedger({
  revenue_ceiling,
  materials,
  assumed_ledger_groups,
  groups_naive,
  unassigned,
  time_scale,
  open_hours,
  open_days,
  open_weeks,
}) {
  if (!revenue_ceiling) {
    return <div className="ui-help">Assumed Capacity data is not available yet.</div>;
  }

  const scale = (v) => scaleAnnualValue(v, time_scale, null, open_hours, open_days, open_weeks);
  const suffix = time_scale !== "year" ? getTimeScaleSuffix(time_scale) : "";
  const money = (v) => `${format_currency(scale(v))}${suffix}`;

  const groups = groups_naive || [];
  const ledger_groups = assumed_ledger_groups || [];
  const scale_pct = ((revenue_ceiling.scale_factor ?? 1) * 100).toFixed(1);

  // Materials' un-floored ("naive") revenue is model-independent - the
  // same real leftover share regardless of which capacity model is
  // active - so it's safe to reuse the field Real Capacity's own
  // calculation already exposes, rather than duplicating it.
  const materials_naive_net_profit =
    (materials.real_capacity_naive_revenue ?? 0) - (materials.true_cost ?? 0);

  const total_modelled_revenue =
    groups.reduce((sum, g) => sum + (g.modelled_revenue ?? 0), 0) +
    (materials.real_capacity_naive_revenue ?? 0);
  const total_true_cost =
    groups.reduce((sum, g) => sum + (g.true_cost ?? 0), 0) + (materials.true_cost ?? 0);
  const total_naive_net_profit =
    groups.reduce((sum, g) => sum + (g.naive_net_profit ?? 0), 0) + materials_naive_net_profit;

  const unassigned_total = unassigned?.total ?? 0;

  const total_implied_net_profit =
    ledger_groups.reduce((sum, g) => sum + (g.implied_net_profit ?? 0), 0) + (materials.net_profit ?? 0);
  const true_total_implied_net_profit = total_implied_net_profit - unassigned_total;

  return (
    <div className="business-outcome-ledger">
      <div className="ui-help">
        Shows exactly how Assumed Capacity is calculated from today&apos;s real revenue - each
        source&apos;s starting position, then the single scale applied to every labour and asset
        source at once if the combined claim exceeds what was actually billed.
      </div>

      <div className="business-outcome-ledger-section-title">Starting point - before any scaling</div>
      <div className="business-outcome-ledger-table">
        <div className="business-outcome-ledger-row business-outcome-ledger-header">
          <span>Source</span>
          <span>Modelled Revenue</span>
          <span>True Cost</span>
          <span>Naive Net Profit</span>
        </div>
        {groups.map((g) => (
          <div className="business-outcome-ledger-row" key={g.group_id || g.group_name}>
            <span>{g.group_name}</span>
            <span>{money(g.modelled_revenue)}</span>
            <span>{money(g.true_cost)}</span>
            <span className={g.naive_net_profit >= 0 ? "value-good" : "value-bad"}>
              {money(g.naive_net_profit)}
            </span>
          </div>
        ))}
        <div className="business-outcome-ledger-row">
          <span>Materials / COGS</span>
          <span>{money(materials.real_capacity_naive_revenue)}</span>
          <span>{money(materials.true_cost)}</span>
          <span className={materials_naive_net_profit >= 0 ? "value-good" : "value-bad"}>
            {money(materials_naive_net_profit)}
          </span>
        </div>
        <div className="business-outcome-ledger-row business-outcome-ledger-total">
          <span>Total</span>
          <span>{money(total_modelled_revenue)}</span>
          <span>{money(total_true_cost)}</span>
          <span className={total_naive_net_profit >= 0 ? "value-good" : "value-bad"}>
            {money(total_naive_net_profit)}
          </span>
        </div>
      </div>

      <div className="business-outcome-ledger-section-title">The scale check</div>
      <div className="business-outcome-ledger-metrics">
        <div className="business-outcome-ledger-metric">
          <span className="business-outcome-ledger-metric-label">Combined labour+asset claim</span>
          <span className="business-outcome-ledger-metric-value">
            {money(revenue_ceiling.labour_asset_modelled_total)}
          </span>
        </div>
        <div className="business-outcome-ledger-metric">
          <span className="business-outcome-ledger-metric-label">Ceiling breached?</span>
          <span className="business-outcome-ledger-metric-value">
            {revenue_ceiling.is_breached ? "Yes" : "No"}
          </span>
        </div>
        {revenue_ceiling.is_breached && (
          <>
            <div className="business-outcome-ledger-metric">
              <span className="business-outcome-ledger-metric-label">Overage</span>
              <span className="business-outcome-ledger-metric-value">
                {money(revenue_ceiling.overage)}
              </span>
            </div>
            <div className="business-outcome-ledger-metric">
              <span className="business-outcome-ledger-metric-label">Scale factor applied to everyone</span>
              <span className="business-outcome-ledger-metric-value">{scale_pct}%</span>
            </div>
          </>
        )}
      </div>
      {!revenue_ceiling.is_breached && (
        <div className="ui-help">
          Combined labour and asset claims are within total revenue - nothing is scaled down,
          every source keeps its full modelled figure.
        </div>
      )}
      {revenue_ceiling.is_breached && (
        <div className="ui-help">
          Every labour and asset source is scaled down by the same {scale_pct}% at once - no
          group is protected or prioritised over another. Materials receives whatever revenue
          is left over, floored at $0 revenue if there is none.
        </div>
      )}

      <div className="business-outcome-ledger-section-title">Final allocation</div>
      <div className="business-outcome-ledger-table">
        <div className="business-outcome-ledger-row business-outcome-ledger-header">
          <span>Source</span>
          <span>Naive Net Profit</span>
          <span>Implied Net Profit</span>
          <span>Verdict</span>
        </div>
        {ledger_groups.map((g) => (
          <div className="business-outcome-ledger-row" key={g.group_id || g.group_name}>
            <span>{g.group_name}</span>
            <span>{money(g.naive_net_profit)}</span>
            <span className={g.implied_net_profit >= 0 ? "value-good" : "value-bad"}>
              {money(g.implied_net_profit)}
            </span>
            <span className={g.verdict === "being_carried" ? "value-bad" : "value-good"}>
              {g.verdict === "being_carried" ? "Being carried" : "Paying its way"}
            </span>
          </div>
        ))}
        <div className="business-outcome-ledger-row">
          <span>
            Materials / COGS
            {materials.is_floored && (
              <span className="business-outcome-ledger-zero-tag">floored at $0 revenue</span>
            )}
          </span>
          <span>{money(materials_naive_net_profit)}</span>
          <span className={materials.net_profit >= 0 ? "value-good" : "value-bad"}>
            {money(materials.net_profit)}
          </span>
          <span className={materials.verdict === "being_carried" ? "value-bad" : "value-good"}>
            {materials.verdict === "being_carried" ? "Being carried" : "Paying its way"}
          </span>
        </div>
        <div className="business-outcome-ledger-row business-outcome-ledger-total">
          <span>Total (6 sources)</span>
          <span className={total_naive_net_profit >= 0 ? "value-good" : "value-bad"}>
            {money(total_naive_net_profit)}
          </span>
          <span className={total_implied_net_profit >= 0 ? "value-good" : "value-bad"}>
            {money(total_implied_net_profit)}
          </span>
          <span>-</span>
        </div>
        {unassigned_total > 0 && (
          <div className="business-outcome-ledger-row">
            <span>Unassigned cost (not attributed to any source)</span>
            <span>-</span>
            <span className="value-bad">{money(-unassigned_total)}</span>
            <span>-</span>
          </div>
        )}
        <div className="business-outcome-ledger-row business-outcome-ledger-total business-outcome-ledger-true-total">
          <span>TRUE TOTAL (matches page headline)</span>
          <span>-</span>
          <span className={true_total_implied_net_profit >= 0 ? "value-good" : "value-bad"}>
            {money(true_total_implied_net_profit)}
          </span>
          <span>-</span>
        </div>
      </div>
    </div>
  );
}

function RealCapacityLedger({ real_capacity, materials, unassigned, time_scale, open_hours, open_days, open_weeks }) {
  if (!real_capacity) {
    return <div className="ui-help">Real Capacity data is not available yet.</div>;
  }

  const scale = (v) => scaleAnnualValue(v, time_scale, null, open_hours, open_days, open_weeks);
  const suffix = time_scale !== "year" ? getTimeScaleSuffix(time_scale) : "";
  const money = (v) => `${format_currency(scale(v))}${suffix}`;

  const groups = real_capacity.group_real_capacity || [];
  const phase1_pct = ((real_capacity.phase1_factor ?? 0) * 100).toFixed(1);
  const materials_naive_net_profit =
    (materials.real_capacity_naive_revenue ?? 0) - (materials.true_cost ?? 0);
  // Materials' "adjustment" is a GAIN (floored up from a naive loss to $0):
  // final minus naive, so it comes out POSITIVE - opposite sign to groups'
  // adjustments (final minus naive too, but a deduction, so negative -
  // shown with a "-" prefix). FIX: was previously naive minus final,
  // which flipped the sign and made the total double up instead of
  // cancel. When both are summed correctly, they net to exactly $0:
  // everything Materials gains, the groups collectively give up, dollar
  // for dollar.
  const materials_adjustment =
    (materials.real_capacity_net_profit ?? 0) - materials_naive_net_profit;

  const unassigned_total = unassigned?.total ?? 0;

  const total_modelled_revenue =
    groups.reduce((sum, g) => sum + (g.modelled_revenue ?? 0), 0) +
    (materials.real_capacity_naive_revenue ?? 0);
  const total_true_cost =
    groups.reduce((sum, g) => sum + (g.true_cost ?? 0), 0) + (materials.true_cost ?? 0);
  const total_naive_net_profit =
    groups.reduce((sum, g) => sum + (g.naive_net_profit ?? 0), 0) + materials_naive_net_profit;
  const total_adjustment =
    groups.reduce((sum, g) => sum + (g.total_adjustment ?? 0), 0) - materials_adjustment;
  const total_final_net_profit =
    groups.reduce((sum, g) => sum + (g.final_net_profit ?? 0), 0) +
    (materials.real_capacity_net_profit ?? 0);
  // TRUE total - includes unassigned cost (real cost with no source
  // attached), the same deduction the page headline already applies.
  // This should always equal the headline's total net profit exactly.
  const true_total_final_net_profit = total_final_net_profit - unassigned_total;

  return (
    <div className="business-outcome-ledger">
      <div className="ui-help">
        Shows exactly how Real Capacity is calculated from today&apos;s real revenue - each
        source&apos;s starting position, then the two-phase cascade that follows once
        Materials can&apos;t cover its own cost from what&apos;s left over.
      </div>

      <div className="business-outcome-ledger-section-title">Starting point - before any cascade</div>
      <div className="business-outcome-ledger-table">
        <div className="business-outcome-ledger-row business-outcome-ledger-header">
          <span>Source</span>
          <span>Modelled Revenue</span>
          <span>True Cost</span>
          <span>Naive Net Profit</span>
        </div>
        {groups.map((g) => (
          <div className="business-outcome-ledger-row" key={g.group_id || g.group_name}>
            <span>{g.group_name}</span>
            <span>{money(g.modelled_revenue)}</span>
            <span>{money(g.true_cost)}</span>
            <span className={g.naive_net_profit >= 0 ? "value-good" : "value-bad"}>
              {money(g.naive_net_profit)}
            </span>
          </div>
        ))}
        <div className="business-outcome-ledger-row">
          <span>Materials / COGS</span>
          <span>{money(materials.real_capacity_naive_revenue)}</span>
          <span>{money(materials.true_cost)}</span>
          <span className={materials_naive_net_profit >= 0 ? "value-good" : "value-bad"}>
            {money(materials_naive_net_profit)}
          </span>
        </div>
        <div className="business-outcome-ledger-row business-outcome-ledger-total">
          <span>Total</span>
          <span>{money(total_modelled_revenue)}</span>
          <span>{money(total_true_cost)}</span>
          <span className={total_naive_net_profit >= 0 ? "value-good" : "value-bad"}>
            {money(total_naive_net_profit)}
          </span>
        </div>
      </div>

      <div className="business-outcome-ledger-section-title">The cascade</div>
      <div className="business-outcome-ledger-metrics">
        <div className="business-outcome-ledger-metric">
          <span className="business-outcome-ledger-metric-label">Materials shortfall</span>
          <span className="business-outcome-ledger-metric-value">
            {money(real_capacity.shortfall)}
          </span>
        </div>
        <div className="business-outcome-ledger-metric">
          <span className="business-outcome-ledger-metric-label">Margin available to absorb it</span>
          <span className="business-outcome-ledger-metric-value">{money(real_capacity.v0)}</span>
        </div>
        <div className="business-outcome-ledger-metric">
          <span className="business-outcome-ledger-metric-label">Absorbed in Phase 1</span>
          <span className="business-outcome-ledger-metric-value">
            {money(real_capacity.phase1_absorbed)} ({phase1_pct}%)
          </span>
        </div>
        <div className="business-outcome-ledger-metric">
          <span className="business-outcome-ledger-metric-label">Left for Phase 2 (fallback)</span>
          <span className="business-outcome-ledger-metric-value">
            {money(real_capacity.leftover)}
          </span>
        </div>
      </div>
      {real_capacity.leftover > 0 && (
        <div className="ui-help">
          Every group with spare margin has now been reduced to $0 - the amount above still
          needed gets spread across all groups by revenue share instead.
        </div>
      )}

      <div className="business-outcome-ledger-section-title">Final allocation</div>
      <div className="business-outcome-ledger-table">
        <div className="business-outcome-ledger-row business-outcome-ledger-header">
          <span>Source</span>
          <span>Naive Net Profit</span>
          <span>Adjustment</span>
          <span>Final Net Profit</span>
        </div>
        {groups.map((g) => {
          const hit_zero =
            g.naive_net_profit > 0 && Math.abs(g.final_net_profit) < 1 && real_capacity.leftover <= 0;
          return (
            <div className="business-outcome-ledger-row" key={g.group_id || g.group_name}>
              <span>
                {g.group_name}
                {hit_zero && <span className="business-outcome-ledger-zero-tag">reached $0</span>}
              </span>
              <span>{money(g.naive_net_profit)}</span>
              <span className={g.total_adjustment > 0 ? "value-bad" : ""}>
                {g.total_adjustment > 0 ? "-" : ""}
                {money(g.total_adjustment)}
              </span>
              <span className={g.final_net_profit >= 0 ? "value-good" : "value-bad"}>
                {money(g.final_net_profit)}
              </span>
            </div>
          );
        })}
        <div className="business-outcome-ledger-row">
          <span>
            Materials / COGS
            {materials.real_capacity_net_profit === 0 && (
              <span className="business-outcome-ledger-zero-tag">floored at $0</span>
            )}
          </span>
          <span>{money(materials_naive_net_profit)}</span>
          <span className={materials_adjustment > 0 ? "value-good" : ""}>
            {materials_adjustment > 0 ? "+" : ""}
            {money(materials_adjustment)}
          </span>
          <span className={materials.real_capacity_verdict === "being_carried" ? "value-bad" : "value-good"}>
            {money(materials.real_capacity_net_profit)}
          </span>
        </div>
        <div className="business-outcome-ledger-row business-outcome-ledger-total">
          <span>Total (6 sources)</span>
          <span className={total_naive_net_profit >= 0 ? "value-good" : "value-bad"}>
            {money(total_naive_net_profit)}
          </span>
          <span>{money(total_adjustment)}</span>
          <span className={total_final_net_profit >= 0 ? "value-good" : "value-bad"}>
            {money(total_final_net_profit)}
          </span>
        </div>
        {unassigned_total > 0 && (
          <div className="business-outcome-ledger-row">
            <span>Unassigned cost (not attributed to any source)</span>
            <span>-</span>
            <span>-</span>
            <span className="value-bad">{money(-unassigned_total)}</span>
          </div>
        )}
        <div className="business-outcome-ledger-row business-outcome-ledger-total business-outcome-ledger-true-total">
          <span>TRUE TOTAL (matches page headline)</span>
          <span>-</span>
          <span>-</span>
          <span className={true_total_final_net_profit >= 0 ? "value-good" : "value-bad"}>
            {money(true_total_final_net_profit)}
          </span>
        </div>
      </div>
    </div>
  );
}

// View B equivalent of RealCapacityLedger above. Genuinely simpler than
// View A's version - no special floor tag, no sign-flipped materials
// adjustment - because View B's cascade treats all six peers (five
// operating groups + materials) through the exact same two-phase math
// uniformly, with no special-casing at all. Built from
// merge_view_b_groups(view_b, "real") rather than duplicating any
// calculation logic - naive_net_profit and total_adjustment are
// derived client-side from fields that function already returns
// (modelled_revenue - total_cost, and naive - final, respectively).
function ViewBRealCapacityLedger({ view_b, unassigned, time_scale, open_hours, open_days, open_weeks }) {
  if (!view_b || !view_b.real_capacity) {
    return <div className="ui-help">Real Capacity data is not available yet.</div>;
  }

  const scale = (v) => scaleAnnualValue(v, time_scale, null, open_hours, open_days, open_weeks);
  const suffix = time_scale !== "year" ? getTimeScaleSuffix(time_scale) : "";
  const money = (v) => `${format_currency(scale(v))}${suffix}`;

  const rows = merge_view_b_groups(view_b, "real").map((e) => {
    const naive_net_profit = e.modelled_revenue - e.total_cost;
    const total_adjustment = naive_net_profit - e.net_profit;
    return { ...e, naive_net_profit, total_adjustment };
  });

  const phase1_pct = ((view_b.real_capacity.phase1_factor ?? 0) * 100).toFixed(1);
  const unassigned_total = unassigned?.total ?? 0;

  const total_modelled_revenue = rows.reduce((sum, r) => sum + r.modelled_revenue, 0);
  const total_true_cost = rows.reduce((sum, r) => sum + r.total_cost, 0);
  const total_naive_net_profit = rows.reduce((sum, r) => sum + r.naive_net_profit, 0);
  const total_adjustment = rows.reduce((sum, r) => sum + r.total_adjustment, 0);
  const total_final_net_profit = rows.reduce((sum, r) => sum + r.net_profit, 0);
  const true_total_final_net_profit = total_final_net_profit - unassigned_total;

  return (
    <div className="business-outcome-ledger">
      <div className="ui-help">
        Shows exactly how Real Capacity is calculated for View B - materials is a genuine sixth
        peer here, going through the exact same two-phase cascade as every operating group, with
        no special floor or protection. Shortfall is global (every source&apos;s combined target
        vs real revenue), shared proportional to who can actually afford to give something up.
      </div>

      <div className="business-outcome-ledger-section-title">Starting point - before any cascade</div>
      <div className="business-outcome-ledger-table">
        <div className="business-outcome-ledger-row business-outcome-ledger-header">
          <span>Source</span>
          <span>Modelled Revenue</span>
          <span>True Cost</span>
          <span>Naive Net Profit</span>
        </div>
        {rows.map((r) => (
          <div className="business-outcome-ledger-row" key={r.key}>
            <span>{r.label}</span>
            <span>{money(r.modelled_revenue)}</span>
            <span>{money(r.total_cost)}</span>
            <span className={r.naive_net_profit >= 0 ? "value-good" : "value-bad"}>
              {money(r.naive_net_profit)}
            </span>
          </div>
        ))}
        <div className="business-outcome-ledger-row business-outcome-ledger-total">
          <span>Total</span>
          <span>{money(total_modelled_revenue)}</span>
          <span>{money(total_true_cost)}</span>
          <span className={total_naive_net_profit >= 0 ? "value-good" : "value-bad"}>
            {money(total_naive_net_profit)}
          </span>
        </div>
      </div>

      <div className="business-outcome-ledger-section-title">The cascade</div>
      <div className="business-outcome-ledger-metrics">
        <div className="business-outcome-ledger-metric">
          <span className="business-outcome-ledger-metric-label">
            Global shortfall (all 6 sources vs real revenue)
          </span>
          <span className="business-outcome-ledger-metric-value">
            {money(view_b.real_capacity.shortfall)}
          </span>
        </div>
        <div className="business-outcome-ledger-metric">
          <span className="business-outcome-ledger-metric-label">Margin available to absorb it</span>
          <span className="business-outcome-ledger-metric-value">{money(view_b.real_capacity.v0)}</span>
        </div>
        <div className="business-outcome-ledger-metric">
          <span className="business-outcome-ledger-metric-label">Absorbed in Phase 1</span>
          <span className="business-outcome-ledger-metric-value">
            {money(view_b.real_capacity.phase1_absorbed)} ({phase1_pct}%)
          </span>
        </div>
        <div className="business-outcome-ledger-metric">
          <span className="business-outcome-ledger-metric-label">Left for Phase 2 (fallback)</span>
          <span className="business-outcome-ledger-metric-value">{money(view_b.real_capacity.leftover)}</span>
        </div>
      </div>
      {view_b.real_capacity.leftover > 0 && (
        <div className="ui-help">
          Every source with spare margin has now been reduced to $0 - the amount above still
          needed gets spread across all six sources by revenue share instead.
        </div>
      )}
      {(view_b.real_capacity.surplus ?? 0) > 0 && (
        <div className="ui-help">
          Real revenue exceeds every source&apos;s combined target by{" "}
          {money(view_b.real_capacity.surplus)} - see the Unattributed surplus note above for
          what this could mean.
        </div>
      )}

      <div className="business-outcome-ledger-section-title">Final allocation</div>
      <div className="business-outcome-ledger-table">
        <div className="business-outcome-ledger-row business-outcome-ledger-header">
          <span>Source</span>
          <span>Naive Net Profit</span>
          <span>Adjustment</span>
          <span>Final Net Profit</span>
        </div>
        {rows.map((r) => (
          <div className="business-outcome-ledger-row" key={r.key}>
            <span>{r.label}</span>
            <span>{money(r.naive_net_profit)}</span>
            <span className={r.total_adjustment > 0 ? "value-bad" : ""}>
              {r.total_adjustment > 0 ? "-" : ""}
              {money(r.total_adjustment)}
            </span>
            <span className={r.net_profit >= 0 ? "value-good" : "value-bad"}>
              {money(r.net_profit)}
            </span>
          </div>
        ))}
        <div className="business-outcome-ledger-row business-outcome-ledger-total">
          <span>Total (6 sources)</span>
          <span className={total_naive_net_profit >= 0 ? "value-good" : "value-bad"}>
            {money(total_naive_net_profit)}
          </span>
          <span>{money(total_adjustment)}</span>
          <span className={total_final_net_profit >= 0 ? "value-good" : "value-bad"}>
            {money(total_final_net_profit)}
          </span>
        </div>
        {unassigned_total > 0 && (
          <div className="business-outcome-ledger-row">
            <span>Unassigned cost (not attributed to any source)</span>
            <span>-</span>
            <span>-</span>
            <span className="value-bad">{money(-unassigned_total)}</span>
          </div>
        )}
        <div className="business-outcome-ledger-row business-outcome-ledger-total business-outcome-ledger-true-total">
          <span>TRUE TOTAL (matches page headline)</span>
          <span>-</span>
          <span>-</span>
          <span className={true_total_final_net_profit >= 0 ? "value-good" : "value-bad"}>
            {money(true_total_final_net_profit)}
          </span>
        </div>
      </div>
    </div>
  );
}

// NEW (2026-09-18) - View B equivalent of AssumedCapacityLedger above,
// the panel that previously said "hasn't been built yet". Genuinely
// simpler than View A's version - materials is a real peer here (same
// as ViewBRealCapacityLedger already treats it), so no separate
// materials handling is needed, just one merge_view_b_groups(view_b,
// "assumed") call for everything. That function was itself fixed
// 2026-09-18 to correctly reflect non-productive cost in both cost and
// net profit for this mode - this panel is purely additive display on
// top of already-correct, already-tested data, no new calculation.
function ViewBAssumedCapacityLedger({ view_b, unassigned, time_scale, open_hours, open_days, open_weeks }) {
  if (!view_b || !view_b.revenue_ceiling) {
    return <div className="ui-help">Assumed Capacity data is not available yet.</div>;
  }

  const scale = (v) => scaleAnnualValue(v, time_scale, null, open_hours, open_days, open_weeks);
  const suffix = time_scale !== "year" ? getTimeScaleSuffix(time_scale) : "";
  const money = (v) => `${format_currency(scale(v))}${suffix}`;

  const rows = merge_view_b_groups(view_b, "assumed").map((e) => {
    const naive_net_profit = e.modelled_revenue - e.total_cost;
    return { ...e, naive_net_profit };
  });

  const scale_pct = ((view_b.revenue_ceiling.scale_factor ?? 1) * 100).toFixed(1);
  const unassigned_total = unassigned?.total ?? 0;

  const total_modelled_revenue = rows.reduce((sum, r) => sum + r.modelled_revenue, 0);
  const total_true_cost = rows.reduce((sum, r) => sum + r.total_cost, 0);
  const total_naive_net_profit = rows.reduce((sum, r) => sum + r.naive_net_profit, 0);
  const total_implied_net_profit = rows.reduce((sum, r) => sum + r.net_profit, 0);
  const true_total_implied_net_profit = total_implied_net_profit - unassigned_total;

  return (
    <div className="business-outcome-ledger">
      <div className="ui-help">
        Shows exactly how Assumed Capacity is calculated for View B - materials is a genuine
        sixth peer here too, same as its Real Capacity ledger, going through the same single
        scale applied to every source at once if the combined claim exceeds what was actually
        billed.
      </div>

      <div className="business-outcome-ledger-section-title">Starting point - before any scaling</div>
      <div className="business-outcome-ledger-table">
        <div className="business-outcome-ledger-row business-outcome-ledger-header">
          <span>Source</span>
          <span>Modelled Revenue</span>
          <span>True Cost</span>
          <span>Naive Net Profit</span>
        </div>
        {rows.map((r) => (
          <div className="business-outcome-ledger-row" key={r.key}>
            <span>{r.label}</span>
            <span>{money(r.modelled_revenue)}</span>
            <span>{money(r.total_cost)}</span>
            <span className={r.naive_net_profit >= 0 ? "value-good" : "value-bad"}>
              {money(r.naive_net_profit)}
            </span>
          </div>
        ))}
        <div className="business-outcome-ledger-row business-outcome-ledger-total">
          <span>Total</span>
          <span>{money(total_modelled_revenue)}</span>
          <span>{money(total_true_cost)}</span>
          <span className={total_naive_net_profit >= 0 ? "value-good" : "value-bad"}>
            {money(total_naive_net_profit)}
          </span>
        </div>
      </div>

      <div className="business-outcome-ledger-section-title">The scale check</div>
      <div className="business-outcome-ledger-metrics">
        <div className="business-outcome-ledger-metric">
          <span className="business-outcome-ledger-metric-label">Combined claim (all 6 sources)</span>
          <span className="business-outcome-ledger-metric-value">
            {money(view_b.revenue_ceiling.all_peers_modelled_total)}
          </span>
        </div>
        <div className="business-outcome-ledger-metric">
          <span className="business-outcome-ledger-metric-label">Ceiling breached?</span>
          <span className="business-outcome-ledger-metric-value">
            {view_b.revenue_ceiling.is_breached ? `Yes (${scale_pct}%)` : "No"}
          </span>
        </div>
      </div>
      {view_b.revenue_ceiling.is_breached ? (
        <div className="ui-help">
          Combined claim across all six sources exceeds real revenue - every source is scaled
          down by the same {scale_pct}% so the total exactly matches what was actually billed.
        </div>
      ) : (
        <div className="ui-help">
          Combined claim is within total revenue - nothing is scaled down, every source keeps
          its full modelled figure.
        </div>
      )}

      <div className="business-outcome-ledger-section-title">Final allocation</div>
      <div className="business-outcome-ledger-table">
        <div className="business-outcome-ledger-row business-outcome-ledger-header">
          <span>Source</span>
          <span>Naive Net Profit</span>
          <span>Implied Net Profit</span>
          <span>Verdict</span>
        </div>
        {rows.map((r) => (
          <div className="business-outcome-ledger-row" key={r.key}>
            <span>{r.label}</span>
            <span>{money(r.naive_net_profit)}</span>
            <span className={r.net_profit >= 0 ? "value-good" : "value-bad"}>
              {money(r.net_profit)}
            </span>
            <span>{r.verdict_label}</span>
          </div>
        ))}
        <div className="business-outcome-ledger-row business-outcome-ledger-total">
          <span>Total (6 sources)</span>
          <span className={total_naive_net_profit >= 0 ? "value-good" : "value-bad"}>
            {money(total_naive_net_profit)}
          </span>
          <span>{money(total_implied_net_profit)}</span>
          <span>-</span>
        </div>
        {unassigned_total > 0 && (
          <div className="business-outcome-ledger-row">
            <span>Unassigned cost (not attributed to any source)</span>
            <span>-</span>
            <span className="value-bad">{money(-unassigned_total)}</span>
            <span>-</span>
          </div>
        )}
        <div className="business-outcome-ledger-row business-outcome-ledger-total business-outcome-ledger-true-total">
          <span>TRUE TOTAL (matches page headline)</span>
          <span>-</span>
          <span className={true_total_implied_net_profit >= 0 ? "value-good" : "value-bad"}>
            {money(true_total_implied_net_profit)}
          </span>
          <span>-</span>
        </div>
      </div>
    </div>
  );
}

export default function BusinessOutcomePerSourceRevenueCard({ per_source, output_contract, labour_recovery, smoothing_mode = "smoothed", set_smoothing_mode, view_mode_ab, set_view_mode_ab, balance_sheet_current_year_earnings = null, fixed_assets_reconciliation = null, balance_sheet_working_capital = null }) {
  // NEW (this session, per user request): the P&L's own genuine
  // Net Profit and Trading Income, straight from useProfitAndLoss -
  // a completely separate hook/calculation from everything else on
  // this page. Used purely as a cross-check in the blurb (comparing
  // our own cascade-derived net profit % against the P&L's own %) -
  // deliberately NOT reconciled or forced to match; a difference
  // here is a genuine, useful signal (already caught in more detail
  // by Module Reconciliation) that modelled/test data has diverged
  // from the actual P&L, not a bug to hide.
  const { output_contract: pnl_output_contract } = useProfitAndLoss();
  const pnl_net_profit_actual = pnl_output_contract?.net_profit;
  const pnl_trading_income_actual = pnl_output_contract?.total_trading_income;
  const [view_mode, set_view_mode] = useState("profit"); // Default changed (this session, per user request): profit is more directly actionable for a casual owner than revenue - "who is actually making money" vs "who brings in the most money". Also surfaces the Being Carried / Paying its way verdict tags by default, since those only render in profit mode.
  const [time_scale, set_time_scale] = useState("year");
  // Defaults to "real" (Real Capacity) per product decision this session -
  // leads with the honest, cross-subsidy-aware number rather than the
  // familiar assumed-hours figure. "assumed" keeps today's existing
  // behaviour, completely untouched, one click away.
  const [capacity_mode, set_capacity_mode] = useState("real");
  const [cost_mode, set_cost_mode] = useState("absorbed");
  // Card 2's own local View A/View B toggle (this session, per user
  // request): Card 1's toggle at the top of the page is the master
  // default - scrolling back up while working in Card 2 is a hassle,
  // so Card 2 gets its own copy that starts synced to whatever Card 1
  // currently shows. Clicking Card 2's own toggle overrides locally
  // and sticks - until Card 1's toggle is changed again, at which
  // point this effect re-syncs Card 2 back to match. Card 1 itself is
  // untouched by anything in Card 2 - the sync only runs one way.
  const [card2_view_mode_ab, set_card2_view_mode_ab] = useState(view_mode_ab);
  useEffect(() => {
    set_card2_view_mode_ab(view_mode_ab);
  }, [view_mode_ab]);
  // Shared drill-down selection (this session, per user request): a
  // single selected_key, lifted here and passed into BOTH
  // RankedGroupsDrill and ViewBGroupsDrill, so switching View A/View B
  // (either the master toggle or Card 2's own override) preserves
  // which group is currently drilled into, instead of resetting - each
  // component previously held its own separate local state, so
  // switching unmounted one and mounted the other, losing the
  // selection. Safe to share: both views key their groups by the same
  // real Cost Allocation group_id (and both key materials as the
  // literal string "materials"), confirmed before this change.
  const [card2_selected_key, set_card2_selected_key] = useState(null);
  const [view_b_shortfall_mode, set_view_b_shortfall_mode] = useState("rate");
  // Source list in the headline card (this session) - always starts
  // collapsed, confirmed with user, regardless of whether anything is
  // failing. The headline sentence and its stark/normal tone already
  // carry the "is anything wrong" signal; the list itself is one click
  // away, consistent with the page's headline -> click -> detail pattern.
  const [sources_open, set_sources_open] = useState(false);

  // Card 1 -> Card 2 click-through (this session): Card 2 starts
  // collapsed ("hide the monster") - clicking a source in Card 1 opens
  // it already showing that source's own breakdown, instead of the
  // page showing everything at once by default.
  const [detail_open, set_detail_open] = useState(false);
  const [requested_selection, set_requested_selection] = useState(null);
  const detail_section_ref = useRef(null);
  // Outer "See the full breakdown behind the numbers" wrapper (this
  // session) - Card 2 now lives nested inside it, so opening a source
  // from Card 1 must open BOTH: the outer wrapper (or Card 2 stays
  // hidden behind it) and Card 2's own toggle.
  const [breakdown_open, set_breakdown_open] = useState(false);

  function open_source_detail(key) {
    set_breakdown_open(true);
    set_requested_selection(key);
    set_card2_selected_key(key);
    set_detail_open(true);
  }

  useEffect(() => {
    if (detail_open && detail_section_ref.current) {
      // Auto-scroll removed (this session) - clicking a source in Card 1 was forcing an unwanted jump.
    }
  }, [detail_open, requested_selection]);

  // Status strip click-through (this session, restored after merging
  // sources_open/breakdown_open into one action) - the outer wrapper no
  // longer has its own toggle button to click via DOM query, so the
  // status strip now dispatches a custom event instead, and this effect
  // opens both states together, matching the merged "Show breakdown"
  // button behaviour exactly.
  useEffect(() => {
    function handle_open_breakdown() {
      set_sources_open(true);
      set_breakdown_open(true);
    }
    window.addEventListener("business-outcome-open-breakdown", handle_open_breakdown);
    return () => window.removeEventListener("business-outcome-open-breakdown", handle_open_breakdown);
  }, []);

  if (!per_source || !per_source.available) {
    return (
      <div className="business-outcome-waterfall">
        <div className="business-outcome-utilisation-note">
          Per-source revenue attribution is not available yet - labour and asset sources need to be
          set up in Cost Allocation and Rate Builder first.
        </div>
      </div>
    );
  }

  function build_naive_headline() {
    const groups = per_source.real_capacity?.group_real_capacity || [];
    const materials = per_source.materials;

    // FIX (2026-09-17): materials?.real_capacity_naive_revenue is the
    // View A RESIDUAL (total_revenue - labour_modelled - asset_modelled)
    // - not independent Materials revenue at all. It swings with every
    // OTHER source's assumed billing, and since this view already
    // credits labour/assets with more revenue than the business
    // actually took in (that's the whole point of this view), Materials
    // was absorbing the entire negative gap as a fake, un-earned loss -
    // same broken mechanism already identified and fixed for Business
    // Modelling's independent lever engine earlier this session
    // (build_materials_input, businessModellingLeverSelectors.js).
    // Same fix, same source of truth: per_source.view_b's own materials
    // figure, built from Rate Builder's real markup against real COGS
    // (businessOutcomeViewBCalculations.js build_materials_source) -
    // genuinely independent of every other source's revenue. Falls
    // back to the old residual only if View B is genuinely unavailable.
    const view_b_materials_revenue = per_source.view_b?.materials?.modelled_revenue;
    const has_view_b_materials_revenue =
      view_b_materials_revenue !== null && view_b_materials_revenue !== undefined;
    const materials_independent_revenue = has_view_b_materials_revenue
      ? view_b_materials_revenue
      : (materials?.real_capacity_naive_revenue ?? 0);

    const materials_naive_net_profit = materials_independent_revenue - (materials?.true_cost ?? 0);

    const materials_entry = {
      key: "materials",
      name: "Materials / COGS",
      net_profit: materials_naive_net_profit,
      modelled_revenue: materials_independent_revenue,
      verdict: materials_naive_net_profit >= 0 ? "paying_its_way" : "being_carried",
      type: "materials",
    };

    const group_entries = groups.map((g) => ({
      key: g.group_id,
      name: g.group_name,
      net_profit: g.naive_net_profit,
      modelled_revenue: g.modelled_revenue,
      verdict: g.naive_net_profit >= 0 ? "paying_its_way" : "being_carried",
      type: "group",
    }));

    // Added 2026-09-17, second pass - pure-support working units (e.g.
    // Accountant) never appear in groups above at all (they contribute
    // no rows to build_labour_sources/build_asset_sources, so
    // group_rows_by_group_id never creates an entry for them). "Each
    // Part On Its Own" is exactly where this belongs - their raw,
    // undistributed cost against $0 revenue, since they structurally
    // can never earn anything on their own.
    const pure_support_entries = (per_source.pure_support_groups || []).map((g) => ({
      key: g.group_id,
      name: g.group_name,
      net_profit: -g.own_non_productive_cost,
      modelled_revenue: 0,
      verdict: "being_carried",
      type: "group",
    }));

    const all_sources = [materials_entry, ...group_entries, ...pure_support_entries];
    const total_net_profit = all_sources.reduce((sum, s) => sum + s.net_profit, 0) - (per_source.unassigned?.total ?? 0);
    const being_carried = all_sources.filter((s) => s.verdict === "being_carried");

    return {
      total_net_profit,
      total_modelled_revenue: all_sources.reduce((sum, s) => sum + s.modelled_revenue, 0),
      total_group_count: all_sources.length,
      being_carried_count: being_carried.length,
      being_carried,
      all_sources,
      all_good: being_carried.length === 0,
      labour_capacity_warning: per_source.headline_real_capacity?.labour_capacity_warning ?? false,
      asset_capacity_warning: per_source.headline_real_capacity?.asset_capacity_warning ?? false,
      labour_coverage_gaps: per_source.headline_real_capacity?.labour_coverage_gaps || [],
    };
  }

  // View B equivalent of build_naive_headline() above - genuinely
  // simpler, since View B already treats materials as a first-class
  // member of group_real_capacity, not something bolted on afterward.
  // mode: "naive" (raw, no cross-subsidy at all) | "real" (cascade-
  // adjusted, proportional by margin) | "assumed" (flat ceiling,
  // same % cut for everyone). Subtracts unassigned cost from the total,
  // same as build_naive_headline() does, so Card 1's headline always
  // reflects the true P&L bottom line regardless of which view or mode
  // is active - the per-source cascade total intentionally does not
  // include unassigned cost (known, flagged gap), but the business-wide
  // headline figure should.
  function build_view_b_headline(mode) {
    if (!per_source.view_b) return null;
    const merge_mode = mode === "assumed" ? "assumed" : "real";
    const merged = merge_view_b_groups(per_source.view_b, merge_mode);
    const all_sources = merged.map((e) => {
      const net_profit = mode === "naive" ? e.modelled_revenue - e.total_cost : e.net_profit;
      return {
        key: e.key,
        name: e.label,
        net_profit,
        modelled_revenue: e.modelled_revenue,
        verdict: net_profit >= 0 ? "paying_its_way" : "being_carried",
        type: e.is_materials ? "materials" : "group",
      };
    });
    // FIX (2026-09-17, third pass): non_revenue_bearing_total was
    // never subtracted here, even though the catch-all display row
    // (apply_non_revenue_bearing_entry) still shows for View B - the
    // total and the visible row list disagreed as a result. Matching
    // the same pattern unassigned_total already uses on the line
    // below, which the catch-all row for THAT has always correctly
    // matched. Does not fix View B's own per-group split (still the
    // known, deliberate gap - View B's own cascade, apply_real_capacity_v2,
    // has no non-productive cost awareness at all) - only restores
    // agreement between the total and what's visibly shown.
    // FIX (2026-09-18): View B's own cascade (apply_real_capacity_v2)
    // now correctly bakes non-productive cost into each row's own
    // real_capacity_net_profit, the same way View A's does - subtracting
    // non_revenue_bearing_total again here double-counts it (confirmed
    // live: Foreman and Site Crew matched exactly between View A and
    // View B once the cascade fix landed, but the two TOTALS were off
    // by almost exactly the non-productive cost amount - this line was
    // why). unassigned_total is untouched - that's still a genuinely
    // separate, unhandled thing.
    // BO-11 / F8 (a): add real revenue that rates + markup do not explain (View B surplus).
    const unexplained_revenue = Math.max(0, Number(per_source.view_b?.real_capacity?.surplus) || 0);
    const total_net_profit =
      all_sources.reduce((sum, s) => sum + s.net_profit, 0) -
      (per_source.unassigned?.total ?? 0) +
      unexplained_revenue;
    const being_carried = all_sources.filter((s) => s.verdict === "being_carried");
    return {
      total_net_profit,
      total_modelled_revenue: all_sources.reduce((sum, s) => sum + s.modelled_revenue, 0),
      unexplained_revenue,
      total_group_count: all_sources.length,
      being_carried_count: being_carried.length,
      being_carried,
      all_sources,
      all_good: being_carried.length === 0,
      labour_capacity_warning: per_source.headline_real_capacity?.labour_capacity_warning ?? false,
      asset_capacity_warning: per_source.headline_real_capacity?.asset_capacity_warning ?? false,
      labour_coverage_gaps: per_source.headline_real_capacity?.labour_coverage_gaps || [],
    };
  }

  const raw_active_headline =
    view_mode_ab === "b"
      ? build_view_b_headline(capacity_mode === "assumed" ? "assumed" : "real")
      : capacity_mode === "real"
        ? smoothing_mode === "naive"
          ? build_naive_headline()
          : per_source.headline_real_capacity
        : per_source.headline;

  // Stable headline for the "Your business, right now" blurb only -
  // always View A's basis (real P&L revenue), regardless of the
  // View A/B toggle. The toggle should only affect the page's own
  // View A/B sections, never silently change the blurb's headline
  // numbers underneath the reader (2026-09-10 decision).
  const raw_stable_headline =
    capacity_mode === "real"
      ? smoothing_mode === "naive"
        ? build_naive_headline()
        : per_source.headline_real_capacity
      : per_source.headline;

  // Unassigned cost as a genuine "blocking flag" row (this session,
  // per user request): real cost, real money, not attributed to any
  // source above - previously invisible in this list even though the
  // headline total already correctly subtracts it. Shown here as a
  // 7th entry, always verdict "being_carried" (it can never be
  // positive - it is pure cost with no revenue attached), counted in
  // the being_carried total so "X of Y sources aren't paying their
  // way" honestly reflects it as a real, current problem, not just
  // informational. Applied here (after active_headline is otherwise
  // finalized) so every mode - naive, real, assumed, View A, View B -
  // gets this consistently without duplicating the logic per branch.
  // The math checks out: total_net_profit already equals
  // sum(6 sources) - unassigned_total, so adding a 7th row valued at
  // -unassigned_total makes the full 7-row list sum to exactly
  // total_net_profit - the list is now genuinely transparent, not
  // just the headline total.
  const unassigned_total = per_source.unassigned?.total ?? 0;
  // FIX (2026-09-17): real cost that IS assigned to a working unit but
  // isn't tied to any revenue-bearing source (non-productive labour/
  // assets) - genuinely different from unassigned_total above (which
  // means "not yet assigned, go fix this in Cost Allocation"). Shown
  // as its own row so the breakdown list keeps summing to the real
  // headline total, without implying there's still something to fix.
  const non_revenue_bearing_total = per_source.non_revenue_bearing?.total ?? 0;

  // Shared helper (2026-09-10): injects the unassigned-cost row into
  // any raw headline object. Extracted so both the toggle-following
  // active_headline (used elsewhere on the page) and the toggle-
  // stable stable_headline (used only by the blurb) get identical
  // treatment without duplicating this logic.
  function apply_unassigned_entry(raw_headline) {
    if (!(unassigned_total > 0 && raw_headline)) return raw_headline;
    const unassigned_entry = {
      key: "unassigned",
      name: "Unassigned cost (not attributed to any source)",
      net_profit: -unassigned_total,
      modelled_revenue: 0,
      verdict: "being_carried",
      type: "unassigned",
    };
    return {
      ...raw_headline,
      all_sources: [...(raw_headline.all_sources || []), unassigned_entry],
      total_group_count: (raw_headline.total_group_count ?? 0) + 1,
      being_carried_count: (raw_headline.being_carried_count ?? 0) + 1,
      being_carried: [...(raw_headline.being_carried || []), unassigned_entry],
      all_good: false,
    };
  }

  // FIX (2026-09-17): same injection pattern as apply_unassigned_entry
  // above, for real assigned-but-not-revenue-bearing cost. Kept as a
  // separate function and a separate row rather than merged into the
  // unassigned entry, since the two mean genuinely different things.
  // FIX (2026-09-17): this standalone catch-all row is now only
  // correct for the paths NOT covered by today's real-capacity cascade
  // fix - the naive/assumed headline, and View B's own separate
  // cascade (not touched today). For View A's real-capacity cascade
  // specifically, non-productive cost is now correctly baked into each
  // working unit's own row (useBusinessOutcomePerSourceRevenue.js), so
  // adding this catch-all row on top would double-count it.
  function apply_non_revenue_bearing_entry(raw_headline, already_included_in_rows) {
    if (already_included_in_rows) return raw_headline;
    if (!(non_revenue_bearing_total > 0 && raw_headline)) return raw_headline;
    const non_revenue_bearing_entry = {
      key: "non_revenue_bearing",
      name: "Non-productive cost (assigned, not tied to any revenue-bearing source)",
      net_profit: -non_revenue_bearing_total,
      modelled_revenue: 0,
      verdict: "being_carried",
      type: "non_revenue_bearing",
    };
    return {
      ...raw_headline,
      all_sources: [...(raw_headline.all_sources || []), non_revenue_bearing_entry],
      total_group_count: (raw_headline.total_group_count ?? 0) + 1,
      being_carried_count: (raw_headline.being_carried_count ?? 0) + 1,
      being_carried: [...(raw_headline.being_carried || []), non_revenue_bearing_entry],
      all_good: false,
    };
  }

  // True only for View A's real-capacity cascade (smoothing_mode not
  // "naive") - the one path fixed today. View B always still needs the
  // standalone row (its own cascade untouched), same for the naive/
  // assumed headline either view.
  // FIX (2026-09-17, third pass): View A now correctly represents
  // non-productive cost in BOTH modes - naive/"Each Part On Its Own"
  // shows pure-support units (e.g. Accountant) as their own explicit
  // row, and real-capacity/"How the Business Runs" bakes it directly
  // into every working unit's own true_cost (plus the new distribution
  // banner). The standalone catch-all row is now fully redundant for
  // View A either way - was only ever skipped for the real-capacity
  // path before this fix, causing Accountant's cost to be counted
  // TWICE in the naive view (once as its own row, once in the
  // catch-all). View B's own separate cascade is still untouched, so
  // it still needs the catch-all row, in both its modes.
  // FIX (2026-09-18): View B's own cascade (apply_real_capacity_v2) now
  // correctly distributes non-productive cost too - the catch-all row
  // is fully redundant for View B as well now, not just View A. Both
  // headlines always covered.
  const active_headline_already_includes_non_revenue_bearing = true;
  const stable_headline_already_includes_non_revenue_bearing = true;

  const active_headline = apply_non_revenue_bearing_entry(
    apply_unassigned_entry(raw_active_headline),
    active_headline_already_includes_non_revenue_bearing
  );
  const stable_headline = apply_non_revenue_bearing_entry(
    apply_unassigned_entry(raw_stable_headline),
    stable_headline_already_includes_non_revenue_bearing
  );

  const total_source_count = active_headline.total_group_count;
  const carried_count = active_headline.being_carried_count;


  // Display-only rounding fix (this session): rounding each row
  // independently for display, then summing the rounded whole-dollar
  // figures, can drift from the headline total by $1-2 when individual
  // values are tiny (e.g. near breakeven). Uses a largest-remainder
  // method so the displayed rows always sum exactly to the displayed
  // headline, without ever showing cents. This is display-only -
  // active_headline.all_sources itself is untouched, so every other
  // consumer of active_headline still gets precise, unrounded values.
  const headline_display_total = Math.round(Number(active_headline.total_net_profit) || 0);
  const display_rows = (() => {
    const floored = (active_headline.all_sources || []).map((e) => {
      const raw = Number(e.net_profit) || 0;
      const floor_value = Math.floor(raw);
      return { ...e, floor_value, remainder: raw - floor_value };
    });
    const floor_sum = floored.reduce((sum, e) => sum + e.floor_value, 0);
    const deficit = Math.max(0, headline_display_total - floor_sum);
    const sorted_by_remainder = [...floored].sort((a, b) => b.remainder - a.remainder);
    const bump_keys = new Set(sorted_by_remainder.slice(0, deficit).map((e) => e.key || e.name));
    return floored.map((e) => ({
      ...e,
      net_profit: e.floor_value + (bump_keys.has(e.key || e.name) ? 1 : 0),
    }));
  })();
  // Banner tone (confirmed with user): only goes starker when switching to
  // Real Capacity actually REVEALS more failure than Assumed Capacity
  // already showed - not simply whenever Real Capacity has any carried
  // sources at all.
  // FIX (this session): previously always compared View A's own
  // headline_real_capacity vs headline, regardless of which view was
  // actually being shown - meaning the banner tone could be driven by
  // View A's numbers while View B's headline was on screen, completely
  // disconnected from what the user was looking at. Now uses View B's
  // own real-vs-assumed comparison when View B is active, reusing
  // build_view_b_headline for both capacity modes.
  const reveals_more_failure =
    capacity_mode === "real" &&
    (view_mode_ab === "b"
      ? (build_view_b_headline("real")?.being_carried_count ?? 0) >
        (build_view_b_headline("assumed")?.being_carried_count ?? 0)
      : per_source.headline_real_capacity.being_carried_count > per_source.headline.being_carried_count);

  // Breakeven revenue (this session, per user request - a CFO/analyst
  // essential the page was missing). Purely a function of real cost,
  // which is identical in View A and View B - neither view touches
  // any actual cost figure, only how modelled revenue gets attributed
  // across sources - so this is ONE number, not computed per view.
  // Genuinely independent of Business Modelling's own breakeven/lever
  // calculations (buildBreakevenSummary in
  // lib/selectors/businessModellingLeverSelectors.js answers a
  // different question - "are stated rates/targets sufficient in
  // principle" - not "what real revenue level actually zeroes real
  // profit"). Verified against the real, previously-confirmed
  // $1,869,724 figure from earlier in this project's history.
  const breakeven_revenue = per_source.reconciliation?.total_true_cost ?? null;
  const real_total_revenue = per_source.materials?.build_up?.total_pnl_revenue ?? null;
  const breakeven_gap =
    breakeven_revenue !== null && real_total_revenue !== null
      ? breakeven_revenue - real_total_revenue
      : null;

  return (
    <div className="business-outcome-waterfall">
        <div className="business-outcome-view-toggle" aria-label="Materials model" style={{ marginTop: "0.75rem" }}>
          <button
            type="button"
            className={`business-outcome-view-toggle-btn ${view_mode_ab === "a" ? "active" : ""}`}
            onClick={() => set_view_mode_ab("a")}
          >
            View A (Materials protected)
          </button>
          <button
            type="button"
            className={`business-outcome-view-toggle-btn ${view_mode_ab === "b" ? "active" : ""}`}
            onClick={() => {
              // FIX (2026-09-17): symmetric to the Best Case button's own
              // fix - Best Case + View B is never a valid combination, so
              // selecting View B while on Best Case reverts to How the
              // Business Runs, closing the loop from this direction too.
              set_view_mode_ab("b");
              if (smoothing_mode === "naive" && typeof set_smoothing_mode === "function") {
                set_smoothing_mode("smoothed");
              }
            }}
          >
            View B (Materials shares equally)
          </button>
        </div>

      <div className={`business-outcome-headline${reveals_more_failure ? " business-outcome-headline-stark" : ""}`}>
        {/* FIX (2026-09-17): "Each Part On Its Own" (smoothing_mode ===
            "naive") was reusing the exact same "Your business made $X
            in net profit" wording the REAL headline uses - but this
            number is not a measurement of anything real, it's a
            hypothetical total stacking together what each part WOULD
            earn if fully billed at its assumed rate/hours with no cap
            to real revenue and no cross-subsidy. Confirmed via git
            history (commit 2724a61, 2026-08-28) this mechanism itself
            is original, deliberate design - "the variance IS the
            diagnostic, never force it to reconcile" (S29 comment,
            top of useBusinessOutcomePerSourceRevenue.js). The bug was
            never the math - it was the wording implying a real
            financial fact. Every per-source row is unchanged. */}
        <div className="business-outcome-headline-eyebrow">
          {smoothing_mode === "naive" ? "Your best-case ceiling" : "Is your business working?"}
        </div>
        <div className="business-outcome-headline-text">
          {smoothing_mode === "naive" ? (
            <>
              If every part of your business achieved 100% of the rates and hours you&apos;ve
              entered - no cap to real revenue, no help from anywhere else - the combined result
              would be{" "}
              <span className={active_headline.total_net_profit >= 0 ? "value-good" : "value-bad"}>
                {format_currency(
                  scaleAnnualValue(
                    active_headline.total_net_profit,
                    time_scale,
                    null,
                    per_source.net_annual_business_open_hours,
                    per_source.net_annual_business_open_days,
                    per_source.annual_open_weeks
                  )
                )}
                {time_scale !== "year" ? getTimeScaleSuffix(time_scale) : ""}
              </span>
              . This is not a measurement of what actually happened - it is your best-case
              ceiling. A source that still can&apos;t cover its own cost here has a rate or hours
              problem that would persist even under perfect conditions.
              {active_headline.all_good ? (
                <> Every part of your business is paying its way.</>
              ) : (
                <>
                  {" "}
                  <span className="value-bad">
                    {carried_count} of {total_source_count}
                  </span>{" "}
                  {carried_count === 1 ? "source isn't paying its way" : "sources aren't paying their way"}, on this
                  independent basis.
                </>
              )}
            </>
          ) : (
            <>
              Your business made{" "}
              <span className={active_headline.total_net_profit >= 0 ? "value-good" : "value-bad"}>
                {format_currency(
                  scaleAnnualValue(
                    active_headline.total_net_profit,
                    time_scale,
                    null,
                    per_source.net_annual_business_open_hours,
                    per_source.net_annual_business_open_days,
                    per_source.annual_open_weeks
                  )
                )}
                {time_scale !== "year" ? getTimeScaleSuffix(time_scale) : ""}
              </span>{" "}
              in net profit.
              {active_headline.all_good ? (
                <> Every part of your business is paying its way.</>
              ) : (
                <>
                  {" "}
                  <span className="value-bad">
                    {carried_count} of {total_source_count}
                  </span>{" "}
                  {carried_count === 1 ? "source isn't paying its way" : "sources aren't paying their way"}.
              {active_headline?.unexplained_revenue > 0.5 && (
                <>
                  {" "}Includes{" "}
                  {format_currency(scaleAnnualValue(active_headline.unexplained_revenue, time_scale, null, per_source.net_annual_business_open_hours, per_source.net_annual_business_open_days, per_source.annual_open_weeks))}
                  {time_scale !== "year" ? getTimeScaleSuffix(time_scale) : ""}{" "}of revenue your rates and markup
                  don&apos;t explain - customers are paying more than the rates set in Rate Builder.
                </>
              )}
                </>
              )}
            </>
          )}
        </div>

        {/* Added 2026-09-17, second pass - signals the non-productive
            cost distribution that's already happening under the hood
            (real cascade math, confirmed correct earlier this session)
            but was previously invisible anywhere on screen. Only shown
            for View A's real-capacity cascade specifically - the one
            path this whole feature was built and fixed for today. */}
        {view_mode_ab !== "b" && capacity_mode === "real" && smoothing_mode !== "naive" &&
          (per_source.non_productive_cost_distributed_total ?? 0) > 0 && (
            <div className="ui-help" style={{ margin: "0.5rem 0" }}>
              <strong>{format_currency(per_source.non_productive_cost_distributed_total)}</strong>{" "}
              of non-productive support cost (e.g. admin, management - not tied to any billable
              job) has been spread across the sources below, weighted by their own real cost.
              See &quot;Best Case (100% of Entered Rates &amp; Hours)&quot; to see this cost on its own, undistributed.
            </div>
          )}

        <div className="ui-help" style={{ margin: "0.5rem 0" }}>
          Breakeven revenue:{" "}
          <strong>
            {breakeven_revenue !== null
              ? format_currency(
                  scaleAnnualValue(breakeven_revenue, time_scale, null, per_source.net_annual_business_open_hours, per_source.net_annual_business_open_days, per_source.annual_open_weeks)
                )
              : "N/A"}
            {time_scale !== "year" ? getTimeScaleSuffix(time_scale) : ""}
          </strong>
          {breakeven_gap !== null && (
            <>
              {" "}&middot;{" "}
              {breakeven_gap > 0 ? (
                <>
                  Needs{" "}
                  <strong className="value-bad">
                    {format_currency(
                      scaleAnnualValue(breakeven_gap, time_scale, null, per_source.net_annual_business_open_hours, per_source.net_annual_business_open_days, per_source.annual_open_weeks)
                    )}
                  </strong>{" "}
                  more revenue to break even
                </>
              ) : (
                <>
                  Currently{" "}
                  <strong className="value-good">
                    {format_currency(
                      scaleAnnualValue(-breakeven_gap, time_scale, null, per_source.net_annual_business_open_hours, per_source.net_annual_business_open_days, per_source.annual_open_weeks)
                    )}
                  </strong>{" "}
                  above breakeven
                </>
              )}
            </>
          )}
        </div>

        {view_mode_ab === "b" && smoothing_mode === "naive" && (
          <div className="business-outcome-capacity-warning">
            <strong>
              &quot;Best Case (100% of Entered Rates &amp; Hours)&quot; isn&apos;t offered for View B here -
              Outcome only shows what&apos;s actually happening against real revenue, not a
              hypothetical ceiling. Showing the full reconciled picture instead (same as &quot;How
              the Business Runs&quot;).
            </strong>
          </div>
        )}

        {(active_headline.labour_capacity_warning || active_headline.asset_capacity_warning) && (
          <div className="business-outcome-capacity-warning">
            <strong>Some of this revenue may not be deliverable as currently staffed</strong>
            {active_headline.labour_capacity_warning && (
              <div>
                One or more staff types are assigned more hours across your operating groups than they
                actually have available. The revenue figures on this page assume every assigned seat is
                fully covered - check Cost Allocation for the specific over-allocated staff type.
              </div>
            )}
            {active_headline.asset_capacity_warning && (
              <div>
                One or more assets are assigned more than 100% across your operating groups. Check Cost
                Allocation for the specific over-allocated asset.
              </div>
            )}
          </div>
        )}

        {active_headline.all_good && (
          <div className="business-outcome-all-good-row">
            Every labour source, asset, and materials is covering its own cost right now - nothing is
            being carried by the rest of the business.
          </div>
        )}

        <button
          type="button"
          className="ui-button-secondary"
          onClick={() => { const next = !sources_open; set_sources_open(next); set_breakdown_open(next); }}
        >
          {sources_open ? "Hide breakdown" : "Show breakdown"}
        </button>

        {sources_open && (
          <div className="business-outcome-attention-list">
            {display_rows.map((entry) => (
              <button
                type="button"
                className={`business-outcome-attention-row ${entry.verdict === "paying_its_way" ? "paying" : ""}`}
                key={entry.key || entry.name}
                onClick={() => open_source_detail(entry.key)}
              >
                <span className="business-outcome-attention-row-name">{entry.name}</span>
                <span className="business-outcome-attention-row-amount">
                  {format_currency(entry.net_profit)} / year
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div
        id="business-outcome-breakdown-section"
        className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)]"
      >
        <div className="px-4 pb-4" style={{ display: breakdown_open ? "block" : "none" }}>

      <div
        ref={detail_section_ref}
        className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)]"
      >
        <button
          type="button"
          onClick={() => set_detail_open((current) => !current)}
          className="ui-collapsible-summary flex w-full items-center justify-between px-4 py-4 text-left"
          aria-expanded={detail_open}
        >
          <div className="flex w-full items-center justify-between gap-4">
            <div className="ui-collapsible-title">Revenue / Profit Breakdown</div>
          </div>
          <span className="ml-4 text-sm text-[var(--text-muted)]">{detail_open ? "Hide" : "Show"}</span>
        </button>
        {detail_open && (
          <div className="px-4 pb-4">
            <div className="business-outcome-utilisation-note">{per_source.disclosure_text}</div>

            <CollapsibleSection title="Advanced options" defaultOpen={false}>
            <div className="business-outcome-view-toggle" aria-label="Capacity model">
              <button
                type="button"
                className={`business-outcome-view-toggle-btn ${capacity_mode === "real" ? "active" : ""}`}
                onClick={() => set_capacity_mode("real")}
              >
                Real capacity
              </button>
              <button
                type="button"
                className={`business-outcome-view-toggle-btn ${capacity_mode === "assumed" ? "active" : ""}`}
                onClick={() => set_capacity_mode("assumed")}
              >
                Assumed capacity
              </button>
            </div>
            <p className="business-outcome-view-toggle-hint">
              <strong>Real capacity</strong> shares any shortfall out
              fairly, based on who can actually afford to give something up.
              <strong> Assumed capacity</strong> shares any shortfall
              out evenly, the same percentage for everyone, regardless of how much margin they have.
            </p>

            <div className="business-outcome-view-toggle" aria-label="Cost basis" style={{ marginTop: "0.75rem" }}>
              <button
                type="button"
                className={`business-outcome-view-toggle-btn ${cost_mode === "absorbed" ? "active" : ""}`}
                onClick={() => set_cost_mode("absorbed")}
              >
                Full cost (with overhead)
              </button>
              <button
                type="button"
                className={`business-outcome-view-toggle-btn ${cost_mode === "contribution" ? "active" : ""}`}
                onClick={() => set_cost_mode("contribution")}
              >
                Contribution margin (no overhead)
              </button>
            </div>
              <p className="business-outcome-view-toggle-hint">
                <strong>Full cost (with overhead)</strong> includes each source&apos;s share of overhead &mdash; use this for pricing or quoting. <strong>Contribution margin (no overhead)</strong>{" "}shows what&apos;s left after direct cost only, before overhead is spread &mdash; useful for comparing sources, never for setting a price.
              </p>

            <div className="business-outcome-view-toggle" aria-label="Materials model (Card 2 override)" style={{ marginTop: "0.75rem" }}>
              <button
                type="button"
                className={`business-outcome-view-toggle-btn ${card2_view_mode_ab === "a" ? "active" : ""}`}
                onClick={() => set_card2_view_mode_ab("a")}
              >
                View A (Materials protected)
              </button>
              <button
                type="button"
                className={`business-outcome-view-toggle-btn ${card2_view_mode_ab === "b" ? "active" : ""}`}
                onClick={() => set_card2_view_mode_ab("b")}
              >
                View B (Materials shares equally)
              </button>
            </div>
              <p className="business-outcome-view-toggle-hint">
                <strong>View A (Materials protected)</strong> treats materials/COGS as a residual &mdash; labour and assets get paid first, and materials gets whatever&apos;s left over. <strong>View B (Materials shares equally)</strong> treats materials as a genuine peer, sharing in both the upside and any shortfall the same way every operating group does.
              </p>

            {card2_view_mode_ab === "b" && (
              <>
              <div className="business-outcome-view-toggle" aria-label="Shortfall attribution" style={{ marginTop: "0.5rem" }}>
                <button
                  type="button"
                  className={`business-outcome-view-toggle-btn ${view_b_shortfall_mode === "rate" ? "active" : ""}`}
                  onClick={() => set_view_b_shortfall_mode("rate")}
                >
                  Rate Shortfall
                </button>
                <button
                  type="button"
                  className={`business-outcome-view-toggle-btn ${view_b_shortfall_mode === "hours" ? "active" : ""}`}
                  onClick={() => set_view_b_shortfall_mode("hours")}
                >
                  Hours Shortfall
                </button>
              </div>
                <p className="business-outcome-view-toggle-hint">
                  <strong>Rate Shortfall</strong> and <strong>Hours Shortfall</strong>{" "}show the same gap two different ways. Rate Shortfall asks: given the hours actually worked, what rate did we effectively get paid? Hours Shortfall asks: given our normal rate, how many hours&apos; worth of revenue did we actually bring in? Pick whichever your team finds clearer.
                </p>
              </>
            )}
            </CollapsibleSection>

            <div className="business-outcome-view-toggle">
              <button
                type="button"
                className={`business-outcome-view-toggle-btn ${view_mode === "revenue" ? "active" : ""}`}
                onClick={() => set_view_mode("revenue")}
              >
                Revenue share
              </button>
              <button
                type="button"
                className={`business-outcome-view-toggle-btn ${view_mode === "profit" ? "active" : ""}`}
                onClick={() => set_view_mode("profit")}
              >
                Net profit share
              </button>
            </div>

            <div className="cost-summary-toggle" aria-label="Time scale">
              {TIME_SCALES.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  className={
                    option.key === time_scale
                      ? "cost-summary-toggle-button active"
                      : "cost-summary-toggle-button"
                  }
                  onClick={() => set_time_scale(option.key)}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {card2_view_mode_ab === "b" ? (
              <ViewBGroupsDrill view_b={per_source.view_b} view_mode={view_mode} time_scale={time_scale} open_hours={per_source.net_annual_business_open_hours} open_days={per_source.net_annual_business_open_days} open_weeks={per_source.annual_open_weeks} shortfall_mode={view_b_shortfall_mode} capacity_mode={capacity_mode} selected_key={card2_selected_key} set_selected_key={set_card2_selected_key} cost_mode={cost_mode} />
            ) : (
              <RankedGroupsDrill real_capacity={per_source.real_capacity}                 headline={active_headline}
                labour_groups={per_source.labour_groups}
                asset_groups={per_source.asset_groups}
                materials={per_source.materials}
                view_mode={view_mode}
                time_scale={time_scale}
                open_hours={per_source.net_annual_business_open_hours} open_days={per_source.net_annual_business_open_days} open_weeks={per_source.annual_open_weeks}
                use_implied={per_source.use_implied}
                capacity_mode={capacity_mode}
                cost_mode={cost_mode}
                selected_key={card2_selected_key}
                set_selected_key={set_card2_selected_key}
              />
            )}
            <div className="mt-4 flex justify-end">
              <button type="button" className="ui-button-secondary" onClick={() => set_detail_open(false)}>
                Hide
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="business-outcome-waterfall-inner business-outcome-per-source-wrapper">
        <UnassignedBlock unassigned={per_source.unassigned} output_contract={output_contract} labour_coverage_gaps={active_headline.labour_coverage_gaps} />

        <CollapsibleSection id="how-the-numbers-are-calculated" title="How the Numbers Are Calculated" defaultOpen={false}>
          <CollapsibleSection id="independent-numbers-folder" title="Independent Numbers" defaultOpen={false}>
            <CollapsibleSection id="revenue-net-profit-panel" title="Revenue / Net Profit" defaultOpen={false}>
              <BusinessOutcomeNetProfitBuildUp smoothing_mode={smoothing_mode} />
            </CollapsibleSection>

            <CollapsibleSection id="revenue-snapshot-panel" title="Revenue Snapshot" defaultOpen={false}>
              <BusinessOutcomeRevenueSnapshotTable
                pnl_revenue={real_total_revenue}
                modelled_revenue={per_source.headline_real_capacity?.independent_modelled_revenue}
                breakeven_revenue={breakeven_revenue}
              />
            </CollapsibleSection>

            <CollapsibleSection id="independent-breakeven-panel" title="Independent Breakeven & Revenue Claim Test" defaultOpen={false}>
              <BusinessOutcomeIndependentBreakevenLedger
                materials={per_source.real_capacity?.materials}
                group_real_capacity={per_source.real_capacity?.group_real_capacity}
                total_revenue_reference={per_source.materials?.build_up?.total_pnl_revenue}
                labour_modelled_revenue_total={per_source.materials?.build_up?.labour_modelled_revenue}
                asset_modelled_revenue_total={per_source.materials?.build_up?.asset_modelled_revenue}
              />
            </CollapsibleSection>

            <CollapsibleSection id="labour-recovery-panel" title="Labour recovery, by source" defaultOpen={false}>
              <BusinessOutcomeTruthLabourRecoveryCard labour_recovery={labour_recovery} />
            </CollapsibleSection>

            <CollapsibleSection id="traditional-viability-panel" title="Traditional viability view" defaultOpen={false}>
              <TraditionalViabilityView output_contract={output_contract} />
            </CollapsibleSection>
          </CollapsibleSection>

          <CollapsibleSection id="capacity-coverage-gap-panel" title="Capacity Coverage Gap" defaultOpen={false}>
            <BusinessOutcomeCapacityCoverageGapTable capacity_coverage_gap={per_source.capacity_coverage_gap} />
          </CollapsibleSection>

          <CollapsibleSection id="health-gauge-explainer-panel" title="Business Health Gauge - explained" defaultOpen={false}>
            <BusinessOutcomeHealthGaugeExplainer health_gauge={per_source.health_gauge} active_headline={stable_headline} />
          </CollapsibleSection>

          <CollapsibleSection id="ebit-by-unit-panel" title="EBIT by Source" defaultOpen={false}>
            <BusinessOutcomeEbitByUnitTable real_capacity={per_source.real_capacity} materials={per_source.materials} unassigned={per_source.unassigned} />
          </CollapsibleSection>

          <CollapsibleSection id="views-folder" title="Views" defaultOpen={false}>
            <CollapsibleSection id="view-ab-comparison-panel" title="Comparison: View A vs View B" defaultOpen={false}>
              <BusinessOutcomeViewABComparisonTable
                labour_groups={per_source.labour_groups}
                asset_groups={per_source.asset_groups}
                materials={per_source.materials}
                view_b={per_source.view_b}
              />
            </CollapsibleSection>

            <CollapsibleSection title="View A" defaultOpen={false}>
              <CollapsibleSection title="Real Capacity ledger" defaultOpen={false}>
                <RealCapacityLedger
                  real_capacity={per_source.real_capacity}
                  materials={per_source.materials}
                  unassigned={per_source.unassigned}
                  time_scale={time_scale}
                  open_hours={per_source.net_annual_business_open_hours} open_days={per_source.net_annual_business_open_days} open_weeks={per_source.annual_open_weeks}
                />
              </CollapsibleSection>
              <CollapsibleSection title="Assumed Capacity ledger" defaultOpen={false}>
                <AssumedCapacityLedger
                  revenue_ceiling={per_source.revenue_ceiling}
                  materials={per_source.materials}
                  assumed_ledger_groups={per_source.assumed_ledger_groups}
                  groups_naive={per_source.real_capacity?.group_real_capacity}
                  unassigned={per_source.unassigned}
                  time_scale={time_scale}
                  open_hours={per_source.net_annual_business_open_hours} open_days={per_source.net_annual_business_open_days} open_weeks={per_source.annual_open_weeks}
                />
              </CollapsibleSection>
              <CollapsibleSection title="Cost build-up (Real Capacity)" defaultOpen={false}>
                <CostBuildUpTable
                  labour_groups={per_source.labour_groups}
                  asset_groups={per_source.asset_groups}
                  materials={per_source.materials}
                  time_scale={time_scale}
                  open_hours={per_source.net_annual_business_open_hours} open_days={per_source.net_annual_business_open_days} open_weeks={per_source.annual_open_weeks}
                  use_implied={per_source.use_implied}
                  capacity_mode="real"
                  real_capacity={per_source.real_capacity}
                />
              </CollapsibleSection>
              <CollapsibleSection title="Cost build-up (Assumed Capacity)" defaultOpen={false}>
                <CostBuildUpTable
                  labour_groups={per_source.labour_groups}
                  asset_groups={per_source.asset_groups}
                  materials={per_source.materials}
                  time_scale={time_scale}
                  open_hours={per_source.net_annual_business_open_hours} open_days={per_source.net_annual_business_open_days} open_weeks={per_source.annual_open_weeks}
                  use_implied={per_source.use_implied}
                  capacity_mode="assumed"
                  real_capacity={per_source.real_capacity}
                />
              </CollapsibleSection>
            </CollapsibleSection>

            <CollapsibleSection title="View B" defaultOpen={false}>
              <CollapsibleSection title="Real Capacity ledger" defaultOpen={false}>
                <ViewBRealCapacityLedger
                  view_b={per_source.view_b}
                  unassigned={per_source.unassigned}
                  time_scale={time_scale}
                  open_hours={per_source.net_annual_business_open_hours} open_days={per_source.net_annual_business_open_days} open_weeks={per_source.annual_open_weeks}
                />
              </CollapsibleSection>
              <CollapsibleSection title="Assumed Capacity ledger" defaultOpen={false}>
                <ViewBAssumedCapacityLedger
                  view_b={per_source.view_b}
                  unassigned={per_source.unassigned}
                  time_scale={time_scale}
                  open_hours={per_source.net_annual_business_open_hours} open_days={per_source.net_annual_business_open_days} open_weeks={per_source.annual_open_weeks}
                />
              </CollapsibleSection>
              <CollapsibleSection title="Cost build-up (Real Capacity)" defaultOpen={false}>
                <ViewBCostBuildUpTable
                  view_b={per_source.view_b}
                  time_scale={time_scale}
                  open_hours={per_source.net_annual_business_open_hours} open_days={per_source.net_annual_business_open_days} open_weeks={per_source.annual_open_weeks}
                  capacity_mode="real"
                />
              </CollapsibleSection>
              <CollapsibleSection title="Cost build-up (Assumed Capacity)" defaultOpen={false}>
                <ViewBCostBuildUpTable
                  view_b={per_source.view_b}
                  time_scale={time_scale}
                  open_hours={per_source.net_annual_business_open_hours} open_days={per_source.net_annual_business_open_days} open_weeks={per_source.annual_open_weeks}
                  capacity_mode="assumed"
                />
              </CollapsibleSection>
            </CollapsibleSection>
          </CollapsibleSection>
        </CollapsibleSection>

        <ReconciliationBanner reconciliation={per_source.reconciliation} />
      </div>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              className="ui-button-secondary"
              onClick={() => { set_breakdown_open(false); set_sources_open(false); }}
            >
              Hide
            </button>
          </div>
        </div>
      </div>

      <button
        type="button"
        className="business-outcome-health-gauge-clickable"
        onClick={() =>
          scroll_to_section({
            target_id: "health-gauge-explainer-panel",
            ancestor_ids: ["how-the-numbers-are-calculated"],
            pre_toggle_labels: ["Show breakdown"],
          })
        }
      >
        <BusinessOutcomeHealthGauge health_gauge={per_source.health_gauge} />
      </button>

      <BusinessOutcomeTruthSituationBlurb
        balance_sheet_current_year_earnings={balance_sheet_current_year_earnings}
        fixed_assets_reconciliation={fixed_assets_reconciliation}
        balance_sheet_working_capital={balance_sheet_working_capital}
        active_headline={stable_headline}
        capacity_mode={capacity_mode}
        real_capacity={per_source.real_capacity}
        revenue_ceiling={per_source.revenue_ceiling}
        capacity_coverage_gap={per_source.capacity_coverage_gap}
        pnl_revenue={real_total_revenue}
        breakeven_revenue={breakeven_revenue}
        labour_recovery_summary={labour_recovery}
        traditional_viability_summary={output_contract}
        pnl_net_profit_actual={pnl_net_profit_actual}
        pnl_trading_income_actual={pnl_trading_income_actual}
        view_b_modelled_revenue={build_view_b_headline("real")?.total_modelled_revenue}
      />

      <BusinessOutcomeTruthAboutPanel />
    </div>
  );
}
