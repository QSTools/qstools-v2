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

function format_rate(value, suffix = "/hr") {
  return `${format_currency(value)}${suffix}`;
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
  recovery_hours_used,

  business_type,
  activity_driver_type,
  units_sold_annual,

  actual_recovery_rate,
  profit_or_deficit_per_recovery_hour,

  recovery_model,
  labour_share_percent,
  asset_share_percent,
  overhead_share_percent,

  labour_recovery_cost,
  asset_recovery_cost,
  overhead_absorbed_cost,
  share_total,

  share_not_balanced,

  insight_text,

  on_recovery_model_change,
  on_labour_share_change,
  on_asset_share_change,
  on_overhead_share_change,
  on_reset,
}) {
  const labour_only_locked = recovery_model === "labour_only";
  const is_product_based =
    business_type === "product_based" || activity_driver_type === "units";

  const recovery_driver_label = is_product_based
    ? "Units used"
    : "Selected recovery hours";

  const recovery_driver_quantity = is_product_based
    ? units_sold_annual
    : recovery_hours_used;

  const required_recovery_label = is_product_based
    ? "Required recovery per unit"
    : "Required recovery per recovery hour";

  const actual_recovery_label = is_product_based
    ? "Actual recovery per unit"
    : "Actual recovery per recovery hour";

  const variance_label = is_product_based
    ? "Recovery variance per unit"
    : "Recovery variance per recovery hour";

  const rate_suffix = is_product_based ? "/unit" : "/hr";

  const required_recovery_rate_display = format_rate(
    required_recovery_rate,
    rate_suffix
  );

  const actual_recovery_rate_display = format_rate(
    actual_recovery_rate,
    rate_suffix
  );

  const recovery_variance_display = format_rate(
    profit_or_deficit_per_recovery_hour,
    rate_suffix
  );

  const has_recovery_shortfall =
    Number(profit_or_deficit_per_recovery_hour ?? 0) < 0;

  const has_recovery_surplus =
    Number(profit_or_deficit_per_recovery_hour ?? 0) > 0;

  const recovery_result_text = has_recovery_shortfall
    ? `The business is currently ${format_rate(
        Math.abs(Number(profit_or_deficit_per_recovery_hour ?? 0)),
        rate_suffix
      )} below the required recovery rate.`
    : has_recovery_surplus
      ? `The business is currently ${format_rate(
          profit_or_deficit_per_recovery_hour,
          rate_suffix
        )} above the required recovery rate.`
      : "The business is currently matching the required recovery rate.";

  return (
    <section className="ui-section">
      <div className="ui-panel">
        <div className="ui-stack">
          <div>
            <p className="ui-kicker">Recovery basis</p>

            <h2 className="text-xl font-semibold text-[var(--text-primary)]">
              Recovery basis being carried forward
            </h2>

            <p className="ui-help">
              This section shows how the Business Summary cost burden becomes a
              recovery rate. Cost Allocation will test whether the business
              structure can support this rate.
            </p>
          </div>

          <div className="ui-panel">
            <div className="ui-stack">
              <div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                  Recovery requirement
                </h3>

                <p className="ui-help">
                  This shows how the Business Summary cost burden becomes the
                  recovery rate carried forward into Cost Allocation.
                </p>
              </div>

              <div className="ui-readonly">
                <div className="ui-stack-sm">
                  <p className="ui-kicker">Required recovery build-up</p>

                  <div className="labour-summary-table">
                    <div className="labour-summary-table-row">
                      <div className="labour-summary-table-label">
                        Total cost burden
                      </div>
                      <div className="labour-summary-table-value">
                        {format_currency(total_cost_burden)}
                      </div>
                    </div>

                    <div className="labour-summary-table-row">
                      <div className="labour-summary-table-label">
                        {recovery_driver_label}
                      </div>
                      <div className="labour-summary-table-value">
                        {is_product_based
                          ? format_number(recovery_driver_quantity)
                          : `${format_number(recovery_driver_quantity)} hrs`}
                      </div>
                    </div>

                    <div className="labour-summary-table-row total">
                      <div className="labour-summary-table-label">
                        {required_recovery_label}
                      </div>
                      <div className="labour-summary-table-value">
                        {required_recovery_rate_display}
                      </div>
                    </div>
                  </div>

                  <p className="ui-help">
                    {is_product_based
                      ? "Total cost burden ÷ units used = required recovery per unit."
                      : "Total cost burden ÷ selected recovery hours = required recovery per recovery hour."}
                  </p>
                </div>
              </div>

              <div className="ui-readonly">
                <div className="ui-stack-sm">
                  <p className="ui-kicker">Actual vs required</p>

                  <div className="labour-summary-table">
                    <div className="labour-summary-table-row">
                      <div className="labour-summary-table-label">
                        {actual_recovery_label}
                      </div>
                      <div className="labour-summary-table-value">
                        {actual_recovery_rate_display}
                      </div>
                    </div>

                    <div className="labour-summary-table-row">
                      <div className="labour-summary-table-label">
                        {required_recovery_label}
                      </div>
                      <div className="labour-summary-table-value">
                        {required_recovery_rate_display}
                      </div>
                    </div>

                    <div className="labour-summary-table-row total">
                      <div className="labour-summary-table-label">
                        {variance_label}
                      </div>
                      <div className="labour-summary-table-value">
                        {recovery_variance_display}
                      </div>
                    </div>
                  </div>

                  <p className="ui-help">
                    Actual recovery rate - required recovery rate = recovery
                    variance.
                  </p>

                  <div className="ui-readonly">
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {recovery_result_text}
                    </p>
                  </div>
                </div>
              </div>
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
                  <option value="labour_only">Labour-led recovery</option>
                  <option value="asset_driven">Asset-supported recovery</option>
                  <option value="hybrid">Hybrid recovery</option>
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
                  These shares define how the recovery burden is split across
                  labour, assets, and absorbed overhead. Leave this as the
                  default unless you are intentionally modelling a different
                  recovery strategy.
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
                  label="Absorbed overhead share percent"
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
                <div className="ui-readonly">
                  <p className="text-sm font-medium text-[var(--text-primary)]">
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
                  Recovery distribution
                </h3>

                <p className="ui-help">
                  This shows how the cost burden is being assigned by the
                  current recovery strategy.
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
                label="Absorbed overhead cost"
                value={format_currency(overhead_absorbed_cost)}
              />
            </div>
          </div>

          <div className="ui-panel">
            <div className="ui-stack">
              <div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                  Recovery insight
                </h3>
              </div>

              <p className="text-sm text-[var(--text-primary)]">
                {insight_text}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}