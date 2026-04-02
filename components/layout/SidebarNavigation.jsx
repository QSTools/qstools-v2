import React, { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Folder, FolderOpen, LayoutDashboard, Calculator, Briefcase, Users, Wrench, Building2, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const NAV_GROUPS = [
  {
    group_id: "core_inputs",
    group_label: "Core Inputs",
    items: [
      { href: "/labour", label: "Labour", icon: Users },
      { href: "/employee-overheads", label: "Employee Overheads", icon: Briefcase },
      { href: "/assets", label: "Assets", icon: Wrench },
      { href: "/general-overheads", label: "General Overheads", icon: Building2 },
      { href: "/cost-allocation", label: "Cost Allocation", icon: Calculator },
    ],
  },
  {
    group_id: "commercial_engine",
    group_label: "Commercial Engine",
    items: [
      { href: "/cost-summary", label: "Cost Summary", icon: LayoutDashboard },
    ],
  },
];

const STANDALONE_ITEMS = [
  { href: "/budget", label: "Budget", icon: BarChart3 },
];

function NavGroup({ group, pathname, defaultOpen = true }) {
  const [is_open, setIsOpen] = useState(defaultOpen);

  const has_active_child = useMemo(
    () => group.items.some((item) => pathname === item.href || pathname.startsWith(`${item.href}/`)),
    [group.items, pathname]
  );

  const folderIcon = is_open || has_active_child ? FolderOpen : Folder;
  const FolderIcon = folderIcon;

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className={cn(
          "flex w-full items-center justify-between rounded-2xl px-3 py-2 text-left transition",
          has_active_child ? "bg-muted font-medium" : "hover:bg-muted/70"
        )}
      >
        <div className="flex items-center gap-3">
          <FolderIcon className="h-4 w-4" />
          <span className="text-sm">{group.group_label}</span>
        </div>
        <ChevronDown className={cn("h-4 w-4 transition-transform", is_open ? "rotate-180" : "rotate-0")} />
      </button>

      {is_open ? (
        <div className="ml-3 space-y-1 border-l pl-3">
          {group.items.map((item) => {
            const Icon = item.icon;
            const is_active = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-3 py-2 text-sm transition",
                  is_active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function StandaloneLink({ item, pathname }) {
  const Icon = item.icon;
  const is_active = pathname === item.href || pathname.startsWith(`${item.href}/`);

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-2xl px-3 py-2 text-sm transition",
        is_active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <Icon className="h-4 w-4" />
      <span>{item.label}</span>
    </Link>
  );
}

export default function SidebarNavigation() {
  const pathname = usePathname();

  return (
    <Card className="sticky top-4 rounded-3xl border shadow-sm">
      <div className="space-y-6 p-4">
        <div className="px-2">
          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">QS Tools</div>
          <div className="mt-1 text-lg font-semibold">Navigation</div>
          <p className="mt-1 text-sm text-muted-foreground">
            Core modules are grouped like folders. Budget stays separate as the forecast page.
          </p>
        </div>

        <div className="space-y-3">
          {NAV_GROUPS.map((group) => (
            <NavGroup key={group.group_id} group={group} pathname={pathname} />
          ))}
        </div>

        <div className="space-y-2 border-t pt-4">
          <div className="px-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">Standalone</div>
          <div className="space-y-1">
            {STANDALONE_ITEMS.map((item) => (
              <StandaloneLink key={item.href} item={item} pathname={pathname} />
            ))}
          </div>
        </div>

        <div className="rounded-2xl border p-3 text-sm text-muted-foreground">
          Suggested flow: Inputs → Cost Summary → Budget.
        </div>
      </div>
    </Card>
  );
}
