"use client";

import { useState } from "react";

function formatCurrency(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  const rounded = Math.round(value);
  const sign = rounded < 0 ? "-" : "";
  return `${sign}$${Math.abs(rounded).toLocaleString()}`;
}

function formatRate(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  return `$${value.toFixed(2)}/hr`;
}

function formatPercent(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  return `${value.toFixed(2)}%`;
}

// Builds ONE unified row list - every operating group plus Materials,
// same shape, so the accordion below can render them identically.
//
// FIX (2026-09-17): each row now defaults to its REAL current net
// profit (real_headline.all_sources - matches Business Outcome
// exactly), not the independent/no-cross-subsidy figure - the same
// "default to real, switch to modelled only once actually touched"
// principle as the headline banner above, now applied per-row instead
// of only at the total. A row only switches to the independent-with-
// target figure once THAT SPECIFIC row has its own target_result set
// (i.e. the user typed a target rate/markup for that row) - every
// other, untouched row keeps showing real data even while a sibling
// row is being modelled. Falls back to the independent headline entry
// only if the real one is genuinely unavailable (defensive).
function buildUnifiedRows({ headline, real_headline, lever_rows, materials_lever_row }) {
  const rows = [];

  (lever_rows || []).forEach((row) => {
    const has_own_target = Boolean(row.target_result);
    const real_entry = (real_headline?.all_sources || []).find((e) => e.key === row.group_id);
    const fallback_entry = (headline?.all_sources || []).find((e) => e.key === row.group_id);
    const resolved_entry = real_entry || fallback_entry;
    rows.push({
      id: row.group_id,
      name: row.group_name,
      is_materials: false,
      net_profit: has_own_target
        ? row.target_result.net_profit
        : (resolved_entry ? resolved_entry.net_profit : null),
      verdict: has_own_target
        ? (row.target_result.is_above_breakeven ? "paying_its_way" : "being_carried")
        : (resolved_entry ? resolved_entry.verdict : null),
      detail: row,
    });
  });

  if (materials_lever_row?.available) {
    const has_own_target = Boolean(materials_lever_row.target_result);
    const real_entry = (real_headline?.all_sources || []).find((e) => e.key === "materials");
    const fallback_entry = (headline?.all_sources || []).find((e) => e.key === "materials");
    const resolved_entry = real_entry || fallback_entry;
    rows.push({
      id: "materials",
      name: materials_lever_row.group_name,
      is_materials: true,
      net_profit: has_own_target
        ? materials_lever_row.target_result.net_profit
        : (resolved_entry ? resolved_entry.net_profit : null),
      verdict: has_own_target
        ? (materials_lever_row.target_result.is_above_breakeven ? "paying_its_way" : "being_carried")
        : (resolved_entry ? resolved_entry.verdict : null),
      detail: materials_lever_row,
    });
  }

  return rows;
}

export default function BusinessModellingLeverCard({
  headline,
  real_headline,
  breakeven_summary,
  lever_rows,
  rate_target_by_group_id,
  onTargetRateChange,
  proportional_suggestions,
  onApplyProportional,
  materials_lever_row,
  materials_markup_percent,
  onMaterialsMarkupChange,
}) {
  const [open_row_id, set_open_row_id] = useState(null);

  if (!headline?.available) {
    return (
      <div className="ui-panel">
        <div className="ui-help">
          Business Outcome data isn't ready yet - set up Cost Allocation and Rate Builder first,
          then this card will show your real current position and rate levers here.
        </div>
      </div>
    );
  }

  // FIX (2026-09-17, same problem flagged earlier this session and
  // never actually built before the rebuild-discovery detour): this
  // headline must default to the REAL, reconciled figure
  // (real_headline, per_source.headline_real_capacity) whenever no
  // lever has been touched yet - matching the real card above it
  // exactly. It only switches to the independent ("if this stood
  // alone") figure once the user has actually entered a target rate or
  // markup. Without this, the page opened on a hypothetical number that
  // could look wildly different from $0 real net profit with zero user
  // input, which is genuinely misleading, not just a labelling nuance.
  const has_lever_input =
    Object.values(rate_target_by_group_id || {}).some(
      (v) => v !== undefined && v !== null && v !== ""
    ) ||
    (materials_markup_percent !== undefined &&
      materials_markup_percent !== null &&
      materials_markup_percent !== "");

  // FIX (2026-09-17): headline_real_capacity (what real_headline
  // actually is) has never had an "available" field - only the
  // independent headline does. Checking real_headline?.available was
  // always undefined/falsy, so this silently fell back to the
  // independent value every time, while the text template above (which
  // only depends on has_lever_input) still showed the "real" phrasing -
  // real-sounding text with the wrong number underneath. Check for a
  // real numeric total instead.
  const display_headline =
    !has_lever_input && real_headline && typeof real_headline.total_net_profit === "number"
      ? real_headline
      : headline;

  const unified_rows = buildUnifiedRows({ headline, real_headline, lever_rows, materials_lever_row });

  function toggle_row(id) {
    set_open_row_id((current) => (current === id ? null : id));
  }

  return (
    <div className="business-outcome-waterfall">
      <div className="business-outcome-headline">
        <div className="business-outcome-headline-eyebrow">
          {has_lever_input ? "What would it take to fix this?" : "Where the business actually is"}
        </div>
        <div className="business-outcome-headline-text">
          {has_lever_input ? (
            <>
              If these changes were applied, net profit would be{" "}
              <span className={display_headline.total_net_profit >= 0 ? "value-good" : "value-bad"}>
                {formatCurrency(display_headline.total_net_profit)}
              </span>{" "}
              per year.
              {display_headline.all_good ? (
                <> Every part of your business would be paying its way.</>
              ) : (
                <>
                  {" "}
                  <span className="value-bad">
                    {display_headline.carried_count} of {display_headline.total_source_count}
                  </span>{" "}
                  {display_headline.carried_count === 1 ? "source still isn't" : "sources still aren't"} paying its way.
                </>
              )}
            </>
          ) : (
            <>
              Right now, your business is making{" "}
              <span className={display_headline.total_net_profit >= 0 ? "value-good" : "value-bad"}>
                {formatCurrency(display_headline.total_net_profit)}
              </span>{" "}
              in net profit.
              {display_headline.all_good ? (
                <> Every part is pulling its weight.</>
              ) : (
                <>
                  {" "}
                  <span className="value-bad">
                    {display_headline.being_carried_count} of {display_headline.total_group_count}
                  </span>{" "}
                  {display_headline.being_carried_count === 1 ? "source is" : "sources are"} currently being carried by
                  the rest of the business.
                </>
              )}
            </>
          )}
        </div>

        {has_lever_input && breakeven_summary?.available && !breakeven_summary.is_at_or_above_breakeven && (
          <div className="business-outcome-capacity-warning">
            <strong>
              To break even (net profit of $0), your business needs{" "}
              {formatCurrency(breakeven_summary.required_revenue_delta)} more in revenue at
              today's cost structure - from any combination of the levers below.
            </strong>
          </div>
        )}
      </div>

      <div className="ui-panel ui-stack-sm" style={{ marginTop: "1rem" }}>
        <div className="ui-kicker">Every source, click one to adjust it</div>
        <p className="ui-help">
          Each row below shows its real current position until you set a target for it - then
          that row alone is tested purely against its own cost, not shared with any other
          source. Click a row to see its breakeven and set a target. Only one row is open at a
          time. Hours stay the same - only the rate or markup changes.
        </p>

        {proportional_suggestions?.available && !proportional_suggestions.already_at_or_above_breakeven && (
          <div className="ui-section-muted ui-stack-sm">
            <p className="ui-help">
              Or, fill in a fix shared across every currently-profitable group at once, weighted
              the same way Business Outcome's own numbers already weight a shortfall - bigger
              contributors take a bigger share, all moving together rather than one group alone.
            </p>
            <button type="button" className="ui-button-primary" onClick={onApplyProportional}>
              Fill in a proportional fix
            </button>
          </div>
        )}

        {proportional_suggestions?.available && proportional_suggestions.already_at_or_above_breakeven && (
          <p className="ui-help">Already at or above breakeven - no fix needed.</p>
        )}

        {unified_rows.map((row) => {
          const is_open = open_row_id === row.id;
          const detail = row.detail;

          return (
            <div key={row.id} className="ui-section-muted ui-stack-sm">
              <button
                type="button"
                className="ui-row-between ui-accordion-header"
                onClick={() => toggle_row(row.id)}
                style={{ width: "100%", textAlign: "left", background: "none", border: "none", cursor: "pointer" }}
              >
                <div className="ui-card-title-sm">{row.name}</div>
                <div className="ui-row-between" style={{ gap: "0.75rem" }}>
                  {!detail.available && (
                    <span className="ui-pill ui-pill-warning">{detail.unavailable_reason}</span>
                  )}
                  {detail.available && (
                    <span className={row.net_profit >= 0 ? "value-good" : "value-bad"}>
                      {formatCurrency(row.net_profit)}
                    </span>
                  )}
                  <span aria-hidden="true">{is_open ? "\u25BE" : "\u25B8"}</span>
                </div>
              </button>

              {is_open && detail.available && !row.is_materials && (
                <>
                  <div className="ui-row-between">
                    <span className="theme-text-secondary">Current rate</span>
                    <span className="ui-collapsible-value">{formatRate(detail.current_rate_per_hour)}</span>
                  </div>
                  <div className="ui-row-between">
                    <span className="theme-text-secondary">
                      Rate needed to break even (this group alone)
                    </span>
                    <span className="ui-collapsible-value">{formatRate(detail.breakeven_rate_per_hour)}</span>
                  </div>

                  <div className="ui-field">
                    <label className="ui-label" htmlFor={`target-rate-${row.id}`}>
                      Your target rate ($/hr)
                    </label>
                    <input
                      id={`target-rate-${row.id}`}
                      type="number"
                      step="0.01"
                      className="ui-input number-input"
                      placeholder={detail.breakeven_rate_per_hour !== null ? detail.breakeven_rate_per_hour.toFixed(2) : ""}
                      value={rate_target_by_group_id?.[row.id] ?? ""}
                      onChange={(e) => onTargetRateChange(row.id, e.target.value)}
                    />
                  </div>

                  {detail.target_result && (
                    <div className="ui-row-between">
                      <span className="theme-text-secondary">Resulting net profit for this group</span>
                      <span
                        className={detail.target_result.net_profit >= 0 ? "value-good" : "value-bad"}
                      >
                        {formatCurrency(detail.target_result.net_profit)}
                        {detail.target_result.is_above_breakeven ? " (above breakeven)" : " (still a loss)"}
                      </span>
                    </div>
                  )}
                </>
              )}

              {is_open && detail.available && row.is_materials && (
                <>
                  <div className="ui-row-between">
                    <span className="theme-text-secondary">Current markup on cost</span>
                    <span className="ui-collapsible-value">{formatPercent(detail.current_markup_percent)}</span>
                  </div>
                  <div className="ui-row-between">
                    <span className="theme-text-secondary">
                      Markup needed to break even (materials alone)
                    </span>
                    <span className="ui-collapsible-value">{formatPercent(detail.breakeven_markup_percent)}</span>
                  </div>

                  <div className="ui-field">
                    <label className="ui-label" htmlFor="materials-markup-target">
                      Your target markup (%)
                    </label>
                    <input
                      id="materials-markup-target"
                      type="number"
                      step="0.01"
                      className="ui-input number-input"
                      placeholder={detail.breakeven_markup_percent !== null ? detail.breakeven_markup_percent.toFixed(2) : ""}
                      value={materials_markup_percent ?? ""}
                      onChange={(e) => onMaterialsMarkupChange(e.target.value)}
                    />
                  </div>

                  {detail.target_result && (
                    <div className="ui-row-between">
                      <span className="theme-text-secondary">Resulting net profit for materials</span>
                      <span
                        className={detail.target_result.net_profit >= 0 ? "value-good" : "value-bad"}
                      >
                        {formatCurrency(detail.target_result.net_profit)}
                        {detail.target_result.is_above_breakeven ? " (above breakeven)" : " (still a loss)"}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}