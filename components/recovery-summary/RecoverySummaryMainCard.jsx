"use client";

function format_currency(value) {
  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    maximumFractionDigits: 2,
  }).format(Number(value ?? 0));
}

function format_number(value) {
  return new Intl.NumberFormat("en-NZ", {
    maximumFractionDigits: 2,
  }).format(Number(value ?? 0));
}

function ReadOnlyRow({ label, value, emphasis = false }) {
  return (
    <div className="ui-split">
      <span className="text-sm text-[var(--text-secondary)]">{label}</span>
      <span
        className={
          emphasis
            ? "text-base font-semibold text-[var(--text-primary)]"
            : "text-sm font-medium text-[var(--text-primary)]"
        }
      >
        {value}
      </span>
    </div>
  );
}

function PercentField({ label, value, onChange, disabled = false }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm text-[var(--text-secondary)]">
        {label}
      </span>
      <input
        type="number"
        min="0"
        step="0.01"
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="ui-input"
      />
    </label>
  );
}

export default function RecoverySummaryMainCard({
  total_cost_burden,
  required_recovery_rate,
  total_productive_output,

  recovery_model,
  labour_share_percent,
  asset_share_percent,
  overhead_share_percent,

  labour_recovery_cost,
  asset_recovery_cost,
  overhead_absorbed_cost,
  required_labour_recovery_rate,
  required_asset_recovery,
  share_total,

  share_not_balanced,
  no_productive_output,
  asset_recovery_without_assets,
  labour_recovery_without_labour,

  insight_text,

  on_recovery_model_change,
  on_labour_share_change,
  on_asset_share_change,
  on_overhead_share_change,
  on_reset,
}) {
  const labour_only_locked = recovery_model === "labour_only";

  return (
    <section className="ui-section">
      <div className="ui-panel">
        <div className="ui-stack">
          <div>
            <p className="ui-kicker">Recovery summary</p>
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">
              Recovery Summary
            </h2>
            <p className="ui-help">
              This page converts the Cost Summary burden into a recovery
              strategy. It does not rebuild upstream cost logic.
            </p>
          </div>

          <div className="ui-panel">
            <div className="ui-stack">
              <div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                  Cost baseline
                </h3>
                <p className="ui-help">
                  This is the recovery target coming from Cost Summary.
                </p>
              </div>

              <ReadOnlyRow
                label="Total cost burden"
                value={format_currency(total_cost_burden)}
                emphasis
              />

              <ReadOnlyRow
                label="Required recovery rate"
                value={format_currency(required_recovery_rate)}
              />

              <ReadOnlyRow
                label="Total productive output"
                value={format_number(total_productive_output)}
              />
            </div>
          </div>

          <div className="ui-panel">
            <div className="ui-stack">
              <div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                  Recovery model selector
                </h3>
                <p className="ui-help">
                  Choose how the total cost burden is intended to be recovered.
                </p>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm text-[var(--text-secondary)]">
                  Recovery model
                </span>
                <select
                  value={recovery_model}
                  onChange={(event) =>
                    on_recovery_model_change(event.target.value)
                  }
                  className="ui-input"
                >
                  <option value="labour_only">Labour Only</option>
                  <option value="asset_driven">Asset Driven</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </label>
            </div>
          </div>

          <div className="ui-panel">
            <div className="ui-stack">
              <div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                  Recovery share inputs
                </h3>
                <p className="ui-help">
                  These shares define how recovery is split across labour,
                  assets, and absorbed overhead.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <PercentField
                  label="Labour share percent"
                  value={labour_share_percent}
                  onChange={on_labour_share_change}
                  disabled={labour_only_locked}
                />

                <PercentField
                  label="Asset share percent"
                  value={asset_share_percent}
                  onChange={on_asset_share_change}
                  disabled={labour_only_locked}
                />

                <PercentField
                  label="Overhead share percent"
                  value={overhead_share_percent}
                  onChange={on_overhead_share_change}
                  disabled={labour_only_locked}
                />
              </div>

              <ReadOnlyRow
                label="Share total"
                value={`${format_number(share_total)}%`}
                emphasis
              />

              {share_not_balanced ? (
                <div className="ui-panel">
                  <p className="text-sm text-[var(--text-primary)]">
                    Recovery shares must total 100%.
                  </p>
                </div>
              ) : null}

              <div className="ui-actions">
                <button
                  type="button"
                  onClick={on_reset}
                  className="ui-button-secondary"
                >
                  Reset to defaults
                </button>
              </div>
            </div>
          </div>

          <div className="ui-panel">
            <div className="ui-stack">
              <div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                  Recovery distribution block
                </h3>
                <p className="ui-help">
                  This shows how the total burden is being distributed.
                </p>
              </div>

              <ReadOnlyRow
                label="Labour recovery cost"
                value={format_currency(labour_recovery_cost)}
              />

              <ReadOnlyRow
                label="Asset recovery cost"
                value={format_currency(asset_recovery_cost)}
              />

              <ReadOnlyRow
                label="Overhead absorbed cost"
                value={format_currency(overhead_absorbed_cost)}
              />
            </div>
          </div>

          <div className="ui-panel">
            <div className="ui-stack">
              <div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                  Recovery pressure block
                </h3>
                <p className="ui-help">
                  These are the key recovery targets created by the current
                  strategy.
                </p>
              </div>

              <div className="ui-panel">
                <div className="ui-stack">
                  <ReadOnlyRow
                    label="Required labour recovery rate"
                    value={format_currency(required_labour_recovery_rate)}
                    emphasis
                  />

                  <ReadOnlyRow
                    label="Required asset recovery"
                    value={format_currency(required_asset_recovery)}
                    emphasis
                  />
                </div>
              </div>

              {no_productive_output ? (
                <div className="ui-panel">
                  <p className="text-sm text-[var(--text-primary)]">
                    No productive output is available, so labour recovery rate is
                    held at 0.
                  </p>
                </div>
              ) : null}

              {asset_recovery_without_assets ? (
                <div className="ui-panel">
                  <p className="text-sm text-[var(--text-primary)]">
                    Asset recovery is active but no asset cost is available
                    upstream.
                  </p>
                </div>
              ) : null}

              {labour_recovery_without_labour ? (
                <div className="ui-panel">
                  <p className="text-sm text-[var(--text-primary)]">
                    Labour recovery is active but no labour base is available
                    upstream.
                  </p>
                </div>
              ) : null}
            </div>
          </div>

          <div className="ui-panel">
            <div className="ui-stack">
              <div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                  Light insight block
                </h3>
              </div>

              <p className="text-sm text-[var(--text-primary)]">{insight_text}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}