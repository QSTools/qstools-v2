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
    <section className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-5">
      <h2 className="text-lg font-semibold">Employee Overheads Summary</h2>

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-input)] p-4">
          <div className="text-sm text-[var(--text-muted)]">Selected Staff Total</div>
          <div className="mt-2 text-2xl font-semibold">
            {format_currency(selected_staff_total_annual)}
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-input)] p-4">
          <div className="text-sm text-[var(--text-muted)]">Module Aggregate Total</div>
          <div className="mt-2 text-2xl font-semibold">
            {format_currency(total_employee_overheads_annual)}
          </div>
        </div>
      </div>
    </section>
  );
}