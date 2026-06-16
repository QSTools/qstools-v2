export default function RecoverySummaryMetricButton({
  id,
  label,
  value,
  active,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(id)}
      className={`recovery-summary-interactive ui-readonly text-left ${
        active ? "is-active" : ""
      }`}
    >
      <div className="ui-label">{label}</div>
      <div className="recovery-summary-row-value text-base font-semibold">
        {value}
      </div>
    </button>
  );
}