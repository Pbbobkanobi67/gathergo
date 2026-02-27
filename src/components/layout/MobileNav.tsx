"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Map, Utensils, Wine, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileNavProps {
  tripId?: string;
}

const mainNavItems = [
  { href: "/dashboard", icon: Home, label: "Home" },
  { href: "/trips", icon: Map, label: "Trips" },
];

const tripNavItems = [
  { href: "", icon: Home, label: "Trip" },
  { href: "/itinerary", icon: Map, label: "Itinerary" },
  { href: "/meals", icon: Utensils, label: "Meals" },
  { href: "/wine", icon: Wine, label: "Tasting" },
  { href: "/expenses", icon: DollarSign, label: "Expenses" },
];

export function MobileNav({ tripId }: MobileNavProps) {
  const pathname = usePathname();

  const navItems = tripId
    ? tripNavItems.map((item) => ({
        ...item,
        href: `/trips/${tripId}${item.href}`,
      }))
    : mainNavItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-700 bg-slate-900/95 backdrop-blur-sm lg:hidden">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== "/dashboard" && item.href !== "/trips" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium transition-colors",
                isActive
                  ? "text-teal-400"
                  : "text-slate-500 hover:text-slate-300"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
