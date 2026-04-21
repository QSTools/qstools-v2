"use client";

function format_currency(value) {
  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function format_hours(value) {
  return `${new Intl.NumberFormat("en-NZ", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(value || 0))} hrs`;
}

function format_percent(value) {
  return `${new Intl.NumberFormat("en-NZ", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(Number(value || 0))}%`;
}

export default function LabourFlowCard({
  outputs = {},
  state = {},
  has_profile = false,
}) {
  if (!has_profile) {
    return (
      <section className="ui-section">
        <div className="ui-stack-sm">
          <div className="ui-kicker">Charge-out build</div>
          <h2 className="ui-card-title">Cost to charge-out flow</h2>
          <p className="ui-help">
            Create or load a Labour profile first to see how paid hours turn
            into productive hours, cost, and required charge-out.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="ui-section">
      <div className="ui-stack">
        <div className="ui-stack-sm">
          <div className="ui-kicker">Charge-out build</div>
          <h2 className="ui-card-title">Cost to charge-out flow</h2>
          <p className="ui-help">
            This shows how paid time, entitlements, employer cost, and
            productivity combine to create the Labour-only minimum charge-out
            requirement.
          </p>
        </div>

        <div className="ui-split-2">
          <div className="ui-panel">
            <div className="ui-stack-sm">
              <div className="ui-kicker">1. Available hours</div>

              <div>
                <div className="ui-label">Paid hours per year</div>
                <div>{format_hours(outputs.paid_hours_per_year)}</div>
              </div>

              <div>
                <div className="ui-label">Non-productive paid hours</div>
                <div>{format_hours(outputs.non_productive_paid_hours)}</div>
              </div>

              <div>
                <div className="ui-label">Productive hours</div>
                <div className="ui-card-title-sm">
                  {format_hours(outputs.productive_hours)}
                </div>
              </div>

              <div>
                <div className="ui-label">Productivity target</div>
                <div>{format_percent(state.productivity_percent)}</div>
              </div>
            </div>
          </div>

          <div className="ui-panel">
            <div className="ui-stack-sm">
              <div className="ui-kicker">2. Annual cost</div>

              <div>
                <div className="ui-label">Base labour cost annual</div>
                <div>{format_currency(outputs.base_labour_cost_annual)}</div>
              </div>

              <div>
                <div className="ui-label">Employer contribution total</div>
                <div>
                  {format_currency(outputs.total_employer_contribution_cost)}
                </div>
              </div>

              <div>
                <div className="ui-label">Total labour cost annual</div>
                <div className="ui-card-title-sm">
                  {format_currency(outputs.total_labour_cost_annual)}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="ui-split-2">
          <div className="ui-panel">
            <div className="ui-stack-sm">
              <div className="ui-kicker">3. Productive labour cost</div>

              <div>
                <div className="ui-label">Loaded labour cost rate</div>
                <div>{format_currency(outputs.loaded_labour_cost_rate)}</div>
              </div>

              <div>
                <div className="ui-label">Productive labour cost rate</div>
                <div className="ui-card-title-sm">
                  {format_currency(outputs.productive_labour_cost_rate)}
                </div>
              </div>

              <p className="ui-help">
                This is the real Labour cost per productive hour after paid
                non-productive time and employer contributions are taken into
                account.
              </p>
            </div>
          </div>

          <div className="ui-panel">
            <div className="ui-stack-sm">
              <div className="ui-kicker">4. Required charge-out</div>

              <div>
                <div className="ui-label">Margin target</div>
                <div>{format_percent(state.margin_target_percent)}</div>
              </div>

              <div>
                <div className="ui-label">Minimum charge-out rate</div>
                <div className="ui-card-title-sm">
                  {format_currency(outputs.minimum_charge_out_rate)}
                </div>
              </div>

              <div>
                <div className="ui-label">Current charge-out rate</div>
                <div>{format_currency(state.charge_out_rate)}</div>
              </div>

              <div>
                <div className="ui-label">Above recovery</div>
                <div>{format_currency(outputs.above_recovery)}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="ui-panel">
          <div className="ui-stack-sm">
            <div className="ui-kicker">Interpretation</div>
            <p className="ui-help">
              Labour only shows the staff cost and Labour-only recovery
              pressure. It does not include employee overheads, assets, or
              wider business overhead. Those layers are introduced later in the
              system.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}