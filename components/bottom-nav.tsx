"use client";

import { Home, List, Settings, Zap } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();

  if (pathname === "/login") return null;

  const routes = [
    {
      href: "/finance",
      label: "Dashboard",
      icon: Home,
    },
    {
      href: "/finance/transactions",
      label: "Activity",
      icon: List,
    },

    {
      href: "/finance/ev-stats",
      label: "Energy",
      icon: Zap,
    },
    {
      href: "/finance/profile",
      label: "Settings",
      icon: Settings,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card/80 backdrop-blur-lg border-t border-white/5 pb-safe">
      <div className="flex justify-around items-center h-16">
        {routes.map((route) => {
          const isActive = pathname === route.href;
          return (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full gap-1 transition-colors relative group",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <div className="relative">
                {isActive && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute -inset-2 bg-primary/10 rounded-xl -z-10"
                    transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
                  />
                )}
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="relative z-10"
                >
                  <route.icon
                    className={cn("w-6 h-6", isActive && "fill-current/20")}
                  />
                </motion.div>
              </div>
              <span className={cn(
                "text-[9px] font-black uppercase tracking-tighter transition-all",
                isActive ? "opacity-100" : "opacity-50 group-hover:opacity-100"
              )}>
                {route.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
