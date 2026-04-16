"use client";

import { useEffect, useState, useCallback } from "react";
import { NeoButton } from "@/components/ui/neo-button";
import { NeoCard } from "@/components/ui/neo-card";
import {
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  Landmark,
  Wallet,
  CreditCard,
  Zap,
  X,
  type LucideIcon,
} from "lucide-react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import Link from "next/link";
import { getBankAccounts } from "@/app/actions/transactions";
import {
  createBankAccount,
  updateBankAccount,
  deleteBankAccount,
} from "@/app/actions/accounts";
import { formatCurrency } from "@/lib/utils";
import { Toast } from "@/components/ui/toast";
import { ConfirmToast } from "@/components/ui/confirm-toast";

interface BankAccount {
  id: string;
  name: string;
  type: string;
  balance: number;
  color?: string;
}

const ACCOUNT_ICONS: Record<string, LucideIcon> = {
  SAVINGS: Landmark,
  CHECKING: Landmark,
  CREDIT: CreditCard,
  CASH: Wallet,
  ENERGY: Zap,
};

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    type: "SAVINGS",
    balance: "", // Use string for easier formatting
    color: "#3b82f6",
  });

  const [toastState, setToastState] = useState<{
    message: string;
    type: "success" | "error";
    visible: boolean;
  }>({
    message: "",
    type: "success",
    visible: false,
  });

  const [deleteConfirm, setDeleteConfirm] = useState<{
    visible: boolean;
    id: string | null;
  }>({
    visible: false,
    id: null,
  });

  const showToast = (
    message: string,
    type: "success" | "error" = "success",
  ) => {
    setToastState({ message, type, visible: true });
  };

  const loadAccounts = useCallback(async () => {
    setLoading(true);
    const data = await getBankAccounts();
    setAccounts(data as BankAccount[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadAccounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async () => {
    if (!form.name) return;

    try {
      if (editingId) {
        const res = await updateBankAccount(editingId, {
          name: form.name,
          type: form.type,
          balance: Number(form.balance),
          color: form.color,
        });
        if (res.success) {
          showToast("Cuenta actualizada");
          setEditingId(null);
          setIsAdding(false);
          loadAccounts();
        }
      } else {
        const res = await createBankAccount({
          name: form.name,
          type: form.type,
          balance: Number(form.balance),
          color: form.color,
        });
        if (res.success) {
          showToast("Cuenta creada");
          setIsAdding(false);
          loadAccounts();
        }
      }
    } catch {
      showToast("Error al guardar", "error");
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm.id) return;
    const res = await deleteBankAccount(deleteConfirm.id);
    if (res.success) {
      showToast("Cuenta eliminada");
      setDeleteConfirm({ visible: false, id: null });
      loadAccounts();
    } else {
      showToast(res.error || "Error al eliminar", "error");
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24 flex flex-col gap-6 relative">
      <Toast
        isVisible={toastState.visible}
        message={toastState.message}
        type={toastState.type}
        onClose={() => setToastState((prev) => ({ ...prev, visible: false }))}
      />

      <ConfirmToast
        isVisible={deleteConfirm.visible}
        message="¿Eliminar cuenta?"
        description="Esta acción no se puede deshacer si tiene transacciones."
        onClose={() => setDeleteConfirm({ visible: false, id: null })}
        onConfirm={handleDelete}
      />

      <div className="fixed top-6 left-6 z-50">
        <Link href="/finance/profile">
          <NeoButton
            variant="secondary"
            className="gap-1.5 h-9 px-3 rounded-xl shadow-xl hover:scale-[1.05] active:scale-95 transition-all text-[10px] font-black uppercase tracking-widest border-white/10 bg-black/20 backdrop-blur-md"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Volver
          </NeoButton>
        </Link>
      </div>

      <div className="p-6 pt-20 flex flex-col gap-6">
        <header className="flex justify-between items-center">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-black italic tracking-tighter uppercase">
              Cuentas
            </h1>
            <div className="flex items-center gap-2 pl-1">
              <span className="text-[8px] font-black uppercase tracking-widest text-white/50">Desliza:</span>
              <span className="text-[8px] font-black uppercase tracking-widest text-emerald-400">Derecha - Editar</span>
              <span className="w-1 h-1 rounded-full bg-white/20" />
              <span className="text-[8px] font-black uppercase tracking-widest text-rose-400">Izquierda - Borrar</span>
            </div>
          </div>
          {!isAdding && (
            <NeoButton
              size="icon"
              className="w-12 h-12 rounded-2xl bg-primary text-black border-none shadow-lg shadow-primary/20"
              onClick={() => {
                setEditingId(null);
                setForm({
                  name: "",
                  type: "SAVINGS",
                  balance: "",
                  color: "#3b82f6",
                });
                setIsAdding(true);
              }}
            >
              <Plus className="w-6 h-6 stroke-[3]" />
            </NeoButton>
          )}
        </header>

        {isAdding && (
          <NeoCard className="p-5 flex flex-col gap-4 border-primary/20 bg-primary/5 animate-in fade-in slide-in-from-top-4">
            <div className="flex justify-between items-center">
              <h2 className="font-black italic tracking-tight uppercase text-sm">
                {editingId ? "Editar Cuenta" : "Nueva Cuenta"}
              </h2>
              <button
                onClick={() => setIsAdding(false)}
                className="opacity-50 hover:opacity-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[8px] uppercase font-black text-muted-foreground tracking-[0.2em] pl-1">
                  Nombre (ej. Bancolombia)
                </label>
                <input
                  className="bg-white/10 border border-white/20 rounded-xl px-4 h-12 text-sm font-bold outline-none text-white placeholder:text-white/20 focus:border-primary/50 transition-colors"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Nombre de la cuenta"
                  maxLength={20}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5 overflow-hidden">
                  <label className="text-[8px] uppercase font-black text-muted-foreground tracking-widest pl-1">
                    Tipo
                  </label>
                  <div className="relative">
                    <select
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-3 h-12 text-sm font-bold outline-none appearance-none text-white [&>option]:bg-[#1a1a1a] [&>option]:text-white"
                      value={form.type}
                      onChange={(e) =>
                        setForm({ ...form, type: e.target.value })
                      }
                    >
                      <option value="SAVINGS">Ahorros (TD)</option>
                      <option value="CHECKING">Corriente</option>
                      <option value="CASH">Efectivo</option>
                      <option value="CREDIT">Crédito (TC)</option>
                      <option value="ENERGY">Empresa de Energía (EPM, Celsia)</option>
                    </select>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 leading-none">
                  <label className="text-[8px] uppercase font-black text-muted-foreground tracking-widest pl-1">
                    Saldo Inicial
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-white/30">
                      $
                    </span>
                    <input
                      type="text"
                      inputMode="decimal"
                      className="w-full bg-white/10 border border-white/20 rounded-xl pl-8 pr-4 h-12 text-sm font-bold outline-none text-white placeholder:text-white/20 focus:border-primary/50 transition-colors"
                      value={form.balance}
                      onChange={(e) => {
                        let val = e.target.value.replace(/[^0-9.]/g, "");
                        const parts = val.split(".");
                        if (parts.length > 2) {
                          val = parts[0] + "." + parts.slice(1).join("");
                        }
                        const newParts = val.split(".");
                        if (newParts[0].length > 7) {
                          newParts[0] = newParts[0].substring(0, 7);
                        }
                        if (newParts[1] && newParts[1].length > 2) {
                          newParts[1] = newParts[1].substring(0, 2);
                        }
                        setForm({ ...form, balance: newParts.join(".") });
                      }}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[8px] uppercase font-black text-muted-foreground tracking-[0.2em] pl-1">
                  Color de la Cuenta
                </label>
                <div className="flex flex-wrap gap-2 pt-1 px-1">
                  {[
                    "#10b981", // Emerald (Base)
                    "#00f2ff", // Neo Cyan
                    "#ff0055", // Rose Neo
                    "#a855f7", // Electric Purple
                    "#ffff00", // Bright Yellow
                    "#ff8800", // Vivid Orange
                    "#00ff00", // Pure Lime
                    "#ffffff", // Contrast White
                  ].map((c) => (
                    <button
                      key={c}
                      onClick={() => setForm({ ...form, color: c })}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        form.color === c
                          ? "border-white scale-110 shadow-lg"
                          : "border-transparent opacity-50 hover:opacity-100"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <NeoButton
                className="w-full h-12 font-black uppercase tracking-widest mt-2"
                onClick={handleSave}
                style={{ backgroundColor: form.color, color: "#000" }}
              >
                {editingId ? "Guardar Cambios" : "Crear Cuenta"}
              </NeoButton>
            </div>
          </NeoCard>
        )}

        <div className="flex flex-col gap-3">
          {loading ? (
            <p className="text-center py-10 opacity-50 italic text-[10px] uppercase font-black tracking-widest animate-pulse">
              Cargando...
            </p>
          ) : (
            accounts.map((acc) => (
              <AccountItem
                key={acc.id}
                acc={acc}
                onEdit={(acc) => {
                  setEditingId(acc.id);
                  setForm({
                    name: acc.name,
                    type: acc.type,
                    balance: acc.balance.toString(),
                    color: acc.color || "#3b82f6",
                  });
                  setIsAdding(true);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                onDelete={(id) => setDeleteConfirm({ visible: true, id })}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function AccountItem({
  acc,
  onEdit,
  onDelete,
}: {
  acc: BankAccount;
  onEdit: (acc: BankAccount) => void;
  onDelete: (id: string) => void;
}) {
  const x = useMotionValue(0);
  const deleteBgOpacity = useTransform(x, [-100, -50], [1, 0]);
  const editBgOpacity = useTransform(x, [50, 100], [0, 1]);
  const deleteScale = useTransform(x, [-100, -50], [1, 0.5]);
  const editScale = useTransform(x, [50, 100], [0.5, 1]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -100) {
      onDelete(acc.id);
    } else if (info.offset.x > 100) {
      onEdit(acc);
    }
  };

  const IconComponent = ACCOUNT_ICONS[acc.type] || Wallet;

  return (
    <div className="relative group overflow-hidden rounded-2xl mb-2">
      <div className="absolute inset-0 flex items-center justify-between px-6 pointer-events-none">
        <motion.div
          style={{ opacity: editBgOpacity, scale: editScale }}
          className="flex items-center gap-2 text-primary"
        >
          <Edit2 className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-widest">
            Editar
          </span>
        </motion.div>
        <motion.div
          style={{ opacity: deleteBgOpacity, scale: deleteScale }}
          className="flex items-center gap-2 text-rose-500"
        >
          <span className="text-[10px] font-black uppercase tracking-widest">
            Eliminar
          </span>
          <Trash2 className="w-4 h-4" />
        </motion.div>
      </div>

      <motion.div
        drag="x"
        dragConstraints={{ left: -120, right: 120 }}
        dragElastic={0.2}
        onDragEnd={onDragEnd}
        style={{ x }}
        className="relative z-10 touch-pan-y"
      >
        <NeoCard className="p-4 flex items-center justify-between border-white/5 bg-white/5 w-full">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center border border-white/10 shadow-inner"
              style={{
                backgroundColor: `${acc.color}20`,
                color: acc.color,
              }}
            >
              <IconComponent className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-base tracking-tight uppercase">
                {acc.name}
              </h3>
              <span className="text-[10px] font-black text-primary opacity-70 uppercase tracking-widest">
                {formatCurrency(acc.balance)}
              </span>
            </div>
          </div>
        </NeoCard>
      </motion.div>
    </div>
  );
}
