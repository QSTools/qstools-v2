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
    ],
  },
  {
    label: "Commercial Engine",
    items: [{ href: "/cost-summary", label: "Cost Summary" }],
  },
  {
    label: "Recovery",
    items: [
      { href: "/recovery-summary", label: "Recovery Summary" },
      { href: "/cost-allocation", label: "Cost Allocation" },
    ],
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
    Recovery: true,
  });

  function toggleGroup(group_label) {
    setOpenGroups((prev) => ({
      ...prev,
      [group_label]: !prev[group_label],
    }));
  }

  function isActive(href) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <aside className="min-h-screen border-r border-[var(--border-primary)] bg-[var(--bg-card)] p-4 text-[var(--text-primary)]">
      <div className="mb-6">
        <div className="ui-kicker">QS Tools</div>
        <div className="text-2xl font-semibold text-[var(--text-primary)]">
          Navigation
        </div>
      </div>

      <div className="ui-stack">
        {navGroups.map((group) => (
          <div key={group.label} className="ui-stack">
            <button
              type="button"
              onClick={() => toggleGroup(group.label)}
              className="ui-button-secondary w-full justify-start text-left"
            >
              {openGroups[group.label] ? "▾" : "▸"} {group.label}
            </button>

            {openGroups[group.label] ? (
              <div className="ui-stack pl-3">
                {group.items.map((item) => {
                  const active = isActive(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={[
                        "block rounded-xl px-4 py-3 no-underline transition-colors",
                        active
                          ? "bg-[var(--bg-card-muted)] font-semibold text-[var(--text-primary)]"
                          : "text-[var(--text-primary)] hover:bg-[var(--bg-card-muted)]",
                      ].join(" ")}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            ) : null}
          </div>
        ))}

        <div className="mt-4 border-t border-[var(--border-primary)] pt-4">
          <div className="ui-kicker mb-3">Standalone</div>

          <div className="ui-stack">
            {standaloneItems.map((item) => {
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "block rounded-xl px-4 py-3 no-underline transition-colors",
                    active
                      ? "bg-[var(--bg-card-muted)] font-semibold text-[var(--text-primary)]"
                      : "text-[var(--text-primary)] hover:bg-[var(--bg-card-muted)]",
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
}