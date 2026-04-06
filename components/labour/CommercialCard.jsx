"use client";

export default function CommercialCard({
  state,
  has_profile,
  update_field,
}) {
  return (
    <section className="ui-section">
      <div className="ui-stack">
        <div>
          <h2 className="text-lg font-semibold">Commercial</h2>
          <p className="ui-help">Productivity and target margin settings</p>
        </div>

        <div className="ui-stack">
          <Field label="Productivity Percent">
            <input
              type="number"
              step="0.01"
              value={state.productivity_percent ?? ""}
              onChange={(e) => update_field("productivity_percent", e.target.value)}
              disabled={!has_profile}
              className="ui-input number-input"
            />
          </Field>

          <Field label="Margin Target Percent">
            <input
              type="number"
              step="0.01"
              value={state.margin_target_percent ?? ""}
              onChange={(e) => update_field("margin_target_percent", e.target.value)}
              disabled={!has_profile}
              className="ui-input number-input"
            />
          </Field>
        </div>
      </div>
    </section>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <div className="ui-label">{label}</div>
      {children}
    </label>
  );
}