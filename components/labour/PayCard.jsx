"use client";

export default function PayCard({ state, has_profile, update_field }) {
  return (
    <section className="ui-section">
      <div className="ui-stack">
        <div>
          <h2 className="text-lg font-semibold">Pay</h2>
          <p className="ui-help">Base labour rate and charge-out rate</p>
        </div>

        <div className="ui-stack">
          <Field label="Labour Rate">
            <input
              type="number"
              step="0.01"
              value={state.labour_rate ?? ""}
              onChange={(e) => update_field("labour_rate", e.target.value)}
              disabled={!has_profile}
              className="ui-input number-input"
            />
          </Field>

          <Field label="Charge Out Rate">
            <input
              type="number"
              step="0.01"
              value={state.charge_out_rate ?? ""}
              onChange={(e) => update_field("charge_out_rate", e.target.value)}
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