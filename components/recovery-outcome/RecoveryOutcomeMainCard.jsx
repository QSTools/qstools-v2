"use client";

function format_currency(value) {
  return `$${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function format_percent(value) {
  return `${Number(value || 0).toFixed(1)}%`;
}

function format_number(value) {
  return Number(value || 0).toLocaleString();
}

function Pill({ label, tone = "ok" }) {
  return <span className={`ui-pill ui-pill-${tone}`}>{label}</span>;
}

function get_tone(status) {
  if (status === "viable") return "good";
  if (status === "viable_with_dependency" || status === "at_risk") return "ok";
  return "bad";
}

function ValueRow({ label, value }) {
  return (
    <div className="ui-readonly">
      <span className="ui-label">{label}</span>
      <div className="text-sm font-medium text-[var(--text-primary)]">
        {value}
      </div>
    </div>
  );
}

function WarningRow({ warning }) {
  const message =
    typeof warning === "string"
      ? warning
      : warning?.message || warning?.warning_key || "Warning";

  const source =
    typeof warning === "string"
      ? "Business Outcome"
      : warning?.source || "Business Outcome";

  return (
    <div className="ui-readonly">
      <span className="ui-label">{source}</span>
      <div className="text-sm text-[var(--text-primary)]">{message}</div>
    </div>
  );
}

export default function RecoveryOutcomeMainCard({
  outcome_banner = {},
  primary_constraint = {},
  recovery_context = {},
  allocation_context = {},
  outcome_context = {},
  warnings = [],
}) {
  const banner_tone = get_tone(outcome_banner.outcome_status);

  const split = recovery_context.recovery_plan_split ?? {};
  const component_recovery =
    recovery_context.component_required_recovery ?? {};

  return (
    <section className="ui-section">
      <div className="ui-panel">
        <div className="ui-stack">
          <div className="ui-panel">
            <div className="ui-stack">
              <div className="ui-actions">
                <Pill
                  label={outcome_banner.outcome_status || "not_viable"}
                  tone={banner_tone}
                />
                <Pill
                  label={`Health: ${outcome_context.business_model_health || "unknown"}`}
                  tone={banner_tone}
                />
              </div>

              <div>
                <p className="ui-kicker">Verdict</p>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                  {outcome_banner.outcome_title}
                </h2>
                <p className="text-sm text-[var(--text-secondary)]">
                  {outcome_banner.outcome_message}
                </p>
              </div>

              <div className="ui-readonly">
                <span className="ui-label">Recommended action</span>
                <div className="text-sm text-[var(--text-primary)]">
                  {outcome_banner.recommended_action}
                </div>
              </div>
            </div>
          </div>

          <div>
            <p className="ui-kicker">Primary constraint</p>
            <div className="ui-stack">
              <ValueRow
                label="Constraint"
                value={primary_constraint.primary_constraint_title}
              />
              <div className="ui-readonly">
                <span className="ui-label">Explanation</span>
                <div className="text-sm text-[var(--text-primary)]">
                  {primary_constraint.primary_constraint_message}
                </div>
              </div>
            </div>
          </div>

          <div>
            <p className="ui-kicker">Recovery context</p>
            <div className="ui-stack">
              <ValueRow
                label="Recovery Model"
                value={recovery_context.active_recovery_model}
              />
              <ValueRow
                label="Activity Driver"
                value={`${recovery_context.activity_driver_label || "Driver"} (${format_number(
                  recovery_context.activity_driver_value
                )})`}
              />
              <ValueRow
                label="Plan Target Per Driver"
                value={format_currency(
                  recovery_context.recovery_plan_target_per_driver
                )}
              />
              <ValueRow
                label="Required Recovery Per Driver"
                value={format_currency(
                  recovery_context.required_recovery_per_driver
                )}
              />
              <ValueRow
                label="Current Margin Per Driver"
                value={format_currency(
                  recovery_context.current_margin_per_driver
                )}
              />
              <ValueRow
                label="Recovery Gap Per Driver"
                value={format_currency(recovery_context.recovery_gap_per_driver)}
              />
              <ValueRow
                label="Margin Pool"
                value={format_currency(recovery_context.margin_pool)}
              />
              <ValueRow
                label="Total Cost Burden"
                value={format_currency(recovery_context.total_cost_burden)}
              />
              <ValueRow
                label="Net Position"
                value={format_currency(recovery_context.net_position)}
              />
            </div>
          </div>

          <div>
            <p className="ui-kicker">Recovery split</p>
            <div className="ui-stack">
              <ValueRow
                label="Labour Share"
                value={format_percent(split.labour_share_percent)}
              />
              <ValueRow
                label="Asset Share"
                value={format_percent(split.asset_share_percent)}
              />
              <ValueRow
                label="Overhead Share"
                value={format_percent(split.overhead_share_percent)}
              />
            </div>
          </div>

          <div>
            <p className="ui-kicker">Component recovery requirement</p>
            <div className="ui-stack">
              <ValueRow
                label="Labour Recovery Cost"
                value={format_currency(component_recovery.labour?.recovery_cost)}
              />
              <ValueRow
                label="Required Labour Recovery Rate"
                value={format_currency(
                  component_recovery.labour?.required_recovery_rate
                )}
              />
              <ValueRow
                label="Asset Recovery Cost"
                value={format_currency(component_recovery.asset?.recovery_cost)}
              />
              <ValueRow
                label="Required Asset Recovery"
                value={format_currency(component_recovery.asset?.required_recovery)}
              />
              <ValueRow
                label="Overhead Absorbed Cost"
                value={format_currency(component_recovery.overhead?.recovery_cost)}
              />
            </div>
          </div>

          <div>
            <p className="ui-kicker">Allocation / dependency context</p>
            <div className="ui-stack">
              <ValueRow
                label="Allocation Status"
                value={allocation_context.allocation_status || "unknown"}
              />
              <ValueRow
                label="Dependency Type"
                value={allocation_context.allocation_dependency_type || "unknown"}
              />
              <ValueRow
                label="External Delivery Enabled"
                value={allocation_context.external_delivery_enabled ? "Yes" : "No"}
              />
              <ValueRow
                label="External Delivery Required"
                value={allocation_context.external_delivery_required ? "Yes" : "No"}
              />
              <ValueRow
                label="Internal Capacity Shortfall"
                value={format_currency(
                  allocation_context.internal_capacity_shortfall
                )}
              />
            </div>
          </div>

          <div>
            <p className="ui-kicker">Structure summary</p>
            <div className="ui-stack">
              <ValueRow
                label="Structure Valid"
                value={allocation_context.structure_valid ? "Yes" : "No"}
              />
              <ValueRow
                label="Staff Coverage"
                value={format_percent(allocation_context.staff_coverage_percent)}
              />
              <ValueRow
                label="Asset Coverage"
                value={format_percent(allocation_context.asset_coverage_percent)}
              />
              <ValueRow
                label="Group Coverage"
                value={format_percent(allocation_context.group_coverage_percent)}
              />
              <ValueRow
                label="Linked Staff / Unlinked Staff"
                value={`${allocation_context.linked_staff_count || 0} / ${
                  allocation_context.unlinked_staff_count || 0
                }`}
              />
              <ValueRow
                label="Linked Assets / Unlinked Assets"
                value={`${allocation_context.linked_asset_count || 0} / ${
                  allocation_context.unlinked_asset_count || 0
                }`}
              />
              <ValueRow
                label="Valid Groups / Invalid Groups"
                value={`${allocation_context.valid_operational_groups || 0} / ${
                  allocation_context.invalid_operational_groups || 0
                }`}
              />
            </div>
          </div>

          <div>
            <p className="ui-kicker">Warnings</p>
            <div className="ui-stack">
              {warnings.length === 0 ? (
                <div className="ui-readonly">
                  <div className="text-sm text-[var(--text-secondary)]">
                    No outcome warnings.
                  </div>
                </div>
              ) : (
                warnings.map((warning, index) => (
                  <WarningRow key={`${warning?.warning_key || "warning"}-${index}`} warning={warning} />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}