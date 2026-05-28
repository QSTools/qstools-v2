"use client";

function getResultHeading(status) {
  switch (status) {
    case "works":
      return "Good quote";
    case "marginal":
      return "Marginal quote";
    case "leaking":
      return "Bad quote / leaking";
    default:
      return "Quote not ready to validate";
  }
}

function getResultMessage(status) {
  switch (status) {
    case "works":
      return "This quote appears to recover the current model requirement.";
    case "marginal":
      return "This quote is close to the model requirement. Review the recovery surplus and labour allowance.";
    case "leaking":
      return "This quote does not recover enough against the current model requirement.";
    default:
      return "Enter the required quote inputs and confirm the upstream model is ready.";
  }
}

export default function QuoteEngineSideCard({
  summary = {},
  quote_result_status = "invalid",
}) {
  return (
    <section className="ui-section">
      <div className="ui-card ui-stack-sm">
        <div className="ui-card-title">Quote result</div>

        <p className="ui-help">
          This checks whether the quote has enough margin left after COG and
          labour cost to satisfy the Cost Summary recovery requirement.
        </p>

        <div className="ui-panel ui-stack-sm">
          <div className="ui-label">Result status</div>
          <div className="ui-card-title-sm">
            {getResultHeading(quote_result_status)}
          </div>
          <p className="ui-help">{getResultMessage(quote_result_status)}</p>
        </div>

        <div className="ui-panel ui-row-between">
          <div>
            <span className="ui-label">Quote price</span>
            <div>{summary.quote_price_total}</div>
          </div>
          <div>
            <span className="ui-label">Estimated job cost</span>
            <div>{summary.direct_cost_total}</div>
          </div>
        </div>

        <div className="ui-panel ui-row-between">
          <div>
            <span className="ui-label">Margin left after job costs</span>
            <div>{summary.quote_margin_pool}</div>
          </div>
          <div>
            <span className="ui-label">Cost Summary recovery required</span>
            <div>{summary.business_recovery_required_total}</div>
          </div>
        </div>

        <div className="ui-panel ui-row-between">
          <div>
            <span className="ui-label">Recovery surplus / shortfall</span>
            <div>{summary.quote_gap}</div>
          </div>
          <div>
            <span className="ui-label">Hourly recovery surplus / shortfall</span>
            <div>{summary.hourly_gap}</div>
          </div>
        </div>

        <div className="ui-panel ui-row-between">
          <div>
            <span className="ui-label">Cost Summary recovery rate</span>
            <div>{summary.required_recovery_rate}</div>
          </div>
          <div>
            <span className="ui-label">Minimum model price</span>
            <div>{summary.required_price_at_allowed_hours}</div>
          </div>
        </div>

        <div className="ui-panel ui-row-between">
          <div>
            <span className="ui-label">Price movement required</span>
            <div>{summary.price_gap}</div>
          </div>
          <div>
            <span className="ui-label">Max hours before recovery fails</span>
            <div>{summary.max_viable_hours}</div>
          </div>
        </div>

        <div className="ui-panel ui-stack-sm">
          <p className="ui-help">
            Recovery surplus / shortfall is the main pass/fail number. Positive
            means the quote is above the model requirement. Negative means the
            quote is short.
          </p>
          <p className="ui-help">
            Price movement required shows how much the quote would need to move
            to exactly meet the model. A negative number means the quote is
            already above the minimum model price.
          </p>
        </div>
      </div>
    </section>
  );
}