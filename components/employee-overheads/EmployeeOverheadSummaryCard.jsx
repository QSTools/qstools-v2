"use client";

function format_currency(value) {
  const amount = Number(value) || 0;

  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    maximumFractionDigits: 2,
  }).format(amount);
}

export default function EmployeeOverheadSummaryCard({
  selected_staff_total_annual = 0,
  total_employee_overheads_annual = 0,
}) {
  return (
    <section className="ui-section">
      <div className="ui-stack">

        <div>
          <h2 className="text-lg font-semibold">
            Employee Overheads Summary
          </h2>
          <p className="ui-help">
            Total annual overhead burden linked to active staff.
          </p>
        </div>

        <div className="ui-panel">
          <div className="ui-kicker">Selected Staff Total</div>
          <div className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">
            {format_currency(selected_staff_total_annual)}
          </div>
        </div>

        <div className="ui-panel">
          <div className="ui-kicker">Module Aggregate Total</div>
          <div className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">
            {format_currency(total_employee_overheads_annual)}
          </div>
        </div>

      </div>
    </section>
  );
}