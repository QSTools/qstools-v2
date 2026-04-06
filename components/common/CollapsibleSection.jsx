"use client";

import { useState } from "react";

export default function CollapsibleSection({
  title,
  summary,
  defaultOpen = true,
  children,
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <details
      open={isOpen}
      onToggle={(e) => setIsOpen(e.currentTarget.open)}
      className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)]"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4">
        <div>
          <div className="text-sm font-semibold text-[var(--text-primary)]">
            {title}
          </div>
          <div className="ui-help">
            {summary}
          </div>
        </div>

        <span className="text-sm text-[var(--text-muted)]">
          {isOpen ? "Hide" : "Show"}
        </span>
      </summary>

      <div className="px-4 pb-4">{children}</div>
    </details>
  );
}