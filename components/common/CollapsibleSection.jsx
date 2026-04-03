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
      className="rounded-2xl border border-neutral-800 bg-neutral-900"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4">
        <div>
          <div className="text-sm font-semibold text-white">{title}</div>
          <div className="mt-1 text-xs text-neutral-400">{summary}</div>
        </div>

        <span className="text-sm text-neutral-400">
          {isOpen ? "Hide" : "Show"}
        </span>
      </summary>

      <div className="px-4 pb-4">{children}</div>
    </details>
  );
}