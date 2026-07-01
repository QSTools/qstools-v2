export default function RateBuilderLabourRatesSetupCard({ model }) {
  const {
    labour_rate_models,
    active_model,
    actions,
  } = model;

  return (
    <div className="ui-panel">
      <div className="ui-stack">
        <div>
          <p className="ui-kicker">Saved rate models</p>
          <h3 className="ui-section-title">Labour rate setup</h3>
        </div>

        <div className="ui-field">
          <label className="ui-label" htmlFor="labour_rate_model_select">
            Saved calculator
          </label>
          <select
            id="labour_rate_model_select"
            className="ui-select"
            value={active_model.labour_rate_model_id}
            onChange={(event) =>
              actions.set_active_labour_rate_model_id(event.target.value)
            }
          >
            {labour_rate_models.map((labour_rate_model) => (
              <option
                key={labour_rate_model.labour_rate_model_id}
                value={labour_rate_model.labour_rate_model_id}
              >
                {labour_rate_model.labour_rate_model_name}
              </option>
            ))}
          </select>
        </div>

        <div className="ui-actions">
          <button
            type="button"
            className="ui-button-primary"
            onClick={actions.handle_new_model}
          >
            New rate
          </button>

          <button
            type="button"
            className="ui-button-secondary"
            onClick={actions.handle_duplicate_model}
          >
            Duplicate
          </button>

          <button
            type="button"
            className="ui-button-danger"
            onClick={actions.handle_delete_model}
            disabled={labour_rate_models.length <= 1}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}