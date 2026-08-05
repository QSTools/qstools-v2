export default function BusinessOutcomeHelpPanel() {
  return (
    <div className="ui-card theme-card-muted">
      <h2>About Recovery &amp; Rate Justification</h2>
      <p>
        Recovery &amp; Rate Justification explains whether the business is
        recovering its cost burden through its labour and asset rates,
        where the strongest recovery pressure is coming from, and what
        data is not yet available.
      </p>
      <p>
        It reads from Recovery Summary, Labour, Cost Allocation, and Rate
        Builder. It does not recalculate those modules, and it does not
        decide the business model. This is the Recovery Chain's rate
        justification view, not the primary commercial-truth Business
        Outcome view.
      </p>
      <p>
        Contribution by revenue stream or operating group is not yet
        available in this build. It requires Revenue/COGS stream mapping or
        Cost Allocation group data that this module does not currently
        source.
      </p>
    </div>
  );
}
