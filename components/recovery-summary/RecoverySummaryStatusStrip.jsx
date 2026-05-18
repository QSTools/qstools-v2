"use client";

import { useState } from "react";

import RecoverySummaryNoteDrilldown from "@/components/recovery-summary/RecoverySummaryNoteDrilldown";

function get_status_label(recovery_ready, warning_count) {
  if (recovery_ready && warning_count > 0) {
    return "Usable with warnings";
  }

  if (recovery_ready) {
    return "Ready";
  }

  return "Needs attention";
}

function get_business_type_label(business_type) {
  return business_type === "product_based"
    ? "Product-driven business"
    : "Labour-driven business";
}

function get_recovery_driver_label(activity_driver_type) {
  return activity_driver_type === "units"
    ? "Units sold"
    : "Selected recovery hours";
}

function SummaryMetric({ id, label, value, active, onClick }) {
  return (
    <button
      type="button"
      onClick={() => onClick(id)}
      className={`recovery-summary-interactive ui-readonly text-left ${
        active ? "is-active" : ""
      }`}
    >
      <div className="ui-label">{label}</div>
      <div className="recovery-summary-row-value text-base font-semibold">
        {value}
      </div>
    </button>
  );
}

function DetailPanel({
  active_detail,
  status_label,
  business_type_label,
  recovery_driver_label,
  warning_count,
  warning_items,
  values,
}) {
  if (active_detail === "status") {
    return (
      <div className="ui-panel">
        <div className="ui-stack-sm">
          <p className="ui-label">Recovery strategy status</p>

          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
            {status_label}
          </h3>

          <p className="ui-help">
            This tells you whether the recovery strategy is usable enough to
            carry forward into Cost Allocation.
          </p>

          <div className="ui-readonly">
            <p className="text-sm font-medium text-[var(--text-primary)]">
              Warnings may still exist because Business Summary has identified
              commercial pressure. That does not always block the recovery
              strategy. It tells you what Cost Allocation needs to test next.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (active_detail === "business_type") {
    return (
      <div className="ui-panel">
        <div className="ui-stack-sm">
          <p className="ui-label">Business type</p>

          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
            {business_type_label}
          </h3>

          <p className="ui-help">
            This comes from Business Setup through Business Summary. It controls
            how QS Tools expresses the recovery pressure.
          </p>

          <div className="ui-readonly">
            <p className="text-sm font-medium text-[var(--text-primary)]">
              Labour-driven businesses are tested against selected recovery
              hours. Product-driven businesses are tested against units sold.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (active_detail === "driver") {
    return (
      <div className="ui-panel">
        <div className="ui-stack-sm">
          <p className="ui-label">Recovery driver</p>

          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
            {recovery_driver_label}
          </h3>

          <p className="ui-help">
            This is the selected recovery denominator used to express the
            required recovery pressure.
          </p>

          <div className="ui-readonly">
            <p className="text-sm font-medium text-[var(--text-primary)]">
              Business Summary works out the current position. Recovery Summary
              carries the recovery requirement forward so Cost Allocation can
              test whether the business structure can support it.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (active_detail === "notes") {
    return (
      <RecoverySummaryNoteDrilldown
        warning_count={warning_count}
        warning_items={warning_items}
        values={values}
      />
    );
  }

  return null;
}

export default function RecoverySummaryStatusStrip({
  business_type,
  activity_driver_type,
  activity_driver_label,

  recovery_ready,
  warning_count,
  warning_items = [],

  margin_pool,
  total_cost_burden,
  net_position,
  current_margin_per_driver,
  required_recovery_per_driver,
  recovery_gap_per_driver,

  total_revenue,
  total_direct_costs,
  total_people_cost_annual,
  total_asset_cost_annual,
  total_business_overheads,
}) {
  const [active_detail, set_active_detail] = useState("status");

  const status_label = get_status_label(recovery_ready, warning_count);
  const business_type_label = get_business_type_label(business_type);
  const recovery_driver_label = get_recovery_driver_label(
    activity_driver_type,
    activity_driver_label
  );

  const values = {
    margin_pool,
    total_cost_burden,
    net_position,
    current_margin_per_driver,
    required_recovery_per_driver,
    recovery_gap_per_driver,
    total_revenue,
    total_direct_costs,
    total_people_cost_annual,
    total_asset_cost_annual,
    total_business_overheads,
  };

  return (
    <section className="ui-hero">
      <div className="ui-hero-inner">
        <div className="ui-stack">
          <div>
            <p className="ui-kicker">Recovery summary</p>

            <h1 className="ui-card-title-sm text-[var(--text-primary)]">
              Your recovery strategy
            </h1>

            <p className="ui-help">
              This page shows the recovery strategy QS Tools is carrying forward
              from Business Summary. It explains the selected recovery basis
              before Cost Allocation tests whether the structure can support it.
            </p>
          </div>

          <div className="ui-split-2">
            <SummaryMetric
              id="status"
              label="Recovery model status"
              value={status_label}
              active={active_detail === "status"}
              onClick={set_active_detail}
            />

            <SummaryMetric
              id="business_type"
              label="Business type"
              value={business_type_label}
              active={active_detail === "business_type"}
              onClick={set_active_detail}
            />

            <SummaryMetric
              id="driver"
              label="Recovery driver"
              value={recovery_driver_label}
              active={active_detail === "driver"}
              onClick={set_active_detail}
            />

            <SummaryMetric
              id="notes"
              label="Model notes"
              value={String(warning_count)}
              active={active_detail === "notes"}
              onClick={set_active_detail}
            />
          </div>

          <DetailPanel
            active_detail={active_detail}
            status_label={status_label}
            business_type_label={business_type_label}
            recovery_driver_label={recovery_driver_label}
            warning_count={warning_count}
            warning_items={warning_items}
            values={values}
          />
        </div>
      </div>
    </section>
  );
}