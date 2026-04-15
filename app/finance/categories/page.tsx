"use client";

import { useEffect, useState, useCallback } from "react";
import { NeoButton } from "@/components/ui/neo-button";
import { NeoCard } from "@/components/ui/neo-card";
import { ArrowLeft, Plus, Edit2, Trash2 } from "lucide-react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import Link from "next/link";
import { getCategories } from "@/app/actions/transactions";
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/app/actions/categories";
import { CATEGORY_ICONS } from "@/components/ui/category-icons";
import { cn } from "@/lib/utils";
import { CircleHelp } from "lucide-react";
import { Toast } from "@/components/ui/toast";
import { ConfirmToast } from "@/components/ui/confirm-toast";

interface Category {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
  icon: string;
  color: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

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

  const [isDeleting, setIsDeleting] = useState(false);

  const showToast = (
    message: string,
    type: "success" | "error" = "success",
  ) => {
    setToastState({ message, type, visible: true });
  };

  const [form, setForm] = useState({
    name: "",
    type: "EXPENSE" as "EXPENSE" | "INCOME",
    icon: "Car",
    color: "#10b981",
  });

  const loadCategories = useCallback(async () => {
    if (categories.length === 0) setLoading(true);
    const data = await getCategories();
    setCategories(data as Category[]);
    setLoading(false);
  }, [categories.length]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleSave = async () => {
    if (!form.name) return;

    try {
      if (editingId) {
        const res = await updateCategory(editingId, {
          name: form.name,
          icon: form.icon,
          color: form.color,
        });
        if (res.success) {
          showToast("Categoría actualizada correctamente");
          setEditingId(null);
          setIsAdding(false);
          loadCategories();
        } else {
          showToast(res.error || "Error al actualizar", "error");
        }
      } else {
        const res = await createCategory(form);
        if (res.success) {
          showToast("Categoría creada con éxito");
          setIsAdding(false);
          loadCategories();
        } else {
          showToast(res.error || "Error al crear", "error");
        }
      }
    } catch (error) {
      console.error(error);
      showToast("Ocurrió un error inesperado", "error");
    }
    setForm({
      name: "",
      type: "EXPENSE",
      icon: "Car",
      color: "#10b981",
    });
  };

  const handleDelete = async () => {
    if (!deleteConfirm.id) return;

    setIsDeleting(true);
    try {
      const res = await deleteCategory(deleteConfirm.id);
      if (res.success) {
        showToast("Categoría eliminada con éxito");
        setDeleteConfirm({ visible: false, id: null });
        loadCategories();
      } else {
        showToast(res.error || "No se pudo eliminar la categoría", "error");
        setDeleteConfirm({ visible: false, id: null });
      }
    } catch (error) {
      console.error(error);
      showToast("Ocurrió un error inesperado", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setForm({
      name: cat.name,
      type: cat.type,
      icon: cat.icon,
      color: cat.color,
    });
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
        message="¿Eliminar categoría?"
        description="Ten en cuenta que esta operación fallará si la categoría está siendo usada en alguna transacción existente."
        onClose={() => setDeleteConfirm({ visible: false, id: null })}
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />

      {/* Floating Back Button */}
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
          <h1 className="text-2xl font-black italic tracking-tighter">
            CATEGORÍAS
          </h1>
          {!isAdding && (
            <NeoButton
              size="icon"
              className="w-12 h-12 rounded-2xl bg-primary text-black border-none shadow-lg shadow-primary/20"
              onClick={() => {
                setEditingId(null);
                setForm({
                  name: "",
                  type: "EXPENSE",
                  icon: "Car",
                  color: "#10b981",
                });
                setIsAdding(true);
              }}
            >
              <Plus className="w-6 h-6 stroke-[3]" />
            </NeoButton>
          )}
        </header>

        {isAdding && (
          <NeoCard className="p-5 flex flex-col gap-4 animate-in fade-in slide-in-from-top-4 border-primary/20 bg-primary/5">
            <div className="flex justify-between items-center">
              <h2 className="font-black italic tracking-tight uppercase text-sm">
                {editingId ? "Editar Categoría" : "Nueva Categoría"}
              </h2>
              <button
                onClick={() => setIsAdding(false)}
                className="text-[10px] font-black uppercase text-muted-foreground hover:text-white"
              >
                Cerrar
              </button>
            </div>

            <input type="hidden" value="EXPENSE" />

            <div className="flex flex-col gap-2">
              <label className="text-[8px] uppercase font-black text-muted-foreground tracking-widest pl-1">
                Nombre (ej. Carga Celsia)
              </label>
              <input
                className="bg-white/5 border border-white/10 rounded-xl px-4 h-12 text-sm font-bold outline-none focus:ring-1 ring-primary/50"
                placeholder="..."
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                maxLength={20}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[8px] uppercase font-black text-muted-foreground tracking-[0.2em] pl-1">
                Color de la Categoría
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
              {editingId ? "Guardar Cambios" : "Crear Categoría"}
            </NeoButton>
          </NeoCard>
        )}

        <div className="flex flex-col gap-4">
          <h2 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] pl-1">
            Tus Categorías
          </h2>
          <div className="flex flex-col gap-2">
            {loading && categories.length === 0 ? (
              <p className="text-center py-10 opacity-50 italic text-[10px] uppercase font-black tracking-widest animate-pulse">
                Cargando...
              </p>
            ) : (
              categories.map((cat) => (
                <CategoryItem
                  key={cat.id}
                  cat={cat}
                  onEdit={startEdit}
                  onDelete={(id: string) =>
                    setDeleteConfirm({ visible: true, id })
                  }
                />
              ))
            )}
            {!loading && categories.length === 0 && (
              <p className="text-center py-10 opacity-50 italic text-[10px] uppercase font-black tracking-widest">
                No hay categorías registradas
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CategoryItem({
  cat,
  onEdit,
  onDelete,
}: {
  cat: Category;
  onEdit: (cat: Category) => void;
  onDelete: (id: string) => void;
}) {
  const x = useMotionValue(0);
  const deleteBgOpacity = useTransform(x, [-100, -50], [1, 0]);
  const editBgOpacity = useTransform(x, [50, 100], [0, 1]);
  const deleteScale = useTransform(x, [-100, -50], [1, 0.5]);
  const editScale = useTransform(x, [50, 100], [0.5, 1]);

  const isRecarga = cat.name.toLowerCase() === "recarga";

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -100) {
      if (!isRecarga) onDelete(cat.id);
    } else if (info.offset.x > 100) {
      onEdit(cat);
    }
  };

  const IconComponent = CATEGORY_ICONS[cat.icon] || CircleHelp;

  return (
    <div className="relative group overflow-hidden rounded-2xl mb-1">
      {/* Background Actions */}
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
          className={cn("flex items-center gap-2", isRecarga ? "text-muted-foreground/30" : "text-rose-500")}
        >
          <span className="text-[10px] font-black uppercase tracking-widest">
            {isRecarga ? "FIJO" : "Eliminar"}
          </span>
          {!isRecarga && <Trash2 className="w-4 h-4" />}
        </motion.div>
      </div>

      <motion.div
        drag="x"
        dragConstraints={{ left: isRecarga ? 0 : -120, right: 120 }}
        dragElastic={0.2}
        onDragEnd={onDragEnd}
        style={{ x }}
        className="relative z-10 touch-pan-y"
      >
        <NeoCard className="p-3 pl-4 flex items-center justify-between border-white/5 bg-white/5 w-full">
          <div className="flex items-center gap-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center border shadow-lg"
              style={{
                backgroundColor: `${cat.color}15`,
                borderColor: `${cat.color}30`,
                color: cat.color,
              }}
            >
              <IconComponent className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-tight uppercase leading-none">{cat.name}</h3>
            </div>
          </div>
        </NeoCard>
      </motion.div>
    </div>
  );
}
