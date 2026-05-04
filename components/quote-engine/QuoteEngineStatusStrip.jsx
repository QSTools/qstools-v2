"use client";

function formatCurrency(value) {
  return Number(value || 0).toLocaleString("en-NZ", {
    style: "currency",
    currency: "NZD",
    maximumFractionDigits: 0,
  });
}

function getStatusHeading(status) {
  switch (status) {
    case "works":
      return "Quote works against the model";
    case "marginal":
      return "Quote is marginal against the model";
    case "leaking":
      return "Quote is leaking against the model";
    default:
      return "Quote is not valid against the model";
  }
}

export default function QuoteEngineStatusStrip({
  quote_result_status = "invalid",
  quote_warnings = [],
  model_readiness_status = "blocked",
  model_trust_state = "blocked",
  required_recovery_rate = 0,
  hourly_gap = 0,
  quote_gap = 0,
}) {
  return (
    <section className="ui-section">
      <div className="ui-panel ui-stack-sm">
        <div className="ui-kicker">Quote Engine</div>
        <div className="ui-card-title-sm">{getStatusHeading(quote_result_status)}</div>
        <p className="ui-help">
          This baseline quote is being checked against the business model and the
          live Cost Summary inputs.
        </p>

        <div className="ui-panel ui-row-between">
          <div>
            <div className="ui-label">Quote status</div>
            <div>{quote_result_status}</div>
          </div>
          <div>
            <div className="ui-label">Model trust state</div>
            <div>{model_trust_state}</div>
          </div>
        </div>

        <div className="ui-panel ui-row-between">
          <div>
            <div className="ui-label">Required recovery rate</div>
            <div>{formatCurrency(required_recovery_rate)} / hr</div>
          </div>
          <div>
            <div className="ui-label">Hourly gap</div>
            <div>{formatCurrency(hourly_gap)} / hr</div>
          </div>
        </div>

        <div className="ui-panel ui-row-between">
          <div>
            <div className="ui-label">Quote gap</div>
            <div>{formatCurrency(quote_gap)}</div>
          </div>
          <div>
            <div className="ui-label">Model readiness</div>
            <div>{model_readiness_status}</div>
          </div>
        </div>

        {quote_warnings.length > 0 ? (
          <div className="ui-panel ui-stack-sm">
            <div className="ui-label">Quote warnings</div>
            {quote_warnings.slice(0, 4).map((warning) => (
              <p key={warning.warning_id} className="ui-help">
                {warning.message}
              </p>
            ))}
            {quote_warnings.length > 4 ? (
              <p className="ui-help">
                {quote_warnings.length - 4} more warnings are present.
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
