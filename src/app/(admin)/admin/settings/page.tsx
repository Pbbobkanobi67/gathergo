"use client";

import { useState, useEffect } from "react";
import { Save, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAdminSettings, useAdminUpdateSettings } from "@/hooks/useAdmin";
import { ACTIVITY_LOG_TYPES } from "@/constants";

export default function AdminSettingsPage() {
  const { data: settings, isLoading } = useAdminSettings();
  const updateMutation = useAdminUpdateSettings();
  const [hiddenTypes, setHiddenTypes] = useState<string[]>([]);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (settings) {
      setHiddenTypes(settings.hiddenActivityTypes);
      setDirty(false);
    }
  }, [settings]);

  const toggleType = (type: string) => {
    setHiddenTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
    setDirty(true);
  };

  const showAll = () => {
    setHiddenTypes([]);
    setDirty(true);
  };

  const hideAll = () => {
    setHiddenTypes(ACTIVITY_LOG_TYPES.map((t) => t.value));
    setDirty(true);
  };

  const save = () => {
    updateMutation.mutate({ hiddenActivityTypes: hiddenTypes });
    setDirty(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Settings</h1>
          <p className="text-slate-400">Configure what appears on trip overview pages</p>
        </div>
        <Button
          onClick={save}
          disabled={!dirty || updateMutation.isPending}
          className="gap-2"
        >
          <Save className="h-4 w-4" />
          {updateMutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Activity Feed Visibility</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={showAll}>
                <Eye className="mr-1.5 h-3.5 w-3.5" />
                Show All
              </Button>
              <Button variant="outline" size="sm" onClick={hideAll}>
                <EyeOff className="mr-1.5 h-3.5 w-3.5" />
                Hide All
              </Button>
            </div>
          </div>
          <p className="text-sm text-slate-400">
            Choose which activity types appear in the Recent Activity feed on trip overview pages.
          </p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-700" />
              ))}
            </div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {ACTIVITY_LOG_TYPES.map((type) => {
                const isVisible = !hiddenTypes.includes(type.value);
                return (
                  <button
                    key={type.value}
                    onClick={() => toggleType(type.value)}
                    className={`flex items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors ${
                      isVisible
                        ? "border-teal-500/40 bg-teal-500/10 hover:bg-teal-500/20"
                        : "border-slate-700 bg-slate-800/50 opacity-60 hover:bg-slate-800"
                    }`}
                  >
                    <span className="text-sm font-medium text-slate-200">
                      {type.label}
                    </span>
                    <Badge variant={isVisible ? "success" : "secondary"} className="text-xs">
                      {isVisible ? "Visible" : "Hidden"}
                    </Badge>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {updateMutation.isSuccess && !dirty && (
        <p className="text-sm text-green-400">Settings saved successfully.</p>
      )}
      {updateMutation.isError && (
        <p className="text-sm text-red-400">
          Failed to save: {updateMutation.error?.message}
        </p>
      )}
    </div>
  );
}
