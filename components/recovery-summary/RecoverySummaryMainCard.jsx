"use client";

import { useState } from "react";

import RecoverySummaryNoteDrilldown from "@/components/recovery-summary/RecoverySummaryNoteDrilldown";
import RecoveryDriverDetail from "@/components/recovery-summary/main-card/RecoveryDriverDetail";
import RecoveryOutcomeDetail from "@/components/recovery-summary/main-card/RecoveryOutcomeDetail";
import RecoverySummaryMetricButton from "@/components/recovery-summary/main-card/RecoverySummaryMetricButton";
import RecoverySupportingEvidenceDetail from "@/components/recovery-summary/main-card/RecoverySupportingEvidenceDetail";
import {
  get_business_type_label,
  get_commercial_failure_path,
  get_model_confidence_warnings,
  get_primary_commercial_warning,
  get_recovery_driver_label,
  get_status_label,
} from "@/components/recovery-summary/main-card/recoverySummaryWarningHelpers";

function RecoveryDetailPanel({
  active_detail,
  status_label,
  business_type_label,
  recovery_driver_label,
  warning_count,
  warning_items,
  values,
  primary_recovery_warning,
  recovery_failure_path,
  model_confidence_warnings,
  product_mode_active,
  card,
}) {
  if (active_detail === "status") {
    return (
      <RecoveryOutcomeDetail
        status_label={status_label}
        margin_pool={values.margin_pool}
        total_cost_burden={values.total_cost_burden}
        primary_recovery_warning={primary_recovery_warning}
        model_confidence_warnings={model_confidence_warnings}
      />
    );
  }

  if (active_detail === "driver") {
    return (
      <RecoveryDriverDetail
        business_type_label={business_type_label}
        recovery_driver_label={recovery_driver_label}
        product_mode_active={product_mode_active}
        actual_recovery_rate={card.actual_recovery_rate}
        required_recovery_rate={card.required_recovery_rate}
        profit_or_deficit_per_recovery_hour={
          card.profit_or_deficit_per_recovery_hour
        }
      />
    );
  }

  if (active_detail === "evidence") {
    return (
      <RecoverySupportingEvidenceDetail
        product_mode_active={product_mode_active}
        material_recovery_included={card.material_recovery_included}
        asset_recovery_included={card.asset_recovery_included}
        labour_recovery_cost={card.labour_recovery_cost}
        labour_recovery_hours={card.labour_recovery_hours}
        labour_recovery_status={card.labour_recovery_status}
        required_labour_recovery_rate={card.required_labour_recovery_rate}
        asset_recovery_cost={card.asset_recovery_cost}
        asset_utilisation_hours_annual={card.asset_utilisation_hours_annual}
        required_asset_recovery_rate={card.required_asset_recovery_rate}
        asset_recovery_status={card.asset_recovery_status}
        material_margin_pool={card.material_margin_pool}
        material_margin_percent={card.material_margin_percent}
        material_margin_status={card.material_margin_status}
        total_cost_burden={card.total_cost_burden}
        total_units={card.total_units}
        margin_per_unit={card.margin_per_unit}
        required_cost_per_unit={card.required_cost_per_unit}
        unit_surplus_or_gap={card.unit_surplus_or_gap}
        total_annual_surplus_or_gap={card.total_annual_surplus_or_gap}
        required_units_if_margin_fixed={card.required_units_if_margin_fixed}
        required_margin_if_units_fixed={card.required_margin_if_units_fixed}
        product_unit_recovery_status={card.product_unit_recovery_status}
        product_unit_margin_label={card.product_unit_margin_label}
        product_required_cost_label={card.product_required_cost_label}
        product_surplus_gap_label={card.product_surplus_gap_label}
        product_total_units_label={card.product_total_units_label}
        product_unit_suffix={card.product_unit_suffix}
        product_rate_suffix={card.product_rate_suffix}
      />
    );
  }

  if (active_detail === "notes") {
    return (
      <RecoverySummaryNoteDrilldown
        warning_count={warning_count}
        warning_items={warning_items}
        values={values}
        primary_recovery_warning={primary_recovery_warning}
        recovery_failure_path={recovery_failure_path}
      />
    );
  }

  return null;
}

export default function RecoverySummaryMainCard({
  recovery_ready,
  warning_count,
  warning_items = [],

  recovery_warning_count,
  primary_recovery_warning,
  recovery_failure_path = [],

  business_type,
  recovery_mode,
  is_product_based,
  activity_driver_type,
  activity_driver_label,

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

  ...card
}) {
  const [active_detail, set_active_detail] = useState("status");

  const commercial_failure_path =
    get_commercial_failure_path(recovery_failure_path);

  const model_confidence_warnings =
    get_model_confidence_warnings(recovery_failure_path);

  const primary_commercial_warning = get_primary_commercial_warning({
    primary_recovery_warning,
    recovery_failure_path,
  });

  const effective_warning_count =
    recovery_warning_count ?? warning_count ?? recovery_failure_path.length ?? 0;

  const should_show_failure_path = commercial_failure_path.length > 0;

  const effective_failure_path =
    should_show_failure_path ? commercial_failure_path : [];

  const status_label = get_status_label({
    recovery_ready,
    warning_count: effective_warning_count,
    primary_commercial_warning,
    recovery_failure_path,
  });

  const business_type_label = get_business_type_label(business_type);

  const recovery_driver_label = get_recovery_driver_label(
    activity_driver_type,
    activity_driver_label
  );

  const product_mode_active =
    is_product_based === true ||
    business_type === "product_based" ||
    recovery_mode === "product_unit";

  const values = {
    business_type,
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

  const detail_card = {
    ...card,
    business_type,
    recovery_mode,
    is_product_based,
    activity_driver_type,
    activity_driver_label,
    margin_pool,
    total_cost_burden,
  };

  return (
    <section className="ui-section">
      <div className="ui-panel">
        <div className="ui-stack">
          <div>
            <p className="ui-kicker">Recovery summary</p>

            <h2 className="text-xl font-semibold text-[var(--text-primary)]">
              Does the business recover?
            </h2>

            <p className="ui-help">
              Open each card to see the recovery outcome, driver, evidence, and
              failure path.
            </p>
          </div>

          <div className="ui-split-2">
            <RecoverySummaryMetricButton
              id="status"
              label="Recovery outcome"
              value={status_label}
              active={active_detail === "status"}
              onClick={set_active_detail}
            />

            <RecoverySummaryMetricButton
              id="driver"
              label="Recovery driver"
              value={
                product_mode_active ? "Units and margin" : recovery_driver_label
              }
              active={active_detail === "driver"}
              onClick={set_active_detail}
            />

            <RecoverySummaryMetricButton
              id="evidence"
              label="Supporting evidence"
              value={
                product_mode_active
                  ? "Product margin"
                  : "Labour / assets / margin"
              }
              active={active_detail === "evidence"}
              onClick={set_active_detail}
            />

            {should_show_failure_path ? (
              <RecoverySummaryMetricButton
                id="notes"
                label="Failure path"
                value={String(effective_failure_path.length)}
                active={active_detail === "notes"}
                onClick={set_active_detail}
              />
            ) : null}
          </div>

          <RecoveryDetailPanel
            active_detail={active_detail}
            status_label={status_label}
            business_type_label={business_type_label}
            recovery_driver_label={
              product_mode_active ? "Units and margin" : recovery_driver_label
            }
            warning_count={effective_failure_path.length}
            warning_items={warning_items}
            values={values}
            primary_recovery_warning={primary_commercial_warning}
            recovery_failure_path={effective_failure_path}
            model_confidence_warnings={model_confidence_warnings}
            product_mode_active={product_mode_active}
            card={detail_card}
          />
        </div>
      </div>
    </section>
  );
}