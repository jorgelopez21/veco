"use client";

import { useState } from "react";
import { NeoCard } from "@/components/ui/neo-card";
import { Trash2, Edit3 } from "lucide-react";
import { format } from "date-fns";
import { deleteTransaction } from "@/app/actions/delete-transaction";
import { useRouter } from "next/navigation";
import { cn, formatCurrency } from "@/lib/utils";
import { ConfirmToast } from "@/components/ui/confirm-toast";
import { Toast } from "@/components/ui/toast";
import { getCategoryIcon } from "@/components/ui/category-icons";
import { TransactionType } from "@prisma/client";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { usePathname } from "next/navigation";

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  date: Date | string;
  description: string | null;
  categoryId: string | null;
  category: {
    id: string;
    name: string;
    icon: string | null;
    color: string | null;
  } | null;
  vehicle?: {
    brand: string;
    model: string;
  } | null;
}

interface TransactionItemProps {
  transaction: Transaction;
}

export function TransactionItem({ transaction }: TransactionItemProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [toastState, setToastState] = useState<{
    message: string;
    type: "success" | "error";
    visible: boolean;
  }>({
    message: "",
    type: "success",
    visible: false,
  });

  const router = useRouter();
  const pathname = usePathname();
  const x = useMotionValue(0);

  // Background colors and opacity based on drag
  const deleteBgOpacity = useTransform(x, [-100, -50], [1, 0]);
  const editBgOpacity = useTransform(x, [50, 100], [0, 1]);
  const deleteScale = useTransform(x, [-100, -50], [1, 0.5]);
  const editScale = useTransform(x, [50, 100], [0.5, 1]);

  const iconName = transaction.category?.icon;
  const IconComponent = getCategoryIcon(iconName);

  const showToast = (
    message: string,
    type: "success" | "error" = "success",
  ) => {
    setToastState({ message, type, visible: true });
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteTransaction(transaction.id);
      if (result.success) {
        showToast("Transacción eliminada");
        setTimeout(() => {
          setIsConfirmOpen(false);
          router.refresh();
        }, 1000);
      } else {
        showToast(result.error || "No se pudo eliminar", "error");
        setIsConfirmOpen(false);
      }
    } catch (error) {
      console.error(error);
      showToast("Ocurrió un error inesperado", "error");
      setIsConfirmOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -100) {
      // Swipe left -> Delete
      setIsConfirmOpen(true);
    } else if (info.offset.x > 100) {
      // Swipe right -> Edit
      const fromParam = pathname.includes("transactions") ? "?from=activity" : "";
      router.push(`/finance/transactions/edit/${transaction.id}${fromParam}`);
    }
  };

  return (
    <div className="relative group overflow-hidden rounded-[2rem]">
      <Toast
        isVisible={toastState.visible}
        message={toastState.message}
        type={toastState.type}
        onClose={() => setToastState((prev) => ({ ...prev, visible: false }))}
      />

      <ConfirmToast
        isVisible={isConfirmOpen}
        message="¿Eliminar esta transacción?"
        description="No te preocupes, el monto se ajustará automáticamente en tu saldo de forma inmediata."
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />

      {/* Background Actions (Visible during swipe) */}
      <div className="absolute inset-0 flex items-center justify-between px-6 pointer-events-none">
        <motion.div
          style={{ opacity: editBgOpacity, scale: editScale }}
          className="flex items-center gap-2 text-primary"
        >
          <Edit3 className="w-5 h-5" />
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
          <Trash2 className="w-5 h-5" />
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
        <NeoCard
          className={cn(
            "p-4 flex items-center justify-between hover:bg-white/5 cursor-pointer transition-colors border-white/5 bg-white/5 rounded-[2rem]",
            isDeleting && "opacity-50 pointer-events-none",
          )}
        >
          <div className="flex items-center gap-4">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center transition-transform group-hover:scale-110"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                color: transaction.category?.color || "white",
              }}
            >
              <IconComponent className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-foreground tracking-tight">
                {transaction.category?.name || "Sin Categoría"}
              </h3>
              <div className="flex items-center gap-1.5 mt-1">
                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest leading-none">
                  {format(new Date(transaction.date), "MMM d, h:mm a")}
                </p>
                {transaction.vehicle && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-primary/40" />
                    <p className="text-[10px] text-primary/80 uppercase font-black tracking-widest leading-none">
                      {transaction.vehicle.brand} {transaction.vehicle.model}
                    </p>
                  </>
                )}
                {transaction.description && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-white/10" />
                    <p className="text-[10px] text-muted-foreground uppercase font-medium tracking-widest leading-none truncate max-w-[80px]">
                      {transaction.description}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-black tracking-tighter text-lg text-foreground">
              {formatCurrency(transaction.amount)}
            </span>
          </div>
        </NeoCard>
      </motion.div>
    </div>
  );
}
