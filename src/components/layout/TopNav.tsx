"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, Search, Menu, Beer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSafeUser, SafeUserButton } from "@/components/shared/SafeClerkUser";
import { formatHoodBucks } from "@/lib/hood-bucks";

interface TopNavProps {
  onMenuClick?: () => void;
  hoodBucksBalance?: number;
  showSearch?: boolean;
}

export function TopNav({ onMenuClick, hoodBucksBalance, showSearch = true }: TopNavProps) {
  const { user, isLoaded } = useSafeUser();
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-slate-700 bg-slate-900/95 px-4 backdrop-blur-sm lg:px-6">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Search */}
      {showSearch && (
        <div className="hidden flex-1 md:block md:max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input
              type="search"
              placeholder="Search trips, activities..."
              className="w-full pl-10"
            />
          </div>
        </div>
      )}

      {/* Mobile search toggle */}
      {showSearch && (
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setSearchOpen(!searchOpen)}
        >
          <Search className="h-5 w-5" />
        </Button>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Hood Bucks Balance */}
      {hoodBucksBalance !== undefined && (
        <Link
          href="/hood-bucks"
          className="flex items-center gap-2 rounded-lg bg-amber-500/10 px-3 py-1.5 text-amber-400 transition-colors hover:bg-amber-500/20"
        >
          <Beer className="h-4 w-4" />
          <span className="text-sm font-medium">
            {formatHoodBucks(hoodBucksBalance)} HB
          </span>
        </Link>
      )}

      {/* Notifications */}
      <Button variant="ghost" size="icon" className="relative">
        <Bell className="h-5 w-5" />
        <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-coral-500" />
      </Button>

      {/* User menu */}
      {isLoaded && user && (
        <SafeUserButton
          appearance={{
            elements: {
              avatarBox: "h-8 w-8",
            },
          }}
        />
      )}

      {/* Mobile search bar */}
      {searchOpen && (
        <div className="absolute left-0 right-0 top-16 border-b border-slate-700 bg-slate-900 p-4 md:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input
              type="search"
              placeholder="Search trips, activities..."
              className="w-full pl-10"
              autoFocus
            />
          </div>
        </div>
      )}
    </header>
  );
}
