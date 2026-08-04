export default function PlaceholderSection({ kicker, title, help_text }) {
  return (
    <section className="ui-panel">
      <div className="ui-stack">
        <div>
          <p className="ui-kicker">{kicker}</p>
          <h3 className="text-base font-semibold text-[var(--text-primary)]">
            {title}
          </h3>
          <p className="ui-help">{help_text}</p>
        </div>

        <div className="ui-readonly">
          <p className="text-sm font-medium text-[var(--text-primary)]">
            Component route is ready.
          </p>
          <p className="mt-1 ui-help">
            This section is now separated from the old assignment tabs. The
            division and group builder is the main place to assign labour,
            assets, and overhead.
          </p>
        </div>
      </div>
    </section>
  );
}
