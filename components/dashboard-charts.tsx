"use client";

import { CategoryDonutChart } from "./category-donut-chart";
import { NeoCard } from "./ui/neo-card";
import { TrendingDown } from "lucide-react";

interface CategoryStat {
  name: string;
  value: number;
  color: string;
}

interface DashboardChartsProps {
  categoryStats: CategoryStat[];
}

export function DashboardCharts({ categoryStats }: DashboardChartsProps) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
          <h2 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">
            Distribución de Gastos
          </h2>
        </div>
      </div>

      <NeoCard className="h-64 flex flex-col items-center justify-center relative overflow-hidden p-6 pb-2">
        <div className="absolute inset-0 pointer-events-none opacity-30 bg-gradient-to-br from-rose-500/10 to-transparent" />
        <div className="w-full h-full relative z-10">
          <CategoryDonutChart data={categoryStats} type="EXPENSE" />
        </div>
      </NeoCard>
    </section>
  );
}
