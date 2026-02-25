"use client";

import { useState } from "react";
import { Search, Pencil, Trash2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAdminActivity, useAdminUpdateActivity, useAdminDeleteActivity } from "@/hooks/useAdmin";
import { ACTIVITY_LOG_TYPES } from "@/constants";

export default function AdminActivityPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const { data, isLoading } = useAdminActivity({ search: search || undefined, type: typeFilter || undefined, page, limit: 20 });
  const updateMutation = useAdminUpdateActivity();
  const deleteMutation = useAdminDeleteActivity();

  const startEdit = (id: string, action: string) => {
    setEditingId(id);
    setEditText(action);
  };

  const saveEdit = (id: string) => {
    updateMutation.mutate({ id, data: { action: editText } });
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this activity log entry?")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Activity Log</h1>
        <p className="text-slate-400">View and manage all activity across trips</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search actions..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2 pl-10 pr-4 text-sm text-slate-100 placeholder:text-slate-500 focus:border-teal-500 focus:outline-none"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-teal-500 focus:outline-none"
        >
          <option value="">All Types</option>
          {ACTIVITY_LOG_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-700">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700 bg-slate-800/50">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-400">Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-400">Action</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-400">Trip</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-400">Date</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase text-slate-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">Loading...</td>
              </tr>
            ) : !data || data.items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">No activity logs found</td>
              </tr>
            ) : (
              data.items.map((item) => {
                const typeInfo = ACTIVITY_LOG_TYPES.find((t) => t.value === item.type);
                return (
                  <tr key={item.id} className="hover:bg-slate-800/50">
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className="text-xs">
                        {typeInfo?.label || item.type}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {editingId === item.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="flex-1 rounded border border-slate-600 bg-slate-700 px-2 py-1 text-sm text-slate-100 focus:border-teal-500 focus:outline-none"
                          />
                          <button onClick={() => saveEdit(item.id)} className="text-green-400 hover:text-green-300">
                            <Check className="h-4 w-4" />
                          </button>
                          <button onClick={() => setEditingId(null)} className="text-slate-400 hover:text-slate-300">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-200">{item.action}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300">
                      {(item as unknown as Record<string, unknown>).trip ? ((item as unknown as Record<string, unknown>).trip as { title: string }).title : "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-400">
                      {new Date(item.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEdit(item.id, item.action)}
                          disabled={editingId === item.id}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && data.total > 20 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-400">
            Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, data.total)} of {data.total}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={!data.hasMore} onClick={() => setPage(page + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
