"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const views = [
  {
    href: "/business-outcome",
    label: "Business Outcome",
    description: "Is the business commercially viable? (revenue, COG, margin, cost burden)",
  },
  {
    href: "/recovery-outcome",
    label: "Recovery & Rate Justification",
    description: "What rate do we need to charge? (labour/asset recovery, rate build-up)",
  },
];

export default function BusinessOutcomeViewSwitcher() {
  const pathname = usePathname();

  return (
    <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-card)] p-2 flex gap-2">
      {views.map((view) => {
        const is_active = pathname === view.href;

        return (
          <Link
            key={view.href}
            href={view.href}
            className={`flex-1 rounded-md px-4 py-2 text-sm transition-colors ${
              is_active
                ? "bg-[var(--info)] text-white font-semibold"
                : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
            }`}
            title={view.description}
          >
            {view.label}
          </Link>
        );
      })}
    </div>
  );
}
