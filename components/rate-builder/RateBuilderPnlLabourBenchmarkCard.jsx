"use client";

import { useState } from "react";

import {
  format_currency,
  format_rate,
} from "@/lib/calculations/rateBuilderLabourRateCalculations";

function to_number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function format_multiplier_as_percent(value) {
  const parsed = to_number(value);
  return `${(parsed * 100).toFixed(1)}%`;
}

export default function RateBuilderPnlLabourBenchmarkCard({
  selected_labour_source = {},
  result = {},
  labour_unit_label = "hr",
}) {
  const [show_detail, set_show_detail] = useState(false);

  const pnl_implied_recovered_rate = to_number(
    selected_labour_source?.pnl_implied_recovered_rate
  );

  const pnl_recovery_gap_to_current_rate =
    to_number(result?.current_charge_out_rate) - pnl_implied_recovered_rate;

  const pnl_benchmark_ready = pnl_implied_recovered_rate > 0;

  const gross_profit = to_number(selected_labour_source?.gross_profit);
  const labour_recovery_pool = to_number(
    selected_labour_source?.labour_recovery_pool
  );
  const recovery_multiplier = to_number(
    selected_labour_source?.pnl_labour_recovery_multiplier
  );
  const total_productive_labour_cost = to_number(
    selected_labour_source?.total_productive_labour_cost
  );
  const total_productive_labour_hours = to_number(
    selected_labour_source?.total_productive_labour_hours
  );
  const source_cost_rate = to_number(selected_labour_source?.labour_cost_rate);

  const stripped_from_gross_profit = gross_profit - labour_recovery_pool;

  const labour_recovery_shortfall =
    total_productive_labour_cost - labour_recovery_pool;

  const has_labour_recovery_leak =
    pnl_benchmark_ready && labour_recovery_shortfall > 0;

  const labour_recovery_surplus =
    pnl_benchmark_ready && labour_recovery_shortfall < 0
      ? Math.abs(labour_recovery_shortfall)
      : 0;

  const unrecovered_labour_percent =
    1 - recovery_multiplier > 0 ? 1 - recovery_multiplier : 0;

  return (
    <>
      <div
        className={
          has_labour_recovery_leak
            ? "rate-builder-status-card rate-builder-status-card--bad"
            : "rate-builder-result-card"
        }
      >
        <p className="rate-builder-result-label">
          P&amp;L implied recovered rate
        </p>

        <p className="rate-builder-result-value">
          {pnl_benchmark_ready
            ? format_rate(pnl_implied_recovered_rate, labour_unit_label)
            : "Not ready yet"}
        </p>

        <p className="ui-help">
          This is what your current P&amp;L appears to recover for the selected
          labour type. It is a benchmark only, not a saved charge-out rate.
        </p>

        {pnl_benchmark_ready ? (
          <div className="rate-builder-labour-breakdown">
            <div className="rate-builder-labour-breakdown__row">
              <span>Labour cost recovered by P&amp;L</span>
              <strong>{format_multiplier_as_percent(recovery_multiplier)}</strong>
            </div>

            <div className="rate-builder-labour-breakdown__row">
              <span>
                {has_labour_recovery_leak
                  ? "Estimated labour recovery shortfall"
                  : "Estimated labour recovery surplus"}
              </span>
              <strong>
                {has_labour_recovery_leak
                  ? format_currency(labour_recovery_shortfall)
                  : format_currency(labour_recovery_surplus)}
              </strong>
            </div>
          </div>
        ) : null}

        {has_labour_recovery_leak ? (
          <p className="ui-help">
            Leak detected: the P&amp;L appears to recover only{" "}
            {format_multiplier_as_percent(recovery_multiplier)} of productive
            labour cost. The remaining {(unrecovered_labour_percent * 100).toFixed(1)}
            % is not being recovered by the current P&amp;L structure.
          </p>
        ) : null}

        <button
          type="button"
          className="ui-button-secondary"
          onClick={() => set_show_detail((current) => !current)}
        >
          {show_detail ? "Hide calculation" : "Show calculation"}
        </button>

        {show_detail ? (
          <div className="rate-builder-labour-breakdown">
            <div className="rate-builder-labour-breakdown__row">
              <span>P&amp;L gross profit</span>
              <strong>{format_currency(gross_profit)}</strong>
            </div>

            <div className="rate-builder-labour-breakdown__row">
              <span>Less net profit and non-labour overheads</span>
              <strong>{format_currency(stripped_from_gross_profit)}</strong>
            </div>

            <div className="rate-builder-labour-breakdown__row">
              <span>Labour recovery pool</span>
              <strong>{format_currency(labour_recovery_pool)}</strong>
            </div>

            <div className="rate-builder-labour-breakdown__row">
              <span>Total productive labour cost</span>
              <strong>{format_currency(total_productive_labour_cost)}</strong>
            </div>

            <div className="rate-builder-labour-breakdown__row">
              <span>Total productive labour hours</span>
              <strong>{total_productive_labour_hours.toFixed(2)} hrs</strong>
            </div>

            <div className="rate-builder-labour-breakdown__row">
              <span>Labour cost recovered by P&amp;L</span>
              <strong>{format_multiplier_as_percent(recovery_multiplier)}</strong>
            </div>

            <div className="rate-builder-labour-breakdown__row">
              <span>Recovery multiplier</span>
              <strong>{recovery_multiplier.toFixed(3)}x</strong>
            </div>

            <div className="rate-builder-labour-breakdown__row">
              <span>Selected labour cost rate</span>
              <strong>{format_rate(source_cost_rate, labour_unit_label)}</strong>
            </div>

            <div className="rate-builder-labour-breakdown__row">
              <span>P&amp;L implied recovered rate</span>
              <strong>
                {format_rate(pnl_implied_recovered_rate, labour_unit_label)}
              </strong>
            </div>

            <div className="rate-builder-labour-breakdown__row">
              <span>
                {has_labour_recovery_leak
                  ? "Labour recovery shortfall"
                  : "Labour recovery surplus"}
              </span>
              <strong>
                {has_labour_recovery_leak
                  ? format_currency(labour_recovery_shortfall)
                  : format_currency(labour_recovery_surplus)}
              </strong>
            </div>

            <p className="ui-help">
              Calculation: labour recovery pool ÷ total productive labour cost =
              recovery multiplier. Then selected labour cost rate × recovery
              multiplier = P&amp;L implied recovered rate.
            </p>

            <p className="ui-help">
              Meaning: your Labour module says productive labour costs{" "}
              {format_currency(total_productive_labour_cost)} per year. Your
              P&amp;L only leaves {format_currency(labour_recovery_pool)}{" "}
              available to recover labour after COG, net profit, and
              non-labour overheads are removed.
            </p>
          </div>
        ) : null}
      </div>

      <div
        className={
          pnl_benchmark_ready && pnl_recovery_gap_to_current_rate >= 0
            ? "rate-builder-status-card rate-builder-status-card--good"
            : "rate-builder-status-card rate-builder-status-card--bad"
        }
      >
        <p className="rate-builder-result-label">
          Current vs P&amp;L benchmark
        </p>

        <p className="rate-builder-result-value">
          {pnl_benchmark_ready
            ? pnl_recovery_gap_to_current_rate >= 0
              ? "Above P&L benchmark"
              : "Below P&L benchmark"
            : "Benchmark not ready"}
        </p>

        <p className="ui-help">
          {pnl_benchmark_ready
            ? `Gap: ${format_currency(
                pnl_recovery_gap_to_current_rate
              )} / ${labour_unit_label}`
            : "Complete P&L, General Overheads, and Labour setup to show this benchmark."}
        </p>
      </div>
    </>
  );
}