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
    items: [
      { href: "/cost-summary", label: "Cost Summary" },
    ],
  },
];

const standaloneItems = [
  { href: "/budget", label: "Budget" },
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
    <aside
      style={{
        width: "100%",
        padding: "16px",
        borderRight: "1px solid #e5e5e5",
        minHeight: "100vh",
        background: "#fff",
      }}
    >
      <div style={{ marginBottom: "24px" }}>
        <div style={{ fontSize: "12px", color: "#666", textTransform: "uppercase" }}>
          QS Tools
        </div>
        <div style={{ fontSize: "20px", fontWeight: 600 }}>Navigation</div>
      </div>

      {navGroups.map((group) => (
        <div key={group.label} style={{ marginBottom: "20px" }}>
          <button
            type="button"
            onClick={() => toggleGroup(group.label)}
            style={{
              width: "100%",
              textAlign: "left",
              padding: "10px 12px",
              border: "1px solid #ddd",
              borderRadius: "8px",
              background: "#f7f7f7",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            {openGroups[group.label] ? "▾" : "▸"} {group.label}
          </button>

          {openGroups[group.label] && (
            <div style={{ marginTop: "8px", paddingLeft: "12px" }}>
              {group.items.map((item) => (
                <div key={item.href} style={{ marginBottom: "6px" }}>
                  <Link
                    href={item.href}
                    style={{
                      display: "block",
                      padding: "8px 10px",
                      borderRadius: "6px",
                      textDecoration: "none",
                      background: isActive(item.href) ? "#111" : "transparent",
                      color: isActive(item.href) ? "#fff" : "#222",
                    }}
                  >
                    {item.label}
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      <div style={{ marginTop: "28px", paddingTop: "16px", borderTop: "1px solid #e5e5e5" }}>
        <div
          style={{
            fontSize: "12px",
            color: "#666",
            textTransform: "uppercase",
            marginBottom: "10px",
          }}
        >
          Standalone
        </div>

        {standaloneItems.map((item) => (
          <div key={item.href} style={{ marginBottom: "6px" }}>
            <Link
              href={item.href}
              style={{
                display: "block",
                padding: "8px 10px",
                borderRadius: "6px",
                textDecoration: "none",
                background: isActive(item.href) ? "#111" : "transparent",
                color: isActive(item.href) ? "#fff" : "#222",
              }}
            >
              {item.label}
            </Link>
          </div>
        ))}
      </div>
    </aside>
  );
}