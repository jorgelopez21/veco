"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, X } from "lucide-react";
import { useEffect } from "react";

interface ToastProps {
  message: string;
  type?: "success" | "error";
  isVisible: boolean;
  onClose: () => void;
}

export function Toast({
  message,
  type = "success",
  isVisible,
  onClose,
}: ToastProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 5000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-3rem)] max-w-sm"
        >
          <div className="bg-neutral-900/90 border border-white/10 backdrop-blur-xl p-4 rounded-3xl shadow-2xl flex items-center justify-between gap-3 overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />

            <div className="flex items-center gap-3 relative z-10">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                  type === "success"
                    ? "bg-emerald-500/10 text-emerald-500"
                    : "bg-rose-500/10 text-rose-500"
                }`}
              >
                {type === "success" ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <AlertCircle className="w-5 h-5" />
                )}
              </div>
              <div className="flex flex-col">
                <span
                  className={`text-[10px] font-black uppercase tracking-widest ${
                    type === "success" ? "text-emerald-500" : "text-rose-500"
                  }`}
                >
                  {type === "success" ? "Éxito" : "Atención"}
                </span>
                <p className="text-xs font-bold text-white leading-tight">
                  {message}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center hover:bg-white/10 transition-colors relative z-10"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
