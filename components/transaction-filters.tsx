"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const dateFilters = [
  { id: "all", label: "Todo" },
  { id: "3days", label: "3 Días" },
  { id: "week", label: "Semana" },
  { id: "month", label: "Mes" },
  { id: "custom", label: "Rango" },
];

export function TransactionFilters({
  categories,
  accounts,
  vehicles = [],
}: {
  categories: { id: string; name: string; type: string }[];
  accounts: { id: string; name: string }[];
  vehicles?: { id: string; brand: string; model: string }[];
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const currentFilter = searchParams.get("filter") || "all";
  const currentCategory = searchParams.get("category") || "ALL";
  const currentAccount = searchParams.get("account") || "ALL";
  
  const currentVehicle = searchParams.get("vehicleId") || "ALL";

  const from = searchParams.get("from") || format(new Date(), "yyyy-MM-dd");
  const to = searchParams.get("to") || format(new Date(), "yyyy-MM-dd");

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);

    if (value === "ALL" || value === "all") {
      params.delete(key);
    } else {
      params.set(key, value);
    }

    if (key === "filter" && value !== "custom") {
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
      {/* Date Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
        {dateFilters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => setParam("filter", filter.id)}
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

      {/* Vehicle Selector - Primary */}
      <div className="relative">
        <select
          value={currentVehicle}
          onChange={(e) => setParam("vehicleId", e.target.value)}
          className={cn(
            "w-full bg-white/5 border border-white/10 rounded-xl px-4 h-12 text-sm font-bold outline-none appearance-none cursor-pointer transition-all hover:bg-white/10",
            currentVehicle === "ALL" && "border-primary/50 bg-primary/5 shadow-lg shadow-primary/5"
          )}
        >
          {vehicles.map((v) => (
            <option key={v.id} value={v.id} className="bg-black text-white">
              {v.brand.toUpperCase()} {v.model.toUpperCase()}
            </option>
          ))}
          <option value="ALL" className="bg-black text-white">
            TODOS LOS VEHÍCULOS
          </option>
        </select>
        <span className="absolute -top-1.5 left-3 px-1 bg-black text-[7px] font-black text-primary uppercase tracking-widest border border-white/5 rounded-sm">
          Vehículo Requerido
        </span>
      </div>

      {/* Selects: Category, Account - Dependent on Vehicle */}
      <div className="grid grid-cols-2 gap-2 transition-all duration-300">
        <div className="relative">
          <select
            value={currentCategory}
            onChange={(e) => setParam("category", e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-2 h-10 text-[9px] font-bold outline-none appearance-none cursor-pointer hover:bg-white/10"
          >
            <option value="ALL" className="bg-black text-white">
              TODAS LAS CATEGORÍAS
            </option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id} className="bg-black text-white">
                {cat.name.toUpperCase()}
              </option>
            ))}
          </select>
          <span className="absolute -top-1.5 left-2 px-1 bg-black text-[7px] font-black text-muted-foreground uppercase tracking-widest border border-white/5 rounded-sm">
            Categoría
          </span>
        </div>

        <div className="relative">
          <select
            value={currentAccount}
            onChange={(e) => setParam("account", e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-2 h-10 text-[9px] font-bold outline-none appearance-none cursor-pointer hover:bg-white/10"
          >
            <option value="ALL" className="bg-black text-white">
              TODAS LAS CUENTAS
            </option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id} className="bg-black text-white">
                {acc.name.toUpperCase()}
              </option>
            ))}
          </select>
          <span className="absolute -top-1.5 left-2 px-1 bg-black text-[7px] font-black text-muted-foreground uppercase tracking-widest border border-white/5 rounded-sm">
            Cuenta
          </span>
        </div>
      </div>
    </div>
  );
}
