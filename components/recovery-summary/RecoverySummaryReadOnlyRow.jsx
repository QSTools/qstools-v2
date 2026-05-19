export default function RecoverySummaryReadOnlyRow({
  label,
  value,
  emphasis = false,
}) {
  return (
    <div className="ui-split">
      <span className="text-sm text-[var(--text-secondary)]">{label}</span>
      <span
        className={
          emphasis
            ? "text-base font-semibold text-[var(--text-primary)]"
            : "text-sm font-medium text-[var(--text-primary)]"
        }
      >
        {value}
      </span>
    </div>
  );
}
