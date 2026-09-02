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

export default function BusinessModellingLeverCard({
  headline,
  breakeven_summary,
  lever_rows,
  rate_target_by_group_id,
  onTargetRateChange,
}) {
  const [sources_open, set_sources_open] = useState(false);

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

  return (
    <div className="business-outcome-waterfall">
      <div className="business-outcome-headline">
        <div className="business-outcome-headline-eyebrow">What would it take to fix this?</div>
        <div className="business-outcome-headline-text">
          Your business is currently making{" "}
          <span className={headline.total_net_profit >= 0 ? "value-good" : "value-bad"}>
            {formatCurrency(headline.total_net_profit)}
          </span>{" "}
          in net profit.
          {headline.all_good ? (
            <> Every part of your business is paying its way.</>
          ) : (
            <>
              {" "}
              <span className="value-bad">
                {headline.carried_count} of {headline.total_source_count}
              </span>{" "}
              {headline.carried_count === 1 ? "source isn't" : "sources aren't"} paying its way.
            </>
          )}
        </div>

        {breakeven_summary?.available && !breakeven_summary.is_at_or_above_breakeven && (
          <div className="business-outcome-capacity-warning">
            <strong>
              To break even (net profit of $0), your business needs{" "}
              {formatCurrency(breakeven_summary.required_revenue_delta)} more in revenue at
              today's cost structure - from any combination of the levers below.
            </strong>
          </div>
        )}

        <button
          type="button"
          className="ui-button-secondary"
          onClick={() => set_sources_open((current) => !current)}
        >
          {sources_open ? "Hide breakdown" : "Show breakdown"}
        </button>

        {sources_open && (
          <div className="business-outcome-attention-list">
            {(headline.all_sources || []).map((entry) => (
              <div
                key={entry.key || entry.name}
                className={`business-outcome-attention-row ${entry.verdict === "paying_its_way" ? "paying" : ""}`}
              >
                <span className="business-outcome-attention-row-name">{entry.name}</span>
                <span className="business-outcome-attention-row-amount">
                  {formatCurrency(entry.net_profit)} / year
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="ui-panel ui-stack-sm" style={{ marginTop: "1rem" }}>
        <div className="ui-kicker">Rate levers, by operating group</div>
        <p className="ui-help">
          Adjust an operating group's blended rate to see the effect on that group and on your
          whole business. Hours stay the same - only the rate changes. Revenue is never typed in
          directly; it only ever moves because a rate moves.
        </p>

        {(lever_rows || []).map((row) => (
          <div key={row.group_id} className="ui-section-muted ui-stack-sm">
            <div className="ui-row-between">
              <div className="ui-card-title-sm">{row.group_name}</div>
              {!row.available && (
                <span className="ui-pill ui-pill-warning">{row.unavailable_reason}</span>
              )}
            </div>

            {row.available && (
              <>
                <div className="ui-row-between">
                  <span className="theme-text-secondary">Current rate</span>
                  <span className="ui-collapsible-value">{formatRate(row.current_rate_per_hour)}</span>
                </div>
                <div className="ui-row-between">
                  <span className="theme-text-secondary">
                    Rate needed to break even (this group alone)
                  </span>
                  <span className="ui-collapsible-value">{formatRate(row.breakeven_rate_per_hour)}</span>
                </div>

                <div className="ui-field">
                  <label className="ui-label" htmlFor={`target-rate-${row.group_id}`}>
                    Your target rate ($/hr)
                  </label>
                  <input
                    id={`target-rate-${row.group_id}`}
                    type="number"
                    step="0.01"
                    className="ui-input number-input"
                    placeholder={row.current_rate_per_hour !== null ? row.current_rate_per_hour.toFixed(2) : ""}
                    value={rate_target_by_group_id?.[row.group_id] ?? ""}
                    onChange={(e) => onTargetRateChange(row.group_id, e.target.value)}
                  />
                </div>

                {row.target_result && (
                  <div className="ui-row-between">
                    <span className="theme-text-secondary">Resulting whole-business net profit</span>
                    <span
                      className={row.target_result.total_net_profit >= 0 ? "value-good" : "value-bad"}
                    >
                      {formatCurrency(row.target_result.total_net_profit)}
                      {row.target_result.is_above_breakeven ? " (above breakeven)" : " (still a loss)"}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}