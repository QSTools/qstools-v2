"use client";

import useOpeningHours from "@/hooks/useOpeningHours";
import OpeningHoursStatusStrip from "@/components/opening-hours/OpeningHoursStatusStrip";
import OpeningHoursMainCard from "@/components/opening-hours/OpeningHoursMainCard";
import OpeningHoursHelpPanel from "@/components/opening-hours/OpeningHoursHelpPanel";

export default function OpeningHoursPage() {
  const { status, card, actions } = useOpeningHours();

  return (
    <main className="ui-page">
      <div className="ui-page-stack">
        <section className="ui-hero">
          <div className="ui-hero-inner">
            <div className="ui-kicker">Opening hours setup</div>

            <h1 className="ui-hero-title">Set your operating calendar</h1>

            <p className="ui-hero-copy">
              Define when the business is normally available to operate. These
              hours create calendar context only — Labour still owns productive
              hours and Assets still own utilisation hours.
            </p>

            <p className="ui-help">
              This prevents hidden assumptions around working weeks, shutdowns,
              weekends, public holidays, and closed periods.
            </p>
          </div>
        </section>

        <div className="opening-hours-layout">
          <div className="opening-hours-layout__left">
            <div className="opening-hours-layout__left-stack">
              <OpeningHoursMainCard {...card} actions={actions} />
            </div>
          </div>

          <aside className="opening-hours-layout__right">
            <div className="opening-hours-layout__right-stack">
              <OpeningHoursStatusStrip {...status} />
              <OpeningHoursSummaryRail summary_rows={card.summary_rows} />
            </div>
          </aside>

          <div className="opening-hours-layout__bottom">
            <div className="opening-hours-layout__bottom-stack">
              <OpeningHoursHelpPanel />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function OpeningHoursSummaryRail({ summary_rows }) {
  const rows = summary_rows || [];

  const primary_rows = rows.filter((row) =>
    [
      "Standard weekly open hours",
      "Annual open weeks",
      "Annual business open hours",
      "Public holiday closed hours",
      "Additional closed hours",
      "Net annual business open hours",
    ].includes(row.label)
  );

  return (
    <section className="ui-section">
      <div className="ui-panel">
        <p className="ui-kicker">Current calendar result</p>
        <h2 className="ui-card-title-sm">What this calendar produces</h2>

        <p className="ui-help">
          Operating calendar output only. These hours are not automatically
          productive Labour hours or Asset utilisation hours.
        </p>

        <div className="opening-hours-result-list">
          {primary_rows.map((row) => (
            <div key={row.label} className="opening-hours-result-row">
              <div>
                <strong>{row.label}</strong>
                <p className="ui-help">
                  {get_opening_hours_row_help(row.label)}
                </p>
              </div>

              <strong className="opening-hours-result-value">
                {row.value}
              </strong>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function get_opening_hours_row_help(label) {
  switch (label) {
    case "Standard weekly open hours":
      return "Normal open hours in a standard operating week.";
    case "Annual open weeks":
      return "Weeks available after seasonal shutdown allowance.";
    case "Annual business open hours":
      return "Gross annual open hours before holidays and extra closures.";
    case "Public holiday closed hours":
      return "Estimated closed hours from public holiday allowance.";
    case "Additional closed hours":
      return "Specific closure hours entered below.";
    case "Net annual business open hours":
      return "Final annual operating calendar hours after all closures.";
    default:
      return "";
  }
}