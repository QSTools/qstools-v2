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

// FIX (confirmed live): a real Cost Allocation group like "2inc Line"
// can carry BOTH labour and asset members (e.g. Senior Operator + pump +
// Landcruiser, all one group). This used to create TWO separate drill
// entries sharing the same display name - clicking one hid the other
// entirely. Now merged by group_id into ONE entry per real group, with
// both labour and asset children combined.
function combine_entries(labour_groups, asset_groups, materials) {
  const by_group_id = new Map();

  function get_or_create(group_id, group_name) {
    const key = group_id || `unkeyed_${group_name}`;
    if (!by_group_id.has(key)) {
      by_group_id.set(key, {
        key,
        label: group_name,
        net_profit: 0,
        modelled_revenue: 0,
        children: [],
        has_unavailable: false,
      });
    }
    return by_group_id.get(key);
  }

  labour_groups.forEach((g) => {
    const entry = get_or_create(g.group_id, g.group_name);
    entry.net_profit += g.group_net_profit ?? 0;
    entry.modelled_revenue += g.group_modelled_revenue ?? 0;
    if (g.group_has_unavailable) entry.has_unavailable = true;
    g.staff.forEach((s) => {
      entry.children.push({
        key: s.staff_type_id,
        label: s.staff_type_name,
        net_profit: s.net_profit,
        modelled_revenue: s.modelled_revenue,
        available: s.available,
        unavailable_reason: s.unavailable_reason,
        verdict: s.verdict,
        verdict_label: s.verdict_label,
      });
    });
  });

  asset_groups.forEach((g) => {
    const entry = get_or_create(g.group_id, g.group_name);
    entry.net_profit += g.group_net_profit ?? 0;
    entry.modelled_revenue += g.group_modelled_revenue ?? 0;
    if (g.group_has_unavailable) entry.has_unavailable = true;
    g.assets.forEach((a) => {
      entry.children.push({
        key: a.asset_id,
        label: a.asset_name,
        net_profit: a.net_profit,
        modelled_revenue: a.modelled_revenue,
        available: a.available,
        unavailable_reason: a.unavailable_reason,
        verdict: a.verdict,
        verdict_label: a.verdict_label,
      });
    });
  });

  const merged_entries = Array.from(by_group_id.values()).map((entry) => ({
    ...entry,
    verdict: entry.has_unavailable ? null : entry.net_profit >= 0 ? "paying_its_way" : "being_carried",
    verdict_label: entry.has_unavailable
      ? "Not available"
      : entry.net_profit >= 0
        ? "Paying its way"
        : "Being carried",
  }));

  merged_entries.push({
    key: "materials",
    label: "Materials / COG",
    net_profit: materials.net_profit,
    modelled_revenue: materials.revenue,
    verdict: materials.verdict,
    verdict_label: materials.verdict_label,
    children: [],
  });

  return merged_entries;
}

function RankedGroupsDrill({ headline, labour_groups, asset_groups, materials, view_mode }) {
  const [selected_key, set_selected_key] = useState(null);
  const [hovered_key, set_hovered_key] = useState("");

  const entries = combine_entries(labour_groups, asset_groups, materials);
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

      <div className="cost-summary-drill-list">
        {active_list.map((item) => {
          const has_children = !selected_entry && entries.find((e) => e.key === item.key)?.children.length > 0;
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
                  {item.verdict && <VerdictTag verdict={item.verdict} label={item.verdict_label} />}
                </span>
                <div className="ui-card-title-sm">
                  {format_currency(value)}
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

  const total_source_count = per_source.headline.total_group_count;
  const carried_count = per_source.headline.being_carried_count;

  return (
    <div className="business-outcome-waterfall">
      <div className="business-outcome-headline">
        <div className="business-outcome-headline-eyebrow">Is your business working?</div>
        <div className="business-outcome-headline-text">
          Your business made{" "}
          <span className={per_source.headline.total_net_profit >= 0 ? "value-good" : "value-bad"}>
            {format_currency(per_source.headline.total_net_profit)}
          </span>{" "}
          in net profit.

        {per_source.headline.all_good ? (
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

        {(per_source.headline.labour_capacity_warning || per_source.headline.asset_capacity_warning) && (
          <div className="business-outcome-capacity-warning">
            <strong>Some of this revenue may not be deliverable as currently staffed</strong>
            {per_source.headline.labour_capacity_warning && (
              <div>
                One or more staff types are assigned more hours across your operating groups than they
                actually have available. The revenue figures on this page assume every assigned seat is
                fully covered - check Cost Allocation for the specific over-allocated staff type.
              </div>
            )}
            {per_source.headline.asset_capacity_warning && (
              <div>
                One or more assets are assigned more than 100% across your operating groups. Check Cost
                Allocation for the specific over-allocated asset.
              </div>
            )}
          </div>
        )}

        {per_source.headline.labour_coverage_gaps.length > 0 && (
          <div className="business-outcome-coverage-gap-block">
            <div className="business-outcome-coverage-gap-title">Scheduling gap - not a profit issue</div>
            {per_source.headline.labour_coverage_gaps.map((gap) => (
              <div className="business-outcome-coverage-gap-row" key={gap.group_id}>
                <strong>{gap.group_name}</strong> - assigned labour covers {gap.gap_hours} fewer
                hours than this asset runs each year. This is a real scheduling gap worth weighing up in
                Business Modelling - not something to fix on this page.
              </div>
            ))}
          </div>
        )}

        {per_source.headline.all_good ? (
          <div className="business-outcome-all-good-row">
            Every labour source, asset, and materials is covering its own cost right now - nothing is
            being carried by the rest of the business.
          </div>
        ) : (
          <div className="business-outcome-attention-list">
            {per_source.headline.being_carried.map((entry) => (
              <div className="business-outcome-attention-row" key={entry.name}>
                <span className="business-outcome-attention-row-name">{entry.name}</span>
                <span className="business-outcome-attention-row-amount">
                  {format_currency(entry.net_profit)} / year
                </span>
              </div>
            ))}
            <div className="business-outcome-attention-footer">
              {total_source_count - carried_count} other{" "}
              {total_source_count - carried_count === 1 ? "source is" : "sources are"} performing as
              expected - see full breakdown below.
            </div>
          </div>
        )}
      </div>

      <RankedGroupsDrill
        headline={per_source.headline}
        labour_groups={per_source.labour_groups}
        asset_groups={per_source.asset_groups}
        materials={per_source.materials}
        view_mode={view_mode}
      />

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
          <MaterialsSection materials={per_source.materials} view_mode={view_mode} />
        </div>

        <UnassignedBlock unassigned={per_source.unassigned} />
        <ReconciliationBanner reconciliation={per_source.reconciliation} />
      </div>
    </div>
  );
}






















