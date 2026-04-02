"use client";

export default function CommercialCard({
  state,
  has_profile,
  update_field,
}) {
  return (
    <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
      <h2 className="text-lg font-semibold">Commercial</h2>
      <p className="mt-1 mb-5 text-sm text-neutral-400">
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
            className="number-input w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm"
          />
        </Field>

        <Field label="Margin Target Percent">
          <input
            type="number"
            step="0.01"
            value={state.margin_target_percent ?? ""}
            onChange={(e) => update_field("margin_target_percent", e.target.value)}
            disabled={!has_profile}
            className="number-input w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm"
          />
        </Field>
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