import {
  format_currency,
} from "@/components/recovery-summary/recoverySummaryFormatters";
import { get_annual_recovery_gap } from "@/components/recovery-summary/main-card/recoverySummaryWarningHelpers";

function get_primary_warning_label(primary_recovery_warning) {
  return (
    primary_recovery_warning?.headline ||
    primary_recovery_warning?.message ||
    "Recovery strategy needs review"
  );
}

function get_primary_warning_explanation(primary_recovery_warning) {
  return (
    primary_recovery_warning?.plain_english ||
    primary_recovery_warning?.effect ||
    "Recovery Summary has identified pressure that should be reviewed before relying on this result."
  );
}

function get_primary_warning_cascade(primary_recovery_warning) {
  return (
    primary_recovery_warning?.cascade_effect ||
    primary_recovery_warning?.carry_forward_message ||
    ""
  );
}

function ModelConfidenceBlock({ model_confidence_warnings = [] }) {
  if (!Array.isArray(model_confidence_warnings)) {
    return null;
  }

  if (model_confidence_warnings.length === 0) {
    return null;
  }

  const primary_confidence_warning = model_confidence_warnings[0];

  return (
    <div className="ui-readonly">
      <p className="ui-label">Model confidence</p>

      <p className="text-sm font-semibold text-[var(--text-primary)]">
        {primary_confidence_warning.headline ||
          primary_confidence_warning.message ||
          "Source model needs review"}
      </p>

      <p className="ui-help">
        {primary_confidence_warning.plain_english ||
          primary_confidence_warning.effect ||
          "The recovery result is provisional until the upstream model is trusted."}
      </p>
    </div>
  );
}

function CommercialRecoveryPosition({
  primary_recovery_warning,
  margin_pool,
  total_cost_burden,
}) {
  const annual_gap = get_annual_recovery_gap({
    margin_pool,
    total_cost_burden,
  });

  if (primary_recovery_warning) {
    return (
      <div className="ui-readonly">
        <p className="ui-label">Primary commercial failure</p>

        <p className="text-base font-semibold text-[var(--text-primary)]">
          {get_primary_warning_label(primary_recovery_warning)}
        </p>

        <p className="ui-help">
          {get_primary_warning_explanation(primary_recovery_warning)}
        </p>

        {get_primary_warning_cascade(primary_recovery_warning) ? (
          <p className="text-sm font-medium text-[var(--text-primary)]">
            {get_primary_warning_cascade(primary_recovery_warning)}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="ui-readonly">
      <p className="ui-label">Commercial recovery position</p>

      <p className="text-base font-semibold text-[var(--text-primary)]">
        No commercial recovery failure detected
      </p>

      <p className="ui-help">
        {annual_gap >= 0
          ? "Margin pool and recovery rate are currently above the required recovery burden."
          : "Recovery Summary has not identified a specific commercial failure, but the annual recovery position should still be reviewed before relying on this result."}
      </p>
    </div>
  );
}

export default function RecoveryOutcomeDetail({
  status_label,
  margin_pool,
  total_cost_burden,
  primary_recovery_warning,
  model_confidence_warnings,
}) {
  const annual_gap = get_annual_recovery_gap({
    margin_pool,
    total_cost_burden,
  });

  return (
    <div className="ui-panel">
      <div className="ui-stack-sm">
        <p className="ui-label">Recovery outcome detail</p>

        <h3 className="text-lg font-semibold text-[var(--text-primary)]">
          {status_label}
        </h3>

        <p className="ui-help">
          This is the detailed recovery position behind the headline result.
        </p>

        <CommercialRecoveryPosition
          primary_recovery_warning={primary_recovery_warning}
          margin_pool={margin_pool}
          total_cost_burden={total_cost_burden}
        />

        <ModelConfidenceBlock
          model_confidence_warnings={model_confidence_warnings}
        />

        <div className="labour-summary-table">
          <div className="labour-summary-table-row">
            <div className="labour-summary-table-label">Margin pool</div>
            <div className="labour-summary-table-value">
              {format_currency(margin_pool)}
            </div>
          </div>

          <div className="labour-summary-table-row">
            <div className="labour-summary-table-label">Cost burden</div>
            <div className="labour-summary-table-value">
              {format_currency(total_cost_burden)}
            </div>
          </div>

          <div className="labour-summary-table-row total">
            <div className="labour-summary-table-label">Annual recovery gap</div>
            <div className="labour-summary-table-value">
              {format_currency(annual_gap)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}