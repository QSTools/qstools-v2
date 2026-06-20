"use client";

export default function RateBuilderTabs({ tabs = [], active_tab, on_change }) {
  return (
    <nav className="rate-builder-tabs" aria-label="Rate Builder sections">
      {tabs.map((tab) => {
        const is_active = tab.id === active_tab;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => on_change(tab.id)}
            className={`rate-builder-tab ${
              is_active ? "rate-builder-tab--active" : ""
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}