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

function format_percent(value) {
  return `${to_number(value).toFixed(1)}%`;
}

export default function RateBuilderMinimumRecoveryCard({
  selected_labour_source = {},
  labour_unit_label = "hr",
}) {
  const [show_build_up, set_show_build_up] = useState(false);

  const labour_cost_rate = to_number(selected_labour_source.labour_cost_rate);

  const non_productive_labour_pressure_rate = to_number(
    selected_labour_source.non_productive_labour_pressure_rate ??
      selected_labour_source.non_productive_labour_recovery_rate
  );

  const allocated_business_overhead_recovery_rate = to_number(
    selected_labour_source.allocated_business_overhead_recovery_rate
  );

  const minimum_recoverable_charge_out_rate = to_number(
    selected_labour_source.minimum_recoverable_charge_out_rate
  );

  const total_non_productive_labour_cost = to_number(
    selected_labour_source.total_non_productive_labour_cost
  );

  const total_productive_labour_hours = to_number(
    selected_labour_source.total_productive_labour_hours
  );

  const labour_allocated_business_overhead_pool = to_number(
    selected_labour_source.labour_allocated_business_overhead_pool
  );

  const total_business_overheads = to_number(
    selected_labour_source.total_business_overheads
  );

  const labour_share_percent = to_number(
    selected_labour_source.labour_share_percent
  );

  return (
    <div className="rate-builder-result-card">
      <p className="rate-builder-result-label">
        Minimum recoverable charge-out rate
      </p>

      <p className="rate-builder-result-value">
        {format_rate(minimum_recoverable_charge_out_rate, labour_unit_label)}
      </p>

      <p className="ui-help">
        Includes true productive labour cost and allocated business overhead
        recovery. Non-productive labour is shown as business recovery pressure,
        but is not added to this charge-out rate.
      </p>

      <button
        type="button"
        className="ui-button-secondary"
        onClick={() => set_show_build_up((current) => !current)}
      >
        {show_build_up ? "Hide build-up" : "Show build-up"}
      </button>

      {show_build_up ? (
        <div className="rate-builder-labour-breakdown">
          <div className="rate-builder-labour-breakdown__row">
            <span>True productive labour cost</span>
            <strong>{format_rate(labour_cost_rate, labour_unit_label)}</strong>
          </div>

          <div className="rate-builder-labour-breakdown__row">
            <span>Allocated business overhead recovery</span>
            <strong>
              {format_rate(
                allocated_business_overhead_recovery_rate,
                labour_unit_label
              )}
            </strong>
          </div>

          <div className="rate-builder-labour-breakdown__row">
            <span>Minimum recoverable rate</span>
            <strong>
              {format_rate(
                minimum_recoverable_charge_out_rate,
                labour_unit_label
              )}
            </strong>
          </div>

          <div className="rate-builder-labour-breakdown__row">
            <span>Non-productive labour pressure</span>
            <strong>
              {format_rate(
                non_productive_labour_pressure_rate,
                labour_unit_label
              )}
            </strong>
          </div>

          <div className="rate-builder-labour-breakdown__row">
            <span>Total non-productive labour cost</span>
            <strong>{format_currency(total_non_productive_labour_cost)}</strong>
          </div>

          <div className="rate-builder-labour-breakdown__row">
            <span>Total productive labour hours</span>
            <strong>{total_productive_labour_hours.toFixed(2)} hrs</strong>
          </div>

          <div className="rate-builder-labour-breakdown__row">
            <span>Total business overheads</span>
            <strong>{format_currency(total_business_overheads)}</strong>
          </div>

          <div className="rate-builder-labour-breakdown__row">
            <span>Labour recovery share</span>
            <strong>{format_percent(labour_share_percent)}</strong>
          </div>

          <div className="rate-builder-labour-breakdown__row">
            <span>Business overhead allocated to labour</span>
            <strong>
              {format_currency(labour_allocated_business_overhead_pool)}
            </strong>
          </div>

          <p className="ui-help">
            Calculation: true productive labour cost + allocated business
            overhead recovery. Non-productive labour is handled through gross
            profit / business recovery unless deliberately assigned to labour.
          </p>
        </div>
      ) : null}
    </div>
  );
}