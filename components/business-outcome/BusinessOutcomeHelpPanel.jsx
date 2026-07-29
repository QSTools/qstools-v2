export default function BusinessOutcomeHelpPanel() {
  return (
    <div className="ui-card theme-card-muted">
      <h2>About Business Outcome</h2>
      <p>
        Business Outcome is the current commercial truth layer. It explains
        whether the business is recovering its cost burden, where the
        strongest pressure is coming from, and what data is not yet
        available.
      </p>
      <p>
        It reads from Business Summary, Revenue Summary, and Model
        Readiness. It does not recalculate those modules, and it does not
        decide the business model. Business Modelling should use this as
        its current-state source.
      </p>
      <p>
        Contribution by revenue stream or operating group is not yet
        available in this build. It requires Revenue/COGS stream mapping or
        Cost Allocation group data that Business Outcome does not currently
        source.
      </p>
    </div>
  );
}