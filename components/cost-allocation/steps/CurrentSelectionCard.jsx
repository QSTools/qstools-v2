export default function CurrentSelectionCard({
  division_rows,
  groups_for_selected_division,
  selected_division_id,
  selected_group_id,
  selected_division,
  selected_group,
  set_selected_division_id,
  set_selected_group_id,
  set_open_section,
}) {
  return (
    <div className="ui-readonly">
      <div className="ui-stack-sm">
        <div>
          <p className="ui-kicker">Current selection</p>
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            Choose the operating area and working unit you are currently building.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="ui-field">
            <span className="ui-label">Operating area</span>
            <select
              className="ui-input"
              value={selected_division_id}
              onChange={(event) => {
                set_selected_division_id(event.target.value);
                set_selected_group_id("");
                set_open_section("group");
              }}
            >
              <option value="">Select operating area</option>
              {division_rows.map((division) => (
                <option key={division.division_id} value={division.division_id}>
                  {division.division_name || "Unnamed operating area"}
                </option>
              ))}
            </select>
            <p className="mt-1 ui-help">
              {selected_division?.division_name || "No operating area selected"}
            </p>
          </label>

          <label className="ui-field">
            <span className="ui-label">Working unit</span>
            <select
              className="ui-input"
              value={selected_group_id}
              onChange={(event) => {
                set_selected_group_id(event.target.value);

                if (event.target.value) {
                  set_open_section("labour");
                }
              }}
              disabled={!selected_division_id}
            >
              <option value="">Select working unit</option>
              {groups_for_selected_division.map((group) => (
                <option key={group.group_id} value={group.group_id}>
                  {group.group_name || "Unnamed working unit"}
                </option>
              ))}
            </select>
            <p className="mt-1 ui-help">
              {selected_group?.group_name || "No working unit selected"}
            </p>
          </label>
        </div>
      </div>
    </div>
  );
}
