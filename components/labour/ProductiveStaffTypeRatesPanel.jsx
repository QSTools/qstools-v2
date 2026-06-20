function to_number(value) {
  if (value === "" || value === null || value === undefined) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function format_currency(value, fraction_digits = 0) {
  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    minimumFractionDigits: fraction_digits,
    maximumFractionDigits: fraction_digits,
  }).format(to_number(value));
}

function format_number(value, fraction_digits = 0) {
  return new Intl.NumberFormat("en-NZ", {
    minimumFractionDigits: fraction_digits,
    maximumFractionDigits: fraction_digits,
  }).format(to_number(value));
}

function format_percent(value, fraction_digits = 1) {
  return `${format_number(value, fraction_digits)}%`;
}

function get_status_label(rate_status = "") {
  if (rate_status === "ready") {
    return "Ready";
  }

  if (rate_status === "invalid_zero_productive_hours") {
    return "Needs productive hours";
  }

  if (rate_status === "review_zero_cost") {
    return "Review zero cost";
  }

  if (rate_status === "review_unassigned_staff_type") {
    return "Assign staff type";
  }

  return "Review";
}

function get_status_class(rate_status = "") {
  if (rate_status === "ready") {
    return "ui-pill ui-pill-success";
  }

  return "ui-pill ui-pill-warning";
}

export default function ProductiveStaffTypeRatesPanel({
  productive_staff_type_rates = [],
  weighted_all_productive_labour_rate = 0,
  weighted_all_productive_productivity_percent = 0,
  total_productive_labour_hours = 0,
  total_productive_labour_cost = 0,
  total_productive_paid_hours = 0,
  productive_staff_type_rate_warnings = [],
}) {
  const has_staff_type_rates = productive_staff_type_rates.length > 0;
  const has_warnings = productive_staff_type_rate_warnings.length > 0;

  return (
    <section className="ui-card">
      <div className="ui-card-header">
        <div>
          <h3>Productive staff type rates</h3>
          <p className="ui-help">
            Weighted productive labour cost by staff type. These are Labour
            cost-truth outputs for Rate Builder, Cost Summary, and recovery
            checks.
          </p>
        </div>
      </div>

      <div className="labour-summary-table">
        <div className="labour-summary-table-row">
          <div className="labour-summary-table-label">
            <div>All productive labour weighted rate</div>
            <div className="ui-help">
              {format_currency(total_productive_labour_cost)} annual productive
              labour cost · {format_number(total_productive_paid_hours)} paid
              hrs · {format_number(total_productive_labour_hours)} productive
              hrs ·{" "}
              {format_percent(weighted_all_productive_productivity_percent)}{" "}
              weighted productivity
            </div>
          </div>

          <div className="labour-summary-table-value">
            <div>{format_currency(weighted_all_productive_labour_rate, 2)}/hr</div>
            <div className="ui-help">Weighted across productive staff</div>
          </div>
        </div>

        {has_staff_type_rates ? (
          <>
            {productive_staff_type_rates.map((rate) => (
              <div
                key={`${rate.staff_type_id}-${rate.staff_type_name}-${rate.rate_status}`}
                className="labour-summary-table-row"
              >
                <div className="labour-summary-table-label">
                  <div>{rate.staff_type_name || "Unnamed staff type"}</div>
                  <div className="ui-help">
                    {format_number(rate.staff_count)} productive staff ·{" "}
                    {format_currency(rate.total_annual_cost)} annual labour
                    cost · {format_number(rate.total_paid_hours)} paid hrs ·{" "}
                    {format_number(rate.total_productive_hours)} productive hrs ·{" "}
                    {format_percent(rate.weighted_productivity_percent)} weighted
                    productivity · {format_percent(rate.productive_share_percent)}{" "}
                    share
                  </div>
                </div>

                <div className="labour-summary-table-value">
                  <div>
                    {format_currency(rate.weighted_productive_hourly_rate, 2)}
                    /hr
                  </div>
                  <div className={get_status_class(rate.rate_status)}>
                    {get_status_label(rate.rate_status)}
                  </div>
                </div>
              </div>
            ))}
          </>
        ) : (
          <div className="ui-help">
            No productive staff type rates are available yet.
          </div>
        )}
      </div>

      {has_warnings ? (
        <div className="ui-warning-list">
          {productive_staff_type_rate_warnings.map((warning) => (
            <div
              key={`${warning.warning_key}-${warning.staff_type_name || "all"}`}
              className="ui-warning"
            >
              {warning.message}
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}