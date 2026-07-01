export default function RateBuilderLabourRatesInputCard({ model }) {
  const {
    active_model,
    selected_labour_source,
    labour_source_options,
    is_all_productive_summary,
    selected_source_charge_out_rate,
    current_charge_out_rate,
    labour_source_rate_save_status,
    actions,
  } = model;

  return (
    <div className="ui-panel">
      <div className="ui-stack">
        <div>
          <p className="ui-kicker">Input</p>
          <h3 className="ui-section-title">Rate assumptions</h3>
        </div>

        <div className="ui-field">
          <label className="ui-label" htmlFor="labour_rate_model_name">
            Calculator name
          </label>
          <input
            id="labour_rate_model_name"
            className="ui-input"
            value={active_model.labour_rate_model_name}
            onChange={(event) =>
              actions.update_active_model(
                "labour_rate_model_name",
                event.target.value
              )
            }
          />
        </div>

        <div className="ui-field">
          <label className="ui-label" htmlFor="labour_source_type_id">
            Labour source
          </label>
          <select
            id="labour_source_type_id"
            className="ui-select"
            value={
              selected_labour_source?.labour_source_type_id ||
              active_model.labour_source_type_id ||
              "all_productive"
            }
            onChange={(event) =>
              actions.handle_labour_source_change(event.target.value)
            }
          >
            {labour_source_options.map((option) => (
              <option
                key={option.labour_source_type_id}
                value={option.labour_source_type_id}
              >
                {option.labour_source_type_name}
              </option>
            ))}
          </select>
          <p className="ui-help">
            Productive staff type rates are editable. The all productive option
            is a read-only weighted summary.
          </p>
        </div>

        <div className="ui-field">
          <label className="ui-label" htmlFor="current_charge_out_rate">
            {is_all_productive_summary
              ? "Weighted current charge-out rate"
              : "Current charge-out rate"}
          </label>
          <input
            id="current_charge_out_rate"
            className="ui-input"
            type="number"
            min="0"
            step="0.01"
            value={
              is_all_productive_summary
                ? Number(current_charge_out_rate.toFixed(2))
                : selected_source_charge_out_rate
            }
            disabled={is_all_productive_summary}
            onChange={(event) =>
              actions.update_source_charge_out_rate(event.target.value)
            }
          />
          <p className="ui-help">
            {is_all_productive_summary
              ? "This is derived from the individual staff-type charge-out rates weighted by productive hours."
              : "Enter the hourly labour rate the business currently charges or intends to charge for this staff type."}
          </p>
        </div>

        {!is_all_productive_summary ? (
          <div className="ui-actions">
            <button
              type="button"
              className="ui-button-primary"
              onClick={actions.save_selected_labour_source_charge_out_rate}
            >
              Save rate
            </button>

            {labour_source_rate_save_status ? (
              <span className="ui-help">{labour_source_rate_save_status}</span>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}