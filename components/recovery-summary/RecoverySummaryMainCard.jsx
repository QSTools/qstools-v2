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

function get_business_mode_label(business_type) {
  return business_type === "product_based"
    ? "product-driven business"
    : "labour-driven business";
}

function get_recovery_driver_label(activity_driver_type, activity_driver_label) {
  if (activity_driver_label) {
    return activity_driver_label;
  }

  return activity_driver_type === "units"
    ? "units sold"
    : "productive recovery hours";
}

function get_recovery_model_label(recovery_model) {
  const model_map = {
    labour_only: "Labour-led recovery",
    asset_driven: "Asset-supported recovery",
    hybrid: "Hybrid recovery",
  };

  return model_map[recovery_model] || "Recovery model";
}

function get_split_message({
  business_type,
  activity_driver_label,
  recovery_model,
  labour_share_percent,
  asset_share_percent,
  overhead_share_percent,
}) {
  const business_mode_label = get_business_mode_label(business_type);
  const recovery_driver_label = get_recovery_driver_label(
    null,
    activity_driver_label
  );

  if (recovery_model === "labour_only") {
    return `QS Tools is currently treating this as a ${business_mode_label}. The business cost burden is being tested against ${recovery_driver_label}, with the recovery burden currently assigned to labour-led recovery.`;
  }

  if (recovery_model === "asset_driven") {
    return `QS Tools is currently treating this as a ${business_mode_label}. The business cost burden is being tested against ${recovery_driver_label}, with a major part of the recovery burden assigned to assets.`;
  }

  if (recovery_model === "hybrid") {
    return `QS Tools is currently treating this as a ${business_mode_label}. The business cost burden is being tested against ${recovery_driver_label}, with recovery spread across labour, assets, and absorbed overhead.`;
  }

  return `QS Tools is currently assigning recovery as Labour ${labour_share_percent}%, Assets ${asset_share_percent}%, and Absorbed overhead ${overhead_share_percent}%.`;
}

export default function RecoverySummaryMainCard({
  business_type,
  activity_driver_type,
  activity_driver_label,
  activity_driver_value,

  total_cost_burden,
  required_recovery_rate,
  recovery_hours_used,

  recovery_model,
  labour_share_percent,
  asset_share_percent,
  overhead_share_percent,

  labour_recovery_cost,
  asset_recovery_cost,
  overhead_absorbed_cost,
  required_labour_recovery_rate_per_recovery_hour,
  required_asset_recovery,
  share_total,

  share_not_balanced,
  no_recovery_hours,
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

  const business_mode_label = get_business_mode_label(business_type);
  const recovery_driver_label = get_recovery_driver_label(
    activity_driver_type,
    activity_driver_label
  );
  const recovery_model_label = get_recovery_model_label(recovery_model);

  const split_message = get_split_message({
    business_type,
    activity_driver_label: recovery_driver_label,
    recovery_model,
    labour_share_percent,
    asset_share_percent,
    overhead_share_percent,
  });

  return (
    <section className="ui-section">
      <div className="ui-panel">
        <div className="ui-stack">
          <div>
            <p className="ui-kicker">Recovery summary</p>
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">
              Your starting recovery model
            </h2>
            <p className="ui-help">
              This page shows the starting basis QS Tools is using to understand
              how your business recovers its cost burden. It is not a quote
              tool and it is not Business Modelling.
            </p>
          </div>

          <div className="ui-panel">
            <div className="ui-stack">
              <div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                  What this page is telling you
                </h3>
                <p className="ui-help">
                  Based on your current setup, QS Tools is treating this as a{" "}
                  {business_mode_label}. The main recovery driver is{" "}
                  {recovery_driver_label}.
                </p>
              </div>

              <div className="ui-panel">
                <p className="text-sm text-[var(--text-primary)]">
                  {split_message}
                </p>
              </div>

              <div className="ui-panel">
                <p className="text-sm text-[var(--text-primary)]">
                  Cost Allocation will check whether your staff, assets, and
                  operational structure can support this starting recovery model.
                </p>
              </div>
            </div>
          </div>

          <div className="ui-panel">
            <div className="ui-stack">
              <div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                  What the business needs to recover
                </h3>
                <p className="ui-help">
                  This is the total business cost burden coming from the current
                  model.
                </p>
              </div>

              <ReadOnlyRow
                label="Total cost burden"
                value={format_currency(total_cost_burden)}
                emphasis
              />

              <ReadOnlyRow
                label="Minimum recovery rate"
                value={format_currency(required_recovery_rate)}
              />

              <ReadOnlyRow
                label="Recovery driver"
                value={recovery_driver_label}
              />

              <ReadOnlyRow
                label="Recovery driver quantity"
                value={format_number(activity_driver_value ?? recovery_hours_used)}
              />
            </div>
          </div>

          <div className="ui-panel">
            <div className="ui-stack">
              <div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                  Suggested recovery split
                </h3>
                <p className="ui-help">
                  This is the starting recovery split QS Tools is using for the
                  model. Alternative strategies should be tested later in
                  Business Modelling.
                </p>
              </div>

              <ReadOnlyRow
                label="Starting recovery type"
                value={recovery_model_label}
                emphasis
              />

              <ReadOnlyRow
                label="Labour-led recovery share"
                value={`${format_number(labour_share_percent)}%`}
              />

              <ReadOnlyRow
                label="Asset recovery share"
                value={`${format_number(asset_share_percent)}%`}
              />

              <ReadOnlyRow
                label="Absorbed overhead share"
                value={`${format_number(overhead_share_percent)}%`}
              />

              <ReadOnlyRow
                label="Share total"
                value={`${format_number(share_total)}%`}
                emphasis
              />

              {share_not_balanced ? (
                <div className="ui-panel">
                  <p className="text-sm text-[var(--text-primary)]">
                    Recovery shares must total 100% before this recovery model
                    can be used.
                  </p>
                </div>
              ) : null}
            </div>
          </div>

          <div className="ui-panel">
            <div className="ui-stack">
              <div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                  What this split means in dollars
                </h3>
                <p className="ui-help">
                  This shows how the total cost burden is being assigned under
                  the current recovery model.
                </p>
              </div>

              <ReadOnlyRow
                label="Labour-led recovery burden"
                value={format_currency(labour_recovery_cost)}
              />

              <ReadOnlyRow
                label="Asset recovery burden"
                value={format_currency(asset_recovery_cost)}
              />

              <ReadOnlyRow
                label="Absorbed overhead burden"
                value={format_currency(overhead_absorbed_cost)}
              />
            </div>
          </div>

          <div className="ui-panel">
            <div className="ui-stack">
              <div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                  What Cost Allocation will test next
                </h3>
                <p className="ui-help">
                  The next page checks whether the visible business structure
                  can support this starting recovery model.
                </p>
              </div>

              <ReadOnlyRow
                label="Labour recovery pressure"
                value={format_currency(
                  required_labour_recovery_rate_per_recovery_hour
                )}
                emphasis
              />

              <ReadOnlyRow
                label="Required asset recovery"
                value={format_currency(required_asset_recovery)}
                emphasis
              />

              {no_recovery_hours ? (
                <div className="ui-panel">
                  <p className="text-sm text-[var(--text-primary)]">
                    No recovery hours are available, so labour recovery pressure
                    is held at 0.
                  </p>
                </div>
              ) : null}

              {asset_recovery_without_assets ? (
                <div className="ui-panel">
                  <p className="text-sm text-[var(--text-primary)]">
                    Asset recovery is active, but no asset recovery base is
                    available upstream.
                  </p>
                </div>
              ) : null}

              {labour_recovery_without_labour ? (
                <div className="ui-panel">
                  <p className="text-sm text-[var(--text-primary)]">
                    Labour recovery is active, but no labour base is available
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
                  Model notes
                </h3>
                <p className="ui-help">
                  These notes explain what the current recovery model means.
                </p>
              </div>

              <p className="text-sm text-[var(--text-primary)]">
                {insight_text}
              </p>
            </div>
          </div>

          <div className="ui-panel">
            <div className="ui-stack">
              <div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                  Advanced recovery settings
                </h3>
                <p className="ui-help">
                  These settings are available for testing the starting recovery
                  model. Larger strategy changes should be handled later in
                  Business Modelling.
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
                  <option value="labour_only">Labour-led recovery</option>
                  <option value="asset_driven">Asset-supported recovery</option>
                  <option value="hybrid">Hybrid recovery</option>
                </select>
              </label>

              <div className="grid grid-cols-1 gap-3">
                <PercentField
                  label="Labour-led recovery share percent"
                  value={labour_share_percent}
                  onChange={on_labour_share_change}
                  disabled={labour_only_locked}
                />

                <PercentField
                  label="Asset recovery share percent"
                  value={asset_share_percent}
                  onChange={on_asset_share_change}
                  disabled={labour_only_locked}
                />

                <PercentField
                  label="Absorbed overhead share percent"
                  value={overhead_share_percent}
                  onChange={on_overhead_share_change}
                  disabled={labour_only_locked}
                />
              </div>

              <div className="ui-actions">
                <button
                  type="button"
                  onClick={on_reset}
                  className="ui-button-secondary"
                >
                  Reset to suggested model
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}