
export default function RateBuilderGroupSelector({
  active_calculator,
  asset_backed_group_options,
  updateLinkedCostAllocationGroup,
  group_asset_options = [],
  updateLinkedAsset,
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

            {active_calculator?.linked_cost_allocation_group_id &&
            group_asset_options.length > 0 ? (
              <label className="ui-field">
                <span className="ui-label">Select asset to price</span>

                <select
                  value={active_calculator?.linked_asset_id || ""}
                  onChange={(event) => updateLinkedAsset?.(event.target.value)}
                  className="ui-select"
                >
                  <option value="">
                    {(active_calculator?.lines?.length || 0) > 0 &&
                    !active_calculator?.linked_asset_id
                      ? "Whole group (legacy - one rate for all assets)"
                      : "Select asset"}
                  </option>

                  {group_asset_options.map((assignment) => (
                    <option key={assignment.asset_id} value={assignment.asset_id}>
                      {assignment.asset_name || "Unnamed asset"}
                    </option>
                  ))}
                </select>

                <span className="ui-help">
                  A calculator linked to an asset prices that asset only.
                </span>
              </label>
            ) : null}
          </div>
        </article>
  );
}
