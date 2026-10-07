export default function GroupRecoveryBasisCard({
  selected_group,
  update_operational_group,
}) {
  if (!selected_group) {
    return null;
  }

  const group_id = selected_group.group_id || "";
  const recovery_source =
    selected_group.group_recovery_hour_source || "labour_hours";
  const manual_hours = selected_group.manual_group_recovery_hours || "";
  const run_pattern = selected_group.asset_run_pattern || "together";
  const labour_tied = selected_group.labour_tied_to_asset === true;

  function updateRecoverySource(value) {
    if (!group_id || typeof update_operational_group !== "function") {
      return;
    }

    update_operational_group(group_id, {
      group_recovery_hour_source: value,
    });
  }

  function updateManualHours(value) {
    if (!group_id || typeof update_operational_group !== "function") {
      return;
    }

    update_operational_group(group_id, {
      manual_group_recovery_hours: value,
    });
  }

  function updateRunPattern(value) {
    if (!group_id || typeof update_operational_group !== "function") {
      return;
    }

    update_operational_group(group_id, {
      asset_run_pattern: value,
    });
  }

  function updateLabourTied(checked) {
    if (!group_id || typeof update_operational_group !== "function") {
      return;
    }

    update_operational_group(group_id, {
      labour_tied_to_asset: checked === true,
    });
  }

  return (
    <div className="ui-readonly">
      <div className="ui-stack-sm">
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            Group recovery basis
          </p>
          <p className="ui-help">
            Choose the hours used to spread labour, asset, and overhead cost for
            this working unit.
          </p>
        </div>

        <label className="ui-field">
          <span className="ui-label">Recover this group over</span>
          <select
            className="ui-input"
            value={recovery_source}
            onChange={(event) => updateRecoverySource(event.target.value)}
          >
            <option value="labour_hours">Labour hours</option>
            <option value="asset_hours">Asset hours</option>
            <option value="manual_hours">Manual hours</option>
          </select>
        </label>

        {recovery_source === "manual_hours" ? (
          <label className="ui-field">
            <span className="ui-label">Manual annual recovery hours</span>
            <input
              className="ui-input"
              value={manual_hours}
              onChange={(event) => updateManualHours(event.target.value)}
              placeholder="Example: 1600"
            />
          </label>
        ) : null}

        {recovery_source === "asset_hours" ? (
          <label className="ui-field">
            <span className="ui-label">
              If this working unit has more than one asset, they run
            </span>
            <select
              className="ui-input"
              value={run_pattern}
              onChange={(event) => updateRunPattern(event.target.value)}
            >
              
              <option value="together">
                Together (one operator, at the same time)
              </option>
              <option value="sequential">One after another</option>
            </select>
            <p className="mt-1 ui-help">
              Saved with this working unit. If the labour hours are fewer than the hours the assets need, the cost of this working unit is spread over the labour hours instead.
            </p>
          </label>
        ) : null}

        {recovery_source === "asset_hours" ? (
          <label className="flex items-start gap-2 text-sm text-[var(--text-primary)]">
            <input
              type="checkbox"
              className="mt-1"
              checked={labour_tied}
              onChange={(event) => updateLabourTied(event.target.checked)}
            />
            <span>
              The labour in this working unit is tied to the asset only
              <span className="block ui-help">
                Tick this if the people here will not do other work when the
                asset is idle (for example, a digger driver). Idle hours are
                then shown as a real cost.
              </span>
            </span>
          </label>
        ) : null}
      </div>
    </div>
  );
}
