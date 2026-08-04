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
      </div>
    </div>
  );
}
