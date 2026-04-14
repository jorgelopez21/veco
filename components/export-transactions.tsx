"use client";

import { useState } from "react";
import { NeoButton } from "@/components/ui/neo-button";
import { format } from "date-fns";
import { Toast } from "@/components/ui/toast";
import { type Transaction } from "@/components/transaction-item";
import { cn, formatCurrency } from "@/lib/utils";

export function ExportTransactions({
  transactions,
}: {
  transactions: Transaction[];
}) {
  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "success" as "success" | "error",
  });

  const showToast = (
    message: string,
    type: "success" | "error" = "success",
  ) => {
    setToast({ visible: true, message, type });
  };

  const handleExport = () => {
    try {
      if (!transactions || transactions.length === 0) {
        showToast("No hay transacciones en los filtros actuales", "error");
        return;
      }

      // Generate CSV
      const headers = [
        "Fecha",
        "Tipo",
        "Categoría",
        "Cuenta",
        "Descripción",
        "Monto",
      ];

      const rows = transactions.map((t) => [
        format(new Date(t.date), "yyyy-MM-dd HH:mm"),
        t.type,
        t.category?.name || "Sin categoría",
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        (t as any).account?.name || "N/A",
        t.description || "",
        t.amount.toString(),
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((r) =>
          r.map((cell) => `"${cell.toString().replace(/"/g, '""')}"`).join(","),
        ),
      ].join("\n");

      // Download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `veco_export_${format(new Date(), "yyyy-MM-dd")}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast("Exportación completada");
    } catch (error) {
      console.error(error);
      showToast("Error al exportar", "error");
    }
  };

  const total = transactions.reduce((acc, t) => {
    return t.type === "EXPENSE" ? acc - t.amount : acc + t.amount;
  }, 0);

  return (
    <div className="flex flex-col gap-4">
      <Toast
        isVisible={toast.visible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((t) => ({ ...t, visible: false }))}
      />

      <div className="flex flex-col gap-2 p-4 bg-white/5 border border-white/5 rounded-[2rem]">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
            Total en vista
          </span>
          <span
            className={cn(
              "text-xl font-black tracking-tighter italic",
              total >= 0 ? "text-emerald-500" : "text-rose-500",
            )}
          >
            {total >= 0 ? "+" : ""}
            {formatCurrency(total)}
          </span>
        </div>
        <NeoButton
          variant="secondary"
          size="sm"
          className="w-full text-[9px] font-black h-10 rounded-[1.25rem] bg-primary/10 border-primary/20 text-primary uppercase tracking-widest mt-2"
          onClick={handleExport}
        >
          Descargar esta vista (.CSV)
        </NeoButton>
      </div>
    </div>
  );
}
