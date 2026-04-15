"use client";

import { NeoButton } from "./ui/neo-button";
import { UserX, RefreshCw } from "lucide-react";
import { deleteAccount, resetDemoAccount } from "@/app/actions/user";
import { useState } from "react";
import { ConfirmToast } from "./ui/confirm-toast";

export function DeleteAccountButton({ isDemo }: { isDemo?: boolean }) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      if (isDemo) {
        await resetDemoAccount();
        window.location.reload();
      } else {
        await deleteAccount();
      }
    } catch (error) {
      console.error(error);
      setIsLoading(false);
      setIsConfirmOpen(false);
    }
  };

  return (
    <>
      <NeoButton
        variant="secondary"
        onClick={() => setIsConfirmOpen(true)}
        className="w-full h-14 font-black uppercase tracking-widest text-rose-500 bg-rose-500/5 hover:bg-rose-500/10 border-rose-500/20 text-[10px] rounded-2xl transition-all active:scale-95"
      >
        {isDemo ? (
          <>
            <RefreshCw className="w-5 h-5 mr-3" />
            Eliminar registros
          </>
        ) : (
          <>
            <UserX className="w-5 h-5 mr-3" />
            Eliminar mi cuenta
          </>
        )}
      </NeoButton>

      <ConfirmToast
        isVisible={isConfirmOpen}
        message={isDemo ? "¿Restablecer cuenta de prueba?" : "¿Estás completamente seguro?"}
        description={
          isDemo
            ? "Esto limpiará todas las transacciones, cuentas y vehículos creados durante tu prueba, pero mantendrá el usuario."
            : "Esta acción eliminará permanentemente todos tus datos, transacciones y configuraciones. No se puede deshacer."
        }
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
        isLoading={isLoading}
      />
    </>
  );
}
