"use client";

import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import Link from "next/link";
import { NeoButton } from "./ui/neo-button";

export function FabNewTransaction() {
  return (
    <motion.div 
      className="fixed bottom-24 right-6 z-40"
      initial={{ scale: 0, y: 100 }}
      animate={{ scale: 1, y: 0 }}
      transition={{ 
        type: "spring",
        stiffness: 260,
        damping: 20,
        delay: 0.2
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Link href="/finance/transactions/new">
        <NeoButton
          size="icon"
          className="h-16 w-16 rounded-full shadow-2xl shadow-emerald-500/40 bg-emerald-500 hover:bg-emerald-400 text-black flex items-center justify-center border-none relative group overflow-hidden"
        >
          {/* Animated Shimmer background */}
          <motion.div 
            className="absolute inset-0 bg-white/30 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 skew-x-12"
          />
          
          <Plus className="w-10 h-10 relative z-10" />
          
          {/* Pulse effect */}
          <motion.div
            className="absolute inset-0 rounded-full bg-emerald-500 opacity-20"
            animate={{ scale: [1, 1.4, 1], opacity: [0.2, 0, 0.2] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          />
        </NeoButton>
      </Link>
    </motion.div>
  );
}
