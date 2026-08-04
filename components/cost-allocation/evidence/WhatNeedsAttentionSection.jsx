import {
  TableBlock,
  TableRow,
  formatPercent,
  yesNo,
} from "@/components/cost-allocation/evidence/evidenceHelpers";

export default function WhatNeedsAttentionSection({ delivery_summary, problems }) {
  return (
    <section className="ui-panel">
      <div className="ui-stack">
        <div>
          <p className="ui-kicker">What needs attention</p>
          <h3 className="text-base font-semibold text-[var(--text-primary)]">
            Operating structure readiness
          </h3>
          <p className="ui-help">
            These checks explain whether the operating structure is ready for
            downstream recovery testing.
          </p>
        </div>

        <TableBlock
          title="Structure coverage"
          help_text="Coverage shows whether divisions, productive labour, productive assets, and operating groups are properly assigned."
        >
          <TableRow
            label="Division coverage"
            value={formatPercent(delivery_summary?.division_coverage_percent)}
          />
          <TableRow
            label="Productive labour coverage"
            value={formatPercent(delivery_summary?.staff_coverage_percent)}
          />
          <TableRow
            label="Productive asset coverage"
            value={formatPercent(delivery_summary?.asset_coverage_percent)}
          />
          <TableRow
            label="Operating group coverage"
            value={formatPercent(delivery_summary?.group_coverage_percent)}
          />
          <TableRow
            label="Full cost attribution coverage"
            value={formatPercent(
              delivery_summary?.full_cost_attribution_coverage_percent
            )}
            help="Every staff member and asset - productive and non-productive - assigned to a group. A separate check from the recovery-trust coverage above it."
            total
          />
        </TableBlock>

        <TableBlock
          title="Division and group structure"
          help_text="These counts show whether the active divisions and operating groups are ready."
        >
          <TableRow
            label="Ready / incomplete divisions"
            value={`${delivery_summary?.valid_divisions ?? 0} / ${
              delivery_summary?.invalid_divisions ?? 0
            }`}
          />
          <TableRow
            label="Ready / incomplete operating groups"
            value={`${delivery_summary?.valid_operational_groups ?? 0} / ${
              delivery_summary?.invalid_operational_groups ?? 0
            }`}
            total
          />
        </TableBlock>

        <TableBlock
          title="Capacity and dependency"
          help_text="Internal shortfall is a dependency signal. It is not automatically a final business failure."
        >
          <TableRow
            label="Internal capacity shortfall"
            value={yesNo(delivery_summary?.internal_capacity_shortfall)}
          />
          <TableRow
            label="External delivery required"
            value={yesNo(delivery_summary?.external_delivery_required)}
          />
          <TableRow
            label="External delivery confirmed"
            value={yesNo(delivery_summary?.external_delivery_enabled)}
            total
          />
        </TableBlock>
      </div>
    </section>
  );
}
