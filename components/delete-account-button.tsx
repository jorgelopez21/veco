"use client";

import { NeoButton } from "./ui/neo-button";
import { UserX } from "lucide-react";
import { deleteAccount } from "@/app/actions/user";
import { useState } from "react";
import { ConfirmToast } from "./ui/confirm-toast";

export function DeleteAccountButton() {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await deleteAccount();
    } catch (error) {
      console.error(error);
      setIsLoading(false);
      setIsConfirmOpen(false);
    }
  };

  return (
    <>
      <NeoButton
        variant="ghost"
        onClick={() => setIsConfirmOpen(true)}
        className="w-full h-14 font-black uppercase tracking-widest text-muted-foreground/40 hover:text-rose-500 hover:bg-rose-500/5 transition-all text-[9px] rounded-2xl border border-dashed border-white/5"
      >
        <UserX className="w-4 h-4 mr-3" />
        Darse de baja
      </NeoButton>

      <ConfirmToast
        isVisible={isConfirmOpen}
        message="¿Estás completamente seguro?"
        description="Esta acción eliminará permanentemente todos tus datos, transacciones y configuraciones. No se puede deshacer."
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
        isLoading={isLoading}
      />
    </>
  );
}
