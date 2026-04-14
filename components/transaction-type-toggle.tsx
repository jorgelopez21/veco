"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { TransactionType } from "@prisma/client";

interface TransactionTypeToggleProps {
  value: TransactionType;
  onChange: (value: TransactionType) => void;
}

export function TransactionTypeToggle({
  value,
  onChange,
}: TransactionTypeToggleProps) {
  return (
    <div className="flex w-full bg-card rounded-2xl p-1 relative shadow-inner shadow-black/30 border border-white/5 h-14">
      <motion.div
        layout
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className={cn(
          "absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-xl shadow-lg border",
          value === TransactionType.INCOME
            ? "left-1 bg-emerald-500/20 border-emerald-500"
            : "left-[calc(50%+4px)] bg-rose-500/20 border-rose-500",
        )}
      />

      <button
        type="button"
        onClick={() => onChange(TransactionType.INCOME)}
        className={cn(
          "flex-1 z-10 text-sm font-bold transition-colors uppercase tracking-wider relative",
          value === TransactionType.INCOME
            ? "text-emerald-500"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        Income
      </button>
      <button
        type="button"
        onClick={() => onChange(TransactionType.EXPENSE)}
        className={cn(
          "flex-1 z-10 text-sm font-bold transition-colors uppercase tracking-wider relative",
          value === TransactionType.EXPENSE
            ? "text-rose-500"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        Expense
      </button>
    </div>
  );
}
