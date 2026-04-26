"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SETUP_NAV_GATING_ENABLED } from "@/lib/config/setupFlowConfig";

const nav_groups = [
  {
    label: "Quick Start",
    items: [
      { href: "/quick-start", label: "Quick Start Overview" },
      {
        href: "/labour-rate-reality-check",
        label: "Labour Rate Reality Check",
      },
    ],
  },
  {
    label: "Business Truth",
    items: [{ href: "/p-and-l", label: "P&L" }],
  },
  {
    label: "Core Inputs",
    items: [
      { href: "/labour", label: "Labour" },
      { href: "/employee-overheads", label: "Employee Overheads" },
      { href: "/assets", label: "Assets" },
      { href: "/general-overheads", label: "General Overheads" },
      { href: "/materials", label: "Materials" },
    ],
  },
  {
    label: "Cost & Recovery",
    items: [
      { href: "/cost-summary", label: "Cost Summary" },
      { href: "/recovery-summary", label: "Recovery Summary" },
    ],
  },
  {
    label: "Rate Models",
    items: [
      { href: "/rates/square-metre", label: "Square Metre Rate" },
      { href: "/rates/volume", label: "Volume Rate" },
    ],
  },
  {
    label: "Structure & Outcome",
    items: [
      { href: "/cost-allocation", label: "Cost Allocation" },
      { href: "/recovery-outcome", label: "Recovery Outcome" },
    ],
  },
];

const standalone_items = [
  { href: "/budget", label: "Budget" },
  { href: "/settings", label: "Settings" },
];

const SETUP_FLOW_ORDER = [
  "/p-and-l",
  "/general-overheads",
  "/labour",
  "/assets",
  "/cost-summary",
];

const setup_progress = {
  "/p-and-l": true,
  "/general-overheads": false,
  "/labour": false,
  "/assets": false,
  "/cost-summary": false,
};

function build_initial_open_groups(pathname) {
  return {
    "Quick Start":
      pathname === "/quick-start" ||
      pathname.startsWith("/quick-start/") ||
      pathname === "/labour-rate-reality-check" ||
      pathname.startsWith("/labour-rate-reality-check/"),
    "Business Truth": pathname === "/p-and-l" || pathname.startsWith("/p-and-l/"),
    "Core Inputs":
      pathname === "/labour" ||
      pathname.startsWith("/labour/") ||
      pathname === "/employee-overheads" ||
      pathname.startsWith("/employee-overheads/") ||
      pathname === "/assets" ||
      pathname.startsWith("/assets/") ||
      pathname === "/general-overheads" ||
      pathname.startsWith("/general-overheads/") ||
      pathname === "/materials" ||
      pathname.startsWith("/materials/"),
    "Cost & Recovery":
      pathname === "/cost-summary" ||
      pathname.startsWith("/cost-summary/") ||
      pathname === "/recovery-summary" ||
      pathname.startsWith("/recovery-summary/"),
    "Rate Models":
      pathname === "/rates/square-metre" ||
      pathname.startsWith("/rates/square-metre/") ||
      pathname === "/rates/volume" ||
      pathname.startsWith("/rates/volume/"),
    "Structure & Outcome":
      pathname === "/cost-allocation" ||
      pathname.startsWith("/cost-allocation/") ||
      pathname === "/recovery-outcome" ||
      pathname.startsWith("/recovery-outcome/"),
  };
}

function get_item_classes(active) {
  return [
    "block rounded-xl px-4 py-3 no-underline transition-colors",
    active
      ? "bg-[var(--bg-card-muted)] font-semibold text-[var(--text-primary)]"
      : "text-[var(--text-primary)] hover:bg-[var(--bg-card-muted)]",
  ].join(" ");
}

function is_setup_route_locked(href) {
  const is_in_setup_flow = SETUP_FLOW_ORDER.includes(href);

  if (!SETUP_NAV_GATING_ENABLED) {
    return false;
  }

  if (!is_in_setup_flow) {
    return false;
  }

  return !setup_progress[href];
}

function NavigationItem({ item, active }) {
  const is_locked = is_setup_route_locked(item.href);

  if (is_locked) {
    return (
      <div
        key={item.href}
        className={`${get_item_classes(false)} cursor-not-allowed opacity-40`}
        title="Complete the previous setup step before opening this page."
      >
        {item.label}
      </div>
    );
  }

  return (
    <Link key={item.href} href={item.href} className={get_item_classes(active)}>
      {item.label}
    </Link>
  );
}

export default function SidebarNavigation() {
  const pathname = usePathname();

  const [open_groups, set_open_groups] = useState(
    build_initial_open_groups(pathname),
  );

  function toggle_group(group_label) {
    set_open_groups((prev) => ({
      ...prev,
      [group_label]: !prev[group_label],
    }));
  }

  function is_active(href) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <aside className="min-h-screen border-r border-[var(--border-primary)] bg-[var(--bg-card)] p-4 text-[var(--text-primary)]">
      <div className="mb-6 ui-stack-sm">
        <div>
          <div className="ui-kicker">QS Tools</div>
          <div className="text-2xl font-semibold text-[var(--text-primary)]">
            Navigation
          </div>
        </div>

        <Link href="/" className={get_item_classes(is_active("/"))}>
          Home
        </Link>
      </div>

      <div className="ui-stack">
        {nav_groups.map((group) => (
          <div key={group.label} className="ui-stack">
            <button
              type="button"
              onClick={() => toggle_group(group.label)}
              className="ui-button-secondary w-full justify-start text-left"
            >
              {open_groups[group.label] ? "▾" : "▸"} {group.label}
            </button>

            {open_groups[group.label] ? (
              <div className="ui-stack pl-3">
                {group.items.map((item) => (
                  <NavigationItem
                    key={item.href}
                    item={item}
                    active={is_active(item.href)}
                  />
                ))}
              </div>
            ) : null}
          </div>
        ))}

        <div className="mt-4 border-t border-[var(--border-primary)] pt-4">
          <div className="mb-3 ui-kicker">Standalone</div>

          <div className="ui-stack">
            {standalone_items.map((item) => (
              <NavigationItem
                key={item.href}
                item={item}
                active={is_active(item.href)}
              />
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}