"use client";

export default function WorkingPatternCard({
  state,
  outputs,
  has_profile,
  update_field,
}) {
  return (
    <section className="ui-section">
      <h2 className="text-lg font-semibold">Working Pattern</h2>
      <p className="mt-1 mb-5 text-sm text-[var(--text-muted)]">
        Weekly hours structure
      </p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Hours per Week">
          <input
            type="number"
            step="0.01"
            value={state.hours_per_week ?? ""}
            onChange={(e) => update_field("hours_per_week", e.target.value)}
            disabled={!has_profile}
            className="ui-input number-input"
          />
        </Field>

        <ReadOnlyField
          label="Paid Hours per Year"
          value={format_number(outputs.paid_hours_per_year)}
        />
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

function ReadOnlyField({ label, value }) {
  return (
    <div>
      <div className="ui-label">{label}</div>
      <div className="ui-readonly">
        {value}
      </div>
    </div>
  );
}

function format_number(value) {
  return Number(value || 0).toLocaleString(undefined, {
    maximumFractionDigits: 2,
  });
}