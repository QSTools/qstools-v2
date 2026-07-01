import {
  format_currency,
  format_rate,
} from "@/lib/calculations/rateBuilderLabourRateCalculations";

export default function RateBuilderLabourWeightedSummaryCard({ model }) {
  const { weighted_summary, labour_unit_label } = model;

  return (
    <div className="rate-builder-result-card">
      <p className="rate-builder-result-label">Staff-type rate build-up</p>

      <div className="rate-builder-labour-breakdown">
        {weighted_summary.weighted_summary_rows.map((row) => (
          <div
            className="rate-builder-labour-breakdown__row"
            key={row.labour_source_type_id}
          >
            <span>
              {row.labour_source_type_name}
              <br />
              <small>
                {row.productive_hours.toFixed(2)} hrs ×{" "}
                {format_rate(row.current_charge_out_rate, labour_unit_label)}
              </small>
            </span>
            <strong>{format_currency(row.modelled_labour_revenue)}</strong>
          </div>
        ))}

        <div className="rate-builder-labour-breakdown__row">
          <span>Total modelled productive labour revenue</span>
          <strong>
            {format_currency(weighted_summary.weighted_modelled_labour_revenue)}
          </strong>
        </div>

        <div className="rate-builder-labour-breakdown__row">
          <span>Total productive labour hours</span>
          <strong>
            {weighted_summary.weighted_productive_hours.toFixed(2)} hrs
          </strong>
        </div>
      </div>
    </div>
  );
}