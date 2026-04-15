"use client";

import { cn } from "@/lib/utils";
import { type Category } from "@/app/actions/transactions";
import { Car } from "lucide-react";

interface CategorySelectorProps {
  categories: Category[];
  selectedId?: string;
  onSelect: (id: string) => void;
}

export function CategorySelector({
  categories,
  selectedId,
  onSelect,
}: CategorySelectorProps) {
  return (
    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-4 lg:grid-cols-5 gap-x-2 gap-y-6 max-h-[320px] overflow-y-auto pr-2 pt-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent custom-scrollbar">
      {categories.map((cat) => {
        const isSelected = selectedId === cat.id;
        const color = cat.color || "#888888";

        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelect(cat.id)}
            className="flex flex-col items-center gap-2 group transition-transform active:scale-95"
          >
            <div
              className={cn(
                "w-16 h-16 rounded-[2rem] flex items-center justify-center transition-all duration-300 border-2",
                isSelected
                  ? "shadow-[0_0_25px_-5px_rgba(0,0,0,0.5)] scale-110"
                  : "opacity-70 hover:opacity-100 hover:scale-105",
              )}
              style={{
                borderColor: isSelected ? color : `${color}40`,
                color: isSelected ? "#fff" : color,
                backgroundColor: isSelected ? color : `${color}10`,
                boxShadow: isSelected ? `0 10px 30px -10px ${color}80` : undefined,
              }}
            >
              <Car className={cn("w-7 h-7 stroke-[2.5]", isSelected && "drop-shadow-lg")} />
            </div>
            <span
              className={cn(
                "text-[10px] font-black text-center transition-all uppercase tracking-tight leading-none px-0.5 break-words w-full",
                isSelected
                  ? "text-white opacity-100"
                  : "text-white/70 group-hover:text-white",
              )}
            >
              {cat.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}



