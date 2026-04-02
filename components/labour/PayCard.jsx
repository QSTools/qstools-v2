"use client";

export default function PayCard({ state, has_profile, update_field }) {
  return (
    <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
      <h2 className="text-lg font-semibold">Pay</h2>
      <p className="mt-1 mb-5 text-sm text-neutral-400">
        Base labour rate and charge-out rate
      </p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Labour Rate">
          <input
            type="number"
            step="0.01"
            value={state.labour_rate ?? ""}
            onChange={(e) => update_field("labour_rate", e.target.value)}
            disabled={!has_profile}
            className="number-input w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm"
          />
        </Field>

        <Field label="Charge Out Rate">
          <input
            type="number"
            step="0.01"
            value={state.charge_out_rate ?? ""}
            onChange={(e) => update_field("charge_out_rate", e.target.value)}
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