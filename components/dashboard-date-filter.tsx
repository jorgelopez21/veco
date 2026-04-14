"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const filters = [
  { id: "3days", label: "3 Días" },
  { id: "week", label: "Semana" },
  { id: "month", label: "Mes" },
  { id: "custom", label: "Rango" },
];

export function DashboardDateFilter() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const currentFilter = searchParams.get("filter") || "month";
  const today = format(new Date(), "yyyy-MM-dd");
  const from = searchParams.get("from") || today;
  const to = searchParams.get("to") || today;

  const setFilter = (id: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("filter", id);
    if (id !== "custom") {
      params.delete("from");
      params.delete("to");
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleDateChange = (key: "from" | "to", value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set(key, value);
    params.set("filter", "custom");
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
        {filters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => setFilter(filter.id)}
            className={cn(
              "whitespace-nowrap px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border",
              currentFilter === filter.id
                ? "bg-primary text-black border-primary shadow-lg shadow-primary/20"
                : "bg-white/5 text-muted-foreground border-white/10 hover:bg-white/10",
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {currentFilter === "custom" && (
        <div className="flex gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex-1 relative group">
            <input
              type="date"
              value={from}
              max={today}
              onChange={(e) => handleDateChange("from", e.target.value)}
              style={{ colorScheme: "dark" }}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 h-10 text-[10px] font-bold outline-none focus:ring-1 ring-primary/30 transition-all hover:bg-white/10"
            />
            <span className="absolute -top-1.5 left-2 px-1 bg-black text-[7px] font-black text-muted-foreground uppercase tracking-widest border border-white/5 rounded-sm">
              Desde
            </span>
          </div>
          <div className="flex-1 relative group">
            <input
              type="date"
              value={to}
              max={today}
              onChange={(e) => handleDateChange("to", e.target.value)}
              style={{ colorScheme: "dark" }}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 h-10 text-[10px] font-bold outline-none focus:ring-1 ring-primary/30 transition-all hover:bg-white/10"
            />
            <span className="absolute -top-1.5 left-2 px-1 bg-black text-[7px] font-black text-muted-foreground uppercase tracking-widest border border-white/5 rounded-sm">
              Hasta
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
