export default function AutomaticOverheadNote() {
  return (
    <div className="ui-readonly">
      <p className="text-sm font-semibold text-[var(--text-primary)]">
        Overhead allocation is automatic
      </p>
      <p className="mt-1 ui-help">
        Overhead is distributed from the operating structure after labour and
        assets are assigned. There is no manual overhead input in this step.
      </p>
    </div>
  );
}
