export default function GroupIdleLabourNotice({ row, has_labour }) {
  const warning = row?.idle_labour_warning;

  if (!warning || !has_labour) {
    return null;
  }

  return (
    <div className="ui-readonly">
      <p className="text-sm font-semibold text-[var(--text-primary)]">
        Paid labour hours exceed the asset hours
      </p>
      <p className="ui-help">{warning.message}</p>
      <p className="ui-help">
        This labour is marked as tied to the asset, so the idle hours are a real
        cost. Reduce the labour assigned here, find work for it, or untick the
        setting if this person also works elsewhere. If the asset hours look
        wrong, correct them in the Assets module.
      </p>
    </div>
  );
}