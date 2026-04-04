"use client";

import { useMemo, useState } from "react";

function money(value) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    maximumFractionDigits: 0,
  }).format(amount);
}

function moneyHr(value) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function SummaryTile({ label, value, valueClassName = "text-white" }) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-950/70 p-4">
      <div className="text-[11px] uppercase tracking-wide text-neutral-500">
        {label}
      </div>
      <div className={`mt-2 text-sm font-semibold ${valueClassName}`}>
        {value}
      </div>
    </div>
  );
}

function SectionHeader({
  title,
  subtitle,
  value,
  unit,
  isOpen,
  onToggle,
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full rounded-2xl border border-neutral-800 bg-neutral-950/70 px-5 py-4 text-left transition hover:border-neutral-700"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="text-base font-semibold text-white">{title}</div>
          {subtitle ? (
            <div className="mt-1 text-sm text-neutral-400">{subtitle}</div>
          ) : null}
        </div>

        <div className="md:text-right">
          <div className="text-lg font-semibold text-white">
            {value}
            {unit ? (
              <span className="ml-1 text-sm font-medium text-neutral-400">
                {unit}
              </span>
            ) : null}
          </div>
          <div className="mt-1 text-xs text-neutral-500">
            {isOpen ? "Hide breakdown" : "Show breakdown"}
          </div>
        </div>
      </div>
    </button>
  );
}

function LineRow({ label, value, bold = false }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className={bold ? "font-semibold text-white" : "text-neutral-300"}>
        {label}
      </div>
      <div className={bold ? "font-semibold text-white" : "text-neutral-200"}>
        {value}
      </div>
    </div>
  );
}

function Divider() {
  return <div className="border-t border-neutral-800" />;
}

function DrilldownTable({ rows = [], emptyText = "No items available" }) {
  if (!rows.length) {
    return (
      <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4 text-sm text-neutral-500">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950/50">
      <div className="grid grid-cols-[1fr_auto] gap-4 border-b border-neutral-800 px-4 py-3 text-xs uppercase tracking-wide text-neutral-500">
        <div>Name</div>
        <div>Total / year</div>
      </div>

      {rows.map((row) => (
        <div
          key={row.key}
          className="grid grid-cols-[1fr_auto] gap-4 border-b border-neutral-900 px-4 py-4 text-sm last:border-b-0"
        >
          <div>
            <div className="font-medium text-neutral-100">{row.label}</div>
            {row.meta ? (
              <div className="mt-1 text-xs text-neutral-500">{row.meta}</div>
            ) : null}
          </div>
          <div className="font-medium text-neutral-200">{money(row.value)}</div>
        </div>
      ))}
    </div>
  );
}

function WarningPanel({ warnings = [] }) {
  if (!warnings.length) {
    return (
      <div className="rounded-2xl border border-neutral-800 bg-neutral-950/70 p-4">
        <div className="text-[11px] uppercase tracking-wide text-neutral-500">
          Current Warnings
        </div>
        <div className="mt-2 text-sm font-medium text-emerald-300">
          No active warnings
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-amber-900/80 bg-amber-950/30 p-4">
      <div className="text-[11px] uppercase tracking-wide text-amber-400/90">
        Current Warnings
      </div>
      <ul className="mt-3 space-y-2 text-sm text-amber-200">
        {warnings.map((item) => (
          <li key={item}>• {item}</li>
        ))}
      </ul>
    </div>
  );
}

function InsightPill({ text }) {
  if (!text) return null;

  return (
    <div className="inline-flex rounded-full border border-sky-900 bg-sky-950/40 px-3 py-1 text-xs font-medium text-sky-300">
      {text}
    </div>
  );
}

export default function CostSummaryCard({
  recovery_model_label = "Not set",
  linked_staff_count = 0,
  linked_asset_count = 0,
  warnings = [],

  people_cost_total = 0,
  labour_cost_total = 0,
  employee_overheads_total = 0,
  people_drilldown = [],

  business_cost_total = 0,
  asset_cost_total = 0,
  general_overheads_total = 0,
  asset_drilldown = [],
  overhead_drilldown = [],

  total_cost_burden = 0,
  required_revenue = 0,
  required_recovery_rate = 0,

  insight_text = "",
}) {
  const [peopleOpen, setPeopleOpen] = useState(true);
  const [businessOpen, setBusinessOpen] = useState(true);
  const [totalOpen, setTotalOpen] = useState(true);

  const recoveryModelClass = useMemo(() => {
    if (recovery_model_label === "Asset Driven") return "text-sky-300";
    if (recovery_model_label === "Labour Only") return "text-emerald-300";
    return "text-amber-300";
  }, [recovery_model_label]);

  return (
    <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Cost Summary</h2>
          <p className="mt-1 text-sm text-neutral-400">
            Internal cost burden and required recovery view.
          </p>
        </div>

        <InsightPill text={insight_text} />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950/50 p-4">
          <div className="mb-4">
            <div className="text-sm font-semibold text-white">
              Recovery Model Block
            </div>
            <div className="mt-1 text-sm text-neutral-400">
              Active structural recovery settings from Cost Allocation.
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <SummaryTile
              label="Recovery Model"
              value={recovery_model_label}
              valueClassName={recoveryModelClass}
            />
            <SummaryTile
              label="Linked Staff"
              value={linked_staff_count}
            />
            <SummaryTile
              label="Linked Assets"
              value={linked_asset_count}
            />
          </div>
        </div>

        <WarningPanel warnings={warnings} />
      </div>

      <div className="mt-6 space-y-5">
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-3">
          <SectionHeader
            title="People Cost"
            subtitle="Labour + Employee Overheads"
            value={money(people_cost_total)}
            unit="/ year"
            isOpen={peopleOpen}
            onToggle={() => setPeopleOpen((prev) => !prev)}
          />

          {peopleOpen ? (
            <div className="mt-3 rounded-2xl border border-neutral-800 bg-neutral-950/40 p-5">
              <div className="space-y-1">
                <LineRow label="Labour" value={money(labour_cost_total)} />
                <LineRow
                  label="Employee Overheads"
                  value={money(employee_overheads_total)}
                />
              </div>

              <div className="my-2">
                <Divider />
              </div>

              <LineRow
                label="Total People Cost"
                value={money(people_cost_total)}
                bold
              />

              <div className="mt-5">
                <div className="mb-3 text-sm font-medium text-neutral-300">
                  Staff Drilldown
                </div>
                <DrilldownTable
                  rows={people_drilldown}
                  emptyText="No active staff cost records available"
                />
              </div>
            </div>
          ) : null}
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-3">
          <SectionHeader
            title="Business Cost"
            subtitle="Assets + General Overheads"
            value={money(business_cost_total)}
            unit="/ year"
            isOpen={businessOpen}
            onToggle={() => setBusinessOpen((prev) => !prev)}
          />

          {businessOpen ? (
            <div className="mt-3 rounded-2xl border border-neutral-800 bg-neutral-950/40 p-5">
              <div className="space-y-1">
                <LineRow label="Assets" value={money(asset_cost_total)} />
                <LineRow
                  label="General Overheads"
                  value={money(general_overheads_total)}
                />
              </div>

              <div className="my-2">
                <Divider />
              </div>

              <LineRow
                label="Total Business Cost"
                value={money(business_cost_total)}
                bold
              />

              <div className="mt-5 grid grid-cols-1 gap-4 2xl:grid-cols-2">
                <div>
                  <div className="mb-3 text-sm font-medium text-neutral-300">
                    Asset Drilldown
                  </div>
                  <DrilldownTable
                    rows={asset_drilldown}
                    emptyText="No active asset cost records available"
                  />
                </div>

                <div>
                  <div className="mb-3 text-sm font-medium text-neutral-300">
                    Overhead Drilldown
                  </div>
                  <DrilldownTable
                    rows={overhead_drilldown}
                    emptyText="No active overhead items available"
                  />
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-3">
          <SectionHeader
            title="Total Cost & Recovery"
            subtitle="Core recovery outputs"
            value={money(total_cost_burden)}
            unit="/ year"
            isOpen={totalOpen}
            onToggle={() => setTotalOpen((prev) => !prev)}
          />

          {totalOpen ? (
            <div className="mt-3 rounded-2xl border border-neutral-800 bg-neutral-950/40 p-5">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <SummaryTile
                  label="Total Cost Burden"
                  value={money(total_cost_burden)}
                />
                <SummaryTile
                  label="Required Revenue"
                  value={money(required_revenue)}
                />
                <SummaryTile
                  label="Required Recovery Rate"
                  value={`${moneyHr(required_recovery_rate)} / hr`}
                  valueClassName="text-sky-300"
                />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}