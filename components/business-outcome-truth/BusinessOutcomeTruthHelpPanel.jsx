export default function BusinessOutcomeTruthHelpPanel() {
  return (
    <div className="ui-card theme-card-muted">
      <h2>About Business Outcome</h2>
      <p>
        Business Outcome is the current commercial truth layer. It answers
        whether the business is commercially viable, using real revenue,
        cost, and margin data.
      </p>
      <p>
        It reads from Business Summary, Revenue/COG truth, and Revenue
        Summary. It does not recalculate those modules and is not a
        scenario page - it describes the current, actual business state.
      </p>
      <p>
        Contribution by revenue stream or operating group, and primary
        commercial drivers, are not yet available in this build - see the
        Data Quality panel below for details.
      </p>
      <p>
        For a view of what rate you need to charge based on labour and
        asset recovery, see{" "}
        <a href="/recovery-outcome" className="underline">
          Recovery &amp; Rate Justification
        </a>
        .
      </p>
    </div>
  );
}
