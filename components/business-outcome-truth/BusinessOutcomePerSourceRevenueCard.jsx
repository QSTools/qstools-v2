"use client";

import { useState, useEffect, useRef } from "react";
import CollapsibleSection from "@/components/common/CollapsibleSection";
import {
  TIME_SCALES,
  scaleAnnualValue,
  getTimeScaleSuffix,
} from "@/components/cost-summary/cost-summary-card/costSummaryFormatters";
import { merge_groups_by_id, merge_groups_by_id_real_capacity } from "@/lib/selectors/business-outcome/businessOutcomePerSourceRevenueSelectors";

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

function MaterialsBuildUp({ build_up }) {
  if (!build_up) return null;

  return (
    <div className="business-outcome-buildup">
      <div className="business-outcome-buildup-title">How this is derived - not a P&L line</div>

      <div className="business-outcome-buildup-row">
        <span>Total P&L revenue</span>
        <span className="business-outcome-buildup-value">{format_currency(build_up.total_pnl_revenue)}</span>
      </div>
      <div className="business-outcome-buildup-row is-subtract">
        <span>− Labour modelled revenue (all sources)</span>
        <span className="business-outcome-buildup-value">{format_currency(build_up.labour_modelled_revenue)}</span>
      </div>
      <div className="business-outcome-buildup-row is-subtract">
        <span>− Asset modelled revenue (all groups)</span>
        <span className="business-outcome-buildup-value">{format_currency(build_up.asset_modelled_revenue)}</span>
      </div>
      <div className="business-outcome-buildup-row is-total">
        <span>= Materials revenue share</span>
        <span className="business-outcome-buildup-value">
          {format_currency(
            build_up.total_pnl_revenue - build_up.labour_modelled_revenue - build_up.asset_modelled_revenue
          )}
        </span>
      </div>

      <div className="business-outcome-buildup-row" style={{ marginTop: "0.5rem" }}>
        <span>Materials revenue share</span>
        <span className="business-outcome-buildup-value">
          {format_currency(
            build_up.total_pnl_revenue - build_up.labour_modelled_revenue - build_up.asset_modelled_revenue
          )}
        </span>
      </div>
      <div className="business-outcome-buildup-row is-subtract">
        <span>− COGS (P&L)</span>
        <span className="business-outcome-buildup-value">{format_currency(build_up.cogs)}</span>
      </div>
      <div className="business-outcome-buildup-row is-subtract">
        <span>− Residual overhead (not distributed to labour/asset groups)</span>
        <span className="business-outcome-buildup-value">{format_currency(build_up.residual_overhead)}</span>
      </div>
      <div className="business-outcome-buildup-row is-total">
        <span>= Materials net profit (Adjusted GP)</span>
        <span className="business-outcome-buildup-value">
          {format_currency(
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
    </div>
  );
}

function MaterialsSection({ materials, view_mode }) {
  if (!materials) return null;

  const primary = view_mode === "profit" ? materials.net_profit : materials.revenue;
  const secondary = view_mode === "profit" ? materials.revenue : materials.net_profit;
  const secondary_label = view_mode === "profit" ? "Revenue" : "Net profit";

  const summary = (
    <span className="business-outcome-source-group-values">
      <span className="business-outcome-source-group-total">{format_currency(primary)}</span>
      <span className="business-outcome-source-group-secondary-value">
        {secondary_label}: {format_currency(secondary)}
      </span>
    </span>
  );

  return (
    <div className="business-outcome-collapsible-group">
      <CollapsibleSection title="Materials — Adjusted GP after labour & asset revenue removed" summary={summary} defaultOpen={false}>
        <div className="business-outcome-source-group-body">
          <div className="business-outcome-source-row" style={{ "--indent-level": 1 }}>
            <span className="business-outcome-source-row-name">
              {view_mode === "profit" ? "Revenue" : "Net profit"}
            </span>
            <span className="business-outcome-source-row-figures-stack">
              <ModelledTag />
              <VerdictTag verdict={materials.verdict} label={materials.verdict_label} />
              <span className="business-outcome-source-row-values">
                <span className="business-outcome-source-row-value">
                  {format_currency(view_mode === "profit" ? materials.revenue : materials.net_profit)}
                </span>
              </span>
            </span>
          </div>
          <MaterialsBuildUp build_up={materials.build_up} />
        </div>
      </CollapsibleSection>
    </div>
  );
}

function UnassignedBlock({ unassigned }) {
  if (!unassigned || !unassigned.has_gaps) return null;

  return (
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

function RankedGroupsDrill({ headline, labour_groups, asset_groups, materials, view_mode, time_scale, open_hours, use_implied, capacity_mode, requested_selection }) {
  const scale = (v) => scaleAnnualValue(v, time_scale, null, open_hours);
  const suffix = time_scale !== "year" ? getTimeScaleSuffix(time_scale) : "";
  const [selected_key, set_selected_key] = useState(null);
  const [hovered_key, set_hovered_key] = useState("");

  // Synced from Card 1 (this session): clicking a source there requests
  // this drill jump straight to that source's own breakdown. Only
  // re-syncs when the PARENT sends a new request - never fights the
  // user's own subsequent clicks inside this component.
  useEffect(() => {
    if (requested_selection) {
      set_selected_key(requested_selection);
    }
  }, [requested_selection]);

  const entries =
    capacity_mode === "real"
      ? merge_groups_by_id_real_capacity(labour_groups, asset_groups, materials)
      : merge_groups_by_id(labour_groups, asset_groups, materials, use_implied);
  const metric = (e) => (view_mode === "profit" ? e.net_profit : e.modelled_revenue);
  const total = view_mode === "profit" ? headline.total_net_profit : headline.total_modelled_revenue;

  const sorted_top_level = [...entries].sort((a, b) => metric(b) - metric(a));
  const selected_entry = entries.find((e) => e.key === selected_key) || null;

  const active_list = selected_entry
    ? [...selected_entry.children].sort((a, b) => metric(b) - metric(a))
    : sorted_top_level;

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
        {selected_entry ? `${selected_entry.label} - ranked by ${view_mode === "profit" ? "net profit" : "revenue"}` : `Ranked by ${view_mode === "profit" ? "net profit" : "revenue"}`}
      </div>

      {selected_entry?.key === "materials" ? (
        <MaterialsSection materials={materials} view_mode={view_mode} />
      ) : (
      <div className="cost-summary-drill-list">
        {active_list.map((item) => {
          const has_children =
            !selected_entry &&
            (entries.find((e) => e.key === item.key)?.children.length > 0 || item.key === "materials");
          const is_active = hovered_key === item.key;
          const is_muted = Boolean(hovered_key) && !is_active;
          const value = metric(item);
          const share = total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";

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
                {item.available === false && <div className="ui-help">{item.unavailable_reason || "Not available"}</div>}
              </div>
              <div className="cost-summary-drill-value">
                <span className="business-outcome-drill-tags">
                  <ModelledTag />
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
                <div className="ui-card-title-sm">
                  {format_currency(scale(value))}
                  {suffix}
                  <span className="ui-help"> ({share}%)</span>
                </div>
              </div>
            </>
          );

          if (has_children) {
            return (
              <button
                key={item.key}
                type="button"
                className={row_class}
                onMouseEnter={() => set_hovered_key(item.key)}
                onMouseLeave={() => set_hovered_key("")}
                onClick={() => set_selected_key(item.key)}
              >
                {content}
              </button>
            );
          }

          return (
            <div
              key={item.key}
              className={row_class}
              onMouseEnter={() => set_hovered_key(item.key)}
              onMouseLeave={() => set_hovered_key("")}
            >
              {content}
            </div>
          );
        })}
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
        <TruthFieldRow label="Total COG" field={total_COG} />
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
}) {
  if (!revenue_ceiling) {
    return <div className="ui-help">Assumed Capacity data is not available yet.</div>;
  }

  const scale = (v) => scaleAnnualValue(v, time_scale, null, open_hours);
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
          <span>Materials / COG</span>
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
            Materials / COG
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

function RealCapacityLedger({ real_capacity, materials, unassigned, time_scale, open_hours }) {
  if (!real_capacity) {
    return <div className="ui-help">Real Capacity data is not available yet.</div>;
  }

  const scale = (v) => scaleAnnualValue(v, time_scale, null, open_hours);
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
          <span>Materials / COG</span>
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
            Materials / COG
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

export default function BusinessOutcomePerSourceRevenueCard({ per_source, output_contract }) {
  const [view_mode, set_view_mode] = useState("revenue");
  const [time_scale, set_time_scale] = useState("year");
  // Defaults to "real" (Real Capacity) per product decision this session -
  // leads with the honest, cross-subsidy-aware number rather than the
  // familiar assumed-hours figure. "assumed" keeps today's existing
  // behaviour, completely untouched, one click away.
  const [capacity_mode, set_capacity_mode] = useState("real");

  // Card 1 -> Card 2 click-through (this session): Card 2 starts
  // collapsed ("hide the monster") - clicking a source in Card 1 opens
  // it already showing that source's own breakdown, instead of the
  // page showing everything at once by default.
  const [detail_open, set_detail_open] = useState(false);
  const [requested_selection, set_requested_selection] = useState(null);
  const detail_section_ref = useRef(null);

  function open_source_detail(key) {
    set_requested_selection(key);
    set_detail_open(true);
  }

  useEffect(() => {
    if (detail_open && detail_section_ref.current) {
      detail_section_ref.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [detail_open, requested_selection]);

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

  const active_headline =
    capacity_mode === "real" ? per_source.headline_real_capacity : per_source.headline;

  const total_source_count = active_headline.total_group_count;
  const carried_count = active_headline.being_carried_count;

  // Banner tone (confirmed with user): only goes starker when switching to
  // Real Capacity actually REVEALS more failure than Assumed Capacity
  // already showed - not simply whenever Real Capacity has any carried
  // sources at all.
  const reveals_more_failure =
    capacity_mode === "real" &&
    per_source.headline_real_capacity.being_carried_count > per_source.headline.being_carried_count;

  return (
    <div className="business-outcome-waterfall">
      <div className={`business-outcome-headline${reveals_more_failure ? " business-outcome-headline-stark" : ""}`}>
        <div className="business-outcome-headline-eyebrow">Is your business working?</div>
        <div className="business-outcome-headline-text">
          Your business made{" "}
          <span className={active_headline.total_net_profit >= 0 ? "value-good" : "value-bad"}>
            {format_currency(
              scaleAnnualValue(
                active_headline.total_net_profit,
                time_scale,
                null,
                per_source.net_annual_business_open_hours
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
              {carried_count === 1 ? "source isn't" : "sources aren't"} paying its way.
            </>
          )}
        </div>

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

        {active_headline.labour_coverage_gaps.length > 0 && (
          <div className="business-outcome-coverage-gap-block">
            <div className="business-outcome-coverage-gap-title">Scheduling gap - not a profit issue</div>
            {active_headline.labour_coverage_gaps.map((gap) => (
              <div className="business-outcome-coverage-gap-row" key={gap.group_id}>
                <strong>{gap.group_name}</strong> - assigned labour covers {gap.gap_hours} fewer
                hours than this asset runs each year. This is a real scheduling gap worth weighing up in
                Business Modelling - not something to fix on this page.
              </div>
            ))}
          </div>
        )}

        {active_headline.all_good && (
          <div className="business-outcome-all-good-row">
            Every labour source, asset, and materials is covering its own cost right now - nothing is
            being carried by the rest of the business.
          </div>
        )}
        <div className="business-outcome-attention-list">
          {(active_headline.all_sources || []).map((entry) => (
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
      </div>

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
            <div className="ui-collapsible-title">Ranked by revenue contribution</div>
          </div>
          <span className="ml-4 text-sm text-[var(--text-muted)]">{detail_open ? "Hide" : "Show"}</span>
        </button>
        {detail_open && (
          <div className="px-4 pb-4">
            <div className="business-outcome-utilisation-note">{per_source.disclosure_text}</div>

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

            <div className="business-outcome-view-toggle">
              <button
                type="button"
                className={`business-outcome-view-toggle-btn ${view_mode === "revenue" ? "active" : ""}`}
                onClick={() => set_view_mode("revenue")}
              >
                Revenue contribution
              </button>
              <button
                type="button"
                className={`business-outcome-view-toggle-btn ${view_mode === "profit" ? "active" : ""}`}
                onClick={() => set_view_mode("profit")}
              >
                Net profit contribution
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

            <RankedGroupsDrill
              headline={active_headline}
              labour_groups={per_source.labour_groups}
              asset_groups={per_source.asset_groups}
              materials={per_source.materials}
              view_mode={view_mode}
              time_scale={time_scale}
              open_hours={per_source.net_annual_business_open_hours}
              use_implied={per_source.use_implied}
              capacity_mode={capacity_mode}
              requested_selection={requested_selection}
            />
            <div className="mt-4 flex justify-end">
              <button type="button" className="ui-button-secondary" onClick={() => set_detail_open(false)}>
                Hide
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="business-outcome-waterfall-inner business-outcome-per-source-wrapper">

        <UnassignedBlock unassigned={per_source.unassigned} />
        <ReconciliationBanner reconciliation={per_source.reconciliation} />

        <CollapsibleSection
          title={capacity_mode === "real" ? "How Real Capacity is calculated" : "How Assumed Capacity is calculated"}
          defaultOpen={false}
        >
          {capacity_mode === "real" ? (
            <RealCapacityLedger
              real_capacity={per_source.real_capacity}
              materials={per_source.materials}
              unassigned={per_source.unassigned}
              time_scale={time_scale}
              open_hours={per_source.net_annual_business_open_hours}
            />
          ) : (
            <AssumedCapacityLedger
              revenue_ceiling={per_source.revenue_ceiling}
              materials={per_source.materials}
              assumed_ledger_groups={per_source.assumed_ledger_groups}
              groups_naive={per_source.real_capacity?.group_real_capacity}
              unassigned={per_source.unassigned}
              time_scale={time_scale}
              open_hours={per_source.net_annual_business_open_hours}
            />
          )}
        </CollapsibleSection>

        <CollapsibleSection title="Traditional viability view" defaultOpen={false}>
          <TraditionalViabilityView output_contract={output_contract} />
        </CollapsibleSection>
      </div>
    </div>
  );
}











































