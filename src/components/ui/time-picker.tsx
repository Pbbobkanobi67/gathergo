"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface TimePickerProps {
  value: string; // "HH:mm" 24h format or ""
  onChange: (value: string) => void;
  className?: string;
  id?: string;
}

function TimePickerComponent({ value, onChange, className, id }: TimePickerProps) {
  // Parse 24h "HH:mm" into 12h components
  const parsed = React.useMemo(() => {
    if (!value) return { hour: "", minute: "", period: "AM" };
    const [h, m] = value.split(":").map(Number);
    const period = h >= 12 ? "PM" : "AM";
    const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return { hour: String(hour12), minute: String(m).padStart(2, "0"), period };
  }, [value]);

  const update = (hour: string, minute: string, period: string) => {
    if (!hour || !minute) {
      onChange("");
      return;
    }
    let h = parseInt(hour, 10);
    if (period === "AM" && h === 12) h = 0;
    if (period === "PM" && h !== 12) h += 12;
    onChange(`${String(h).padStart(2, "0")}:${minute}`);
  };

  const hours = Array.from({ length: 12 }, (_, i) => String(i + 1));
  const minutes = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"));

  const selectClass = cn(
    "h-10 rounded-lg border bg-slate-800 px-2 py-2 text-sm text-slate-100 transition-all duration-200 appearance-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]",
    "border-slate-600 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
  );

  return (
    <div className={cn("flex items-center gap-1.5", className)} id={id}>
      <select
        className={cn(selectClass, "w-[68px]")}
        value={parsed.hour}
        onChange={(e) => update(e.target.value, parsed.minute || "00", parsed.period)}
      >
        <option value="" className="bg-slate-800 text-slate-500">Hr</option>
        {hours.map((h) => (
          <option key={h} value={h} className="bg-slate-800">{h}</option>
        ))}
      </select>
      <span className="text-slate-400 font-bold">:</span>
      <select
        className={cn(selectClass, "w-[68px]")}
        value={parsed.minute}
        onChange={(e) => update(parsed.hour || "12", e.target.value, parsed.period)}
      >
        <option value="" className="bg-slate-800 text-slate-500">Min</option>
        {minutes.map((m) => (
          <option key={m} value={m} className="bg-slate-800">{m}</option>
        ))}
      </select>
      <select
        className={cn(selectClass, "w-[72px]")}
        value={parsed.period}
        onChange={(e) => update(parsed.hour || "12", parsed.minute || "00", e.target.value)}
      >
        <option value="AM" className="bg-slate-800">AM</option>
        <option value="PM" className="bg-slate-800">PM</option>
      </select>
    </div>
  );
}

export const TimePicker = React.memo(TimePickerComponent);
