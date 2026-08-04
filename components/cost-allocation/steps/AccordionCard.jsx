export default function AccordionCard({
  title,
  subtitle,
  kicker,
  is_open,
  on_toggle,
  children,
}) {
  return (
    <section className="ui-panel">
      <div className="ui-stack">
        <div className="ui-actions">
          <div>
            <h3 className="text-lg font-semibold text-[var(--accent)]">
              {title}
            </h3>
          </div>

          <div className="flex items-center gap-3">
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              {subtitle}
            </p>

            <button
              type="button"
              className="ui-button-secondary"
              onClick={on_toggle}
            >
              {is_open ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        {is_open ? (
          <div className="ui-readonly">
            <div className="ui-stack">
              <div>
                <p className="ui-kicker">{kicker}</p>
                <h2 className="text-2xl font-semibold text-[var(--text-primary)]">
                  {subtitle}
                </h2>
              </div>

              {children}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
