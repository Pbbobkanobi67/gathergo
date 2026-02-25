"use client";

import { useState } from "react";
import { useAdminTrips, useAdminUpdateTrip, useAdminDeleteTrip } from "@/hooks/useAdmin";
import { Search, Trash2, ChevronLeft, ChevronRight } from "lucide-react";

const STATUSES = ["", "PLANNING", "CONFIRMED", "ACTIVE", "COMPLETED", "CANCELLED"] as const;

const statusColors: Record<string, string> = {
  PLANNING: "bg-blue-600/20 text-blue-400",
  CONFIRMED: "bg-green-600/20 text-green-400",
  ACTIVE: "bg-teal-600/20 text-teal-400",
  COMPLETED: "bg-slate-600/20 text-slate-400",
  CANCELLED: "bg-red-600/20 text-red-400",
};

export default function AdminTripsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const { data, isLoading } = useAdminTrips({
    search: debouncedSearch,
    status: statusFilter || undefined,
    page,
    limit: 20,
  });
  const updateTrip = useAdminUpdateTrip();
  const deleteTrip = useAdminDeleteTrip();

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
    const timer = setTimeout(() => setDebouncedSearch(value), 300);
    return () => clearTimeout(timer);
  };

  const handleStatusChange = (tripId: string, newStatus: string) => {
    updateTrip.mutate({ tripId, data: { status: newStatus as "PLANNING" | "CONFIRMED" | "ACTIVE" | "COMPLETED" | "CANCELLED" } });
  };

  const handleDelete = (tripId: string, tripTitle: string) => {
    if (confirm(`Delete trip "${tripTitle}"? This will delete all associated data and cannot be undone.`)) {
      deleteTrip.mutate(tripId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-100">Trips</h1>
        {data && (
          <span className="text-sm text-slate-400">{data.total} total</span>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by title or city..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full rounded-lg border border-slate-600 bg-slate-800 py-2 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-400 focus:border-teal-500 focus:outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-teal-500 focus:outline-none"
        >
          <option value="">All Statuses</option>
          {STATUSES.filter(Boolean).map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-700">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-700 bg-slate-800/50">
            <tr>
              <th className="px-4 py-3 font-medium text-slate-400">Trip</th>
              <th className="px-4 py-3 font-medium text-slate-400">Organizer</th>
              <th className="px-4 py-3 font-medium text-slate-400">Status</th>
              <th className="px-4 py-3 font-medium text-slate-400">Dates</th>
              <th className="px-4 py-3 font-medium text-slate-400">Members</th>
              <th className="px-4 py-3 font-medium text-slate-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}>
                  <td colSpan={6} className="px-4 py-3">
                    <div className="h-5 w-full animate-pulse rounded bg-slate-700" />
                  </td>
                </tr>
              ))
            ) : data?.items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  No trips found
                </td>
              </tr>
            ) : (
              data?.items.map((trip) => (
                <tr key={trip.id} className="hover:bg-slate-800/30">
                  <td className="px-4 py-3">
                    <div>
                      <span className="font-medium text-slate-100">{trip.title}</span>
                      {(trip.city || trip.state) && (
                        <p className="text-xs text-slate-400">
                          {[trip.city, trip.state].filter(Boolean).join(", ")}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{trip.organizer.name}</td>
                  <td className="px-4 py-3">
                    <select
                      value={trip.status}
                      onChange={(e) => handleStatusChange(trip.id, e.target.value)}
                      disabled={updateTrip.isPending}
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[trip.status] ?? "bg-slate-600/20 text-slate-400"} border-0 bg-transparent focus:outline-none`}
                    >
                      {STATUSES.filter(Boolean).map((s) => (
                        <option key={s} value={s} className="bg-slate-800 text-slate-100">{s}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-slate-300">{trip._count.members}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDelete(trip.id, trip.title)}
                      disabled={deleteTrip.isPending}
                      className="rounded p-1.5 text-slate-400 hover:bg-red-900/30 hover:text-red-400 disabled:opacity-50"
                      title="Delete trip"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && data.total > 20 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-400">
            Page {data.page} of {Math.ceil(data.total / data.limit)}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-lg border border-slate-600 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!data.hasMore}
              className="rounded-lg border border-slate-600 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
