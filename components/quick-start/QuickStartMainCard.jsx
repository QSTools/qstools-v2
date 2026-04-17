"use client";

function render_mode_buttons(business_type, update_quick_start_field) {
  const options = [
    { key: "labour_rate_reality_check", label: "Labour Reality Check" },
    { key: "product_time", label: "Product + Time" },
    { key: "m2_rate", label: "m² Rate" },
    { key: "asset_operator", label: "Asset + Operator" },
  ];

  return (
    <div className="ui-actions">
      {options.map((option) => (
        <button
          key={option.key}
          type="button"
          className={
            business_type === option.key
              ? "ui-button-primary"
              : "ui-button-secondary"
          }
          onClick={() => update_quick_start_field("business_type", option.key)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function render_field(label, value, field_name, update_quick_start_field) {
  return (
    <label className="ui-stack">
      <span className="ui-label">{label}</span>
      <input
        className="ui-input"
        type="number"
        value={value ?? ""}
        onChange={(event) => {
          const next_value = event.target.value;
          update_quick_start_field(
            field_name,
            next_value === "" ? "" : Number(next_value)
          );
        }}
      />
    </label>
  );
}

function render_inputs(business_type, fields, update_quick_start_field) {
  if (business_type === "labour_rate_reality_check") {
    return (
      <div className="ui-stack">
        {render_field(
          "Charge hrly rate",
          fields.labour_rate,
          "labour_rate",
          update_quick_start_field
        )}
        {render_field(
          "Hours per Week",
          fields.hours_per_week,
          "hours_per_week",
          update_quick_start_field
        )}
      </div>
    );
  }

  if (business_type === "product_time") {
    return (
      <div className="ui-stack">
        {render_field(
          "Labour Hours",
          fields.labour_hours,
          "labour_hours",
          update_quick_start_field
        )}
        {render_field(
          "Total Job Price",
          fields.total_job_price,
          "total_job_price",
          update_quick_start_field
        )}
        {render_field(
          "Product Cost",
          fields.product_cost,
          "product_cost",
          update_quick_start_field
        )}
        {render_field(
          "Product Margin (%)",
          fields.product_margin_percent,
          "product_margin_percent",
          update_quick_start_field
        )}
        {render_field(
          "Staff Assigned",
          fields.staff_assigned,
          "staff_assigned",
          update_quick_start_field
        )}
      </div>
    );
  }

  if (business_type === "m2_rate") {
    return (
      <div className="ui-stack">
        {render_field(
          "Total m²",
          fields.total_m2,
          "total_m2",
          update_quick_start_field
        )}
        {render_field(
          "m² Rate",
          fields.rate_per_m2,
          "rate_per_m2",
          update_quick_start_field
        )}
        {render_field(
          "Expected Task Hours",
          fields.expected_task_hours,
          "expected_task_hours",
          update_quick_start_field
        )}
        {render_field(
          "Staff Assigned",
          fields.staff_assigned,
          "staff_assigned",
          update_quick_start_field
        )}
        {render_field(
          "Expected Labour Margin (%)",
          fields.expected_labour_margin_percent,
          "expected_labour_margin_percent",
          update_quick_start_field
        )}
      </div>
    );
  }

  return (
    <div className="ui-stack">
      {render_field(
        "Machine Rate ($/hr)",
        fields.machine_rate,
        "machine_rate",
        update_quick_start_field
      )}
      {render_field(
        "Operator Rate ($/hr)",
        fields.operator_rate,
        "operator_rate",
        update_quick_start_field
      )}
      {render_field(
        "Charge-out Rate ($/hr)",
        fields.charge_out_rate,
        "charge_out_rate",
        update_quick_start_field
      )}
      {render_field(
        "Hours per Week",
        fields.utilisation_hours,
        "utilisation_hours",
        update_quick_start_field
      )}
    </div>
  );
}

function get_segment_text_class(percent) {
  if (percent < 12) {
    return "truncate whitespace-nowrap text-xs font-semibold leading-none";
  }

  if (percent < 18) {
    return "truncate whitespace-nowrap text-sm font-semibold leading-none";
  }

  if (percent < 28) {
    return "truncate whitespace-nowrap text-base font-semibold leading-none";
  }

  return "truncate whitespace-nowrap text-lg font-semibold leading-none";
}

function render_bar_segment(value, percent, background) {
  if (percent <= 0) {
    return null;
  }

  return (
    <div
      className="flex items-center justify-center text-white px-2 overflow-hidden"
      style={{
        width: `${percent}%`,
        background,
      }}
    >
      <span className={get_segment_text_class(percent)}>{value}</span>
    </div>
  );
}

function render_remaining_segment(percent) {
  if (percent <= 0) {
    return null;
  }

  return (
    <div
      className="flex items-center justify-center px-2 overflow-hidden"
      style={{
        width: `${percent}%`,
        background: "#5c8fe0",
      }}
    />
  );
}

function render_labour_reality_graph({
  headline_rate_value,
  equivalent_rate_value,
  headline_rate_pct,
  lost_rate_pct,
}) {
  return (
    <div className="w-full max-w-2xl pt-4">
      <div className="flex justify-around text-sm font-medium text-[var(--text-secondary)] mb-2">
        <span>THINK</span>
        <span className="text-[var(--accent)]">REAL</span>
      </div>

      <div className="w-full flex rounded-2xl overflow-hidden min-h-[84px] border border-[var(--border-primary)]">
        {render_bar_segment(headline_rate_value, headline_rate_pct, "#8e97a8")}
        {render_remaining_segment(lost_rate_pct)}
      </div>

      <div className="mt-4 text-3xl font-semibold text-[var(--accent)]">
        {equivalent_rate_value}{" "}
        <span className="text-[var(--text-secondary)] font-normal">
          REAL RATE
        </span>
      </div>
    </div>
  );
}

function render_standard_graph({
  cost_value,
  labour_value,
  remaining_value,
  cost_pct,
  labour_pct,
  remaining_pct,
}) {
  return (
    <div className="w-full max-w-2xl pt-4">
      <div className="flex justify-around text-sm font-medium text-[var(--text-secondary)] mb-2">
        <span>COST</span>
        <span>LABOUR</span>
        <span className="text-[var(--accent)]">REMAINING</span>
      </div>

      <div className="w-full flex rounded-2xl overflow-hidden min-h-[84px] border border-[var(--border-primary)]">
        {render_bar_segment(cost_value, cost_pct, "#8e97a8")}
        {render_bar_segment(labour_value, labour_pct, "#91c37b")}
        {render_remaining_segment(remaining_pct)}
      </div>

      <div className="mt-4 text-3xl font-semibold text-[var(--accent)]">
        {remaining_value}{" "}
        <span className="text-[var(--text-secondary)] font-normal">
          REMAINING
        </span>
      </div>

      <div className="mt-4 flex flex-col items-center gap-2 text-lg text-[var(--text-secondary)]">
        <div>↓</div>
        <div>Overheads</div>
        <div>↓</div>
        <div className="font-medium text-[var(--text-primary)]">
          Actual Profit
        </div>
      </div>
    </div>
  );
}

export default function QuickStartMainCard({
  business_type,
  update_quick_start_field,
  reset_quick_start_state,
  fields,
  primary_value,
  primary_label,
  sub_label,
  metrics,
  total_job_value,
  cost_value,
  labour_value,
  remaining_value,
  cost_pct,
  labour_pct,
  remaining_pct,
  insight_text,

  headline_rate_text,
  equivalent_rate_text,
  headline_rate_value,
  equivalent_rate_value,
  headline_rate_pct,
  lost_rate_pct,
  annual_perfect_text,
  annual_real_text,
}) {
  const is_labour_reality = business_type === "labour_rate_reality_check";

  return (
    <section className="ui-section">
      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="ui-panel ui-stack">
          <div className="ui-stack">
            <div className="ui-kicker">Quick Start</div>
            <h1>
              {is_labour_reality
                ? "What you think you’re earning vs what you’re actually getting"
                : "Do your quotes reflect your business model?"}
            </h1>
            <p className="ui-help">
              {is_labour_reality
                ? "A fast reality check for contractor rates."
                : "We reflect your business back to you — then show you if it works."}
            </p>
          </div>

          {render_mode_buttons(business_type, update_quick_start_field)}
          {render_inputs(business_type, fields, update_quick_start_field)}

          <div className="ui-actions">
            <button
              type="button"
              className="ui-button-secondary"
              onClick={reset_quick_start_state}
            >
              Reset
            </button>
          </div>
        </div>

        <div className="ui-panel ui-stack items-center text-center">
          {is_labour_reality ? (
            <>
              <div className="text-sm text-[var(--text-secondary)]">
                Charge hrly rate
              </div>

              <div className="text-4xl font-semibold text-[var(--text-primary)]">
                {headline_rate_text}
              </div>

              {render_labour_reality_graph({
                headline_rate_value,
                equivalent_rate_value,
                headline_rate_pct,
                lost_rate_pct,
              })}

              <div className="ui-stack pt-2">
                <p className="ui-help">
                  This is what your rate looks like based on NZ standard
                  entitlements.
                </p>
                <p className="ui-help">
                  4 weeks holiday, sick leave, public holidays, and other unpaid
                  time reduce what this rate is really worth.
                </p>
                <p className="ui-help">
                  You still have to pay tax, ACC, vehicle costs, tools,
                  insurance, and job gaps out of this as well.
                </p>
              </div>

              <div className="w-full max-w-xl ui-stack pt-4">
                {metrics.map((metric) => (
                  <div key={metric.label} className="ui-split">
                    <span>{metric.label}</span>
                    <strong>{metric.value}</strong>
                  </div>
                ))}
              </div>

              <div className="ui-stack pt-4">
                <p className="ui-help">{annual_perfect_text}</p>
                <p className="ui-help">{annual_real_text}</p>
              </div>

              <div className="ui-help pt-2">{insight_text}</div>
            </>
          ) : (
            <>
              <div className="text-2xl font-semibold text-[var(--text-primary)]">
                {total_job_value}
              </div>

              <div className="text-sm text-[var(--text-secondary)]">
                Total Job Value
              </div>

              <div className="text-4xl font-semibold">{primary_value}</div>

              <div className="ui-help">{primary_label}</div>
              <div className="ui-help">{sub_label}</div>

              {render_standard_graph({
                cost_value,
                labour_value,
                remaining_value,
                cost_pct,
                labour_pct,
                remaining_pct,
              })}

              <div className="w-full max-w-xl ui-stack pt-4">
                {metrics.map((metric) => (
                  <div key={metric.label} className="ui-split">
                    <span>{metric.label}</span>
                    <strong>{metric.value}</strong>
                  </div>
                ))}
              </div>

              <div className="ui-stack pt-4">
                <p className="ui-help">
                  This is what’s left to run your business.
                </p>
                <p className="ui-help">Overheads come out of this.</p>
                <p className="ui-help">
                  What’s left after that is <strong>your real profit.</strong>
                </p>
              </div>

              <div className="ui-help pt-2">{insight_text}</div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}