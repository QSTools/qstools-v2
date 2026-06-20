"use client";

function to_number(value) {
  if (value === "" || value === null || value === undefined) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function format_currency(value) {
  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(to_number(value));
}

function format_number(value) {
  return new Intl.NumberFormat("en-NZ", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(to_number(value));
}

function format_percent(value) {
  return `${new Intl.NumberFormat("en-NZ", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(to_number(value))}%`;
}

export default function LabourInsightsRow({ outputs = {}, has_profile }) {
  if (!has_profile) return null;

  const paid_hours = to_number(outputs.paid_hours_per_year);
  const productive_hours = to_number(outputs.productive_hours);
  const productivity_percent =
    paid_hours > 0 ? (productive_hours / paid_hours) * 100 : 0;

  const drivers = get_cost_drivers(outputs);

  return (
    <div className="ui-stack">
      <Card title="Productive cost position">
        <Row
          label="Loaded cost rate"
          value={`${format_currency(outputs.loaded_labour_cost_rate)} / hr`}
        />
        <Row
          label="Productive cost rate"
          value={`${format_currency(outputs.productive_labour_cost_rate)} / hr`}
        />
        <Row
          label="Annual labour cost"
          value={format_currency(outputs.total_labour_cost_annual)}
        />
      </Card>

      <Card title="Productive capacity">
        <Row label="Paid hours" value={`${format_number(paid_hours)} hrs`} />
        <Row
          label="Productive hours"
          value={`${format_number(productive_hours)} hrs`}
        />
        <Row
          label="Effective productivity"
          value={format_percent(productivity_percent)}
        />
      </Card>

      <Card title="What’s driving labour cost">
        <div className="space-y-2 text-sm text-[var(--text-secondary)]">
          {drivers.map((driver, index) => (
            <div key={`${driver}-${index}`}>• {driver}</div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function get_cost_drivers(outputs = {}) {
  const drivers = [];

  const paid_hours = to_number(outputs.paid_hours_per_year);
  const productive_hours = to_number(outputs.productive_hours);
  const non_productive_paid_hours = to_number(
    outputs.non_productive_paid_hours
  );
  const total_employer_contribution_cost = to_number(
    outputs.total_employer_contribution_cost
  );
  const loaded_labour_cost_rate = to_number(outputs.loaded_labour_cost_rate);
  const productive_labour_cost_rate = to_number(
    outputs.productive_labour_cost_rate
  );

  const productivity_percent =
    paid_hours > 0 ? (productive_hours / paid_hours) * 100 : 0;

  if (productivity_percent > 0 && productivity_percent < 80) {
    drivers.push("Low productivity is increasing productive hourly cost");
  }

  if (non_productive_paid_hours > 300) {
    drivers.push("Entitlements are reducing available productive hours");
  }

  if (
    productive_labour_cost_rate > 0 &&
    loaded_labour_cost_rate > 0 &&
    productive_labour_cost_rate > loaded_labour_cost_rate * 1.25
  ) {
    drivers.push("The productive cost rate is materially higher than the paid-hour cost rate");
  }

  if (total_employer_contribution_cost > 10000) {
    drivers.push("Employer contributions are adding significant annual cost");
  }

  if (drivers.length === 0) {
    drivers.push("Labour cost structure is currently balanced");
  }

  return drivers;
}

function Card({ title, children }) {
  return (
    <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-4">
      <div className="mb-3 text-sm font-medium text-[var(--text-muted)]">
        {title}
      </div>
      {children}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between text-sm text-[var(--text-secondary)]">
      <span>{label}</span>
      <span className="font-medium text-[var(--text-primary)]">{value}</span>
    </div>
  );
}