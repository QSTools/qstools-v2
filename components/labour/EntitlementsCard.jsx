"use client";

export default function EntitlementsCard({
  state,
  outputs,
  has_profile,
  update_field,
}) {
  return (
    <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
      <h2 className="text-lg font-semibold">Entitlements</h2>
      <p className="mt-1 mb-5 text-sm text-neutral-400">
        NZ default leave and entitlement model
      </p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Field label="Annual Leave Weeks">
          <input
            type="number"
            step="0.01"
            value={state.annual_leave_weeks ?? ""}
            onChange={(e) => update_field("annual_leave_weeks", e.target.value)}
            disabled={!has_profile}
            className="number-input w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm"
          />
        </Field>

        <Field label="Public Holiday Days">
          <input
            type="number"
            step="0.01"
            value={state.public_holiday_days ?? ""}
            onChange={(e) => update_field("public_holiday_days", e.target.value)}
            disabled={!has_profile}
            className="number-input w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm"
          />
        </Field>

        <Field label="Sick Days">
          <input
            type="number"
            step="0.01"
            value={state.sick_days ?? ""}
            onChange={(e) => update_field("sick_days", e.target.value)}
            disabled={!has_profile}
            className="number-input w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm"
          />
        </Field>

        <Field label="Bereavement Days">
          <input
            type="number"
            step="0.01"
            value={state.bereavement_days ?? ""}
            onChange={(e) => update_field("bereavement_days", e.target.value)}
            disabled={!has_profile}
            className="number-input w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm"
          />
        </Field>

        <Field label="Family Violence Days">
          <input
            type="number"
            step="0.01"
            value={state.family_violence_days ?? ""}
            onChange={(e) => update_field("family_violence_days", e.target.value)}
            disabled={!has_profile}
            className="number-input w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm"
          />
        </Field>

        <ReadOnlyField
          label="Non-Productive Paid Hours"
          value={format_number(outputs.non_productive_paid_hours)}
        />
      </div>
    </section>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <div className="mb-2 text-sm text-neutral-300">{label}</div>
      {children}
    </label>
  );
}

function ReadOnlyField({ label, value }) {
  return (
    <div>
      <div className="mb-2 text-sm text-neutral-300">{label}</div>
      <div className="rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-200">
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