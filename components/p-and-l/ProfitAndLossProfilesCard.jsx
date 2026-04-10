"use client";

export default function ProfitAndLossProfilesCard({
  profiles = [],
  on_load,
  on_delete,
}) {
  return (
    <section className="ui-section">
      <div className="ui-panel ui-stack">
        <div>
          <div className="ui-kicker">Saved Periods</div>
          <h2 className="text-xl font-semibold">P&L Timeline</h2>
        </div>

        {profiles.length === 0 ? (
          <p className="ui-help">No saved periods yet.</p>
        ) : (
          profiles.map((profile) => (
            <div key={profile.id} className="ui-panel ui-stack-sm">
              <div className="font-semibold">{profile.label}</div>

              <div className="ui-help">
                FY {profile.financial_year}
                {profile.month
                  ? ` • ${get_month_name(profile.month)}`
                  : " • Full Year"}
              </div>

              <div className="ui-help">
                Saved: {new Date(profile.created_at).toLocaleDateString()}
              </div>

              <div className="ui-actions">
                <button
                  className="ui-button-secondary"
                  onClick={() => on_load(profile.id)}
                >
                  Load
                </button>

                <button
                  className="ui-button-danger"
                  onClick={() => on_delete(profile.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

// helper (duplicate for component scope)
function get_month_name(month) {
  const months = [
    "Jan","Feb","Mar","Apr","May","Jun",
    "Jul","Aug","Sep","Oct","Nov","Dec"
  ];
  return months[month - 1] ?? "";
}