"use client";

import RecoverySummaryModelSelectorBlock from "@/components/recovery-summary/RecoverySummaryModelSelectorBlock";
import RecoverySummaryStartingSplitBlock from "@/components/recovery-summary/RecoverySummaryStartingSplitBlock";
import RecoverySummaryDistributionBlock from "@/components/recovery-summary/RecoverySummaryDistributionBlock";
import RecoverySummaryUnassignedCheckBlock from "@/components/recovery-summary/RecoverySummaryUnassignedCheckBlock";
import RecoverySummaryHandoffBlock from "@/components/recovery-summary/RecoverySummaryHandoffBlock";
import {
  format_currency,
  format_number,
} from "@/components/recovery-summary/recoverySummaryFormatters";

function ProductRecoveryRequirementBlock({
  total_cost_burden = 0,
  margin_per_unit = 0,
  units_sold_annual = 0,
  required_units_to_break_even = 0,
  unit_surplus_or_shortfall = 0,
  product_recovery_status = "not_recoverable",
}) {
  const status_message =
    product_recovery_status === "not_recoverable"
      ? "Product margin is not positive, so unit volume cannot recover the business cost burden."
      : product_recovery_status === "shortfall"
        ? "Current unit volume is below the break-even unit requirement."
        : "Current unit volume is above the break-even unit requirement.";

  return (
    <div className="ui-panel">
      <div className="ui-stack-sm">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Product Recovery Requirement
          </h2>
          <p className="ui-help">
            Product mode tests whether trading margin per unit and expected
            unit volume can recover the business cost burden.
          </p>
        </div>

        <div className="labour-summary-table">
          <div className="labour-summary-table-row">
            <div className="labour-summary-table-label">Total Cost Burden</div>
            <div className="labour-summary-table-value">
              {format_currency(total_cost_burden)}
            </div>
          </div>
          <div className="labour-summary-table-row">
            <div className="labour-summary-table-label">Margin per Unit</div>
            <div className="labour-summary-table-value">
              {format_currency(margin_per_unit)} /unit
            </div>
          </div>
          <div className="labour-summary-table-row">
            <div className="labour-summary-table-label">
              Units Sold per Year
            </div>
            <div className="labour-summary-table-value">
              {format_number(units_sold_annual, " units")}
            </div>
          </div>
          <div className="labour-summary-table-row">
            <div className="labour-summary-table-label">
              Required Units to Break Even
            </div>
            <div className="labour-summary-table-value">
              {format_number(required_units_to_break_even, " units")}
            </div>
          </div>
          <div className="labour-summary-table-row total">
            <div className="labour-summary-table-label">
              Unit Surplus / Shortfall
            </div>
            <div className="labour-summary-table-value">
              {format_number(unit_surplus_or_shortfall, " units")}
            </div>
          </div>
        </div>

        <div className="ui-readonly">
          <p className="text-sm font-medium text-[var(--text-primary)]">
            {status_message}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RecoverySummaryMainCard({
  business_type,
  is_product_based,

  recovery_model,

  labour_share_percent,
  asset_share_percent,
  material_share_percent,
  overhead_absorbed_percent,
  overhead_share_percent,

  labour_recovery_cost,
  asset_recovery_cost,
  material_recovery_cost,
  overhead_absorbed_cost,

  explained_recovery_total,
  share_total,
  share_not_balanced,

  material_recovery_included,
  asset_recovery_included,

  overhead_absorption_level,
  overhead_absorption_title,
  overhead_absorption_message,
  overhead_absorption_diagnostics = [],

  total_cost_burden,
  margin_per_unit,
  units_sold_annual,
  required_units_to_break_even,
  unit_surplus_or_shortfall,
  product_recovery_status,

  on_recovery_model_change,
  on_reset,
}) {
  const product_mode_active =
    is_product_based === true || business_type === "product_based";

  return (
    <section className="ui-section">
      <div className="ui-panel">
        <div className="ui-stack">
          <RecoverySummaryModelSelectorBlock
            recovery_model={recovery_model}
            on_recovery_model_change={on_recovery_model_change}
          />

          {product_mode_active ? (
            <ProductRecoveryRequirementBlock
              total_cost_burden={total_cost_burden}
              margin_per_unit={margin_per_unit}
              units_sold_annual={units_sold_annual}
              required_units_to_break_even={required_units_to_break_even}
              unit_surplus_or_shortfall={unit_surplus_or_shortfall}
              product_recovery_status={product_recovery_status}
            />
          ) : null}

          <RecoverySummaryStartingSplitBlock
            labour_share_percent={labour_share_percent}
            asset_share_percent={asset_share_percent}
            material_share_percent={material_share_percent}
            overhead_absorbed_percent={overhead_absorbed_percent}
            overhead_share_percent={overhead_share_percent}
            explained_recovery_total={explained_recovery_total}
            share_total={share_total}
            share_not_balanced={share_not_balanced}
            on_reset={on_reset}
          />

          <RecoverySummaryDistributionBlock
            labour_recovery_cost={labour_recovery_cost}
            asset_recovery_cost={asset_recovery_cost}
            material_recovery_cost={material_recovery_cost}
            overhead_absorbed_cost={overhead_absorbed_cost}
          />

          <RecoverySummaryUnassignedCheckBlock
            overhead_absorption_level={overhead_absorption_level}
            overhead_absorption_title={overhead_absorption_title}
            overhead_absorption_message={overhead_absorption_message}
            overhead_absorption_diagnostics={overhead_absorption_diagnostics}
          />

          <RecoverySummaryHandoffBlock
            material_recovery_included={material_recovery_included}
            asset_recovery_included={asset_recovery_included}
          />
        </div>
      </div>
    </section>
  );
}
