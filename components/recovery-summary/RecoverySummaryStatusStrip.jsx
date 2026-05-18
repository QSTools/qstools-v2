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

function get_recovery_driver_label(activity_driver_type, activity_driver_label) {
  if (activity_driver_label) {
    return activity_driver_label;
  }

  return activity_driver_type === "units"
    ? "Units sold"
    : "Productive recovery hours";
}

function SummaryMetric({ id, label, value, active, onClick }) {
  return (
    <button
      type="button"
      onClick={() => onClick(id)}
      className={`ui-readonly text-left transition ${
        active
          ? "border-[var(--accent)] shadow-[0_0_0_3px_var(--accent-soft)]"
          : ""
      }`}
    >
      <div className="ui-label">{label}</div>
      <div className="text-base font-semibold text-[var(--text-primary)]">
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
          <p className="ui-label">Recovery model status</p>
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
            {status_label}
          </h3>
          <p className="ui-help">
            This tells you whether the starting recovery model can be used by
            the next page. A warning does not always block the model. Some
            warnings simply show that the business is under pressure.
          </p>

          <div className="ui-readonly">
            <p className="text-sm font-medium text-[var(--text-primary)]">
              The model can continue when the recovery driver exists and the
              recovery setup is structurally valid. Commercial warnings remain
              visible so the user understands the pressure in the business.
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
            how QS Tools interprets the main recovery driver.
          </p>

          <div className="ui-readonly">
            <p className="text-sm font-medium text-[var(--text-primary)]">
              Labour-driven businesses are tested against recovery hours.
              Product-driven businesses are tested against units sold.
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
            This is the activity base QS Tools uses to spread the total cost
            burden. It is the denominator for the required recovery level.
          </p>

          <div className="ui-readonly">
            <p className="text-sm font-medium text-[var(--text-primary)]">
              The same recovery maths applies whether the result is good or bad:
              total cost burden is compared against the selected recovery
              driver, then Business Summary shows whether the business is
              generating enough margin to cover it.
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
              Your starting recovery model
            </h1>

            <p className="ui-help">
              This page shows the starting basis QS Tools is using to understand
              how your business recovers its cost burden before Cost Allocation
              tests whether the structure can support it.
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