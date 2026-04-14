import { cn } from "@/lib/utils";
import { HTMLAttributes, forwardRef } from "react";

interface NeoCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "glass" | "outline";
}

const NeoCard = forwardRef<HTMLDivElement, NeoCardProps>(
  ({ className, variant = "glass", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-2xl transition-all duration-300",
          variant === "glass" &&
            "bg-card/40 backdrop-blur-xl border border-white/5 shadow-lg",
          variant === "default" && "bg-card border border-border shadow-sm",
          variant === "outline" && "bg-transparent border border-border",
          className,
        )}
        {...props}
      />
    );
  },
);
NeoCard.displayName = "NeoCard";

export { NeoCard };
