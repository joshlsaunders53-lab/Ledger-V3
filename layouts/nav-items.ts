import { Home, Play, CalendarDays, Sparkles, BarChart3, BookOpen, Flame, type LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  live: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/home", label: "Home", icon: Home, live: true },
  { href: "/session", label: "Session", icon: Play, live: true },
  { href: "/history", label: "History", icon: CalendarDays, live: true },
  { href: "/journal", label: "Journal", icon: BookOpen, live: true },
  { href: "/habits", label: "Habits", icon: Flame, live: true },
  { href: "/analytics", label: "Analytics", icon: BarChart3, live: true },
  { href: "/coach", label: "Coach", icon: Sparkles, live: true },
];
