"use client";

function formatCurrency(value) {
  const number = Number(value) || 0;

  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    maximumFractionDigits: 0,
  }).format(number);
}

function formatDate(value) {
  if (!value) {
    return "Not set";
  }
  return new Date(value).toLocaleDateString("en-NZ", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function BusinessModellingStatusStrip({
  baseline_date,
  selected_model_name,
  selected_model_trust_state,
  selected_scenario_status,
  selected_scenario_modified,
  annual_delta,
  per_hour_delta,
  modelling_warnings,
  selectModel,
  selected_model_type_value,
}) {
  return (
    <section className="ui-section">
      <div className="ui-panel ui-stack-sm">
        <div className="ui-kicker">Business Modelling</div>
        <div className="ui-card-title-sm">Controlled scenario benchmark</div>
        <p className="ui-help">
          Test upside and downside business scenarios without altering the real model.
        </p>

        <div className="ui-stack-sm">
          <div className="model-tabs">
            {[
              { type: "baseline", label: "Baseline" },
              { type: "upside", label: "Upside" },
              { type: "downside", label: "Downside" },
            ].map((option) => (
              <button
                key={option.type}
                type="button"
                className={`ui-button ui-button-secondary${selected_model_type_value === option.type ? " active" : ""}`}
                onClick={() => selectModel(option.type)}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="labour-summary-table">
            <div className="labour-summary-table-row total">
              <div className="labour-summary-table-label">Baseline date</div>
              <div className="labour-summary-table-value">
                {formatDate(baseline_date)}
              </div>
            </div>
            <div className="labour-summary-table-row">
              <div className="labour-summary-table-label">Selected model</div>
              <div className="labour-summary-table-value">{selected_model_name}</div>
            </div>
            <div className="labour-summary-table-row">
              <div className="labour-summary-table-label">Model status</div>
              <div className="labour-summary-table-value">{selected_scenario_status}</div>
            </div>
            <div className="labour-summary-table-row">
              <div className="labour-summary-table-label">Trust state</div>
              <div className="labour-summary-table-value">{selected_model_trust_state}</div>
            </div>
            <div className="labour-summary-table-row">
              <div className="labour-summary-table-label">Modified</div>
              <div className="labour-summary-table-value">
                {selected_scenario_modified ? "Yes" : "No"}
              </div>
            </div>
          </div>

          <div className="labour-summary-table">
            <div className="labour-summary-table-row total">
              <div className="labour-summary-table-label">Annual delta</div>
              <div className="labour-summary-table-value">
                {formatCurrency(annual_delta)} / year
              </div>
            </div>
            <div className="labour-summary-table-row">
              <div className="labour-summary-table-label">Per-hour delta</div>
              <div className="labour-summary-table-value">
                {formatCurrency(per_hour_delta)} / hr
              </div>
            </div>
            <div className="labour-summary-table-row">
              <div className="labour-summary-table-label">Warnings</div>
              <div className="labour-summary-table-value">
                {modelling_warnings.length}
              </div>
            </div>
          </div>
        </div>

        {modelling_warnings.length > 0 ? (
          <div className="ui-stack-sm">
            {modelling_warnings.map((warning) => (
              <p className="ui-help" key={warning.warning_id}>
                {warning.message}
              </p>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
