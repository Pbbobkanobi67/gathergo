"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Map,
  Utensils,
  Wine,
  DollarSign,
  Users,
  Package,
  FileText,
  Camera,
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/useCurrentUser";

interface SidebarProps {
  tripId?: string;
  isCollapsed: boolean;
  onToggle: () => void;
}

const mainNavItems = [
  { href: "/dashboard", icon: Home, label: "Dashboard" },
  { href: "/trips", icon: Map, label: "My Trips" },
];

const tripNavItems = [
  { href: "", icon: Home, label: "Overview" },
  { href: "/itinerary", icon: Map, label: "Itinerary" },
  { href: "/meals", icon: Utensils, label: "Meals" },
  { href: "/wine", icon: Wine, label: "Wine" },
  { href: "/expenses", icon: DollarSign, label: "Expenses" },
  { href: "/guests", icon: Users, label: "Guests" },
  { href: "/packing", icon: Package, label: "Packing" },
  { href: "/documents", icon: FileText, label: "Documents" },
  { href: "/photos", icon: Camera, label: "Photos" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export function Sidebar({ tripId, isCollapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { data: currentUser } = useCurrentUser();

  const navItems = tripId
    ? tripNavItems.map((item) => ({
        ...item,
        href: `/trips/${tripId}${item.href}`,
      }))
    : mainNavItems;

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-full flex-col border-r border-slate-700 bg-gradient-to-b from-slate-900 to-slate-950 shadow-[2px_0_8px_rgba(0,0,0,0.3)] transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-slate-700 px-4">
        {!isCollapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-2xl font-bold bg-gradient-to-br from-teal-400 to-emerald-500 bg-clip-text text-transparent">G</span>
            <span className="text-lg font-semibold text-slate-100">GatherGo</span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onToggle}
          className="ml-auto"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {tripId && !isCollapsed && (
          <div className="mb-4">
            <Link
              href="/trips"
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Trips
            </Link>
          </div>
        )}

        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== "/dashboard" && item.href !== "/trips" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-teal-600/20 text-teal-400 shadow-[inset_3px_0_0_rgba(13,148,136,0.8)]"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!isCollapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Admin Link */}
      {currentUser?.isAdmin && (
        <div className="border-t border-slate-700 p-3">
          <Link
            href="/admin"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              pathname.startsWith("/admin")
                ? "bg-amber-600/20 text-amber-400"
                : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            )}
          >
            <Shield className="h-5 w-5 shrink-0" />
            {!isCollapsed && <span>Admin</span>}
          </Link>
        </div>
      )}

      {/* Footer */}
      {!isCollapsed && (
        <div className="border-t border-slate-700 p-4">
          <p className="text-xs text-slate-500">
            GatherGo v1.0
          </p>
        </div>
      )}
    </aside>
  );
}
