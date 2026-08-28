"use client";

import { useState } from "react";
import CollapsibleSection from "@/components/common/CollapsibleSection";

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

export default function BusinessOutcomePerSourceRevenueCard({ per_source }) {
  const [view_mode, set_view_mode] = useState("revenue");

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

  return (
    <div className="business-outcome-waterfall">
      <div className="business-outcome-waterfall-inner business-outcome-per-source-wrapper">
        <div className="business-outcome-utilisation-note">{per_source.disclosure_text}</div>

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

        <div className="business-outcome-per-source">
          <LabourGroupsSection labour_groups={per_source.labour_groups} view_mode={view_mode} />
          <AssetGroupsSection asset_groups={per_source.asset_groups} view_mode={view_mode} />
          <MaterialsSection materials={per_source.materials} view_mode={view_mode} />
        </div>

        <UnassignedBlock unassigned={per_source.unassigned} />
        <ReconciliationBanner reconciliation={per_source.reconciliation} />
      </div>
    </div>
  );
}










