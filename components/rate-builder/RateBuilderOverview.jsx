"use client";

export default function RateBuilderOverview() {
  return (
    <section className="ui-section">
      <p className="ui-kicker">Overview</p>

      <h2 className="ui-section-title">Rate Builder module</h2>

      <p className="ui-help">
        Rate Builder is where the business turns customer charging structures
        into usable rates. Start by defining customer charge lines, then build
        labour charge-out rates, and later compare those rates against recovery
        requirements.
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <article className="rate-builder-overview-card">
          <p className="rate-builder-overview-card__label">Step 1</p>

          <h3 className="rate-builder-overview-card__title">
            Customer charge calculators
          </h3>

          <p className="rate-builder-overview-card__body">
            Define the actual line items a customer is charged for, such as
            setup fees, hourly rates, output-unit rates, materials, or
            subcontractor charges.
          </p>
        </article>

        <article className="rate-builder-overview-card">
          <p className="rate-builder-overview-card__label">Step 2</p>

          <h3 className="rate-builder-overview-card__title">
            Labour rates builder
          </h3>

          <p className="rate-builder-overview-card__body">
            Build charge-out rates for staff, crews, and productive labour
            groups. This section will be built next.
          </p>
        </article>

        <article className="rate-builder-overview-card">
          <p className="rate-builder-overview-card__label">Step 3</p>

          <h3 className="rate-builder-overview-card__title">
            Effective output rates
          </h3>

          <p className="rate-builder-overview-card__body">
            Convert mixed charge structures into one clean effective rate
            against the selected output driver, such as dollars per m³, hour,
            day, tonne, or item.
          </p>
        </article>

        <article className="rate-builder-overview-card">
          <p className="rate-builder-overview-card__label">Step 4</p>

          <h3 className="rate-builder-overview-card__title">Recovery link</h3>

          <p className="rate-builder-overview-card__body">
            Later, compare calculated charge rates against Recovery Summary and
            Business Outcome requirements to test whether the rates are enough.
          </p>
        </article>
      </div>
    </section>
  );
}