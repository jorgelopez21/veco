import {
  CircleHelp,
  Utensils,
  Car,
  Home,
  Gamepad2,
  ShoppingBag,
  Briefcase,
  TrendingUp,
  Laptop,
  Heart,
  Book,
  Plane,
  Circle,
  type LucideIcon,
} from "lucide-react";

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  CircleHelp,
  Utensils,
  Car,
  Home,
  Gamepad2,
  ShoppingBag,
  Briefcase,
  TrendingUp,
  Laptop,
  Heart,
  Book,
  Plane,
  Circle,
};

export function getCategoryIcon(): LucideIcon {
  return Car;
}
