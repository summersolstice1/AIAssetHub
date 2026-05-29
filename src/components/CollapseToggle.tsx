import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface CollapseToggleProps {
  collapsed: boolean;
  onToggle: () => void;
  className?: string;
}

export default function CollapseToggle({ collapsed, onToggle, className }: CollapseToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "flex items-center gap-1.5 rounded-xl border border-white/5 bg-slate-900/70 px-3 py-1.5 text-xs font-semibold text-slate-300 transition-all hover:bg-slate-800 hover:text-emerald-300",
        className
      )}
    >
      <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", collapsed ? "" : "rotate-180")} />
      <span>{collapsed ? "展开" : "收纳"}</span>
    </button>
  );
}
