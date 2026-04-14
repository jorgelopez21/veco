"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale/es";
import { cn, formatCurrency } from "@/lib/utils";
import { Zap, Calendar, TrendingUp, Info, ChevronDown } from "lucide-react";
import { NeoCard } from "@/components/ui/neo-card";
import { getEVStatsInRange } from "@/app/actions/transactions";
import { NeoButton } from "@/components/ui/neo-button";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";

interface EVTransaction {
  id: string;
  amount: number;
  description: string | null;
  date: Date | string;
}

interface ProcessedEVTransaction extends EVTransaction {
  deltaSOC: number;
  kwhProp: number;
  kwhReal: number;
  efficiency: number;
  odo: number;
  distSinceLast: number;
  note: string;
}

interface EVStatsData {
  total: number;
  count: number;
  transactions: EVTransaction[];
}

interface EVStatsClientProps {
  vehicles: { id: string; brand: string; model: string; batteryCapacity: number; degradation: number }[];
  initialStats: EVStatsData;
}

export function EVStatsClient({
  vehicles = [],
  initialStats,
}: EVStatsClientProps) {
  const [loading, setLoading] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(
    vehicles[0]?.id || ""
  );

  const today = format(new Date(), "yyyy-MM-dd");
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    return format(new Date(d.getFullYear(), d.getMonth(), 1), "yyyy-MM-dd");
  });
  const [dateTo, setDateTo] = useState(today);

  const [isAsc, setIsAsc] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  
  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);
  const battCapacity = useMemo(() => {
    const nominal = selectedVehicle?.batteryCapacity || 56.1;
    const deg = Number(selectedVehicle?.degradation || 0);
    return nominal * (1 - deg / 100);
  }, [selectedVehicle]);

  const [stats, setStats] = useState<EVStatsData>(initialStats);

  const fetchData = useCallback(async () => {
    // Rely on EV: prefix primarily, allow selectedCategoryId to be optional or used later for filtering
    setLoading(true);
    try {
      const from = new Date(dateFrom + "T00:00:00");
      const to = new Date(dateTo + "T23:59:59");
      const data = await getEVStatsInRange(from, to, selectedVehicleId);
      setStats(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, selectedVehicleId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const processed: ProcessedEVTransaction[] = stats.transactions.map((tx) => {
    const desc = tx.description || "";
    const parts = desc.split("|");

    const socPart = parts.find((p: string) => p.includes("%"));
    let deltaSOC = 0;
    let kwhProp = 0;
    let efficiency = 0;

    if (socPart) {
      const [ini, fin] = socPart
        .replace("%", "")
        .split("->")
        .map((v: string) => parseInt(v || "0"));
      deltaSOC = (fin || 0) - (ini || 0);
      kwhProp = (deltaSOC * battCapacity) / 100;
    }

    const kwhReal = parseFloat(
      parts.find((p: string) => p.includes("kWh"))?.replace("kWh", "") || "0",
    );
    efficiency = kwhReal > 0 ? (kwhProp / kwhReal) * 100 : 0;

    const odo = parseInt(
      parts.find((p: string) => p.includes("Odo:"))?.replace("Odo:", "") || "0",
    );

    return {
      ...tx,
      deltaSOC,
      kwhProp,
      kwhReal,
      efficiency,
      odo,
      distSinceLast: 0,
      note: parts
        .filter(
          (p) =>
            !p.includes("EV:") &&
            !p.includes("Odo:") &&
            !p.includes("%->") &&
            !p.includes("kWh"),
        )
        .join("|")
        .trim(),
    };
  });

  const displayList = isAsc ? [...processed].reverse() : processed;

  const sorted = [...processed].sort(
    (a, b) => {
      const timeA = new Date(a.date).getTime();
      const timeB = new Date(b.date).getTime();
      if (timeA !== timeB) return timeA - timeB;
      return a.id.localeCompare(b.id);
    }
  );
  sorted.forEach((tx, i) => {
    if (i > 0 && tx.odo > 0 && sorted[i - 1].odo > 0) {
      tx.distSinceLast = tx.odo - sorted[i - 1].odo;
    }
  });

  const validProcessed = sorted.filter((p) => p.kwhReal > 0);
  const totalKwhReal = validProcessed.reduce(
    (acc: number, p) => acc + p.kwhReal,
    0,
  );
  const totalKwhProp = validProcessed.reduce(
    (acc: number, p) => acc + p.kwhProp,
    0,
  );
  const avgEfficiency = totalKwhReal > 0 ? (totalKwhProp / totalKwhReal) * 100 : 0;

  const validOdos = sorted.map((p) => p.odo).filter((o) => o > 0);
  const totalDist =
    validOdos.length > 1 ? Math.max(...validOdos) - Math.min(...validOdos) : 0;

  // For average consumption, we sum the energy of all recharges AFTER the first one,
  // because each recharge energy (kwhReal) covers the distance since the PREVIOUS recharge.
  const kwhForConsumption = sorted.slice(1).reduce((acc, p) => acc + p.kwhReal, 0);

  const avgConsumption =
    totalDist > 0 ? (kwhForConsumption / (totalDist / 100)).toFixed(2) : "0";

  const getRechargeType = (tx: ProcessedEVTransaction) => {
    const text = (tx.description + " " + tx.note).toLowerCase();
    
    // Fast keywords
    const fastKeywords = ["rapida", "rápida", "fast", "supercharger", "terpel", "pwr", "celsia", "voltex", "blink", "evsy", "electrolinera"];
    if (fastKeywords.some(k => text.includes(k))) return "rapida";
    
    // Home keywords (using word boundaries to avoid matching things like "Casablanca")
    const isHome = /\bcasa\b/.test(text) || /\bhome\b/.test(text) || text.includes("wallbox") || text.includes("domicilio");
    
    // Slow Public keywords
    const isPublic = text.includes("publica") || text.includes("pública") || text.includes("punto") || text.includes("comercial") || text.includes("mall") || text.includes("parqueadero");
    
    if (isHome && !isPublic) return "casa";
    if (isPublic || text.includes("lenta")) return "lenta";
    
    // Default to casa if it has the keyword, otherwise lenta
    return isHome ? "casa" : "lenta";
  };

  const chartData = useMemo(() => {
    return sorted
      .filter((tx) => tx.kwhReal > 0)
      .map((tx) => {
        return {
          id: tx.id,
          dateLabel: format(new Date(tx.date), "dd/MM"),
          efficiency: tx.efficiency,
          type: getRechargeType(tx),
          rawDate: tx.date,
        };
      })
      .slice(-14);
  }, [sorted]);

  return (
    <div className={cn(
      "flex flex-col gap-6 animate-in fade-in duration-500 transition-opacity",
      loading && "opacity-50 pointer-events-none"
    )}>
      <NeoCard className="p-4 bg-white/5 border-white/10 rounded-[2rem] flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">
            Vehículo
          </label>
          <select
            value={selectedVehicleId}
            onChange={(e) => setSelectedVehicleId(e.target.value)}
            className="w-full bg-black/40 border-none rounded-2xl px-4 h-12 text-sm font-bold text-white outline-none focus:ring-1 ring-primary/30 appearance-none"
          >
            <option value="" disabled>
              Selecciona un vehículo
            </option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.brand} {v.model}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">
              Desde
            </label>
            <div className="relative">
              <input
                type="date"
                value={dateFrom}
                max={today}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full bg-black/40 border-none rounded-2xl px-4 h-12 text-xs font-bold text-white outline-none focus:ring-1 ring-primary/30 appearance-none"
              />
              <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">
              Hasta
            </label>
            <div className="relative">
              <input
                type="date"
                value={dateTo}
                max={today}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full bg-black/40 border-none rounded-2xl px-4 h-12 text-xs font-bold text-white outline-none focus:ring-1 ring-primary/30 appearance-none"
              />
              <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 pt-2 border-t border-white/5">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              Degradación (SOH)
            </span>
            <span className="text-sm font-black text-emerald-500">
              {Number(selectedVehicle?.degradation || 0)}%
            </span>
          </div>
          
          <div className="flex flex-col gap-1 bg-black/40 p-3 rounded-2xl">
            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">
              Capacidad Real
            </span>
            <div className="flex items-center justify-between">
              <span className="text-xl font-black text-white">
                {battCapacity.toFixed(1)} <span className="text-xs text-muted-foreground font-medium">kWh</span>
              </span>
              <span className="text-[9px] font-bold text-muted-foreground italic">
                Nominal: {selectedVehicle?.batteryCapacity || 56.1} kWh
              </span>
            </div>
          </div>
        </div>
      </NeoCard>

      {validProcessed.length > 0 ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            <NeoCard className="p-4 bg-emerald-500/5 border-emerald-500/10 rounded-[2rem] flex flex-col gap-1">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-emerald-500" />
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                  Energía Red
                </span>
              </div>
              <span className="text-2xl font-black text-white">
                {totalKwhReal.toFixed(1)}{" "}
                <span className="text-sm font-medium text-muted-foreground ml-1.5">
                  kWh
                </span>
              </span>
              <span className="text-[9px] font-bold text-muted-foreground uppercase">
                Consumidos de la red
              </span>
            </NeoCard>

            <NeoCard className="p-4 bg-blue-500/5 border-blue-500/10 rounded-[2rem] flex flex-col gap-1">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">
                  Eficiencia
                </span>
              </div>
              <span className="text-2xl font-black text-white">
                {avgEfficiency.toFixed(1)}
                <span className="text-sm font-medium text-muted-foreground ml-1.5">
                  %
                </span>
              </span>
              <span className="text-[9px] font-bold text-muted-foreground uppercase">
                Promedio del sistema
              </span>
            </NeoCard>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <NeoCard className="p-4 bg-purple-500/5 border-purple-500/10 rounded-[2rem] flex flex-col gap-1">
              <div className="flex items-center gap-2 mb-1">
                <Info className="w-4 h-4 text-purple-500" />
                <span className="text-[10px] font-black text-purple-500 uppercase tracking-widest">
                  Recorrido
                </span>
              </div>
              <span className="text-2xl font-black text-white">
                {totalDist}
                <span className="text-sm font-medium text-muted-foreground ml-1.5">
                  km
                </span>
              </span>
              <span className="text-[9px] font-bold text-muted-foreground uppercase">
                Distancia en el rango
              </span>
            </NeoCard>

            <NeoCard className="p-4 bg-primary/5 border-primary/10 rounded-[2rem] flex flex-col gap-1">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-[10px] font-black text-primary uppercase tracking-widest">
                  Consumo
                </span>
              </div>
              <span className="text-2xl font-black text-white">
                {avgConsumption}
                <span className="text-sm font-medium text-muted-foreground ml-1.5">
                  kWh/100
                </span>
              </span>
              <span className="text-[9px] font-bold text-muted-foreground uppercase">
                Promedio de eficiencia
              </span>
            </NeoCard>
          </div>

          <NeoCard className="p-4 bg-amber-500/5 border-amber-500/10 rounded-[2rem] flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">
                Inversión Total
              </span>
              <span className="text-2xl font-black text-white">
                {formatCurrency(stats.total)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block">
                Costo / kWh
              </span>
              <span className="text-sm font-bold text-amber-500">
                ~{formatCurrency(stats.total / (totalKwhReal || 1))}
              </span>
            </div>
          </NeoCard>
          
          {chartData.length > 0 && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                  Eficiencia de Recarga
                </h3>
                <div className="flex gap-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-[#10b981]" />
                    <span className="text-[10px] font-black text-muted-foreground uppercase">Casa</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-[#f43f5e]" />
                    <span className="text-[10px] font-black text-muted-foreground uppercase">Rápida</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-[#f59e0b]" />
                    <span className="text-[10px] font-black text-muted-foreground uppercase">Lenta</span>
                  </div>
                </div>
              </div>
              <div className="h-56 w-full bg-white/5 rounded-3xl p-4 border border-white/5 relative group">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.03)" />
                    <XAxis
                      dataKey="id"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#999", fontSize: 10, fontWeight: 900 }}
                      tickFormatter={(id) => chartData.find(d => d.id === id)?.dateLabel || ""}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      domain={[0, 120]}
                      tick={{ fill: "#999", fontSize: 10, fontWeight: 900 }}
                      label={{ 
                        value: 'Eficiencia (%)', 
                        angle: -90, 
                        position: 'insideLeft',
                        offset: 10,
                        style: { fill: '#999', fontSize: 10, fontWeight: 900, textTransform: 'uppercase' }
                      }}
                    />
                    <Tooltip
                      cursor={{ fill: "rgba(255,255,255,0.05)" }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          const color = data.type === 'casa' ? '#10b981' : data.type === 'rapida' ? '#f43f5e' : '#f59e0b';
                          return (
                            <div className="bg-zinc-900/95 backdrop-blur-md border border-white/10 p-3 rounded-2xl shadow-2xl">
                              <div className="flex items-center justify-between gap-4 mb-2">
                                <p className="text-[10px] font-black text-white/40 uppercase">
                                  {data.date}
                                </p>
                                <span className={cn(
                                  "text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter",
                                  data.type === 'casa' ? "bg-emerald-500/20 text-emerald-400" : 
                                  data.type === 'rapida' ? "bg-rose-500/20 text-rose-400" : 
                                  "bg-amber-500/20 text-amber-400"
                                )}>
                                  {data.type}
                                </span>
                              </div>
                              <p className="text-2xl font-black" style={{ color }}>
                                {Number(payload[0].value).toFixed(1)}
                                <span className="text-xs ml-1 opacity-50 text-white font-black">
                                  %
                                </span>
                              </p>
                              <div className="mt-2 pt-2 border-t border-white/5 flex flex-col gap-1">
                                {data.efficiency > 100 ? (
                                  <p className="text-[9px] font-bold text-rose-400 uppercase">
                                    ⚠️ Anormal (&gt;100%)
                                  </p>
                                ) : data.efficiency > 90 ? (
                                  <p className="text-[9px] font-bold text-emerald-400 uppercase">
                                    Excelencia Óptima
                                  </p>
                                ) : (
                                  <p className="text-[9px] font-bold text-amber-400 uppercase">
                                    Pérdida por calor/clima
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar
                      dataKey="efficiency"
                      radius={[4, 4, 4, 4]}
                      barSize={16}
                    >
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            entry.type === 'casa' ? "#10b981" : 
                            entry.type === 'rapida' ? "#f43f5e" : 
                            "#f59e0b"
                          }
                          fillOpacity={0.8}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                Historial de Recargas
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsAsc(!isAsc)}
                  className="text-[9px] font-black uppercase tracking-widest text-primary flex items-center gap-1.5 py-1 px-2.5 bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
                  title={isAsc ? "Ver más nuevas primero" : "Ver más antiguas primero"}
                >
                  {isAsc ? "Antiguas" : "Recientes"}
                </button>
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="w-7 h-7 flex items-center justify-center bg-white/5 rounded-lg text-muted-foreground transition-all duration-300"
                  style={{
                    transform: showHistory ? "rotate(180deg)" : "rotate(0deg)",
                  }}
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>

            <AnimatePresence>
              {showHistory && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="flex flex-col gap-2 pb-10">
                    {displayList.map((tx) => (
                      <NeoCard
                        key={tx.id}
                        className="p-3 bg-white/5 border-white/5 rounded-2xl flex flex-col gap-2"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] font-black text-primary uppercase tracking-widest">
                              {format(new Date(tx.date), "PPP", { locale: es })}
                            </span>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-xs font-bold text-white">
                                {tx.description?.split("|")[0].replace("EV:", "")}
                              </p>
                              <span className={cn(
                                "text-[7px] font-black px-1 py-0.5 rounded uppercase tracking-tighter opacity-80",
                                getRechargeType(tx) === 'casa' ? "bg-emerald-500/20 text-emerald-400" : 
                                getRechargeType(tx) === 'rapida' ? "bg-rose-500/20 text-rose-400" : 
                                "bg-amber-500/20 text-amber-400"
                              )}>
                                {getRechargeType(tx)}
                              </span>
                              {tx.note && (
                                <span className="text-[10px] text-muted-foreground font-medium italic">
                                  • {tx.note}
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="text-sm font-black text-emerald-400">
                            {formatCurrency(tx.amount)}
                          </span>
                        </div>

                        <div className="grid grid-cols-4 gap-2 pt-2 border-t border-white/5">
                          <div className="flex flex-col">
                            <span className="text-[8px] font-black text-muted-foreground uppercase leading-none mb-1">
                              Odo
                            </span>
                            <span className="text-[10px] font-bold text-white tabular-nums">
                              {tx.odo.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[8px] font-black text-muted-foreground uppercase leading-none mb-1">
                              SOC Δ
                            </span>
                            <span className="text-[10px] font-bold text-white">
                              +{tx.deltaSOC}%
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[8px] font-black text-muted-foreground uppercase leading-none mb-1">
                              Energía
                            </span>
                            <span className="text-[10px] font-bold text-white">
                              {tx.kwhReal.toFixed(1)}
                              <span className="text-[7px] ml-0.5 opacity-50 uppercase font-black">
                                kWh
                              </span>
                            </span>
                          </div>
                          <div className="flex flex-col text-right">
                            <span className="text-[8px] font-black text-muted-foreground uppercase leading-none mb-1">
                              Efic.
                            </span>
                            <span
                              className={cn(
                                "text-[10px] font-bold",
                                tx.efficiency > 90
                                  ? "text-emerald-400"
                                  : "text-amber-400",
                              )}
                            >
                              {tx.efficiency.toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      </NeoCard>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {!showHistory && (
              <NeoButton
                variant="secondary"
                className="w-full bg-white/5 border-white/5 text-[9px] font-black uppercase tracking-widest h-10 rounded-xl"
                onClick={() => setShowHistory(true)}
              >
                Ver Historial Completo
              </NeoButton>
            )}
          </div>
        </>
      ) : (
        <NeoCard className="p-12 bg-white/5 border-white/10 rounded-[2rem] flex flex-col items-center justify-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
            <Info className="w-8 h-8 text-muted-foreground/30" />
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-sm font-bold text-white uppercase tracking-tight">
              Sin datos para este periodo
            </p>
            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">
              Asegúrate de registrar las cargas usando el prefijo &quot;EV:&quot;
            </p>
          </div>
        </NeoCard>
      )}
    </div>
  );
}
