"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SETUP_NAV_GATING_ENABLED } from "@/lib/config/setupFlowConfig";

const nav_groups = [
  {
    label: "Setup",
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
      { href: "/revenue-cogs", label: "Revenue / COGS" },
      { href: "/labour", label: "Labour" },
      { href: "/assets", label: "Assets" },
      { href: "/opening-hours", label: "Opening Hours" },
      { href: "/general-overheads", label: "General Overheads" },
    ],
  },
  {
    label: "Business Truth",
    items: [
      { href: "/cost-summary", label: "Cost Summary" },
      { href: "/revenue-reality", label: "Revenue Reality" },
      { href: "/revenue-summary", label: "Revenue Summary" },
      { href: "/business-summary", label: "Business Summary" },
    ],
  },
  {
    label: "Business Review",
    items: [
      { href: "/business-overview", label: "Business Overview" },
      { href: "/model-readiness", label: "Model Readiness" },
      { href: "/business-modelling", label: "Business Modelling" },
      { href: "/quote-checker", label: "Quote Checker" },
    ],
  },
  {
    label: "Recovery & Pricing",
    items: [
      { href: "/cost-allocation", label: "Cost Allocation" },
      { href: "/recovery-summary", label: "Recovery Summary" },
      { href: "/rate-builder", label: "Rate Builder" },
      { href: "/recovery-outcome", label: "Recovery & Rate Justification" },
      { href: "/quote-engine", label: "Quote Engine" },
    ],
  },
  {
    label: "Materials & Rates",
    items: [
      { href: "/materials", label: "Materials" },
      { href: "/rates/square-metre", label: "Square Metre Rate" },
    ],
  },
  {
    label: "Developer / Trace",
    items: [
      { href: "/ai-business-state", label: "AI Business State" },
      { href: "/calculation-trace", label: "Calculation Trace" },
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
  "/business-overview",
  "/model-readiness",
  "/business-modelling",
  "/quote-checker",
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
  "/business-overview": false,
  "/model-readiness": false,
  "/business-modelling": false,
  "/quote-checker": false,
};

function is_active_path(pathname, href) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function get_initial_open_group_label(pathname) {
  for (const group of nav_groups) {
    const has_active_item = group.items.some((item) =>
      is_active_path(pathname, item.href)
    );

    if (has_active_item) {
      return group.label;
    }
  }

  return null;
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

  const [open_group, set_open_group] = useState(() =>
    get_initial_open_group_label(pathname)
  );

  function toggle_group(label) {
    set_open_group((current) => (current === label ? null : label));
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

        <div className="ui-nav-group-list">
          {nav_groups.map((group) => {
            const is_open = open_group === group.label;

            return (
              <div key={group.label} className="ui-nav-group-wrapper">
                <button
                  type="button"
                  className={
                    is_open
                      ? "ui-nav-group-button ui-nav-group-button-open"
                      : "ui-nav-group-button"
                  }
                  onClick={() => toggle_group(group.label)}
                >
                  <span>{group.label}</span>
                  <span>{is_open ? "−" : "+"}</span>
                </button>

                {is_open ? (
                  <div className="ui-nav-group-items">
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
