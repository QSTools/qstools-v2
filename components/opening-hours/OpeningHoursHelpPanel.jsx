export default function OpeningHoursHelpPanel() {
  return (
    <section className="ui-section">
      <details className="ui-panel">
        <summary className="ui-heading">Opening Hours Help</summary>

        <div className="ui-stack">
          <p className="ui-help">
            Opening Hours defines when the business is normally available to
            operate.
          </p>

          <p className="ui-help">
            It is not the same as productive hours. A business may be open 45
            hours per week, but staff may only create part of that as productive
            recoverable time.
          </p>

          <p className="ui-help">
            Labour owns productive hours, productive staff type rates, and
            labour cost.
          </p>

          <p className="ui-help">
            Assets own actual utilisation hours and required asset recovery
            rates.
          </p>

          <p className="ui-help">
            Opening Hours gives the system a visible calendar foundation so
            future Rate Builder and Quote Checker logic can detect weekends,
            shutdowns, after-hours work, and operating capacity pressure.
          </p>
        </div>
      </details>
    </section>
  );
}