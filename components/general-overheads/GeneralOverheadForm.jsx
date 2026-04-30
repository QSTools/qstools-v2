const fixed_fields = [
  ["public_liability_insurance", "Public Liability Insurance"],
  ["professional_indemnity_insurance", "Professional Indemnity Insurance"],
  ["accounting_fees", "Accounting Fees"],
  ["legal_fees", "Legal Fees"],
  ["software_subscriptions", "Software Subscriptions"],
  ["office_rent", "Office Rent"],
  ["power_cost", "Power"],
  ["internet_cost", "Internet"],
  ["phone_system_cost", "Phone System"],
  ["bank_fees", "Bank Fees"],
  ["marketing_cost", "Marketing"],
  ["office_supplies_cost", "Office Supplies"],
  ["general_admin_cost", "General Admin"],
  ["other_general_overhead_cost", "Other General Overheads"],
];

export default function GeneralOverheadForm({
  overhead_state,
  update_field,
  update_custom_item,
  add_custom_item,
  remove_custom_item,
}) {
  const synced_pnl_items = overhead_state.synced_pnl_overhead_items ?? [];
  const manual_custom_items = (overhead_state.custom_overhead_items ?? []).filter(
    (item) => item.source_module !== "p_and_l",
  );

  return (
    <section className="ui-panel">
      <div className="ui-page-stack">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Annual overhead inputs
          </h2>
          <p className="ui-help">
            Enter annual business costs only. No allocation or recovery logic here.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {fixed_fields.map(([field, label]) => (
            <label key={field} className="ui-stack">
              <span className="ui-label">{label}</span>
              <input
                type="number"
                min="0"
                step="0.01"
                className="ui-input"
                value={overhead_state[field] ?? 0}
                onChange={(event) => update_field(field, event.target.value)}
              />
            </label>
          ))}
        </div>

        {synced_pnl_items.length > 0 ? (
          <div className="ui-panel ui-stack-sm">
            <div className="ui-label">Synced from P&amp;L</div>
            <p className="ui-help">
              These values are wired from the current P&amp;L sync and should be
              changed in P&amp;L if the source amount is wrong.
            </p>

            <div className="labour-summary-table">
              {synced_pnl_items.map((item) => (
                <div
                  key={item.synced_overhead_id}
                  className="labour-summary-table-row"
                >
                  <div className="labour-summary-table-label">
                    {item.synced_overhead_name || "Synced P&L Overhead"}
                  </div>
                  <div className="labour-summary-table-value">
                    {item.synced_overhead_amount ?? 0}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="ui-page-stack">
          <div className="ui-split">
            <div>
              <h3 className="text-base font-semibold text-[var(--text-primary)]">
                Custom overhead items
              </h3>
              <p className="ui-help">
                Use these for extra annual costs not covered above.
              </p>
            </div>

            <button type="button" className="ui-button-secondary" onClick={add_custom_item}>
              Add custom item
            </button>
          </div>

          {manual_custom_items.map((item) => (
            <div key={item.custom_overhead_id} className="ui-panel">
              <div className="grid grid-cols-1 gap-4">
                <label className="ui-stack">
                  <span className="ui-label">Item name</span>
                  <input
                    className="ui-input"
                    value={item.custom_overhead_name || ""}
                    onChange={(event) =>
                      update_custom_item(
                        item.custom_overhead_id,
                        "custom_overhead_name",
                        event.target.value
                      )
                    }
                  />
                </label>

                <label className="ui-stack">
                  <span className="ui-label">Annual amount</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="ui-input"
                    value={item.custom_overhead_amount ?? 0}
                    onChange={(event) =>
                      update_custom_item(
                        item.custom_overhead_id,
                        "custom_overhead_amount",
                        event.target.value
                      )
                    }
                  />
                </label>
              </div>

              <div className="mt-4 ui-actions">
                <button
                  type="button"
                  className="ui-button-danger"
                  onClick={() => remove_custom_item(item.custom_overhead_id)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
