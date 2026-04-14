"use client";

import { Home, List, User, Zap } from "lucide-react";
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
      label: "Profile",
      icon: User,
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
                "flex flex-col items-center justify-center w-full h-full gap-1 transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <route.icon
                className={cn("w-6 h-6", isActive && "fill-current/20")}
              />
              <span className="text-[10px] font-medium">{route.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
