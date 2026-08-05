"use client";

function formatCurrency(value) {
  if (value === null || value === undefined) return "N/A";
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  return `${sign}${new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    maximumFractionDigits: 0,
  }).format(abs)}`;
}

function formatPercent(value) {
  if (value === null || value === undefined) return "N/A";
  return `${value.toFixed(1)}%`;
}

function FieldRow({ label, field, format = formatCurrency }) {
  const is_deferred = field?.status === "deferred";

  return (
    <div className="grid grid-cols-2 gap-3 py-2 border-b border-gray-100 last:border-b-0">
      <div className="text-sm text-gray-600">{label}</div>
      <div className="text-sm text-right">
        {is_deferred ? (
          <span className="text-amber-600 text-xs" title={field.reason}>
            Not yet available
          </span>
        ) : (
          <span className="font-medium text-gray-900">{format(field.value)}</span>
        )}
      </div>
    </div>
  );
}

export default function BusinessOutcomeTruthSummaryCard({ output_contract }) {
  const {
    total_revenue,
    total_COG,
    gross_profit,
    gross_margin_percent,
    total_cost_burden,
    required_revenue,
    revenue_surplus_or_gap,
    required_recovery,
    achieved_recovery,
    recovery_surplus_or_gap,
    operating_profit_before_tax,
    net_operating_margin,
    productive_output,
    cost_absorption_status,
  } = output_contract;

  const is_viable = (recovery_surplus_or_gap?.value ?? 0) >= 0;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-6">
      <div>
        <div className="text-sm text-gray-500 uppercase tracking-wide mb-1">
          Is this business commercially viable?
        </div>
        <div className={`text-2xl font-bold ${is_viable ? "text-green-600" : "text-red-600"}`}>
          {is_viable ? "Currently viable" : "Currently running a deficit"}
        </div>
      </div>

      <div>
        <div className="text-xs font-semibold text-gray-400 uppercase mb-1">Revenue &amp; Margin</div>
        <FieldRow label="Total Revenue" field={total_revenue} />
        <FieldRow label="Total COG" field={total_COG} />
        <FieldRow label="Gross Profit" field={gross_profit} />
        <FieldRow
          label="Gross Margin %"
          field={
            gross_margin_percent?.status === "available"
              ? { ...gross_margin_percent, value: gross_margin_percent.value * 100 }
              : gross_margin_percent
          }
          format={formatPercent}
        />
      </div>

      <div>
        <div className="text-xs font-semibold text-gray-400 uppercase mb-1">Cost Burden &amp; Recovery</div>
        <FieldRow label="Total Cost Burden" field={total_cost_burden} />
        <FieldRow label="Required Revenue" field={required_revenue} />
        <FieldRow label="Revenue Surplus / (Gap)" field={revenue_surplus_or_gap} />
        <FieldRow label="Required Recovery" field={required_recovery} />
        <FieldRow label="Achieved Recovery" field={achieved_recovery} />
        <FieldRow label="Recovery Surplus / (Gap)" field={recovery_surplus_or_gap} />
      </div>

      <div>
        <div className="text-xs font-semibold text-gray-400 uppercase mb-1">Bottom Line</div>
        <FieldRow label="Operating Profit Before Tax" field={operating_profit_before_tax} />
        <FieldRow label="Net Operating Margin %" field={net_operating_margin} format={formatPercent} />
        <FieldRow label="Productive Output (hours)" field={productive_output} format={(v) => v?.toLocaleString?.("en-NZ") ?? "N/A"} />
        <FieldRow
          label="Cost Absorption Status"
          field={cost_absorption_status}
          format={(v) => (v ? v.replace(/_/g, " ") : "N/A")}
        />
      </div>
    </div>
  );
}

