"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SETUP_NAV_GATING_ENABLED } from "@/lib/config/setupFlowConfig";

const nav_groups = [
  {
    label: "Quick Start",
    items: [
      { href: "/business-setup", label: "Business Setup" },
      { href: "/quick-start", label: "Quick Start Overview" },
      {
        href: "/labour-rate-reality-check",
        label: "Labour Rate Reality Check",
      },
    ],
  },
  {
    label: "Business Inputs",
    items: [
      { href: "/p-and-l", label: "P&L" },
      { href: "/general-overheads", label: "General Overheads" },
      { href: "/labour", label: "Labour" },
      { href: "/assets", label: "Assets" },
    ],
  },
  {
    label: "Business Truth",
    items: [
      { href: "/cost-summary", label: "Cost Summary" },
      { href: "/revenue-cogs", label: "Revenue / COGS" },
      { href: "/revenue-reality", label: "Revenue Reality" },
      { href: "/business-summary", label: "Business Summary" },
      { href: "/calculation-trace", label: "Calculation Trace" },
      { href: "/model-readiness", label: "Model Readiness" },
    ],
  },
  {
    label: "Recovery Chain",
    items: [
      { href: "/recovery-summary", label: "Recovery Summary" },
      { href: "/cost-allocation", label: "Cost Allocation" },
      { href: "/rate-builder", label: "Rate Builder" },
      { href: "/recovery-outcome", label: "Business Outcome" },
    ],
  },
  {
    label: "Business Modelling",
    items: [
      { href: "/business-modelling", label: "Business Modelling" },
      { href: "/quote-engine", label: "Quote Engine" },
    ],
  },
];

const standalone_items = [{ href: "/settings", label: "Settings" }];

const SETUP_FLOW_ORDER = [
  "/p-and-l",
  "/general-overheads",
  "/labour",
  "/assets",
  "/cost-summary",
  "/revenue-cogs",
  "/revenue-reality",
  "/business-summary",
  "/calculation-trace",
  "/model-readiness",
  "/recovery-summary",
  "/cost-allocation",
  "/rate-builder",
  "/recovery-outcome",
  "/business-modelling",
];

const setup_progress = {
  "/p-and-l": true,
  "/general-overheads": false,
  "/labour": false,
  "/assets": false,
  "/cost-summary": false,
  "/revenue-cogs": false,
  "/revenue-reality": false,
  "/business-summary": false,
  "/calculation-trace": false,
  "/model-readiness": false,
  "/recovery-summary": false,
  "/cost-allocation": false,
  "/rate-builder": false,
  "/recovery-outcome": false,
  "/business-modelling": false,
};

function build_initial_open_groups(pathname) {
  return {
    "Quick Start":
      pathname === "/business-setup" ||
      pathname.startsWith("/business-setup/") ||
      pathname === "/quick-start" ||
      pathname.startsWith("/quick-start/") ||
      pathname === "/labour-rate-reality-check" ||
      pathname.startsWith("/labour-rate-reality-check/"),

    "Business Inputs":
      pathname === "/p-and-l" ||
      pathname.startsWith("/p-and-l/") ||
      pathname === "/general-overheads" ||
      pathname.startsWith("/general-overheads/") ||
      pathname === "/labour" ||
      pathname.startsWith("/labour/") ||
      pathname === "/assets" ||
      pathname.startsWith("/assets/"),

    "Business Truth":
      pathname === "/cost-summary" ||
      pathname.startsWith("/cost-summary/") ||
      pathname === "/revenue-cogs" ||
      pathname.startsWith("/revenue-cogs/") ||
      pathname === "/revenue-reality" ||
      pathname.startsWith("/revenue-reality/") ||
      pathname === "/business-summary" ||
      pathname.startsWith("/business-summary/") ||
      pathname === "/calculation-trace" ||
      pathname.startsWith("/calculation-trace/") ||
      pathname === "/model-readiness" ||
      pathname.startsWith("/model-readiness/"),

    "Recovery Chain":
      pathname === "/recovery-summary" ||
      pathname.startsWith("/recovery-summary/") ||
      pathname === "/cost-allocation" ||
      pathname.startsWith("/cost-allocation/") ||
      pathname === "/rate-builder" ||
      pathname.startsWith("/rate-builder/") ||
      pathname === "/recovery-outcome" ||
      pathname.startsWith("/recovery-outcome/"),

    "Business Modelling":
      pathname === "/business-modelling" ||
      pathname.startsWith("/business-modelling/") ||
      pathname === "/quote-engine" ||
      pathname.startsWith("/quote-engine/"),
  };
}

function is_active_path(pathname, href) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function is_setup_route_locked(href) {
  if (!SETUP_NAV_GATING_ENABLED) {
    return false;
  }

  const index = SETUP_FLOW_ORDER.indexOf(href);

  if (index <= 0) {
    return false;
  }

  const previous_href = SETUP_FLOW_ORDER[index - 1];

  return !setup_progress[previous_href];
}

function get_item_classes(active, locked = false) {
  if (locked) {
    return "ui-nav-item ui-nav-item-locked";
  }

  if (active) {
    return "ui-nav-item ui-nav-item-active";
  }

  return "ui-nav-item";
}

function NavigationItem({ item, active }) {
  const is_locked = is_setup_route_locked(item.href);

  if (is_locked) {
    return (
      <div
        key={item.href}
        className={get_item_classes(false, true)}
        title="Complete the previous setup step first"
      >
        {item.label}
      </div>
    );
  }

  return (
    <Link href={item.href} className={get_item_classes(active)}>
      {item.label}
    </Link>
  );
}

export default function SidebarNavigation() {
  const pathname = usePathname();

  const [open_groups, set_open_groups] = useState(
    build_initial_open_groups(pathname)
  );

  function toggle_group(label) {
    set_open_groups((current) => ({
      ...current,
      [label]: !current[label],
    }));
  }

  function is_active(href) {
    return is_active_path(pathname, href);
  }

  return (
    <aside className="ui-sidebar">
      <div className="ui-stack">
        <div>
          <div className="ui-kicker">QS Tools</div>
          <div className="text-2xl font-semibold text-[var(--text-primary)]">
            Navigation
          </div>
        </div>

        <Link href="/" className={get_item_classes(is_active("/"))}>
          Home
        </Link>

        <div className="ui-stack">
          {nav_groups.map((group) => {
            const is_open = open_groups[group.label];

            return (
              <div key={group.label} className="ui-stack-sm">
                <button
                  type="button"
                  className="ui-nav-group-button"
                  onClick={() => toggle_group(group.label)}
                >
                  <span>{group.label}</span>
                  <span>{is_open ? "−" : "+"}</span>
                </button>

                {is_open ? (
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
            );
          })}
        </div>

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
    </aside>
  );
}
