"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from "recharts";
import { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface CategoryStat {
  name: string;
  value: number;
  color: string;
}

export function CategoryDonutChart({
  data,
  type = "EXPENSE",
}: {
  data: CategoryStat[];
  type?: "EXPENSE" | "INCOME";
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const handle = window.requestAnimationFrame(() => {
      setMounted(true);
    });
    return () => window.cancelAnimationFrame(handle);
  }, []);

  const totalValue = data.reduce((acc, curr) => acc + curr.value, 0);

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="w-24 h-24 rounded-full border-4 border-muted/20 flex items-center justify-center">
          <span className="text-[10px] text-muted-foreground text-center px-4 uppercase font-black">
            Sin datos
          </span>
        </div>
      </div>
    );
  }

  const onPieEnter = (_: unknown, index: number) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(null);
  };

  const renderActiveShape = (props: {
    cx: number;
    cy: number;
    innerRadius: number;
    outerRadius: number;
    startAngle: number;
    endAngle: number;
    fill: string;
  }) => {
    const { cx, cy, outerRadius, startAngle, endAngle, fill } = props;

    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={0}
          outerRadius={outerRadius + 6}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          stroke="none"
        />
      </g>
    );
  };

  return (
    <div className="w-full h-full flex flex-col pt-1">
      <div className="flex-1 flex items-center gap-4 min-h-0 relative">
        {/* Pie on the Left */}
        <div className="flex-1 h-full min-w-0">
          {mounted && (
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <PieChart>
                <PieWithActive
                  activeIndex={activeIndex !== null ? activeIndex : undefined}
                  activeShape={renderActiveShape}
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={0}
                  outerRadius={65}
                  paddingAngle={2}
                  dataKey="value"
                  onMouseEnter={onPieEnter}
                  onMouseLeave={onPieLeave}
                  stroke="#000"
                  strokeWidth={1}
                  animationBegin={0}
                  animationDuration={800}
                >
                  {data.map((entry: CategoryStat, index: number) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      className="outline-none"
                      style={{
                        filter:
                          activeIndex === index
                            ? `drop-shadow(0 0 10px ${entry.color}80)`
                            : "none",
                        opacity:
                          activeIndex === null || activeIndex === index ? 1 : 0.6,
                        transition: "all 0.3s ease",
                      }}
                    />
                  ))}
                </PieWithActive>
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Total on the Right */}
        <div className="flex flex-col items-center justify-center pr-4">
          <span className="text-[9px] text-muted-foreground uppercase font-black tracking-widest leading-none mb-1 opacity-90">
            {type === "EXPENSE" ? "Total Gastos" : "Total Ingresos"}
          </span>
          <span className="text-2xl font-black bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent tracking-tighter">
            {formatCurrency(totalValue)}
          </span>
        </div>
      </div>

      {/* Selected Category Details at Bottom */}
      <div className="h-16 mt-2 flex items-center border-t border-white/5 pt-3">
        <AnimatePresence mode="wait">
          {activeIndex !== null ? (
            <motion.div
              key="active-info"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="flex w-full justify-between items-center"
            >
              <div className="flex flex-col flex-1 truncate">
                <span className="text-muted-foreground/80 text-[8px] font-black uppercase tracking-widest leading-none mb-1">
                  Categoría
                </span>
                <span className="text-foreground font-black uppercase text-sm italic tracking-tighter truncate">
                  {data[activeIndex].name}
                </span>
              </div>

              <div className="flex flex-col items-end pl-4 shrink-0">
                <span className="text-muted-foreground/80 text-[8px] font-black uppercase tracking-widest leading-none mb-1">
                  {type === "EXPENSE" ? "Valor / % Gasto" : "Valor / % Ingreso"}
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className="text-base font-black tracking-tighter"
                    style={{ color: data[activeIndex].color }}
                  >
                    {formatCurrency(data[activeIndex].value)}
                  </span>
                  <div className="bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                    <span className="text-[10px] font-black italic text-primary">
                      {((data[activeIndex].value / totalValue) * 100).toFixed(
                        1,
                      )}
                      %
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="default-info"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full text-center"
            >
              <span className="text-muted-foreground/70 italic text-[10px] uppercase font-black tracking-widest">
                Toca una categoría para detalles
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

const PieWithActive = Pie as React.ElementType;
