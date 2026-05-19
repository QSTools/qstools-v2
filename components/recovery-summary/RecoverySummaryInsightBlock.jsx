export default function RecoverySummaryInsightBlock({ insight_text }) {
  return (
    <div className="ui-panel">
      <div className="ui-stack">
        <div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
            Recovery insight
          </h3>
        </div>

        <p className="text-sm text-[var(--text-primary)]">{insight_text}</p>
      </div>
    </div>
  );
}
