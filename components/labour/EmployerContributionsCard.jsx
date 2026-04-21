"use client";

function format_currency(value) {
  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function format_percent_decimal(value) {
  return `${(Number(value || 0) * 100).toFixed(1)}%`;
}

export default function EmployerContributionsCard({
  state = {},
  outputs = {},
  has_profile = false,
  update_field,
}) {
  const disabled = !has_profile;

  return (
    <section className="ui-section">
      <div className="ui-stack">
        <div className="ui-stack-sm">
          <div className="ui-kicker">Employer contributions</div>
          <h2 className="ui-card-title">KiwiSaver and ESCT</h2>
          <p className="ui-help">
            These are real employer-funded labour costs and must stay visible as
            part of the Labour model.
          </p>
        </div>

        <div className="ui-stack-sm">
          <label className="ui-stack-sm">
            <span className="ui-label">Employee KiwiSaver enabled</span>
            <select
              className="ui-select"
              value={state.employee_kiwisaver_enabled ? "yes" : "no"}
              onChange={(event) =>
                update_field?.(
                  "employee_kiwisaver_enabled",
                  event.target.value === "yes"
                )
              }
              disabled={disabled}
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </label>
        </div>

        <div className="ui-panel">
          <div className="ui-stack-sm">
            <div className="ui-kicker">Contribution outputs</div>

            <div className="ui-split-2">
              <div>
                <div className="ui-label">Employer KiwiSaver</div>
                <div>{format_currency(outputs.employer_kiwisaver_gross)}</div>
              </div>

              <div>
                <div className="ui-label">ESCT rate</div>
                <div>{format_percent_decimal(outputs.esct_rate)}</div>
              </div>
            </div>

            <div className="ui-split-2">
              <div>
                <div className="ui-label">ESCT amount</div>
                <div>{format_currency(outputs.esct_amount)}</div>
              </div>

              <div>
                <div className="ui-label">Employer contribution total</div>
                <div className="ui-card-title-sm">
                  {format_currency(outputs.total_employer_contribution_cost)}
                </div>
              </div>
            </div>

            <p className="ui-help">
              Employer KiwiSaver and ESCT remain separate visible components.
              They should not be silently absorbed into another labour line.
            </p>
          </div>
        </div>

        {!has_profile ? (
          <div className="ui-panel">
            <p className="ui-help">
              Create a Labour profile first to unlock employer contribution
              settings.
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}