"use client";

export default function EmployerContributionsCard({
  state = {},
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
            These settings control employer-funded Labour costs. The calculated
            contribution outputs remain visible in the Labour Summary and Rate
            Builder, not here.
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