"use client";

export default function QuoteEngineBuildUpCard({ build_up = {} }) {
  return (
    <section className="ui-section">
      <div className="ui-card ui-stack-sm">
        <div className="ui-card-title">{build_up.title || "How This Quote Is Being Tested"}</div>

        {Array.isArray(build_up.sections)
          ? build_up.sections.map((section) => (
              <div key={section.title} className="ui-panel ui-stack-sm">
                <div className="ui-card-title-sm">{section.title}</div>
                {section.rows.map((row) => (
                  <div key={row.label} className="ui-row-between">
                    <div>
                      <span className="ui-label">{row.label}</span>
                    </div>
                    <div>{row.value}</div>
                  </div>
                ))}
              </div>
            ))
          : null}

        <div className="ui-panel ui-stack-sm">
          <p className="ui-help">
            Margin pool is the money left to carry the business.
          </p>
          <p className="ui-help">
            This proves the Quote Engine is using the QS Tools business model.
          </p>
        </div>
      </div>
    </section>
  );
}
