"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar as CalendarIcon, ArrowLeft, Trash2 } from "lucide-react";
import { NeoButton } from "@/components/ui/neo-button";
import { NeoCard } from "@/components/ui/neo-card";
import { TransactionTypeToggle } from "@/components/transaction-type-toggle";
import { CategorySelector } from "@/components/category-selector";
import Link from "next/link";
import {
  updateTransaction,
  getEVStatsInRange,
  type Category,
} from "@/app/actions/transactions";
import { deleteTransaction } from "@/app/actions/delete-transaction";
import { Toast } from "@/components/ui/toast";
import { ConfirmToast } from "@/components/ui/confirm-toast";
import { TransactionType } from "@prisma/client";
import { SourceSelector } from "@/components/source-selector";
import { parseInputDate, formatToInputDate } from "@/lib/date-utils";

interface EVTransaction {
  id: string;
  amount: number;
  description: string | null;
  date: Date | string;
}

interface BankAccountOption {
  id: string;
  name: string;
  type: string;
  balance: number;
}

interface EditTransactionFormProps {
  id: string;
  transaction: {
    amount: number;
    type: string;
    categoryId?: string | null;
    accountId?: string | null;
    description?: string | null;
    date: string | Date;
    source?: string;
  };
  categories: Category[];
  recentIds: string[];
  recentAccountIds: string[];
  accounts: BankAccountOption[];
  evStats?: number | { total: number; count: number; transactions: EVTransaction[] };
}

export function EditTransactionForm({
  id,
  transaction,
  categories: allCategories,
  recentIds,
  recentAccountIds,
  accounts,
  evStats = 0,
}: EditTransactionFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from");
  const redirectTarget =
    from === "activity" ? "/finance/transactions" : "/finance";

  const [amount, setAmount] = useState(transaction.amount.toString());
  const [description, setDescription] = useState(transaction.description || "");
  const [type, setType] = useState<TransactionType>(
    transaction.type as TransactionType,
  );
  const [categoryId, setCategoryId] = useState<string | undefined>(
    transaction.categoryId || undefined,
  );
  const [accountId, setAccountId] = useState<string | undefined>(
    transaction.accountId || accounts?.[0]?.id,
  );
  const [targetDebt, setTargetDebt] = useState<string | null>(
    accounts
      .find(
        (acc) =>
          acc.type === "CREDIT" &&
          acc.name.toUpperCase() ===
            (transaction.description || "").toUpperCase(),
      )
      ?.name.toUpperCase() || null,
  );
  const [date, setDate] = useState(new Date(transaction.date));

  const [billingPeriodStart, setBillingPeriodStart] = useState<string>(() => {
    const d = new Date();
    return format(new Date(d.getFullYear(), d.getMonth() - 1, 1), "yyyy-MM-dd");
  });
  const [billingPeriodEnd, setBillingPeriodEnd] = useState<string>(() => {
    const d = new Date();
    return format(new Date(d.getFullYear(), d.getMonth(), 0), "yyyy-MM-dd");
  });
  const [splitEpm, setSplitEpm] = useState(false);
  const [evStatsData, setEvStatsData] = useState<{
    total: number;
    count: number;
    transactions: EVTransaction[];
  }>(() => {
    if (evStats && typeof evStats === "object") return evStats;
    return { total: Number(evStats) || 0, count: 0, transactions: [] };
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // EV Charging State
  const [isEV, setIsEV] = useState(false);
  const [odo, setOdo] = useState("");
  const [socIni, setSocIni] = useState("");
  const [socFin, setSocFin] = useState("100");
  const [evOrigin, setEvOrigin] = useState<
    "Casa" | "Pública Lenta" | "Pública Rápida"
  >("Casa");
  const [kwhGrid, setKwhGrid] = useState("");

  useEffect(() => {
    if (transaction.description?.includes("EV:")) {
      setIsEV(true);
      const descLine = transaction.description;
      const parts = descLine.split("|");

      const evTag = parts.find((p) => p.includes("EV:"));
      if (evTag) {
        const origin = evTag.replace("EV:", "").trim();
        if (
          origin === "Casa" ||
          origin === "Pública Lenta" ||
          origin === "Pública Rápida"
        ) {
          setEvOrigin(origin);
        }
      }

      const odoPart = parts.find((p) => p.includes("Odo:"));
      if (odoPart) setOdo(odoPart.replace("Odo:", ""));

      const socPart = parts.find((p) => p.includes("%->"));
      if (socPart) {
        const cleanSoc = socPart.replace("%", "").trim();
        const [ini, fin] = cleanSoc.split("->");
        setSocIni(ini);
        setSocFin(fin.replace("%", ""));
      }

      const kwhPart = parts.find((p) => p.includes("kWh"));
      if (kwhPart) setKwhGrid(kwhPart.replace("kWh", "").trim());

      // Try to extract the original description
      const extra = parts
        .filter(
          (p) =>
            !p.includes("EV:") &&
            !p.includes("Odo:") &&
            !p.includes("%->") &&
            !p.includes("kWh"),
        )
        .join("|")
        .trim();
      if (extra) {
        setDescription(extra.startsWith(" | ") ? extra.substring(3) : extra);
      }
    }
  }, [transaction.description]);

  const [toastState, setToastState] = useState<{
    message: string;
    type: "success" | "error";
    visible: boolean;
  }>({
    message: "",
    type: "success",
    visible: false,
  });

  const showToast = (
    message: string,
    type: "success" | "error" = "success",
  ) => {
    setToastState({ message, type, visible: true });
  };

  useEffect(() => {
    if (
      billingPeriodStart &&
      billingPeriodEnd &&
      (splitEpm || targetDebt === "EPM")
    ) {
      const fetchEVInRange = async () => {
        const data = await getEVStatsInRange(
          new Date(billingPeriodStart),
          new Date(billingPeriodEnd),
        );
        setEvStatsData(data);
      };
      fetchEVInRange();
    }
  }, [billingPeriodStart, billingPeriodEnd, splitEpm, targetDebt]);

  const handleQuickDate = (d: "today" | "yesterday") => {
    const newDate = new Date();
    if (d === "yesterday") newDate.setDate(newDate.getDate() - 1);
    setDate(newDate);
  };

  const handleSave = async () => {
    if (!categoryId || !amount) {
      showToast("Selecciona una categoría y monto", "error");
      return;
    }
    setIsSaving(true);
    try {
      let finalDescription = description;
      if (isEV) {
        const evData = `EV:${evOrigin}|Odo:${odo || "0"}|${socIni || "0"}%->${socFin || "0"}%|${kwhGrid || "0"}kWh`;
        finalDescription = description ? `${evData} | ${description}` : evData;
      }

      const res = await updateTransaction(id, {
        amount: Number(amount),
        type,
        categoryId,
        accountId: accountId || null,
        description: finalDescription || null,
        date,
      });

      if (res.success) {
        showToast("¡Transacción actualizada!");
        setTimeout(() => router.push(redirectTarget), 1000);
      } else {
        showToast(res.error || "No se pudo actualizar", "error");
      }
    } catch (e) {
      console.error(e);
      showToast("Ocurrió un error inesperado", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteTransaction(id);
      if (result.success) {
        showToast("Transacción eliminada");
        setTimeout(() => router.push(redirectTarget), 1000);
      } else {
        showToast(result.error || "No se pudo eliminar", "error");
        setIsConfirmOpen(false);
      }
    } catch (e) {
      console.error(e);
      showToast("Ocurrió un error inesperado", "error");
      setIsConfirmOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const categories = allCategories
    .filter((c) => c.type === type)
    .sort((a, b) => {
      const indexA = recentIds.indexOf(a.id);
      const indexB = recentIds.indexOf(b.id);
      if (indexA === -1 && indexB === -1) return 0;
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });

  const sortedAccounts = [...accounts].sort((a, b) => {
    const indexA = recentAccountIds.indexOf(a.id);
    const indexB = recentAccountIds.indexOf(b.id);
    if (indexA === -1 && indexB === -1) return 0;
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  const handleCategorySelect = (id: string) => {
    const cat = allCategories.find((c) => c.id === id);
    if (cat?.name !== "Pago Préstamo") {
      setTargetDebt(null);
      // Only clear description if it was a debt name
      const isDebt = accounts.some(
        (acc) =>
          acc.type === "CREDIT" &&
          acc.name.toUpperCase() === description.toUpperCase(),
      );
      if (isDebt) {
        setDescription("");
      }
    }
    setCategoryId(id);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Toast
        isVisible={toastState.visible}
        message={toastState.message}
        type={toastState.type}
        onClose={() => setToastState((prev) => ({ ...prev, visible: false }))}
      />

      <ConfirmToast
        isVisible={isConfirmOpen}
        message="¿Eliminar esta transacción?"
        description="No te preocupes, el monto se ajustará automáticamente en tu saldo. Esta acción no se puede deshacer."
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />

      {/* Header */}
      <header className="p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link href={redirectTarget}>
            <NeoButton
              variant="secondary"
              className="gap-1.5 h-9 px-3 rounded-xl shadow-sm border-white/5 bg-white/5 text-[10px] font-black uppercase tracking-widest shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Volver
            </NeoButton>
          </Link>
          <h1 className="text-lg font-black italic tracking-tighter uppercase truncate">
            Editar Transacción
          </h1>
        </div>
        <NeoButton
          size="icon"
          variant="ghost"
          className="text-rose-500 h-9 w-9 shrink-0 bg-rose-500/5 border border-rose-500/10 rounded-xl"
          onClick={() => setIsConfirmOpen(true)}
        >
          <Trash2 className="w-4 h-4" />
        </NeoButton>
      </header>

      <div className="flex-1 p-5 flex flex-col gap-5 pb-32">
        <TransactionTypeToggle value={type} onChange={setType} />

        <div className="flex flex-col items-center gap-1">
          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
            Monto
          </span>
          <div className="relative w-full max-w-[200px] mx-auto">
            <span className="absolute left-0 top-1/2 -translate-y-1/2 text-2xl font-bold text-muted-foreground/50">
              $
            </span>
            <input
              type="text"
              inputMode="numeric"
              autoFocus
              value={
                amount
                  ? Number(amount).toLocaleString("es-US", {
                      maximumFractionDigits: 0,
                    })
                  : ""
              }
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, "");
                if (val.length <= 8) setAmount(val);
              }}
              placeholder="0"
              className="w-full bg-transparent text-center text-4xl font-black border-none outline-none placeholder:text-muted-foreground/20 focus:ring-0"
            />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              Categoría
            </span>
            <Link href="/finance/categories">
              <button className="text-[10px] text-primary font-black uppercase tracking-widest py-0.5 px-2 bg-primary/10 rounded-md">
                Editar
              </button>
            </Link>
          </div>
          <CategorySelector
            categories={categories}
            selectedId={categoryId}
            onSelect={handleCategorySelect}
          />
        </div>

        {/* EV Data Section */}
        {allCategories.find((c) => c.id === categoryId)?.name &&
          ["transporte", "deepal", "recarga", "vehiculo"].some((k) =>
            allCategories
              .find((c) => c.id === categoryId)
              ?.name.toLowerCase()
              .includes(k),
          ) && (
            <div className="flex flex-col gap-3 p-4 bg-white/5 rounded-3xl border border-white/10 animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                    🔌 Detalles de Recarga
                  </span>
                  <span className="text-[8px] text-muted-foreground uppercase font-bold">
                    Registrar Odo y % de batería
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEV(!isEV)}
                  className={cn(
                    "w-10 h-5 rounded-full p-1 transition-all duration-300",
                    isEV ? "bg-emerald-500" : "bg-white/10",
                  )}
                >
                  <div
                    className={cn(
                      "w-3 h-3 rounded-full bg-white transition-all transform duration-300",
                      isEV ? "translate-x-5" : "translate-x-0",
                    )}
                  />
                </button>
              </div>

              {isEV && (
                <div className="flex flex-col gap-4 pt-2 border-t border-white/5 animate-in fade-in zoom-in-95 duration-200">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[8px] font-black text-muted-foreground uppercase px-1">
                        Odómetro
                      </span>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="000000"
                        value={odo}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, "");
                          if (val.length <= 6) setOdo(val);
                        }}
                        className="bg-white/5 border-none h-10 rounded-xl px-3 text-xs font-bold outline-none focus:ring-1 ring-emerald-500/30"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[8px] font-black text-muted-foreground uppercase px-1">
                        Origen
                      </span>
                      <select
                        value={evOrigin}
                        onChange={(e) =>
                          setEvOrigin(
                            e.target.value as
                              | "Casa"
                              | "Pública Lenta"
                              | "Pública Rápida",
                          )
                        }
                        className="bg-zinc-900 border-none h-10 rounded-xl px-2 text-[10px] font-bold outline-none focus:ring-1 ring-emerald-500/30 text-white appearance-none"
                      >
                        <option value="Casa" className="bg-zinc-900 text-white">
                          CASA
                        </option>
                        <option
                          value="Pública Lenta"
                          className="bg-zinc-900 text-white"
                        >
                          PUBLICA LENTA
                        </option>
                        <option
                          value="Pública Rápida"
                          className="bg-zinc-900 text-white"
                        >
                          PUBLICA RÁPIDA
                        </option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[8px] font-black text-muted-foreground uppercase px-1">
                        kWh Red
                      </span>
                      <input
                        type="text"
                        inputMode="decimal"
                        pattern="[0-9]*[.,]?[0-9]*"
                        placeholder="0.00"
                        value={kwhGrid}
                        onChange={(e) => {
                          const val = e.target.value.replace(",", "."); // mobile fix
                          if (val.length <= 5) setKwhGrid(val);
                        }}
                        className="bg-white/5 border-none h-10 rounded-xl px-3 text-xs font-bold outline-none focus:ring-1 ring-emerald-500/30"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[8px] font-black text-muted-foreground uppercase px-1">
                        % Inicial
                      </span>
                      <div className="relative">
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="0"
                          maxLength={2}
                          value={socIni}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, "");
                            const num = Math.min(99, Number(val));
                            setSocIni(val === "" ? "" : String(num));
                          }}
                          className="w-full bg-white/5 border-none h-10 rounded-xl px-3 text-xs font-bold outline-none focus:ring-1 ring-emerald-500/30"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] opacity-30">
                          %
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[8px] font-black text-muted-foreground uppercase px-1">
                        % Final
                      </span>
                      <div className="relative">
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="100"
                          maxLength={3}
                          value={socFin}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, "");
                            const num = Math.min(100, Number(val));
                            setSocFin(val === "" ? "" : String(num));
                          }}
                          className="w-full bg-white/5 border-none h-10 rounded-xl px-3 text-xs font-bold outline-none focus:ring-1 ring-emerald-500/30"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] opacity-30">
                          %
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        {/* Source Selector */}
        <SourceSelector
          accounts={sortedAccounts}
          selectedAccountId={accountId}
          onAccountChange={setAccountId}
        />
        {/* Target Debt for Payments */}
        {allCategories.find((c) => c.id === categoryId)?.name ===
          "Pago Préstamo" && (
          <div className="flex flex-col gap-3 p-4 bg-white/5 rounded-3xl border border-white/10 animate-in fade-in slide-in-from-top-4 duration-300">
            <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">
              ¿Qué deuda estás pagando?
            </span>
            <div className="grid grid-cols-2 gap-2">
              {accounts
                .filter((acc) => acc.type === "CREDIT")
                .map((acc, idx) => (
                  <NeoButton
                    key={acc.id}
                    variant={
                      targetDebt === acc.name.toUpperCase()
                        ? "primary"
                        : "secondary"
                    }
                    className={cn(
                      "h-12 text-[10px] font-black uppercase rounded-2xl",
                      targetDebt === acc.name.toUpperCase() &&
                        (idx % 2 === 0
                          ? "bg-amber-500 text-black border-none"
                          : "bg-blue-500 text-black border-none"),
                    )}
                    onClick={() => {
                      setTargetDebt(acc.name.toUpperCase());
                      setDescription(acc.name);
                    }}
                  >
                    {acc.name}
                  </NeoButton>
                ))}
              {accounts.filter((acc) => acc.type === "CREDIT").length === 0 && (
                <p className="col-span-2 text-[10px] text-muted-foreground text-center py-2 uppercase font-black">
                  No hay cuentas de deuda creadas
                </p>
              )}
            </div>
          </div>
        )}

        {/* Billing Range and Utility Splitter (for EPM / Credit Cards) */}
        {(targetDebt ||
          allCategories.find((c) => c.id === categoryId)?.name ===
            "Pago Préstamo") && (
          <div
            className={cn(
              "flex flex-col gap-4 p-4 rounded-[2rem] animate-in fade-in slide-in-from-top-4 duration-300 transition-all",
              splitEpm
                ? "bg-amber-500/10 border border-amber-500/20"
                : "bg-white/5 border border-white/10",
            )}
          >
            <div className="flex items-center justify-between">
              <span
                className={cn(
                  "text-[10px] font-black uppercase tracking-widest",
                  targetDebt === "EPM" ? "text-amber-500" : "text-primary",
                )}
              >
                📅 Periodo de Facturación
              </span>
              {targetDebt === "EPM" && evStatsData.total > 0 && (
                <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 uppercase">
                  EV: ${evStatsData.total.toLocaleString()}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <span className="text-[8px] font-black text-muted-foreground uppercase px-1">
                  Inicio Ciclo
                </span>
                <input
                  type="date"
                  value={billingPeriodStart}
                  onChange={(e) => setBillingPeriodStart(e.target.value)}
                  max={formatToInputDate(new Date())}
                  className="bg-black/20 border-none rounded-xl px-3 h-10 text-[10px] font-bold text-white outline-none focus:ring-1 ring-primary/30"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-[8px] font-black text-muted-foreground uppercase px-1">
                  Fin Ciclo
                </span>
                <input
                  type="date"
                  value={billingPeriodEnd}
                  onChange={(e) => setBillingPeriodEnd(e.target.value)}
                  max={formatToInputDate(new Date())}
                  className="bg-black/20 border-none rounded-xl px-3 h-10 text-[10px] font-bold text-white outline-none focus:ring-1 ring-primary/30"
                />
              </div>
            </div>

            {targetDebt === "EPM" && (
              <div className="flex flex-col gap-3 pt-2 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-muted-foreground font-black uppercase tracking-tight">
                    {evStatsData.count > 0
                      ? `Detectadas ${evStatsData.count} recargas`
                      : "No se encontraron recargas en este rango"}
                  </p>
                  <NeoButton
                    variant="secondary"
                    className={cn(
                      "h-8 px-3 text-[8px] font-black uppercase rounded-lg transition-all",
                      splitEpm
                        ? "bg-amber-500/20 text-amber-500 border-none"
                        : "bg-blue-500/10 text-blue-400 border-none",
                    )}
                    onClick={() => setSplitEpm(!splitEpm)}
                  >
                    {splitEpm ? "Deseleccionar" : "Dividir EPM"}
                  </NeoButton>
                </div>

                {evStatsData.transactions.length > 0 && (
                  <div className="flex flex-col gap-1.5 max-h-[120px] overflow-y-auto pr-1 custom-scrollbar">
                    {evStatsData.transactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="flex justify-between items-center p-2 rounded-xl bg-white/5 border border-white/5"
                      >
                        <div className="min-w-0">
                          <p className="text-[9px] font-bold text-white truncate">
                            {format(new Date(tx.date), "MMM d")} -{" "}
                            {tx.description?.split("|")[0]}
                          </p>
                          <p className="text-[7px] text-muted-foreground uppercase font-black">
                            {tx.description?.split("|").slice(1).join(" | ")}
                          </p>
                        </div>
                        <span className="text-[9px] font-black text-amber-500 shrink-0">
                          ${tx.amount.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <NeoCard className="p-3 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <CalendarIcon className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-[8px] text-muted-foreground uppercase font-black tracking-widest leading-none">
                    Fecha
                  </span>
                  <span className="block font-bold text-xs">
                    {format(date, "MMM d, yyyy")}
                  </span>
                </div>
              </div>

              <div className="flex gap-1.5">
                <NeoButton
                  size="sm"
                  variant={
                    format(date, "yyyy-MM-dd") ===
                    format(new Date(), "yyyy-MM-dd")
                      ? "primary"
                      : "secondary"
                  }
                  onClick={() => handleQuickDate("today")}
                  className="h-7 px-2 text-[9px] font-black uppercase rounded-lg"
                >
                  Hoy
                </NeoButton>
                <NeoButton
                  size="sm"
                  variant={
                    format(date, "yyyy-MM-dd") ===
                    format(new Date(Date.now() - 86400000), "yyyy-MM-dd")
                      ? "primary"
                      : "secondary"
                  }
                  onClick={() => handleQuickDate("yesterday")}
                  className="h-7 px-2 text-[9px] font-black uppercase rounded-lg"
                >
                  Ayer
                </NeoButton>
              </div>
            </div>

            <div className="relative group">
              <input
                type="date"
                max={formatToInputDate(new Date())}
                value={formatToInputDate(date)}
                onChange={(e) => setDate(parseInputDate(e.target.value))}
                className="w-full bg-muted/10 border-white/5 h-10 rounded-lg px-3 outline-none text-xs font-bold appearance-none cursor-pointer focus:ring-1 ring-primary/30 transition-all"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                <CalendarIcon className="w-3 h-3" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-muted/20 text-muted-foreground flex items-center justify-center">
              <span className="text-sm">✎</span>
            </div>
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Añadir nota..."
                value={description}
                maxLength={15}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-transparent border-none outline-none text-foreground text-sm font-medium placeholder:text-muted-foreground/30 pr-8"
              />
              <span className="absolute right-0 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                {description.length}/15
              </span>
            </div>
          </div>
        </NeoCard>

        <div className="pt-1">
          <NeoButton
            className={cn(
              "w-full shadow-lg text-base font-bold tracking-widest transition-all h-12 rounded-2xl",
              type === TransactionType.INCOME
                ? "shadow-emerald-500/10 hover:shadow-emerald-500/20"
                : "shadow-rose-500/10 hover:shadow-rose-500/20",
            )}
            size="lg"
            variant={type === TransactionType.INCOME ? "primary" : "secondary"}
            disabled={!categoryId || !amount || Number(amount) <= 0 || isSaving}
            onClick={handleSave}
            isLoading={isSaving}
          >
            {isSaving ? "GUARDANDO..." : "ACTUALIZAR TRANSACCIÓN"}
          </NeoButton>
        </div>
      </div>
    </div>
  );
}
