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

function Pill({ label, tone = "ok" }) {
  return <span className={`ui-pill ui-pill-${tone}`}>{label}</span>;
}

function get_tone(status) {
  if (status === "viable" || status === true) return "good";
  if (status === "marginal") return "ok";
  return "bad";
}

function ValueRow({ label, value }) {
  return (
    <div className="ui-readonly">
      <span className="ui-label">{label}</span>
      <div className="text-sm font-medium text-[var(--text-primary)]">{value}</div>
    </div>
  );
}

export default function RecoveryOutcomeMainCard({
  outcome_banner = {},
  cost_baseline = {},
  recovery_context = {},
  recovery_streams = [],
  structure_summary = {},
  macro_driver = {},
  totals = {},
  warnings = [],
}) {
  const banner_tone = get_tone(outcome_banner.outcome_status);

  return (
    <section className="ui-section">
      <div className="ui-panel">
        <div className="ui-stack">
          <div className="ui-panel">
            <div className="ui-stack">
              <div className="ui-actions">
                <Pill label={outcome_banner.outcome_status} tone={banner_tone} />
              </div>

              <div>
                <p className="ui-kicker">Outcome</p>
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
            <p className="ui-kicker">Cost baseline</p>
            <div className="ui-stack">
              <ValueRow
                label="Total Cost Burden"
                value={format_currency(cost_baseline.total_cost_burden)}
              />
              <ValueRow
                label="Required Revenue"
                value={format_currency(cost_baseline.required_revenue)}
              />
              <ValueRow
                label="Required Recovery Rate"
                value={format_currency(cost_baseline.required_recovery_rate)}
              />
              <ValueRow
                label="Total Productive Output"
                value={Number(cost_baseline.total_productive_output || 0).toLocaleString()}
              />
            </div>
          </div>

          <div>
            <p className="ui-kicker">Recovery strategy context</p>
            <div className="ui-stack">
              <ValueRow
                label="Active Recovery Model"
                value={recovery_context.active_recovery_model}
              />
              <ValueRow
                label="Labour Share"
                value={format_percent(recovery_context.labour_share_percent)}
              />
              <ValueRow
                label="Asset Share"
                value={format_percent(recovery_context.asset_share_percent)}
              />
              <ValueRow
                label="Overhead Share"
                value={format_percent(recovery_context.overhead_share_percent)}
              />
              <ValueRow
                label="Required Labour Recovery Rate"
                value={format_currency(recovery_context.required_labour_recovery_rate)}
              />
              <ValueRow
                label="Required Asset Recovery"
                value={format_currency(recovery_context.required_asset_recovery)}
              />
            </div>
          </div>

          <div>
            <p className="ui-kicker">Recovery streams</p>
            <div className="ui-stack">
              {recovery_streams.length === 0 ? (
                <div className="ui-readonly">
                  <div className="text-sm text-[var(--text-secondary)]">
                    No recovery streams available yet.
                  </div>
                </div>
              ) : (
                recovery_streams.map((stream) => (
                  <div key={stream.stream_key} className="ui-readonly">
                    <span className="ui-label">{stream.stream_name}</span>
                    <div className="text-sm font-medium text-[var(--text-primary)]">
                      {format_currency(stream.contribution_value)}
                    </div>
                    <div className="text-xs text-[var(--text-secondary)]">
                      {format_percent(stream.contribution_percent)} of total recovery
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <p className="ui-kicker">Structure summary</p>
            <div className="ui-stack">
              <ValueRow
                label="Structure Valid"
                value={structure_summary.structure_valid ? "Yes" : "No"}
              />
              <ValueRow
                label="Staff Coverage"
                value={format_percent(structure_summary.staff_coverage_percent)}
              />
              <ValueRow
                label="Asset Coverage"
                value={format_percent(structure_summary.asset_coverage_percent)}
              />
              <ValueRow
                label="Group Coverage"
                value={format_percent(structure_summary.group_coverage_percent)}
              />
              <ValueRow
                label="Linked Staff / Unlinked Staff"
                value={`${structure_summary.linked_staff_count || 0} / ${
                  structure_summary.unlinked_staff_count || 0
                }`}
              />
              <ValueRow
                label="Linked Assets / Unlinked Assets"
                value={`${structure_summary.linked_asset_count || 0} / ${
                  structure_summary.unlinked_asset_count || 0
                }`}
              />
              <ValueRow
                label="Valid Groups / Invalid Groups"
                value={`${structure_summary.valid_operational_groups || 0} / ${
                  structure_summary.invalid_operational_groups || 0
                }`}
              />
            </div>
          </div>

          <div>
            <p className="ui-kicker">Macro driver</p>
            <div className="ui-stack">
              <ValueRow
                label="Dominant Recovery Stream"
                value={
                  macro_driver.dominant_recovery_stream
                    ? `${macro_driver.dominant_recovery_stream} (${format_percent(
                        macro_driver.dominant_recovery_share_percent
                      )})`
                    : "None"
                }
              />
              <ValueRow
                label="Primary Constraint"
                value={macro_driver.primary_constraint_title}
              />
              <div className="ui-readonly">
                <span className="ui-label">Constraint message</span>
                <div className="text-sm text-[var(--text-primary)]">
                  {macro_driver.primary_constraint_message}
                </div>
              </div>
            </div>
          </div>

          <div>
            <p className="ui-kicker">Macro totals</p>
            <div className="ui-stack">
              <ValueRow
                label="Total Recovery Actual"
                value={format_currency(totals.total_recovery_actual)}
              />
              <ValueRow
                label="Recovery Gap"
                value={format_currency(totals.recovery_gap)}
              />
              <ValueRow
                label="Recovery Gap %"
                value={format_percent(totals.recovery_gap_percent)}
              />
              <ValueRow
                label="Business Model Health"
                value={totals.business_model_health}
              />
            </div>
          </div>

          <div>
            <p className="ui-kicker">Warnings</p>
            <div className="ui-stack">
              {warnings.length === 0 ? (
                <div className="ui-readonly">
                  <div className="text-sm text-[var(--text-secondary)]">
                    No warnings at the moment.
                  </div>
                </div>
              ) : (
                warnings.map((warning, index) => (
                  <div key={`${warning}-${index}`} className="ui-readonly">
                    <div className="text-sm text-[var(--text-primary)]">{warning}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}