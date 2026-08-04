import {
  TableBlock,
  TableRow,
  formatMoney,
} from "@/components/cost-allocation/evidence/evidenceHelpers";

export default function PoolReconciliationSection({
  recovery_plan,
  labour_assignment,
  asset_assignment,
  overhead_assignment,
}) {
  const labour_available =
    labour_assignment?.available_labour_cost ??
    recovery_plan?.total_available_labour_cost ??
    0;

  const labour_assigned =
    labour_assignment?.assigned_labour_cost ??
    recovery_plan?.total_assigned_labour_cost ??
    0;

  const labour_remaining =
    labour_assignment?.remaining_labour_cost ??
    recovery_plan?.total_remaining_labour_cost ??
    0;

  const asset_available =
    asset_assignment?.available_asset_cost ??
    recovery_plan?.total_available_asset_cost ??
    0;

  const asset_assigned =
    asset_assignment?.assigned_asset_cost ??
    recovery_plan?.total_assigned_asset_cost ??
    0;

  const asset_remaining =
    asset_assignment?.remaining_asset_cost ??
    recovery_plan?.total_remaining_asset_cost ??
    0;

  const overhead_available =
    overhead_assignment?.available_overhead_cost ??
    recovery_plan?.total_available_overhead_cost ??
    0;

  const overhead_assigned =
    overhead_assignment?.assigned_overhead_cost ??
    recovery_plan?.total_assigned_overhead_cost ??
    0;

  const overhead_remaining =
    overhead_assignment?.remaining_overhead_cost ??
    recovery_plan?.total_remaining_overhead_cost ??
    0;

  return (
    <section className="ui-panel">
      <div className="ui-stack">
        <div>
          <p className="ui-kicker">Pool reconciliation</p>
          <h3 className="text-base font-semibold text-[var(--text-primary)]">
            Check assigned and remaining source pools
          </h3>
          <p className="ui-help">
            This confirms that Cost Allocation is distributing existing source
            pools rather than creating new cost.
          </p>
        </div>

        <TableBlock
          title="Labour pool"
          help_text="Labour includes productive and support / non-productive labour. Support labour adds cost only and does not add productive recovery hours."
        >
          <TableRow
            label="Available labour cost"
            value={formatMoney(labour_available)}
          />
          <TableRow
            label="Assigned labour cost"
            value={formatMoney(labour_assigned)}
          />
          <TableRow
            label="Remaining labour cost"
            value={formatMoney(labour_remaining)}
            total
          />
        </TableBlock>

        <TableBlock
          title="Productive asset pool"
          help_text="Assets are assigned into operating groups by allocation percentage."
        >
          <TableRow
            label="Available asset cost"
            value={formatMoney(asset_available)}
          />
          <TableRow
            label="Assigned asset cost"
            value={formatMoney(asset_assigned)}
          />
          <TableRow
            label="Remaining asset cost"
            value={formatMoney(asset_remaining)}
            total
          />
        </TableBlock>

        <TableBlock
          title="Overhead pool"
          help_text="Overhead is distributed automatically from the operating structure after labour and asset assignments are known."
        >
          <TableRow
            label="Available overhead"
            value={formatMoney(overhead_available)}
          />
          <TableRow
            label="Assigned overhead"
            value={formatMoney(overhead_assigned)}
          />
          <TableRow
            label="Remaining overhead"
            value={formatMoney(overhead_remaining)}
            total
          />
        </TableBlock>

        <TableBlock
          title="Total assigned / remaining"
          help_text="This is the combined operating cost currently inside and outside operating groups."
        >
          <TableRow
            label="Grouped operating cost"
            value={formatMoney(recovery_plan?.total_grouped_operating_cost)}
          />
          <TableRow
            label="Unassigned operating cost"
            value={formatMoney(recovery_plan?.total_unassigned_cost)}
            total
          />
        </TableBlock>
      </div>
    </section>
  );
}
