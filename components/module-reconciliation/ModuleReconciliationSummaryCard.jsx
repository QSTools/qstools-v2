"use client";

import { useState } from "react";

function format_currency(value) {
  return `$${Math.round(Number(value || 0)).toLocaleString()}`;
}

function format_percent(value) {
  return `${Number(value || 0).toFixed(1)}%`;
}

function Pill({ text, tone = "ok" }) {
  return <span className={`ui-pill ui-pill-${tone}`}>{text}</span>;
}

function AmountStack({ source_amount, module_amount }) {
  return (
    <div className="module-reconciliation-amount-stack">
      <div className="module-reconciliation-amount-row">
        <span className="module-reconciliation-amount-label">P&amp;L</span>
        <span className="module-reconciliation-amount-value">
          {format_currency(source_amount)}
        </span>
      </div>

      <div className="module-reconciliation-amount-row">
        <span className="module-reconciliation-amount-label">Module</span>
        <span className="module-reconciliation-amount-value">
          {format_currency(module_amount)}
        </span>
      </div>
    </div>
  );
}

// Real named-item breakdown (per-asset finance, or per-staff
// owner/director cost), plus how much of the gap it accounts for.
function NamedAmountBreakdown({ title, rows = [], note, gap_amount }) {
  if (rows.length === 0) return null;

  const breakdown_total = rows.reduce((sum, row) => sum + (row.amount || 0), 0);
  const remaining = gap_amount - breakdown_total;
  const is_fully_explained = Math.abs(remaining) < 50;

  return (
    <div className="ui-stack-sm">
      <p className="ui-kicker">{title}</p>
      <div className="module-reconciliation-amount-stack">
        {rows.map((row) => (
          <div key={row.id} className="module-reconciliation-amount-row">
            <span className="module-reconciliation-amount-label">
              {row.name}
            </span>
            <span className="module-reconciliation-amount-value">
              {format_currency(row.amount)}
            </span>
          </div>
        ))}
      </div>
      {note ? <p className="ui-help">{note}</p> : null}
      {typeof gap_amount === "number" ? (
        <p className="ui-help">
          {is_fully_explained
            ? `This accounts for the full ${format_currency(gap_amount)} gap.`
            : `This accounts for ${format_currency(breakdown_total)} of the ${format_currency(gap_amount)} gap. ${format_currency(remaining)} remains unexplained by this factor alone.`}
        </p>
      ) : null}
    </div>
  );
}

// One row for a single component (Labour, Asset Finance, or General
// Overheads) - uses the same cost-summary-drill-row class and
// active/muted states as the Cost Summary drill list, so hovering and
// clicking feels identical across the app.
function ComponentRow({
  check,
  is_open,
  is_hovered,
  is_muted,
  onHover,
  onClearHover,
  onToggle,
  asset_finance_breakdown = [],
  owner_director_breakdown = [],
}) {
  const is_asset_finance_check = check.id === "asset_finance_variance";
  const is_labour_check = check.id === "labour_variance";

  const has_asset_breakdown =
    is_asset_finance_check && asset_finance_breakdown.length > 0;
  const has_owner_breakdown =
    is_labour_check && owner_director_breakdown.length > 0;

  let possible_reasons = check.possible_reasons;

  if (has_asset_breakdown) {
    possible_reasons = (possible_reasons || []).filter(
      (reason) => !reason.startsWith("Asset not yet entered"),
    );
  }

  if (has_owner_breakdown) {
    possible_reasons = (possible_reasons || []).filter(
      (reason) => !reason.startsWith("Owner/director pay treatment"),
    );
  }

  const row_className = [
    "cost-summary-drill-row",
    "clickable",
    is_hovered || is_open ? "active" : "",
    is_muted ? "muted" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="ui-stack-sm">
      <button
        type="button"
        className={row_className}
        onClick={onToggle}
        onMouseEnter={onHover}
        onMouseLeave={onClearHover}
        onFocus={onHover}
        onBlur={onClearHover}
      >
        <div className="ui-stack-sm">
          <div className="cost-summary-drill-label">{check.label}</div>
          <Pill
            text={check.status === "pass" ? "Reconciled" : "Variance"}
            tone={check.status === "pass" ? "good" : "bad"}
          />
        </div>

        <div className="cost-summary-drill-value">
          <div className="ui-card-title-sm">
            {format_currency(check.variance_amount)}
          </div>
          <div className="ui-help">
            {is_open ? "Hide" : "Show breakdown"}
          </div>
        </div>
      </button>

      {is_open ? (
        <div className="business-summary-macro-drilldown ui-stack-sm">
          <AmountStack
            source_amount={check.source_amount}
            module_amount={check.module_amount}
          />

          <p className="ui-help">{check.detail}</p>

          {has_asset_breakdown ? (
            <NamedAmountBreakdown
              title="Assets with active finance"
              rows={asset_finance_breakdown.map((asset) => ({
                id: asset.asset_id,
                name: asset.asset_name,
                amount: asset.asset_interest_annual,
              }))}
              note="These assets show real finance interest in the Assets module. If the P&L benchmark above is $0, the most likely explanation is a classification or timing difference on the P&L side rather than a missing asset record."
              gap_amount={check.variance_amount}
            />
          ) : null}

          {has_owner_breakdown ? (
            <NamedAmountBreakdown
              title="Staff classified as Owner / Director"
              rows={owner_director_breakdown.map((staff) => ({
                id: staff.staff_id,
                name: staff.staff_name,
                amount: staff.annual_labour_cost,
              }))}
              note="This cost is real and classified as Owner/Director in the Labour module. If your P&L does not show a matching PAYE wages amount, this is a likely explanation for the gap - for example if this pay is treated as drawings rather than payroll."
              gap_amount={check.variance_amount}
            />
          ) : null}

          {Array.isArray(possible_reasons) && possible_reasons.length > 0 ? (
            <div className="ui-stack-sm">
              <p className="ui-kicker">
                {has_asset_breakdown || has_owner_breakdown
                  ? "Other possible reasons"
                  : "Possible reasons"}
              </p>
              <ul className="ui-help">
                {possible_reasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export default function ModuleReconciliationSummaryCard({
  reconciliation_ready = false,
  business_cost_check = null,
  component_checks = [],
  asset_finance_breakdown = [],
  owner_director_breakdown = [],
}) {
  // Whole group (Labour / Asset Finance / Overheads) hidden until the
  // Gap row is clicked - keeps the card compact by default.
  const [group_open, set_group_open] = useState(false);
  const [open_check_id, set_open_check_id] = useState(null);
  const [hovered_check_id, set_hovered_check_id] = useState(null);

  function toggle_check(check_id) {
    set_open_check_id((current) => (current === check_id ? null : check_id));
  }

  return (
    <section className="ui-section">
      <div className="ui-panel">
        <div className="ui-stack">
          <div>
            <p className="ui-kicker">Module Reconciliation</p>
            <h1 className="text-lg font-semibold text-[var(--text-primary)]">
              P&amp;L vs modules
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Compares what your P&amp;L says against what Labour, Assets,
              and General Overheads independently calculate, and shows where
              and why they differ.
            </p>
          </div>

          <div className="ui-actions">
            <Pill
              text={reconciliation_ready ? "Reconciled" : "Review required"}
              tone={reconciliation_ready ? "good" : "bad"}
            />
          </div>

          {business_cost_check ? (
            <div className="ui-stack-sm">
              <span className="ui-label">{business_cost_check.label}</span>

              <AmountStack
                source_amount={business_cost_check.source_amount}
                module_amount={business_cost_check.module_amount}
              />

              <button
                type="button"
                className={`business-summary-macro-row total ${group_open ? "is-active" : ""}`}
                onClick={() => set_group_open((current) => !current)}
              >
                <div className="business-summary-macro-row-label">
                  <div className="business-summary-macro-row-title">Gap</div>
                  <div className="business-summary-macro-row-help">
                    {group_open
                      ? "Click to hide the breakdown"
                      : "Click to see the three areas this is made up of"}
                  </div>
                </div>
                <div className="business-summary-macro-row-value">
                  {format_currency(business_cost_check.variance_amount)}
                  {business_cost_check.source_amount > 0
                    ? ` (${format_percent(business_cost_check.variance_percent)})`
                    : ""}
                </div>
              </button>
            </div>
          ) : null}

          {group_open ? (
            <div className="cost-summary-drill-list">
              {component_checks.map((check) => (
                <ComponentRow
                  key={check.id}
                  check={check}
                  is_open={open_check_id === check.id}
                  is_hovered={hovered_check_id === check.id}
                  is_muted={
                    Boolean(hovered_check_id) && hovered_check_id !== check.id
                  }
                  onHover={() => set_hovered_check_id(check.id)}
                  onClearHover={() => set_hovered_check_id(null)}
                  onToggle={() => toggle_check(check.id)}
                  asset_finance_breakdown={asset_finance_breakdown}
                  owner_director_breakdown={owner_director_breakdown}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}