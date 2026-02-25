"use client";

import { useAdminStats } from "@/hooks/useAdmin";
import { Users, Map, DollarSign, TrendingUp, Activity, UserPlus } from "lucide-react";

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-400">{label}</p>
          <p className="mt-2 text-3xl font-bold text-slate-100">{value}</p>
        </div>
        <div className={`rounded-lg p-3 ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const { data: stats, isLoading, error } = useAdminStats();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-100">Admin Dashboard</h1>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-slate-800" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-100">Admin Dashboard</h1>
        <div className="rounded-xl border border-red-800 bg-red-900/20 p-6 text-red-400">
          Failed to load stats. {error?.message}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-100">Admin Dashboard</h1>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Total Users"
          value={stats.totalUsers}
          icon={Users}
          color="bg-teal-600"
        />
        <StatCard
          label="Total Trips"
          value={stats.totalTrips}
          icon={Map}
          color="bg-blue-600"
        />
        <StatCard
          label="Active Trips"
          value={stats.activeTrips}
          icon={Activity}
          color="bg-green-600"
        />
        <StatCard
          label="Recent Signups (30d)"
          value={stats.recentSignups}
          icon={UserPlus}
          color="bg-purple-600"
        />
        <StatCard
          label="Total Expenses"
          value={stats.totalExpenses}
          icon={DollarSign}
          color="bg-amber-600"
        />
        <StatCard
          label="Expense Volume"
          value={`$${stats.totalExpenseVolume.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={TrendingUp}
          color="bg-rose-600"
        />
      </div>

      {/* Trips by Status */}
      {stats.tripsByStatus.length > 0 && (
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-100">Trips by Status</h2>
          <div className="flex flex-wrap gap-4">
            {stats.tripsByStatus.map(({ status, count }) => (
              <div
                key={status}
                className="rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-2"
              >
                <span className="text-sm text-slate-400">{status}</span>
                <span className="ml-2 text-lg font-bold text-slate-100">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
