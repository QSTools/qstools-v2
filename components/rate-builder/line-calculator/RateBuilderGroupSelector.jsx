
export default function RateBuilderGroupSelector({
  active_calculator,
  asset_backed_group_options,
  updateLinkedCostAllocationGroup,
}) {
  return (
        <article className="ui-section">
          <p className="ui-kicker">Calculator setup</p>

          <h2 className="ui-section-title">Asset-backed pricing group</h2>

          <p className="ui-help">
            Select the Cost Allocation group this calculator is pricing. Only
            asset-backed operational groups are shown here.
          </p>

          <div className="mt-5 grid gap-4">
            <label className="ui-field">
              <span className="ui-label">Select cost allocation group</span>

              <select
                value={active_calculator?.linked_cost_allocation_group_id || ""}
                onChange={(event) =>
                  updateLinkedCostAllocationGroup(event.target.value)
                }
                className="ui-select"
              >
                <option value="">Select asset-backed group</option>

                {asset_backed_group_options.map((group) => (
                  <option key={group.group_id} value={group.group_id}>
                    {group.group_name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </article>
  );
}
