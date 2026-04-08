"use client";

function CurrencyRow({ label, value }) {
  return (
    <div className="ui-split">
      <span className="text-sm text-[var(--text-secondary)]">{label}</span>
      <span className="text-sm font-medium text-[var(--text-primary)]">
        ${Number(value ?? 0).toLocaleString()}
      </span>
    </div>
  );
}

function NumberRow({ label, value }) {
  return (
    <div className="ui-split">
      <span className="text-sm text-[var(--text-secondary)]">{label}</span>
      <span className="text-sm font-medium text-[var(--text-primary)]">
        {value}
      </span>
    </div>
  );
}

function ToneBanner({ tone, title, message, action }) {
  return (
    <div className="ui-panel">
      <div className="ui-stack">
        <div>
          <p className="ui-kicker">Outcome</p>
          <div className="mt-2">
            <span className={`ui-pill ui-pill-${tone}`}>{title}</span>
          </div>
        </div>

        <p className="text-sm text-[var(--text-primary)]">{message}</p>

        <div className="ui-panel">
          <p className="ui-kicker">Recommended action</p>
          <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">
            {action}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RecoveryOutcomeMainCard({
  outcome_banner,
  recovery_context,
  structure_summary,
  constraint_block,
  recommended_action,
  warnings = [],
}) {
  return (
    <section className="ui-section">
      <div className="ui-stack">
        <ToneBanner
          tone={outcome_banner?.tone ?? "info"}
          title={outcome_banner?.outcome_title ?? "Decision unavailable"}
          message={outcome_banner?.outcome_message ?? "No outcome message."}
          action={outcome_banner?.recommended_action ?? recommended_action}
        />

        <div className="ui-panel">
          <div className="ui-stack">
            <div>
              <p className="ui-kicker">Recovery context</p>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                Strategy summary
              </h2>
            </div>

            <NumberRow
              label="Recovery model"
              value={recovery_context?.active_recovery_model?.replaceAll("_", " ")}
            />
            <NumberRow
              label="Labour share"
              value={recovery_context?.labour_share_percent}
            />
            <NumberRow
              label="Asset share"
              value={recovery_context?.asset_share_percent}
            />
            <NumberRow
              label="Overhead share"
              value={recovery_context?.overhead_share_percent}
            />
            <CurrencyRow
              label="Required recovery rate"
              value={recovery_context?.required_recovery_rate}
            />
            <CurrencyRow
              label="Required labour recovery rate"
              value={recovery_context?.required_labour_recovery_rate}
            />
            <CurrencyRow
              label="Required asset recovery"
              value={recovery_context?.required_asset_recovery}
            />
            <CurrencyRow
              label="Required revenue"
              value={recovery_context?.required_revenue}
            />
            <CurrencyRow
              label="Total cost burden"
              value={recovery_context?.total_cost_burden}
            />
            <NumberRow
              label="Total productive output"
              value={Number(
                recovery_context?.total_productive_output ?? 0
              ).toLocaleString()}
            />
          </div>
        </div>

        <div className="ui-panel">
          <div className="ui-stack">
            <div>
              <p className="ui-kicker">Structure summary</p>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                Delivery readiness
              </h2>
            </div>

            <NumberRow
              label="Structure valid"
              value={structure_summary?.structure_valid ? "Yes" : "No"}
            />
            <NumberRow
              label="Staff coverage"
              value={structure_summary?.staff_coverage_percent}
            />
            <NumberRow
              label="Asset coverage"
              value={structure_summary?.asset_coverage_percent}
            />
            <NumberRow
              label="Group coverage"
              value={structure_summary?.group_coverage_percent}
            />
            <NumberRow
              label="Linked staff"
              value={structure_summary?.linked_staff_count}
            />
            <NumberRow
              label="Unlinked staff"
              value={structure_summary?.unlinked_staff_count}
            />
            <NumberRow
              label="Linked assets"
              value={structure_summary?.linked_asset_count}
            />
            <NumberRow
              label="Unlinked assets"
              value={structure_summary?.unlinked_asset_count}
            />
            <NumberRow
              label="Valid groups"
              value={structure_summary?.valid_operational_groups}
            />
            <NumberRow
              label="Invalid groups"
              value={structure_summary?.invalid_operational_groups}
            />
          </div>
        </div>

        <div className="ui-panel">
          <div className="ui-stack">
            <div>
              <p className="ui-kicker">Primary constraint</p>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                {constraint_block?.primary_constraint_title}
              </h2>
            </div>

            <p className="text-sm text-[var(--text-secondary)]">
              {constraint_block?.primary_constraint_message}
            </p>
          </div>
        </div>

        <div className="ui-panel">
          <div className="ui-stack">
            <div>
              <p className="ui-kicker">Next step</p>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                Recommended action
              </h2>
            </div>

            <p className="text-sm text-[var(--text-primary)]">
              {recommended_action}
            </p>
          </div>
        </div>

        <div className="ui-panel">
          <div className="ui-stack">
            <div>
              <p className="ui-kicker">Warnings</p>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                Combined upstream warnings
              </h2>
            </div>

            {warnings.length === 0 ? (
              <p className="text-sm text-[var(--text-secondary)]">
                No active warnings.
              </p>
            ) : (
              <div className="ui-stack">
                {warnings.map((warning, index) => (
                  <div key={`${warning}-${index}`} className="ui-panel">
                    <p className="text-sm text-[var(--text-primary)]">
                      {warning}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}