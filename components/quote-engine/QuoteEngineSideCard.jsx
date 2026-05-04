"use client";

export default function QuoteEngineSideCard({ summary = {}, quote_result_status = "invalid" }) {
  return (
    <section className="ui-section">
      <div className="ui-card ui-stack-sm">
        <div className="ui-card-title">Quote result</div>
        <p className="ui-help">
          Live quote results are shown here so you can compare the required margin
          against the business recovery requirement.
        </p>

        <div className="ui-panel ui-stack-sm">
          <div className="ui-label">Result status</div>
          <div>{quote_result_status}</div>
        </div>

        <div className="ui-panel ui-row-between">
          <div>
            <span className="ui-label">Quote price total</span>
            <div>{summary.quote_price_total}</div>
          </div>
          <div>
            <span className="ui-label">Direct cost total</span>
            <div>{summary.direct_cost_total}</div>
          </div>
        </div>

        <div className="ui-panel ui-row-between">
          <div>
            <span className="ui-label">Quote margin pool</span>
            <div>{summary.quote_margin_pool}</div>
          </div>
          <div>
            <span className="ui-label">Required price at allowed hours</span>
            <div>{summary.required_price_at_allowed_hours}</div>
          </div>
        </div>

        <div className="ui-panel ui-row-between">
          <div>
            <span className="ui-label">Business recovery required</span>
            <div>{summary.business_recovery_required_total}</div>
          </div>
          <div>
            <span className="ui-label">Quote gap</span>
            <div>{summary.quote_gap}</div>
          </div>
        </div>

        <div className="ui-panel ui-row-between">
          <div>
            <span className="ui-label">Achieved margin / hr</span>
            <div>{summary.achieved_margin_per_hour}</div>
          </div>
          <div>
            <span className="ui-label">Hourly gap</span>
            <div>{summary.hourly_gap}</div>
          </div>
        </div>

        <div className="ui-panel ui-row-between">
          <div>
            <span className="ui-label">Required recovery rate</span>
            <div>{summary.required_recovery_rate}</div>
          </div>
          <div>
            <span className="ui-label">Max viable hours</span>
            <div>{summary.max_viable_hours}</div>
          </div>
        </div>

        <div className="ui-panel">
          <span className="ui-label">Price gap</span>
          <div>{summary.price_gap}</div>
        </div>
      </div>
    </section>
  );
}
