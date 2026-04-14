"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { NeoButton } from "./neo-button";

interface ConfirmToastProps {
  message: string;
  description?: string;
  isVisible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function ConfirmToast({
  message,
  description,
  isVisible,
  onClose,
  onConfirm,
  isLoading,
}: ConfirmToastProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110]"
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[120] w-[calc(100%-3rem)] max-w-sm"
          >
            <div className="bg-neutral-900 border border-white/10 p-6 rounded-[2rem] shadow-2xl flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest text-rose-500">
                    Confirmación
                  </span>
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    {message}
                  </h3>
                </div>
              </div>

              {description && (
                <p className="text-[11px] text-muted-foreground leading-relaxed pl-16">
                  {description}
                </p>
              )}

              <div className="flex gap-3 mt-2">
                <NeoButton
                  variant="secondary"
                  className="flex-1 h-11 rounded-xl text-[10px] font-black uppercase tracking-widest border-white/5 bg-white/5"
                  onClick={onClose}
                  disabled={isLoading}
                >
                  Cancelar
                </NeoButton>
                <NeoButton
                  className="flex-1 h-11 rounded-xl text-[10px] font-black uppercase tracking-widest bg-rose-500 hover:bg-rose-600 text-white"
                  onClick={onConfirm}
                  isLoading={isLoading}
                >
                  Eliminar
                </NeoButton>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
