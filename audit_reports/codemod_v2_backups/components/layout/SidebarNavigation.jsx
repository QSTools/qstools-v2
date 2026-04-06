"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navGroups = [
  {
    label: "Core Inputs",
    items: [
      { href: "/labour", label: "Labour" },
      { href: "/employee-overheads", label: "Employee Overheads" },
      { href: "/assets", label: "Assets" },
      { href: "/general-overheads", label: "General Overheads" },
      { href: "/cost-allocation", label: "Cost Allocation" },
    ],
  },
  {
    label: "Commercial Engine",
    items: [{ href: "/cost-summary", label: "Cost Summary" }],
  },
];

const standaloneItems = [
  { href: "/budget", label: "Budget" },
  { href: "/settings", label: "Settings" },
];

export default function SidebarNavigation() {
  const pathname = usePathname();
  const [openGroups, setOpenGroups] = useState({
    "Core Inputs": true,
    "Commercial Engine": true,
  });

  function toggleGroup(groupLabel) {
    setOpenGroups((prev) => ({
      ...prev,
      [groupLabel]: !prev[groupLabel],
    }));
  }

  function isActive(href) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <aside className="min-h-screen w-full border-r border-[var(--border-primary)] bg-[var(--bg-card)] p-4 text-[var(--text-primary)]">
      <div className="mb-6">
        <div className="text-xs uppercase tracking-wide text-[var(--text-muted)]">
          QS Tools
        </div>
        <div className="text-2xl font-semibold text-[var(--text-primary)]">
          Navigation
        </div>
      </div>

      {navGroups.map((group) => (
        <div key={group.label} className="mb-5">
          <button
            type="button"
            onClick={() => toggleGroup(group.label)}
            className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-card-muted)] px-3 py-2 text-left font-semibold text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-hover)]"
          >
            {openGroups[group.label] ? "▾" : "▸"} {group.label}
          </button>

          {openGroups[group.label] && (
            <div className="mt-2 pl-3">
              {group.items.map((item) => {
                const active = isActive(item.href);

                return (
                  <div key={item.href} className="mb-1.5">
                    <Link
                      href={item.href}
                      className={[
                        "block rounded-md px-3 py-2 no-underline transition-colors",
                        active
                          ? "bg-[var(--bg-card-muted)] text-[var(--text-primary)]"
                          : "text-[var(--text-primary)] hover:bg-[var(--bg-card-muted)]",
                      ].join(" ")}
                    >
                      {item.label}
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}

      <div className="mt-7 border-t border-[var(--border-primary)] pt-4">
        <div className="mb-2.5 text-xs uppercase tracking-wide text-[var(--text-muted)]">
          Standalone
        </div>

        {standaloneItems.map((item) => {
          const active = isActive(item.href);

          return (
            <div key={item.href} className="mb-1.5">
              <Link
                href={item.href}
                className={[
                  "block rounded-md px-3 py-2 no-underline transition-colors",
                  active
                    ? "bg-[var(--bg-card-muted)] text-[var(--text-primary)]"
                    : "text-[var(--text-primary)] hover:bg-[var(--bg-card-muted)]",
                ].join(" ")}
              >
                {item.label}
              </Link>
            </div>
          );
        })}
      </div>
    </aside>
  );
}