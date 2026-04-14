"use client";

import { ButtonHTMLAttributes, forwardRef, type ForwardedRef } from "react";
import { cn } from "@/lib/utils";
import { motion, type HTMLMotionProps } from "framer-motion";
import { Loader2 } from "lucide-react";

interface NeoButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "accent" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  isLoading?: boolean;
}

const NeoButton = forwardRef(
  (
    {
      className,
      variant = "primary",
      size = "default",
      isLoading,
      children,
      ...props
    }: NeoButtonProps,
    ref: ForwardedRef<HTMLButtonElement>,
  ) => {
    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.95 }}
        whileHover={{ opacity: 0.9 }}
        disabled={isLoading || props.disabled}
        className={cn(
          "inline-flex items-center justify-center rounded-2xl font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 gap-2",
          "shadow-lg shadow-black/20",
          {
            "bg-primary text-primary-foreground hover:bg-primary/90":
              variant === "primary",
            "bg-secondary text-secondary-foreground hover:bg-secondary/90":
              variant === "secondary",
            "bg-accent text-accent-foreground hover:bg-accent/90":
              variant === "accent",
            "hover:bg-accent/10 hover:text-accent": variant === "ghost",
            "h-12 px-6 py-3 text-base": size === "default",
            "h-9 px-4 text-sm": size === "sm",
            "h-14 px-8 text-lg": size === "lg",
            "h-12 w-12 p-0 rounded-full": size === "icon",
          },
          className,
        )}
        {...(props as HTMLMotionProps<"button">)}
      >
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : children}
      </motion.button>
    );
  },
);
NeoButton.displayName = "NeoButton";

export { NeoButton };
