"use client";

export default function RateBuilderHelpPanel() {
  return (
    <section className="ui-section">
      <p className="ui-kicker">Help</p>

      <h2 className="ui-section-title">How Rate Builder works</h2>

      <div className="mt-5 ui-stack">
        <article className="ui-panel">
          <h3 className="rate-builder-help-title">Charge lines</h3>

          <p className="ui-help">
            A charge line is one thing the customer is charged for. Examples
            include setup fees, hourly labour, cubic metres, square metres,
            days, tonnes, materials, or subcontractor charges.
          </p>
        </article>

        <article className="ui-panel">
          <h3 className="rate-builder-help-title">Primary output driver</h3>

          <p className="ui-help">
            The primary output driver is the unit you want to normalise the
            total charge against. For concrete pumping, this may be m³. For
            labour hire, it may be hours. For cartage, it may be tonnes or
            loads.
          </p>
        </article>

        <article className="ui-panel">
          <h3 className="rate-builder-help-title">Effective rate</h3>

          <p className="ui-help">
            The effective rate takes all charge lines in the calculator and
            divides the total by the selected output driver quantity. This
            turns mixed pricing into one clean rate, such as dollars per m³.
          </p>
        </article>

        <article className="ui-panel">
          <h3 className="rate-builder-help-title">
            Why this is separate from Revenue / COGS
          </h3>

          <p className="ui-help">
            Revenue / COGS describes what the business sells and what it
            actually earns. Rate Builder describes how the business charges.
            Later, the recovery link will compare the calculated rates against
            the required recovery target.
          </p>
        </article>
      </div>
    </section>
  );
}