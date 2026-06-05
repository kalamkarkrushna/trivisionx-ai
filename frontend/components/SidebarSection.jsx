import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cls } from "./utils";

export default function SidebarSection({
  title,
  children,
  collapsed,
  onToggle,
}) {
  return (
    <section className="flex flex-col">
      <button
        onClick={onToggle}
        aria-expanded={!collapsed}
        className={cls(
          "group relative flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 mt-2 text-left",
          "border transition-all duration-200",
          "border-white/60 bg-white/40 backdrop-blur-sm shadow-[0_1px_4px_rgba(0,0,0,0.06)]",
          "hover:border-violet-200/80 hover:bg-white/70 hover:shadow-[0_2px_8px_rgba(124,58,237,0.08)]",
          "dark:border-white/[0.07] dark:bg-white/[0.04] dark:backdrop-blur-sm dark:shadow-[0_1px_4px_rgba(0,0,0,0.3)]",
          "dark:hover:border-violet-500/30 dark:hover:bg-white/[0.07] dark:hover:shadow-[0_2px_8px_rgba(124,58,237,0.12)]",
          "active:scale-[0.99]",
        )}
      >
        {/* Subtle glow line at top */}
        <span className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-t-xl bg-gradient-to-r from-transparent via-violet-300/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 dark:via-violet-500/30" />

        <span className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-zinc-500 group-hover:text-violet-600 dark:text-zinc-400 dark:group-hover:text-violet-400 transition-colors duration-200">
          {title}
        </span>

        <span className={cls(
          "flex h-4 w-4 items-center justify-center rounded-md transition-all duration-200",
          "bg-zinc-100/80 group-hover:bg-violet-100 dark:bg-white/[0.06] dark:group-hover:bg-violet-500/20",
        )}>
          <ChevronDown
            className={cls(
              "h-2.5 w-2.5 transition-all duration-200",
              "text-zinc-400 group-hover:text-violet-500 dark:text-zinc-500 dark:group-hover:text-violet-400",
              collapsed ? "-rotate-90" : "rotate-0",
            )}
          />
        </span>
      </button>

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="space-y-px overflow-hidden pt-0.5"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
