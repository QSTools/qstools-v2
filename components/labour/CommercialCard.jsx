"use client";

export default function CommercialCard({
  state,
  has_profile,
  update_field,
}) {
  return (
    <section className="ui-section">
      <h2 className="text-lg font-semibold">Commercial</h2>
      <p className="mt-1 mb-5 text-sm text-[var(--text-muted)]">
        Productivity and margin settings
      </p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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