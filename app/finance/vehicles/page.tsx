"use client";

import { useEffect, useState, useCallback } from "react";
import { NeoButton } from "@/components/ui/neo-button";
import { NeoCard } from "@/components/ui/neo-card";
import {
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  Car,
  Battery,
  X,
  ChevronDown,
} from "lucide-react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import Link from "next/link";
import {
  getVehicles,
  createVehicle,
  updateVehicle,
  deleteVehicle,
} from "@/app/actions/vehicles";
import { Toast } from "@/components/ui/toast";
import { ConfirmToast } from "@/components/ui/confirm-toast";

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  batteryCapacity: number;
  degradation: number;
}

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    brand: "",
    model: "",
    batteryCapacity: "",
    degradation: "0",
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

  const loadVehicles = useCallback(async () => {
    try {
      const data = await getVehicles();
      setVehicles(data as unknown as Vehicle[]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadVehicles();
  }, [loadVehicles]);

  const handleSave = async () => {
    if (!form.brand || !form.model || !form.batteryCapacity) return;

    try {
      if (editingId) {
        const res = await updateVehicle(editingId, {
          brand: form.brand,
          model: form.model,
          batteryCapacity: Number(form.batteryCapacity),
          degradation: Number(form.degradation),
        });
        if (res.success) {
          showToast("Vehículo actualizado");
          setEditingId(null);
          setIsAdding(false);
          loadVehicles();
        }
      } else {
        const res = await createVehicle({
          brand: form.brand,
          model: form.model,
          batteryCapacity: Number(form.batteryCapacity),
          degradation: Number(form.degradation),
        });
        if (res.success) {
          showToast("Vehículo creado");
          setIsAdding(false);
          loadVehicles();
        }
      }
    } catch {
      showToast("Error al guardar", "error");
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm.id) return;
    const res = await deleteVehicle(deleteConfirm.id);
    if (res.success) {
      showToast("Vehículo eliminado");
      setDeleteConfirm({ visible: false, id: null });
      loadVehicles();
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
        message="¿Eliminar vehículo?"
        description="Esta acción eliminará el vehículo y sus estadísticas relacionadas."
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
              Vehículos
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
                  brand: "",
                  model: "",
                  batteryCapacity: "",
                  degradation: "0",
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
                {editingId ? "Editar Vehículo" : "Nuevo Vehículo"}
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
                  Marca (ej. Deepal)
                </label>
                <input
                  className="bg-white/10 border border-white/20 rounded-xl px-4 h-12 text-sm font-bold outline-none text-white placeholder:text-white/20 focus:border-primary/50 transition-colors"
                  value={form.brand}
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
                  placeholder="Marca"
                  maxLength={15}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[8px] uppercase font-black text-muted-foreground tracking-[0.2em] pl-1">
                  Modelo (ej. S05)
                </label>
                <input
                  className="bg-white/10 border border-white/20 rounded-xl px-4 h-12 text-sm font-bold outline-none text-white placeholder:text-white/20 focus:border-primary/50 transition-colors"
                  value={form.model}
                  onChange={(e) => setForm({ ...form, model: e.target.value })}
                  placeholder="Modelo"
                  maxLength={15}
                />
              </div>

              <div className="flex flex-col gap-1.5 leading-none">
                <label className="text-[8px] uppercase font-black text-muted-foreground tracking-widest pl-1">
                  Capacidad Batería (kWh)
                </label>
                <div className="relative">
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-white/30">
                    kWh
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 h-12 text-sm font-bold outline-none text-white placeholder:text-white/20 focus:border-primary/50 transition-colors"
                    value={form.batteryCapacity}
                    onChange={(e) => {
                      let val = e.target.value.replace(/,/g, ".").replace(/[^0-9.]/g, "");
                      const match = val.match(/^(\d{0,3})(?:\.(\d{0,2}))?/);
                      if (match) {
                        val = match[1] + (val.includes('.') ? '.' + (match[2] || '') : '');
                      } else {
                        val = "";
                      }
                      setForm({ ...form, batteryCapacity: val });
                    }}
                    placeholder="56.12"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5 leading-none">
                <label className="text-[8px] uppercase font-black text-muted-foreground tracking-widest pl-1">
                  Degradación (%)
                </label>
                <div className="relative group">
                  <span className="absolute right-9 top-1/2 -translate-y-1/2 text-sm font-bold text-white/30 pointer-events-none">
                    %
                  </span>
                  <select
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 h-12 text-sm font-bold outline-none text-white focus:border-primary/50 transition-colors appearance-none"
                    value={form.degradation ? String(Math.min(20, Math.floor(Number(form.degradation)))) : "0"}
                    onChange={(e) => setForm({ ...form, degradation: e.target.value })}
                  >
                    {[...Array(21)].map((_, i) => (
                      <option key={i} value={String(i)} className="bg-zinc-900">
                        {i}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                </div>
              </div>

              <NeoButton
                className="w-full h-12 font-black uppercase tracking-widest mt-2 bg-primary text-black"
                onClick={handleSave}
              >
                {editingId ? "Guardar Cambios" : "Crear Vehículo"}
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
            vehicles.map((v) => (
              <VehicleItem
                key={v.id}
                vehicle={v}
                onEdit={(v) => {
                  setEditingId(v.id);
                  setForm({
                    brand: v.brand,
                    model: v.model,
                    batteryCapacity: v.batteryCapacity.toString(),
                    degradation: v.degradation?.toString() || "0",
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

function VehicleItem({
  vehicle,
  onEdit,
  onDelete,
}: {
  vehicle: Vehicle;
  onEdit: (v: Vehicle) => void;
  onDelete: (id: string) => void;
}) {
  const x = useMotionValue(0);
  const deleteBgOpacity = useTransform(x, [-100, -50], [1, 0]);
  const editBgOpacity = useTransform(x, [50, 100], [0, 1]);
  const deleteScale = useTransform(x, [-100, -50], [1, 0.5]);
  const editScale = useTransform(x, [50, 100], [0.5, 1]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -100) {
      onDelete(vehicle.id);
    } else if (info.offset.x > 100) {
      onEdit(vehicle);
    }
  };

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
            <div className="w-12 h-12 rounded-xl flex items-center justify-center border border-white/10 bg-primary/10 text-primary">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-base tracking-tight uppercase">
                {vehicle.brand} {vehicle.model}
              </h3>
              <div className="flex items-center gap-1.5">
                <Battery className="w-3 h-3 text-muted-foreground" />
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                  {Number(vehicle.batteryCapacity)} kWh • {Number(vehicle.degradation || 0)}% Deg.
                </span>
              </div>
            </div>
          </div>
        </NeoCard>
      </motion.div>
    </div>
  );
}
