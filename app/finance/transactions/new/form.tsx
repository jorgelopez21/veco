"use client";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar as CalendarIcon, ArrowLeft, BatteryCharging, ChevronDown } from "lucide-react";
import { NeoButton } from "@/components/ui/neo-button";
import { CategorySelector } from "@/components/category-selector";
import { SourceSelector } from "@/components/source-selector";
import Link from "next/link";
import {
  createTransaction,
  type Category,
} from "@/app/actions/transactions";
import { Toast } from "@/components/ui/toast";
import { TransactionType } from "@prisma/client";
import { parseInputDate, formatToInputDate } from "@/lib/date-utils";

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
  batteryCapacity: number;
  degradation: number;
}

interface EVStats {
  total: number;
  count: number;
  transactions: {
    id: string;
    amount: number;
    description: string | null;
    date: string;
  }[];
}

interface TransactionFormProps {
  categories: Category[];
  recentIds: string[];
  recentAccountIds: string[];
  accounts: BankAccountOption[];
  vehicles: Vehicle[];
  lastOdo?: number;
  evStats?: EVStats;
}

export function TransactionForm({
  categories: allCategories,
  recentIds,
  recentAccountIds,
  accounts,
  vehicles = [],
  lastOdo = 0,
}: TransactionFormProps) {
  const router = useRouter();
  const dateInputRef = useRef<HTMLInputElement>(null);

  const [amount, setAmount] = useState("");
  const [type] = useState<TransactionType>(TransactionType.EXPENSE);
  const [categoryId, setCategoryId] = useState<string | undefined>(recentIds[0]);
  const [accountId, setAccountId] = useState<string | undefined>(recentAccountIds[0] || accounts[0]?.id);
  const [vehicleId, setVehicleId] = useState<string | undefined>(vehicles[0]?.id);
  const [date, setDate] = useState(new Date());
  const [description, setDescription] = useState("");
  const [isManualKwh, setIsManualKwh] = useState(false);
  
  // EV State
  const [odo, setOdo] = useState(lastOdo > 0 ? String(lastOdo + 200) : "200");
  const [socIni, setSocIni] = useState("");
  const [socFin, setSocFin] = useState("100");
  const [evOrigin, setEvOrigin] = useState<"Casa" | "Pública Lenta" | "Pública Rápida">("Casa");
  const [kwhGrid, setKwhGrid] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [toastState, setToastState] = useState<{ message: string; type: "success" | "error"; visible: boolean }>({ message: "", type: "success", visible: false });

  const currentCategory = allCategories.find(c => c.id === categoryId);
  const isRecarga = currentCategory?.name?.toLowerCase()?.includes("recarga");

  const todayStr = formatToInputDate(new Date());



  // Auto-switch account for Casa charging
  useEffect(() => {
    if (evOrigin === "Casa" && isRecarga) {
      const energyAcc = accounts.find(a => a.type === "ENERGY");
      if (energyAcc) setAccountId(energyAcc.id);
    }
  }, [evOrigin, isRecarga, accounts]);

  const handleSubmit = async () => {
    if (!vehicleId || !categoryId || !amount) {
      setToastState({ message: "Faltan datos obligatorios", type: "error", visible: true });
      return;
    }
    
    setIsLoading(true);
    try {
        const selectedVehicle = vehicles.find(v => v.id === vehicleId);
        const battCap = selectedVehicle?.batteryCapacity || 60;
        
        if (isRecarga) {
          if (Number(odo) !== 0 && Number(odo) < lastOdo) {
            setToastState({ message: `El odómetro no puede retroceder. Último: ${lastOdo}`, type: "error", visible: true });
            setIsLoading(false);
            return;
          }
          if (Number(kwhGrid) > battCap * 2) {
            setToastState({ message: `kWh red no puede superar el 200% de la capacidad (${battCap * 2} kWh)`, type: "error", visible: true });
            setIsLoading(false);
            return;
          }
          if (Number(socIni) > 99) {
             setToastState({ message: "SOC Inicial máximo 99%", type: "error", visible: true });
             setIsLoading(false);
             return;
          }
          if (Number(socFin) > 100) {
             setToastState({ message: "SOC Final máximo 100%", type: "error", visible: true });
             setIsLoading(false);
             return;
          }
        }

        const evData = `EV:${evOrigin}|Odo:${odo || "0"}|${socIni || "0"}%->${socFin || "0"}%|${kwhGrid || "0"}kWh`;
      const finalDesc = isRecarga ? (description ? `${evData} | ${description}` : evData) : (description || null);

      const res = await createTransaction({
        amount: Number(amount),
        type,
        categoryId,
        accountId: accountId || null,
        description: finalDesc,
        date,
        vehicleId: vehicleId || null,
        odo: isRecarga ? Number(odo) : null,
        socIni: isRecarga ? Number(socIni) : null,
        socFin: isRecarga ? Number(socFin) : null,
        kwhGrid: isRecarga ? Number(kwhGrid) : null,
        evOrigin: isRecarga ? evOrigin : null,
      });

      if (res.success) {
        setToastState({ message: "¡Gasto registrado con éxito!", type: "success", visible: true });
        setTimeout(() => router.push("/finance"), 800);
      } else {
        setToastState({ message: res.error || "No se pudo registrar", type: "error", visible: true });
      }
    } catch (e) {
      console.error(e);
      setToastState({ message: "Error inesperado", type: "error", visible: true });
    } finally {
      setIsLoading(false);
    }
  };

  const EV_ORIGINS = [
    { value: "Casa", label: "CASA", icon: "🏠" },
    { value: "Pública Lenta", label: "LENTA", icon: "🔌" },
    { value: "Pública Rápida", label: "RÁPIDA", icon: "⚡" }
  ];

  return (
    <div className="min-h-screen bg-[#060608] text-white flex flex-col font-sans">
      <Toast 
        isVisible={toastState.visible} 
        message={toastState.message} 
        type={toastState.type} 
        onClose={() => setToastState(p=>({...p, visible: false}))} 
      />

      {/* Header */}
      <header className="px-5 pt-8 pb-4 flex items-center justify-between sticky top-0 bg-[#060608]/80 backdrop-blur-xl z-50 border-b border-white/5">
        <Link href="/finance">
          <NeoButton variant="secondary" className="h-9 px-4 rounded-xl bg-white/5 border-white/5 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
            <ArrowLeft className="w-3.5 h-3.5 mr-2" />
            Volver
          </NeoButton>
        </Link>
        <span className="text-[10px] font-black tracking-[0.4em] uppercase opacity-40">Nueva Transacción</span>
        <div className="w-24" />
      </header>

      <div className="flex-1 px-5 flex flex-col gap-10 pt-8 pb-32 max-w-7xl mx-auto w-full">
        
        {/* Vehicle Selection Section */}
        <div className="flex flex-col gap-8">
           <section className="flex flex-col items-center gap-4">
            <span className="text-[10px] font-black text-primary/80 uppercase tracking-[0.5em]">Vehículo Asociado</span>
              <div className="relative w-full max-w-xs group">
                <select 
                  value={vehicleId} onChange={e => setVehicleId(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl h-14 px-6 text-[11px] font-black text-white uppercase appearance-none outline-none hover:bg-white/10 hover:border-primary/30 transition-all text-center shadow-2xl cursor-pointer"
                >
                  {vehicles.map(v => <option key={v.id} value={v.id} className="bg-[#09090b] text-white">{v.brand} {v.model}</option>)}
                </select>
                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-hover:text-primary transition-colors pointer-events-none" />
              </div>
           </section>

           <div className="flex flex-col items-center justify-center p-12 bg-white/[0.03] rounded-[3rem] border border-white/10 shadow-3xl group hover:border-primary/20 transition-all duration-500 focus-within:border-primary/40">
            <span className="text-xs md:text-sm font-black text-primary/70 uppercase tracking-[0.4em] mb-4">Monto a Ingresar</span>
            <div className="flex items-center justify-center w-full">
              <span className="text-3xl font-black text-primary/20 mr-2">$</span>
              <input
                type="text" inputMode="numeric" autoFocus
                value={amount ? Number(amount).toLocaleString('es-US') : ""}
                onChange={e => {
                  const val = e.target.value.replace(/[^0-9]/g, "");
                  if (val.length <= 8) {
                    setAmount(val);
                    if (isRecarga && !isManualKwh) {
                      const divisor = evOrigin === "Casa" ? 950 : 1800;
                      setKwhGrid((Number(val) / divisor).toFixed(1));
                    }
                  }
                }}
                placeholder="0"
                className="bg-transparent border-none p-0 text-6xl md:text-8xl font-black text-white outline-none placeholder:text-white/20 text-center w-full max-w-[350px] md:max-w-[600px] tracking-tighter"
              />
            </div>
            <span className="text-[10px] md:text-xs font-bold text-white/40 mt-4 uppercase tracking-widest">Solo números enteros (Máx 8 dígitos)</span>
          </div>
        </div>

        {/* Categories Section */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center px-4 border-l-2 border-primary/20">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Seleccionar Categoría</span>
          </div>
          <CategorySelector
            categories={allCategories.filter(c => c.type === type)}
            selectedId={categoryId}
            onSelect={setCategoryId}
          />
        </div>

        {/* EV Section (Conditional) */}
        {isRecarga && (
          <div className="max-w-4xl mx-auto w-full animate-in slide-in-from-bottom-4 duration-700">
             <section className="bg-emerald-500/10 rounded-[3.5rem] border border-emerald-500/20 p-10 md:p-14 flex flex-col gap-12 shadow-2xl relative overflow-hidden group/ev">
                <div className="flex items-center gap-6 relative z-10">
                   <div className="w-14 h-14 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/40 group-hover/ev:scale-110 transition-transform">
                      <BatteryCharging className="w-7 h-7 text-black" />
                   </div>
                   <h3 className="text-base font-black text-emerald-500 uppercase tracking-[0.6em]">Energía Eléctrica</h3>
                </div>

                <div className="flex flex-col gap-6 relative z-10">
                  <span className="text-[10px] font-black text-white/50 uppercase tracking-[0.4em] ml-2">Fuente de Carga</span>
                  <div className="grid grid-cols-3 gap-6">
                    {EV_ORIGINS.map(org => {
                      const isSelected = evOrigin === org.value;
                      return (
                        <button key={org.value} type="button" onClick={() => setEvOrigin(org.value as "Casa" | "Pública Lenta" | "Pública Rápida")}
                          className={cn(
                            "relative flex flex-col items-center justify-center gap-4 h-36 rounded-[2.5rem] border transition-all duration-500",
                            isSelected ? "bg-emerald-500 border-emerald-400 text-black shadow-3xl shadow-emerald-500/40 scale-[1.05]" : "bg-black/40 border-white/5 text-white/40 hover:bg-white/10 hover:border-white/10"
                          )}
                        >
                          <span className="text-4xl">{org.icon}</span>
                          <span className="text-[11px] font-black uppercase tracking-[0.2em]">{org.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 relative z-10 pt-4">
                  {[
                    { label: "Odo (KM)", value: odo, setter: setOdo, placeholder: "0", icon: "KM" },
                    { label: "kWh Red", value: kwhGrid, setter: setKwhGrid, placeholder: "0.0", icon: "⚡" },
                    { label: "SOC I %", value: socIni, setter: setSocIni, placeholder: "0", icon: "▼", max: 99 },
                    { label: "SOC F %", value: socFin, setter: setSocFin, placeholder: "100", icon: "▲", max: 100 }
                  ].map(f => (
                    <div key={f.label} className="flex flex-col gap-4">
                      <span className="text-[10px] font-black text-white/60 uppercase tracking-widest ml-2">{f.label}</span>
                      <div className="relative">
                        <input type="text" inputMode="numeric" value={f.value}
                          onChange={e => {
                            let val = e.target.value;
                            if (f.label.includes("kWh")) {
                              val = val.replace(/[^0-9.]/g, "");
                              setIsManualKwh(true);
                            } else {
                              val = val.replace(/[^0-9]/g, "");
                              if (f.max && Number(val) > f.max) val = String(f.max);
                              if (f.label.includes("SOC I") && val.length > 2) val = val.substring(0, 2);
                            }
                            f.setter(val);
                          }}
                          className="w-full bg-black/60 border border-white/10 h-16 rounded-2xl px-6 pr-14 text-sm font-black text-white outline-none focus:border-emerald-500 transition-all shadow-inner" 
                          placeholder={f.placeholder} />
                        <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-white/30 uppercase">{f.icon}</span>
                      </div>
                    </div>
                  ))}
                </div>
             </section>
          </div>
        )}

        {/* Source Selector */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center px-4 border-l-2 border-primary/20">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Origen de Fondos</span>
          </div>
          <SourceSelector
            accounts={accounts}
            selectedAccountId={accountId}
            onAccountChange={setAccountId}
          />
        </div>

        {/* Footer Data Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
           <section className="flex flex-col gap-5 bg-white/[0.02] p-10 rounded-[3rem] border border-white/5 relative group hover:border-primary/20 transition-all">
             <span className="text-[10px] font-black uppercase tracking-widest text-white/50 ml-2">Fecha Registrada</span>
             <div className="flex flex-col xl:flex-row items-center gap-8 w-full">
               <div 
                 className="relative flex items-center gap-5 bg-primary/10 px-8 py-5 rounded-[2rem] border border-primary/20 cursor-pointer overflow-hidden shadow-2xl w-full"
                 onClick={() => dateInputRef.current?.showPicker()}
               >
                 <CalendarIcon className="w-6 h-6 text-primary" />
                 <span className="text-sm font-black uppercase tracking-[0.2em] text-white underline decoration-primary/30 decoration-2 underline-offset-8">
                   {format(date, "EEEE, dd MMMM")}
                 </span>
                 <input 
                   ref={dateInputRef}
                   type="date" max={todayStr} value={formatToInputDate(date)} 
                   onChange={e => setDate(parseInputDate(e.target.value))}
                   className="absolute inset-0 opacity-0 cursor-pointer z-10"
                 />
               </div>
               <div className="flex gap-4 w-full xl:w-auto">
                 {["Hoy", "Ayer"].map((l, i) => {
                   const d2 = i === 0 ? new Date() : new Date(new Date().setDate(new Date().getDate() - 1));
                   const active = formatToInputDate(date) === formatToInputDate(d2);
                   return (
                     <button key={l} onClick={() => setDate(d2)} className={cn(
                       "flex-1 xl:px-10 h-14 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all", 
                       active ? "bg-primary text-black shadow-[0_0_30px_rgba(var(--primary-rgb),0.5)]" : "bg-white/10 text-white/50 border border-white/10 hover:bg-white/20"
                     )}>{l}</button>
                   )
                 })}
               </div>
             </div>
           </section>

           <section className="flex flex-col gap-5 bg-white/[0.05] p-10 rounded-[3rem] border border-white/10 relative group hover:border-primary/40 transition-all">
             <div className="flex items-center justify-between mx-2">
               <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Comentario del Usuario</span>
               <span className="text-[10px] font-black text-rose-500/80 uppercase tracking-widest">{description.length}/20</span>
             </div>
             <div className="relative">
               <input
                 type="text"
                 placeholder="Añadir nota técnica o personal..."
                 value={description}
                 maxLength={20}
                 onChange={(e) => setDescription(e.target.value)}
                 className="w-full bg-black/40 border border-white/5 rounded-[2rem] px-8 h-20 text-sm font-black outline-none focus:border-primary/40 transition-all text-white shadow-inner placeholder:text-white/20"
               />
             </div>
           </section>
        </div>

        <motion.div 
          className="pt-8 flex justify-center pb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <NeoButton
            className="w-full max-w-4xl h-24 rounded-[4rem] bg-emerald-500 hover:bg-emerald-400 text-black text-lg font-black uppercase tracking-[0.8em] shadow-[0_20px_50px_rgba(16,185,129,0.3)] active:scale-[0.98] transition-all duration-300 group relative overflow-hidden"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            <motion.div 
              className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 skew-x-12"
            />
            {isLoading ? (
              <span className="flex items-center gap-3">
                <motion.span 
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  className="w-5 h-5 border-2 border-black border-t-transparent rounded-full"
                />
                CONECTANDO...
              </span>
            ) : "REGISTRAR TRANSACCIÓN"}
          </NeoButton>
        </motion.div>
      </div>
    </div>
  );
}
