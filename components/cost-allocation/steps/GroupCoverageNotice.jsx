export default function GroupCoverageNotice({ selected_group, group_cost_rows }) {
  const group_id = selected_group?.group_id || "";

  if (!group_id || !Array.isArray(group_cost_rows)) {
    return null;
  }

  const row = group_cost_rows.find((item) => item?.group_id === group_id);

  const has_labour =
    Array.isArray(row?.labour_group_assignments) &&
    row.labour_group_assignments.length > 0;

  // Same rule as Business Outcome: a group with no labour at all is a
  // different situation from a scheduling gap, so no notice is shown.
  if (!row?.labour_coverage_warning || !has_labour) {
    return null;
  }

  return (
    <div className="ui-readonly">
      <p className="text-sm font-semibold text-[var(--text-primary)]">
        Labour hours do not cover the asset hours
      </p>
      <p className="ui-help">{row.labour_coverage_warning.message}</p>
      <p className="ui-help">
        If the hours look wrong, correct them in the Assets module.
      </p>
    </div>
  );
}