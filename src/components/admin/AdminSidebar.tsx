"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Users, Map, Activity, Settings, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const adminNavItems = [
  { href: "/admin", icon: BarChart3, label: "Dashboard" },
  { href: "/admin/users", icon: Users, label: "Users" },
  { href: "/admin/trips", icon: Map, label: "Trips" },
  { href: "/admin/activity", icon: Activity, label: "Activity Log" },
  { href: "/admin/settings", icon: Settings, label: "Settings" },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-full w-64 flex-col border-r border-slate-700 bg-slate-900">
      {/* Header */}
      <div className="flex h-16 items-center border-b border-slate-700 px-4">
        <Link href="/admin" className="flex items-center gap-2">
          <span className="text-2xl font-bold text-amber-500">A</span>
          <span className="text-lg font-semibold text-slate-100">Admin Panel</span>
        </Link>
      </div>

      {/* Back to app */}
      <div className="p-3">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to App
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3">
        {adminNavItems.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-amber-600/20 text-amber-400"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-700 p-4">
        <p className="text-xs text-slate-500">Admin Panel</p>
      </div>
    </aside>
  );
}
