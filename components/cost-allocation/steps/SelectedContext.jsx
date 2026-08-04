export default function SelectedContext({ selected_division, selected_group }) {
  if (!selected_division && !selected_group) {
    return null;
  }

  return (
    <div className="ui-readonly">
      <div className="ui-stack-sm">
        {selected_division ? (
          <div>
            <span className="ui-label">Selected division</span>
            <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
              {selected_division.division_name || "Unnamed division"}
            </p>
          </div>
        ) : null}

        {selected_group ? (
          <div>
            <span className="ui-label">Selected operating group</span>
            <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
              {selected_group.group_name || "Unnamed operating group"}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
