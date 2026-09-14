"use client";

import { useState } from "react";
import CollapsibleSection from "@/components/common/CollapsibleSection";
import { buildUpsideHeadline } from "@/lib/calculations/businessModellingScenarioCalculations";

function format_currency(value) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return "N/A";
  const sign = Number(value) < 0 ? "-" : "";
  const abs = Math.abs(Number(value));
  return `${sign}${new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    maximumFractionDigits: 0,
  }).format(abs)}`;
}

/**
 * BusinessModellingScenarioSection
 *
 * Built 2026-09-13 per BUSINESS_MODELLING_SCENARIO_REDESIGN_DECISION_LOCK_2026-09-12.txt.
 * Baseline: real, locked, dated - never a live-editable guess. Upside:
 * a saved target, using the live-lever engine's own real levers.
 * Downside: always calculated live as breakeven, never stored.
 */
export default function BusinessModellingScenarioSection({
  per_source,
  current_baseline,
  downside,
  upside_scenario,
  baseline_history,
  lockNewBaseline,
  revertToBaseline,
  saveUpsideScenario,
  clearUpsideScenario,
  current_rate_target_by_group_id,
  current_materials_markup_percent,
}) {
  const [new_baseline_label, set_new_baseline_label] = useState("");

  const upside_headline = buildUpsideHeadline(per_source, upside_scenario);

  function handle_lock_baseline() {
    lockNewBaseline(new_baseline_label);
    set_new_baseline_label("");
  }

  function handle_save_upside() {
    saveUpsideScenario({
      rate_target_by_group_id: current_rate_target_by_group_id,
      materials_markup_percent: current_materials_markup_percent,
    });
  }

  const downside_message = downside.available
    ? downside.direction === "below"
      ? `${format_currency(downside.distance_from_baseline)} of profit could be lost before hitting breakeven.`
      : `${format_currency(downside.distance_from_baseline)} more revenue is needed to reach breakeven.`
    : null;

  return (
    <div className="business-outcome-ledger">
      <div className="business-outcome-ledger-section-title">Baseline / Upside / Downside</div>

      <div className="business-outcome-ledger-metrics">
        <div className="business-outcome-ledger-metric">
          <span className="business-outcome-ledger-metric-label">Baseline</span>
          {current_baseline ? (
            <>
              <span className="business-outcome-ledger-metric-value">
                {format_currency(current_baseline.snapshot.total_net_profit)}
              </span>
              <span className="business-outcome-ledger-metric-description">
                {current_baseline.label}, locked {new Date(current_baseline.locked_at).toLocaleDateString("en-NZ")}.
                Where the business actually is right now.
              </span>
            </>
          ) : (
            <span className="ui-help">No baseline locked yet.</span>
          )}
        </div>

        <div className="business-outcome-ledger-metric">
          <span className="business-outcome-ledger-metric-label">Upside (target)</span>
          {upside_headline.available ? (
            <>
              <span className="business-outcome-ledger-metric-value">
                {format_currency(upside_headline.total_net_profit)}
              </span>
              <span className="business-outcome-ledger-metric-description">
                Your saved target scenario, using real levers.
              </span>
            </>
          ) : (
            <span className="ui-help">No target saved yet.</span>
          )}
        </div>

        <div className="business-outcome-ledger-metric">
          <span className="business-outcome-ledger-metric-label">Downside (breakeven)</span>
          {downside.available ? (
            <>
              <span className="business-outcome-ledger-metric-value">{format_currency(downside.revenue)}</span>
              <span className="business-outcome-ledger-metric-description">{downside_message}</span>
            </>
          ) : (
            <span className="ui-help">Lock a Baseline first.</span>
          )}
        </div>
      </div>

      <div className="ui-actions" style={{ marginTop: "0.75rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <input
          className="ui-input"
          type="text"
          placeholder="Label (e.g. Q1 2027)"
          value={new_baseline_label}
          onChange={(e) => set_new_baseline_label(e.target.value)}
          style={{ maxWidth: "12rem" }}
        />
        <button type="button" className="ui-button-secondary" onClick={handle_lock_baseline}>
          Lock New Baseline
        </button>
        <button type="button" className="ui-button-secondary" onClick={handle_save_upside}>
          Save Current Levers as Upside
        </button>
        {upside_scenario && (
          <button type="button" className="ui-button-secondary" onClick={clearUpsideScenario}>
            Clear Upside
          </button>
        )}
      </div>

      {baseline_history.length > 0 && (
        <CollapsibleSection title={`Baseline History (${baseline_history.length})`} defaultOpen={false}>
          <div className="business-outcome-ledger-table">
            <div className="business-outcome-ledger-row business-outcome-ledger-header">
              <span>Label</span>
              <span>Net Profit</span>
              <span>Locked</span>
              <span></span>
            </div>
            {[...baseline_history].reverse().map((b) => (
              <div className="business-outcome-ledger-row" key={b.baseline_id} style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr" }}>
                <span>{b.label} {b.is_current && "(current)"}</span>
                <span>{format_currency(b.snapshot.total_net_profit)}</span>
                <span>{new Date(b.locked_at).toLocaleDateString("en-NZ")}</span>
                <span>
                  {!b.is_current && (
                    <button type="button" className="ui-button-secondary" onClick={() => revertToBaseline(b.baseline_id)}>
                      Revert to this
                    </button>
                  )}
                </span>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}
    </div>
  );
}