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
    <div className="flex gap-4 overflow-x-auto pb-4 pt-2 -mx-2 px-2 scrollbar-hide snap-x h-[110px]">
      {categories.map((cat) => {
        const isSelected = selectedId === cat.id;
        const color = cat.color || "#888888";

        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelect(cat.id)}
            className="flex flex-col items-center gap-2 group snap-center min-w-[70px]"
          >
            <div
              className={cn(
                "w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 border",
                isSelected
                  ? "shadow-lg scale-110"
                  : "shadow-[inset_0_0_10px_rgba(0,0,0,0.2)] hover:scale-105 opacity-80 hover:opacity-100",
              )}
              style={{
                borderColor: color,
                color: color,
                backgroundColor: isSelected ? `${color}30` : `${color}10`,
                boxShadow: isSelected ? `0 0 20px ${color}40` : undefined,
              }}
            >
              <Car className="w-6 h-6 stroke-[2.5]" />
            </div>
            <span
              className={cn(
                "text-[10px] font-bold text-center transition-colors truncate w-full uppercase tracking-tighter",
                isSelected
                  ? "text-foreground font-black"
                  : "text-muted-foreground",
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
