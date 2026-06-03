"use client";

function formatMoney(value) {
  return `$${Number(value || 0).toLocaleString("en-NZ", {
    maximumFractionDigits: 0,
  })}`;
}

function formatCount(value) {
  return Number(value || 0).toLocaleString("en-NZ");
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-NZ", {
    maximumFractionDigits: 0,
  });
}

function SummaryTile({ label, value, help }) {
  return (
    <div className="ui-readonly">
      <span className="ui-label">{label}</span>
      <div className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
        {value}
      </div>
      {help ? <p className="mt-1 ui-help">{help}</p> : null}
    </div>
  );
}

export default function CostAllocationDivisionCostSummary({
  division_cost_row,
}) {
  const row = division_cost_row || {};

  return (
    <div className="cost-allocation-group-summary">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <SummaryTile
          label="Operating groups"
          value={formatCount(row.operating_group_count)}
          help="Groups inside this division."
        />

        <SummaryTile
          label="Labour"
          value={formatMoney(row.assigned_labour_cost)}
          help={`${formatNumber(row.assigned_labour_hours)} productive hours`}
        />

        <SummaryTile
          label="Assets"
          value={formatMoney(row.assigned_asset_burden)}
          help={`${formatNumber(row.assigned_asset_hours)} asset hours`}
        />

        <SummaryTile
          label="Total division cost"
          value={formatMoney(row.total_division_cost)}
          help={row.allocation_status || "review_required"}
        />
      </div>
    </div>
  );
}