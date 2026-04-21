"use client";

function get_status_tone(labour_status = "green") {
  if (labour_status === "green") return "success";
  if (labour_status === "amber") return "warning";
  return "danger";
}

function get_status_title(labour_status = "green") {
  if (labour_status === "green") return "Labour ready";
  if (labour_status === "amber") return "Review required";
  return "Blocked";
}

export default function LabourStatusStrip({
  profile_state_label = "No active profile",
  staff_name_label = "Unnamed staff",
  staff_role_label = "No role",
  labour_class_label = "No class",
  saved_profiles_label = "0 saved",
  active_profile_label = "0 active",
  productive_hours_label = "0 hrs",
  minimum_charge_out_label = "$0",
  margin_health_label = "Under recovery",

  labour_ready = false,
  labour_status = "red",
  reconciliation_label = "Blocked",

  pnl_benchmark_total_label = "$0",
  module_total_label = "$0",
  labour_variance_amount_label = "$0",
  labour_variance_percent_label = "0%",

  warning_count = 0,
  warnings = [],
}) {
  const tone = get_status_tone(labour_status);
  const status_title = get_status_title(labour_status);

  return (
    <section className="ui-section">
      <div className="ui-panel">
        <div className="ui-stack-sm">
          <div className="ui-split">
            <div className="ui-stack-sm">
              <div className="ui-kicker">Labour status</div>
              <h2 className="ui-display" style={{ margin: 0 }}>
                {status_title}
              </h2>
              <p className="ui-help" style={{ margin: 0 }}>
                Reconciliation strip is diagnostic only. Labour remains the
                labour cost engine.
              </p>
            </div>

            <div className="ui-actions">
              <span className={`ui-pill ui-pill-${tone}`}>
                {reconciliation_label}
              </span>
              <span className="ui-pill">
                {labour_ready ? "Ready" : "Not ready"}
              </span>
            </div>
          </div>

          <div className="ui-split-2">
            <div className="ui-panel">
              <div className="ui-stack-sm">
                <div className="ui-kicker">Profile</div>
                <div className="ui-help">{profile_state_label}</div>

                <div className="ui-stack-sm">
                  <div>
                    <div className="ui-label">Staff</div>
                    <div>{staff_name_label}</div>
                  </div>

                  <div>
                    <div className="ui-label">Role</div>
                    <div>{staff_role_label}</div>
                  </div>

                  <div>
                    <div className="ui-label">Class</div>
                    <div>{labour_class_label}</div>
                  </div>
                </div>

                <div className="ui-actions">
                  <span className="ui-pill">{saved_profiles_label}</span>
                  <span className="ui-pill">{active_profile_label}</span>
                </div>
              </div>
            </div>

            <div className="ui-panel">
              <div className="ui-stack-sm">
                <div className="ui-kicker">Live position</div>

                <div className="ui-split-2">
                  <div>
                    <div className="ui-label">Productive hours</div>
                    <div>{productive_hours_label}</div>
                  </div>

                  <div>
                    <div className="ui-label">Minimum charge-out</div>
                    <div>{minimum_charge_out_label}</div>
                  </div>
                </div>

                <div>
                  <div className="ui-label">Margin health</div>
                  <div>{margin_health_label}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="ui-panel">
            <div className="ui-stack-sm">
              <div className="ui-kicker">Reconciliation</div>

              <div className="ui-split-2">
                <div>
                  <div className="ui-label">P&amp;L benchmark</div>
                  <div>{pnl_benchmark_total_label}</div>
                </div>

                <div>
                  <div className="ui-label">Module total</div>
                  <div>{module_total_label}</div>
                </div>
              </div>

              <div className="ui-split-2">
                <div>
                  <div className="ui-label">Variance amount</div>
                  <div>{labour_variance_amount_label}</div>
                </div>

                <div>
                  <div className="ui-label">Variance percent</div>
                  <div>{labour_variance_percent_label}</div>
                </div>
              </div>

              <p className="ui-help" style={{ margin: 0 }}>
                Green = ready. Amber = explanation required. Red = blocked.
              </p>
            </div>
          </div>

          {warning_count > 0 ? (
            <div className="ui-panel">
              <div className="ui-stack-sm">
                <div className="ui-kicker">Warnings</div>
                <p className="ui-help" style={{ margin: 0 }}>
                  {warning_count} issue{warning_count === 1 ? "" : "s"} detected.
                </p>

                <div className="ui-stack-sm">
                  {warnings.map((warning, index) => (
                    <div key={`${warning}-${index}`} className="ui-help">
                      • {warning}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}