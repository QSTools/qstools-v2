export default function RecoverySummaryHandoffBlock({
  material_recovery_included,
  asset_recovery_included,
}) {
  const cost_allocation_handoff_notes = [
    "Recovery Summary defines the starting recovery model.",
    "Cost Allocation will now test whether labour, productive assets, materials / products, and operating links can support this starting model.",
  ];

  if (material_recovery_included) {
    cost_allocation_handoff_notes.push(
      "Materials / products recovery is included, but actual material or product margin will be validated later through live job feedback."
    );
  }

  if (asset_recovery_included) {
    cost_allocation_handoff_notes.push(
      "Asset recovery is included, but only productive assets should carry asset recovery by default. Support assets remain in the cost burden."
    );
  }

  return (
    <div className="ui-panel">
      <div className="ui-stack">
        <div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
            Cost Allocation handoff
          </h3>

          <p className="ui-help">
            Recovery Summary defines the starting recovery model. Cost
            Allocation tests whether the actual business structure can support
            it.
          </p>
        </div>

        <div className="ui-readonly">
          <div className="ui-stack-sm">
            {cost_allocation_handoff_notes.map((note) => (
              <p
                key={note}
                className="text-sm font-medium text-[var(--text-primary)]"
              >
                {note}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
