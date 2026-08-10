"use client";

import { useState } from "react";
import Link from "next/link";

const CHECK_ID_TO_MODULE_ROUTE = {
  labour_variance: { href: "/labour", label: "Labour" },
  asset_finance_variance: { href: "/assets", label: "Assets" },
  general_overheads_variance: {
    href: "/general-overheads",
    label: "General Overheads",
  },
};

function format_currency(value) {
  const rounded = Math.round(Number(value || 0));
  const sign = rounded < 0 ? "-" : "";
  return `${sign}$${Math.abs(rounded).toLocaleString()}`;
}

function format_percent(value) {
  return `${Number(value || 0).toFixed(1)}%`;
}

function format_date(iso_string) {
  if (!iso_string) return "";
  const date = new Date(iso_string);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-NZ", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function Pill({ text, tone = "ok", onClick }) {
  if (!onClick) {
    return <span className={`ui-pill ui-pill-${tone}`}>{text}</span>;
  }

  return (
    <button type="button" onClick={onClick} style={{ all: "unset", cursor: "pointer" }}>
      <span className={`ui-pill ui-pill-${tone}`}>{text}</span>
    </button>
  );
}

// S20/S21/S22: one pill treatment per check status. timing_expected,
// accepted, and covered are all non-blocking, non-warning states with
// a specific explanation behind them (system-inferred timing lag,
// user-confirmed acceptance, or a verified coverage relationship) -
// all three use the "good" tone (no separate CSS tone is confirmed to
// exist for further distinct colours) but distinct text, so they
// remain visually distinguishable from each other and from a genuine
// unresolved "Variance".
function get_pill_props(check) {
  if (check.status === "pass") return { text: "Reconciled", tone: "good" };
  if (check.status === "timing_expected") return { text: "Expected", tone: "good" };
  if (check.status === "accepted") return { text: "Accepted", tone: "good" };
  if (check.status === "covered") return { text: "Covered", tone: "good" };
  return { text: "Variance", tone: "bad" };
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
function get_breakdown_summary_text(breakdown_total, gap_amount) {
  if (typeof gap_amount !== "number") return null;

  // Module is not currently higher than P&L (gap_amount <= 0), so a
  // cost-adding factor like this cannot be "explaining" the current
  // gap - other differences must be offsetting it in the other
  // direction. Saying otherwise (with a signed subtraction) produces
  // nonsense like "$-151,526 remains unexplained".
  if (gap_amount <= 0) {
    return `This is a real cost of ${format_currency(breakdown_total)}, but the module total is not currently higher than the P&L, so this factor alone does not explain the current gap - other differences are offsetting it.`;
  }

  const remaining = gap_amount - breakdown_total;

  if (Math.abs(remaining) < 50) {
    return `This accounts for the full ${format_currency(gap_amount)} gap.`;
  }

  if (remaining > 0) {
    return `This accounts for ${format_currency(breakdown_total)} of the ${format_currency(gap_amount)} gap. ${format_currency(remaining)} remains unexplained by this factor alone.`;
  }

  return `This factor alone (${format_currency(breakdown_total)}) is larger than the full ${format_currency(gap_amount)} gap, meaning other differences are offsetting part of it.`;
}

function NamedAmountBreakdown({ title, rows = [], note, gap_amount }) {
  if (rows.length === 0) return null;

  const breakdown_total = rows.reduce((sum, row) => sum + (row.amount || 0), 0);
  const summary_text = get_breakdown_summary_text(breakdown_total, gap_amount);

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
      {summary_text ? <p className="ui-help">{summary_text}</p> : null}
    </div>
  );
}

// S20: inline form to accept a specific "warn" check. Reason is
// required - an acceptance with no reason recorded defeats the point
// (S20 section 1: "on the record", not "hidden"). Inline styles are
// used for the textarea rather than a guessed CSS class, since no
// existing textarea styling convention was confirmed in this codebase.
function AcceptCheckForm({ check_id, current_variance_amount, on_accept }) {
  const [reason, set_reason] = useState("");
  const [submitting, set_submitting] = useState(false);

  function handle_submit(event) {
    event.preventDefault();
    const trimmed = reason.trim();
    if (!trimmed || submitting) return;

    set_submitting(true);
    on_accept({
      check_id,
      accepted_variance_amount: current_variance_amount,
      reason: trimmed,
    });
  }

  return (
    <form className="ui-stack-sm" onSubmit={handle_submit}>
      <label className="ui-kicker" htmlFor={`accept-reason-${check_id}`}>
        Accept this variance - reason (required)
      </label>
      <textarea
        id={`accept-reason-${check_id}`}
        value={reason}
        onChange={(event) => set_reason(event.target.value)}
        placeholder="Why is this number correct as-is?"
        rows={2}
        style={{
          width: "100%",
          background: "rgba(255,255,255,0.06)",
          color: "inherit",
          border: "1px solid rgba(255,255,255,0.18)",
          borderRadius: "6px",
          padding: "8px",
          font: "inherit",
          resize: "vertical",
        }}
      />
      <button
        type="submit"
        className="ui-button-secondary"
        style={{ width: "fit-content" }}
        disabled={!reason.trim() || submitting}
      >
        Accept
      </button>
    </form>
  );
}

// S20: shown once a check has been accepted and the number hasn't
// moved since - the reason and date sit alongside the real numbers,
// not instead of them (S20 section 11).
function AcceptedNote({ reason, accepted_at }) {
  return (
    <div className="ui-stack-sm">
      <p className="ui-kicker">Accepted</p>
      <p className="ui-help">
        {format_date(accepted_at)} - &quot;{reason}&quot;
      </p>
    </div>
  );
}

// S20 section 6/9: shown when a check was previously accepted but the
// underlying source data has since changed - the old acceptance no
// longer describes what's here, so it doesn't silently apply, but its
// history stays visible rather than disappearing without a trace.
function StaleAcceptanceNote({ stale_acceptance }) {
  if (!stale_acceptance) return null;

  return (
    <div className="ui-stack-sm">
      <p className="ui-kicker">Previously accepted</p>
      <p className="ui-help">
        Accepted {format_date(stale_acceptance.accepted_at)} - &quot;
        {stale_acceptance.reason}&quot;. The number has changed since then,
        so this needs a fresh look.
      </p>
    </div>
  );
}

// One row for a single component check (Labour, Asset Finance, or
// General Overheads), or a nested sub-check (Wages, On-costs) drilling
// down under Labour. depth > 0 renders as an indented child row using
// the same open/hover state lifted from the parent card, so a
// sub-check behaves identically to a top-level one - same click,
// hover, and expand behaviour, just visually nested and without its
// own "Go to X" button (the parent's button already covers it).
function ComponentRow({
  check,
  depth = 0,
  open_check_ids,
  hovered_check_id,
  set_hovered_check_id,
  toggle_check,
  on_accept,
  asset_finance_breakdown = [],
  owner_director_breakdown = [],
}) {
  const is_open = open_check_ids.includes(check.id);
  const is_hovered = hovered_check_id === check.id;
  const is_muted = Boolean(hovered_check_id) && hovered_check_id !== check.id;

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

  const has_sub_checks =
    Array.isArray(check.sub_checks) && check.sub_checks.length > 0;

  // S20 section 3: only plain "warn", non-blocking checks are eligible
  // for Accept. pass/timing_expected/accepted/blocking all render no
  // accept form - nothing to accept, or not eligible.
  const is_accept_eligible = check.status === "warn" && !check.is_blocking;

  const pill = get_pill_props(check);

  const row_className = [
    "cost-summary-drill-row",
    "clickable",
    is_hovered || is_open ? "active" : "",
    is_muted ? "muted" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="ui-stack-sm" style={depth > 0 ? { marginLeft: "1.25rem" } : undefined}>
      <button
        type="button"
        className={row_className}
        onClick={() => toggle_check(check.id)}
        onMouseEnter={() => set_hovered_check_id(check.id)}
        onMouseLeave={() => set_hovered_check_id(null)}
        onFocus={() => set_hovered_check_id(check.id)}
        onBlur={() => set_hovered_check_id(null)}
      >
        <div className="ui-stack-sm">
          <div className="cost-summary-drill-label">{check.label}</div>
          <Pill text={pill.text} tone={pill.tone} />
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

          {depth === 0 &&
          check.status !== "pass" &&
          CHECK_ID_TO_MODULE_ROUTE[check.id] ? (
            <Link
              href={CHECK_ID_TO_MODULE_ROUTE[check.id].href}
              className="ui-button-secondary"
              style={{ width: "fit-content" }}
            >
              Go to {CHECK_ID_TO_MODULE_ROUTE[check.id].label}
            </Link>
          ) : null}

          {has_asset_breakdown ? (
            <NamedAmountBreakdown
              title="Assets with active finance"
              rows={asset_finance_breakdown.map((asset) => ({
                id: asset.asset_id,
                name: asset.asset_name,
                amount: asset.asset_interest_annual,
              }))}
              note={
                check.is_coverage_check
                  ? "These assets make up the Assets module's total finance interest, which is being checked for coverage within your P&L's total interest figure above."
                  : "These assets show real finance interest in the Assets module. If the P&L benchmark above is $0, the most likely explanation is a classification or timing difference on the P&L side rather than a missing asset record."
              }
              gap_amount={check.is_coverage_check ? null : check.variance_amount}
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

          {check.status === "accepted" ? (
            <AcceptedNote
              reason={check.accepted_reason}
              accepted_at={check.accepted_at}
            />
          ) : null}

          {check.stale_acceptance ? (
            <StaleAcceptanceNote stale_acceptance={check.stale_acceptance} />
          ) : null}

          {is_accept_eligible && on_accept ? (
            <AcceptCheckForm
              check_id={check.id}
              current_variance_amount={check.variance_amount}
              on_accept={on_accept}
            />
          ) : null}

          {has_sub_checks ? (
            <div className="ui-stack-sm">
              <p className="ui-kicker">Breakdown</p>
              {check.sub_checks.map((sub_check) => (
                <ComponentRow
                  key={sub_check.id}
                  check={sub_check}
                  depth={depth + 1}
                  open_check_ids={open_check_ids}
                  hovered_check_id={hovered_check_id}
                  set_hovered_check_id={set_hovered_check_id}
                  toggle_check={toggle_check}
                  on_accept={on_accept}
                  asset_finance_breakdown={asset_finance_breakdown}
                  owner_director_breakdown={owner_director_breakdown}
                />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

// Every issue that should count toward the Warnings pill and get
// auto-expanded when it's clicked - a top-level check's own warning,
// plus any warning among its sub_checks (S21 wages/on-costs split).
// "accepted" checks are never is_warning (per the reconciliationRules.js
// overlay), so they're correctly excluded here with no extra logic.
function get_all_warning_checks(component_checks) {
  return component_checks.flatMap((check) => [
    check,
    ...(Array.isArray(check.sub_checks) ? check.sub_checks : []),
  ]).filter((check) => check.is_warning && !check.is_blocking);
}

// IDs to auto-open when the Warnings pill is clicked: the parent
// check id (so the group is visible) plus every warning sub-check id
// (so the actual issue is expanded, not just its parent).
function get_warning_open_ids(component_checks) {
  const ids = [];

  component_checks.forEach((check) => {
    const sub_checks = Array.isArray(check.sub_checks) ? check.sub_checks : [];
    const warning_sub_checks = sub_checks.filter(
      (sub) => sub.is_warning && !sub.is_blocking,
    );
    const has_own_warning = check.is_warning && !check.is_blocking;

    if (has_own_warning || warning_sub_checks.length > 0) {
      ids.push(check.id);
    }

    warning_sub_checks.forEach((sub) => ids.push(sub.id));
  });

  return ids;
}

export default function ModuleReconciliationSummaryCard({
  reconciliation_ready = false,
  business_cost_check = null,
  component_checks = [],
  asset_finance_breakdown = [],
  owner_director_breakdown = [],
  accept_check = null,
}) {
  // Whole group (Labour / Asset Finance / Overheads) hidden until the
  // Gap row (or a Blocking/Warnings pill) is clicked - keeps the card
  // compact by default. One shared piece of state, multiple triggers.
  const [group_open, set_group_open] = useState(false);
  const [open_check_ids, set_open_check_ids] = useState([]);
  const [hovered_check_id, set_hovered_check_id] = useState(null);

  function toggle_check(check_id) {
    set_open_check_ids((current) =>
      current.includes(check_id)
        ? current.filter((id) => id !== check_id)
        : [...current, check_id],
    );
  }

  const warning_checks = get_all_warning_checks(component_checks);
  const blocking_count = business_cost_check?.is_blocking ? 1 : 0;
  const warning_count = warning_checks.length;

  // Blocking pill: open the group and show the plain-English blocking
  // explanation (rendered below regardless, once group is open).
  function open_for_blocking() {
    set_group_open(true);
  }

  // Warnings pill: open the group AND auto-expand every row that is
  // actually a warning (including nested sub-checks), so the messages
  // are visible immediately rather than needing a second click per row.
  function open_for_warnings() {
    set_group_open(true);
    set_open_check_ids((current) => {
      const warning_ids = get_warning_open_ids(component_checks);
      const merged = new Set([...current, ...warning_ids]);
      return Array.from(merged);
    });
  }

  return (
    <div className="ui-stack">
      <div className="ui-hero">
        <div className="ui-hero-inner">
          <p className="ui-kicker">Module Reconciliation</p>
          <h1 className="ui-hero-title">P&amp;L vs modules</h1>
          <p className="ui-hero-copy">
            Compares what your P&amp;L says against what Labour, Assets, and
            General Overheads independently calculate, and shows where and
            why they differ.
          </p>
        </div>
      </div>

      <section className="ui-section">
      <div className="ui-panel">
        <div className="ui-stack">
          <div>
            <p className="ui-kicker">Reconciliation Summary</p>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              Current reconciliation position
            </h2>
            <p className="text-sm text-[var(--text-secondary)]">
              Read-only comparison of P&amp;L and module-calculated business
              costs.
            </p>
          </div>

          <div className="ui-actions">
            <Pill
              text={reconciliation_ready ? "Reconciled" : "Review required"}
              tone={reconciliation_ready ? "good" : "bad"}
            />
            <Pill
              text={`Blocking: ${blocking_count}`}
              tone={blocking_count > 0 ? "bad" : "good"}
              onClick={blocking_count > 0 ? open_for_blocking : undefined}
            />
            <Pill
              text={`Warnings: ${warning_count}`}
              tone={warning_count > 0 ? "bad" : "good"}
              onClick={warning_count > 0 ? open_for_warnings : undefined}
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

              {group_open && business_cost_check.is_blocking ? (
                <div className="business-summary-macro-note">
                  <p className="ui-help">
                    This gap is blocking - the model is not trusted for
                    downstream pages until it is explained or corrected.{" "}
                    {business_cost_check.recommended_action ||
                      "Review Labour, Assets, General Overheads, and P&L classification below."}
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}

          {group_open ? (
            <div className="cost-summary-drill-list">
              {component_checks.map((check) => (
                <ComponentRow
                  key={check.id}
                  check={check}
                  depth={0}
                  open_check_ids={open_check_ids}
                  hovered_check_id={hovered_check_id}
                  set_hovered_check_id={set_hovered_check_id}
                  toggle_check={toggle_check}
                  on_accept={accept_check}
                  asset_finance_breakdown={asset_finance_breakdown}
                  owner_director_breakdown={owner_director_breakdown}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
      </section>
    </div>
  );
}
