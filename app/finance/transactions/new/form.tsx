"use client";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar as CalendarIcon, ArrowLeft, BatteryCharging, ChevronDown, Check } from "lucide-react";
import { NeoButton } from "@/components/ui/neo-button";
import { CategorySelector } from "@/components/category-selector";
import { createTransaction, type Category } from "@/app/actions/transactions";
import { parseInputDate, formatToInputDate } from "@/lib/date-utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Toast } from "@/components/ui/toast";
import { TransactionType } from "@prisma/client";
import { SourceSelector } from "@/components/source-selector";

interface BankAccountOption {
  id: string;
  name: string;
  type: string;
  balance: number;
}

interface Vehicle {
  id: string;
  brand: string;
  model: string;
}

interface TransactionFormProps {
  categories: Category[];
  recentIds: string[];
  recentAccountIds: string[];
  accounts: BankAccountOption[];
  vehicles: Vehicle[];
  lastOdo?: number;
  fetchData: () => void;
}

export function TransactionForm({
  categories: allCategories,
  recentAccountIds,
  accounts,
  vehicles = [],
  lastOdo = 0,
}: TransactionFormProps) {
  const router = useRouter();
  const [date, setDate] = useState(new Date());
  const [amount, setAmount] = useState("");
  const [type] = useState<TransactionType>(TransactionType.EXPENSE);
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [accountId, setAccountId] = useState<string | undefined>(recentAccountIds[0] || accounts[0]?.id);
  const [vehicleId, setVehicleId] = useState<string | undefined>(vehicles[0]?.id); 
  
  // EV State
  const [odo, setOdo] = useState(lastOdo > 0 ? String(lastOdo + 200) : "");
  const [socIni, setSocIni] = useState("");
  const [socFin, setSocFin] = useState("100");
  const [evOrigin, setEvOrigin] = useState<"Casa" | "Pública Lenta" | "Pública Rápida">("Casa");
  const [kwhGrid, setKwhGrid] = useState("");

  const todayStr = formatToInputDate(new Date());

  useEffect(() => {
    const isRecarga = allCategories.find(c => c.id === categoryId)?.name?.toLowerCase() === "recarga";
    if (amount && isRecarga) {
      setKwhGrid((Number(amount) / (evOrigin === "Casa" ? 900 : 1800)).toFixed(1));
    }
  }, [amount, evOrigin, categoryId, allCategories]);

  useEffect(() => {
    if (evOrigin === "Casa") {
      const energyAcc = accounts.find((a: BankAccountOption) => a.type === "ENERGY");
      if (energyAcc) setAccountId(energyAcc.id);
    }
  }, [evOrigin, accounts]);

  const [isLoading, setIsLoading] = useState(false);
  const [toastState, setToastState] = useState({ message: "", type: "success" as const, visible: false });

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToastState({ message, type, visible: true });
  };

  const handleSubmit = async () => {
    if (!vehicleId || !categoryId || !amount) return showToast("Faltan datos", "error");
    setIsLoading(true);
    try {
      const isRecarga = allCategories.find(c => c.id === categoryId)?.name?.toLowerCase() === "recarga";
      const desc = isRecarga ? `EV:${evOrigin}|Odo:${odo || "0"}|${socIni || "0"}%->${socFin || "0"}%|${kwhGrid || "0"}kWh` : null;
      
      const res = await createTransaction({
        amount: Number(amount), type, categoryId, accountId: accountId || null,
        description: desc, date, vehicleId: vehicleId || null,
        odo: isRecarga ? Number(odo) : null, socIni: isRecarga ? Number(socIni) : null,
        socFin: isRecarga ? Number(socFin) : null, kwhGrid: isRecarga ? Number(kwhGrid) : null,
        evOrigin: isRecarga ? evOrigin : null,
      });

      if (res.success) { showToast("¡Registrado!"); setTimeout(() => router.push("/finance"), 800); }
      else showToast(res.error || "Error", "error");
    } finally { setIsLoading(false); }
  };

  const EV_ORIGINS = [
    { value: "Casa", label: "CASA", icon: "🏠" },
    { value: "Pública Lenta", label: "LENTA", icon: "🔌" },
    { value: "Pública Rápida", label: "RÁPIDA", icon: "⚡" }
  ];

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col font-sans">
      <Toast isVisible={toastState.visible} message={toastState.message} type={toastState.type} onClose={() => setToastState(p => ({ ...p, visible: false }))} />

      <header className="px-5 pt-6 pb-2 flex items-center justify-between">
        <Link href="/finance">
          <NeoButton variant="secondary" className="h-8 px-2 rounded-lg bg-white/5 border-white/5 text-[9px] font-black uppercase">
            <ArrowLeft className="w-3 h-3 mr-1" /> Volver
          </NeoButton>
        </Link>
        <span className="text-[10px] font-black tracking-[0.3em] uppercase opacity-40">Nueva Transacción</span>
        <div className="w-16" />
      </header>

      <div className="flex-1 px-5 flex flex-col gap-6 pt-2 pb-20">
        {/* HERO SECTION: VEHICLE, AMOUNT, DATE */}
        <section className="bg-white/5 rounded-[3.5rem] border border-white/10 p-8 shadow-2xl relative flex flex-col items-center gap-7">
          {/* Larger Vehicle Dropdown */}
          <div className="w-full max-w-[200px] flex flex-col items-center gap-2">
            <span className="text-[8px] font-black text-primary uppercase tracking-[0.4em] opacity-80">Vehículo Seleccionado</span>
            <div className="relative w-full group">
              <select 
                value={vehicleId} onChange={e => setVehicleId(e.target.value)}
                className="w-full bg-primary/10 border border-primary/20 rounded-2xl h-11 px-5 text-xs font-black text-primary uppercase appearance-none outline-none hover:bg-primary/20 transition-all text-center"
              >
                {vehicles.map(v => <option key={v.id} value={v.id} className="bg-zinc-900">{v.brand} {v.model}</option>)}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40 pointer-events-none" />
            </div>
          </div>

          {/* Centered Large Amount */}
          <div className="flex flex-col items-center gap-1.5">
            <div className="flex items-center justify-center">
              <span className="text-4xl font-black text-primary/40 mr-2">$</span>
              <input
                type="text" inputMode="numeric" placeholder="0"
                value={amount ? Number(amount).toLocaleString('es-US') : ""}
                onChange={e => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
                className="bg-transparent border-none p-0 text-7xl font-black text-white outline-none placeholder:text-white/5 text-center w-full max-w-[300px] tracking-tighter"
              />
            </div>
          </div>

          {/* Centered Date Bar and Buttons */}
          <div className="w-full flex flex-col items-center gap-5">
            <div className="w-full h-px bg-white/5" />
            
            <div className="flex flex-col items-center gap-4 w-full">
              {/* Centered Date Label */}
              <div className="relative flex items-center gap-3 bg-white/5 px-5 py-2.5 rounded-2xl border border-white/5 group cursor-pointer hover:bg-white/10 transition-all">
                <CalendarIcon className="w-4 h-4 text-primary" />
                <span className="text-[12px] font-black uppercase tracking-wider text-white/90">{format(date, "EEEE, dd MMMM")}</span>
                <input 
                  type="date" max={todayStr} value={formatToInputDate(date)} 
                  onChange={e => setDate(parseInputDate(e.target.value))}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>

              {/* Centered Quick Date Buttons */}
              <div className="flex gap-2">
                {["Hoy", "Ayer"].map((l, i) => {
                  const d2 = i === 0 ? new Date() : new Date(new Date().setDate(new Date().getDate() - 1));
                  const active = formatToInputDate(date) === formatToInputDate(d2);
                  return (
                    <button key={l} onClick={() => setDate(d2)} className={cn(
                      "px-6 h-9 rounded-xl text-[10px] font-black uppercase transition-all shadow-lg", 
                      active ? "bg-primary text-black scale-105 shadow-primary/20" : "bg-white/5 text-white/40 border border-white/5"
                    )}>{l}</button>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Categories (Horizontal) */}
        <section className="flex flex-col gap-3">
          <span className="text-[9px] font-black uppercase tracking-widest text-white/30 ml-3">Categoría</span>
          <CategorySelector categories={allCategories.filter(c => c.type === type)} selectedId={categoryId} onSelect={setCategoryId} />
        </section>

        {/* Funding Source */}
        <section className="flex flex-col gap-3">
          <span className="text-[9px] font-black uppercase tracking-widest text-white/30 ml-3">Fuente de Fondos</span>
          <SourceSelector accounts={accounts} selectedAccountId={accountId} onAccountChange={setAccountId} />
        </section>

        {/* EV RECHARGE - UPDATED WITH TOGGLE BUTTONS */}
        {allCategories.find(c => c.id === categoryId)?.name?.toLowerCase() === "recarga" && (
          <section className="bg-emerald-500/10 rounded-[3rem] border border-emerald-500/20 p-8 flex flex-col gap-7 shadow-xl">
            <div className="flex items-center gap-2 border-b border-emerald-500/10 pb-4">
               <BatteryCharging className="w-5 h-5 text-emerald-500" />
               <h3 className="text-[11px] font-black text-emerald-500 uppercase tracking-[0.4em]">Detalles de Recarga</h3>
            </div>

            {/* EV Origin Toggle Buttons */}
            <div className="flex flex-col gap-2.5">
              <span className="text-[9px] font-black text-white/40 uppercase tracking-widest ml-1">Tipo de Estación</span>
              <div className="grid grid-cols-3 gap-2">
                {EV_ORIGINS.map(org => {
                  const isSelected = evOrigin === org.value;
                  return (
                    <button
                      key={org.value}
                      onClick={() => setEvOrigin(org.value as "Casa" | "Pública Lenta" | "Pública Rápida")}
                      className={cn(
                        "relative flex flex-col items-center justify-center gap-3 h-28 rounded-3xl border transition-all duration-300",
                        isSelected 
                          ? "bg-emerald-500 border-emerald-400 text-black shadow-xl shadow-emerald-500/30 scale-[1.05]" 
                          : "bg-black/40 border-white/5 text-white/40 hover:bg-white/5"
                      )}
                    >
                      <span className="text-3xl">{org.icon}</span>
                      <span className="text-[10px] font-black uppercase tracking-wider">{org.label}</span>
                      {isSelected && <Check className="w-4 h-4 absolute top-3 right-3" />}
                    </button>
                  )
                })}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-x-5 gap-y-5">
              {[
                { l: "Odómetro (km)", v: odo, s: setOdo, p: String(lastOdo+200) },
                { l: "Energía (kWh)", v: kwhGrid, s: setKwhGrid, p: "0.0", h: true },
                { l: "SOC Inicial %", v: socIni, s: setSocIni, p: "20" },
                { l: "SOC Final %", v: socFin, s: setSocFin, p: "100" },
              ].map(f => (
                <div key={f.l} className="flex flex-col gap-2 transition-all">
                  <span className="text-[9px] font-black text-white/40 uppercase ml-1">{f.l}</span>
                  <input 
                    type="text" value={f.v} onChange={e => f.s(e.target.value.replace(/[^0-9.]/g, ""))} 
                    className={cn(
                      "bg-black/40 border border-white/10 h-12 rounded-2xl px-4 text-xs font-bold outline-none focus:border-emerald-500/50", 
                      f.h && "text-emerald-400 border-emerald-500/40 font-black shadow-inner"
                    )} 
                    placeholder={f.p}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="pt-4 pb-10">
          <NeoButton
            className="w-full h-16 rounded-[2.5rem] bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-black uppercase tracking-[0.5em] shadow-2xl active:scale-[0.96] transition-all"
            onClick={handleSubmit} disabled={isLoading}
          >
            {isLoading ? "PROCESANDO..." : "REGISTRAR GASTO"}
          </NeoButton>
        </div>
      </div>
    </div>
  );
}
