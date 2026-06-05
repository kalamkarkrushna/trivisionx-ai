"use client";

import {
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
  useEffect,
} from "react";
import { Send, Loader2, Plus, Mic, StopCircle, Paperclip, ChevronDown, FlaskConical, Zap, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ComposerActionsPopover from "./ComposerActionsPopover";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

// ─── Mode definitions ──────────────────────────────────────────────────────────
const MODES = [
  {
    id: "research",
    label: "Research",
    shortLabel: "Research",
    icon: FlaskConical,
    description: "Full RAG pipeline — searches your documents & cites sources",
    gradient: "from-violet-500 to-blue-600",
    badge: "RAG",
    badgeColor: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
    ringColor: "ring-violet-400/30",
    dotColor: "bg-violet-500",
  },
  {
    id: "simple",
    label: "Quick Answer",
    shortLabel: "Quick",
    icon: Zap,
    description: "Direct LLM answer — fast response without document search",
    gradient: "from-amber-400 to-orange-500",
    badge: "LLM",
    badgeColor: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    ringColor: "ring-amber-400/30",
    dotColor: "bg-amber-400",
  },
];

// ─── Mode Selector Dropdown ───────────────────────────────────────────────────
function ModeSelector({ mode, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const dropdownRef = useRef(null);
  const current = MODES.find((m) => m.id === mode) || MODES[0];
  const Icon = current.icon;

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleOutside(e) {
      if (
        ref.current && !ref.current.contains(e.target) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      {/* Trigger button — plain button, no Tooltip wrapper to avoid event conflicts */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        title={`${current.label}: ${current.description}`}
        className={cn(
          "group flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-all duration-200 select-none",
          "border-zinc-200 bg-zinc-50 text-zinc-600 hover:border-zinc-300 hover:bg-white hover:shadow-sm",
          "dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-700/80",
          open && "border-zinc-300 bg-white shadow-sm dark:border-zinc-600 dark:bg-zinc-700/80",
        )}
      >
        <span className={cn("h-1.5 w-1.5 rounded-full shrink-0 transition-colors", current.dotColor)} />
        <Icon className="h-3 w-3" />
        <span>{current.shortLabel}</span>
        <ChevronDown
          className={cn(
            "h-2.5 w-2.5 text-zinc-400 transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      {/* Dropdown — rendered with AnimatePresence, positioned above the button */}
      <AnimatePresence>
        {open && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            // Position above the trigger button
            className="absolute bottom-[calc(100%+8px)] left-0 z-[9999] w-64 rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-900 overflow-hidden"
            style={{ minWidth: "256px" }}
          >
            {/* Header */}
            <div className="border-b border-zinc-100 dark:border-zinc-800 px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Answer Mode
              </p>
            </div>

            {/* Mode options */}
            <div className="p-1.5 space-y-0.5">
              {MODES.map((m) => {
                const MIcon = m.icon;
                const isActive = m.id === mode;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onChange(m.id);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors duration-100",
                      isActive
                        ? "bg-zinc-100 dark:bg-zinc-800"
                        : "hover:bg-zinc-50 dark:hover:bg-zinc-800/70 active:bg-zinc-100 dark:active:bg-zinc-800",
                    )}
                  >
                    {/* Icon */}
                    <div
                      className={cn(
                        "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm",
                        m.gradient,
                      )}
                    >
                      <MIcon className="h-4 w-4" />
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100">
                          {m.label}
                        </span>
                        <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-bold leading-none", m.badgeColor)}>
                          {m.badge}
                        </span>
                        {isActive && (
                          <span className="ml-auto flex h-4 w-4 items-center justify-center rounded-full bg-zinc-900 dark:bg-white shrink-0">
                            <svg
                              className="h-2.5 w-2.5 text-white dark:text-zinc-900"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={3}
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-[11px] leading-snug text-zinc-500 dark:text-zinc-400">
                        {m.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Composer ────────────────────────────────────────────────────────────
const Composer = forwardRef(function Composer({ onSend, busy, defaultMode = "research" }, ref) {
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [mode, setMode] = useState(defaultMode);
  const inputRef = useRef(null);

  // Auto-grow textarea
  useEffect(() => {
    if (!inputRef.current) return;
    const ta = inputRef.current;
    const lineHeight = 24;
    ta.style.height = "auto";
    const lines = Math.max(1, Math.ceil(ta.scrollHeight / lineHeight));
    if (lines <= 12) {
      ta.style.height = `${Math.max(24, ta.scrollHeight)}px`;
      ta.style.overflowY = "hidden";
    } else {
      ta.style.height = `${12 * lineHeight}px`;
      ta.style.overflowY = "auto";
    }
  }, [value]);

  useImperativeHandle(
    ref,
    () => ({
      insertTemplate: (templateContent) => {
        setValue((prev) => {
          const next = prev ? `${prev}\n\n${templateContent}` : templateContent;
          setTimeout(() => {
            inputRef.current?.focus();
            inputRef.current?.setSelectionRange(next.length, next.length);
          }, 0);
          return next;
        });
      },
      setValue: (text) => {
        setValue(text);
        setTimeout(() => inputRef.current?.focus(), 0);
      },
      focus: () => inputRef.current?.focus(),
      getMode: () => mode,
    }),
    [mode],
  );

  async function handleSend() {
    if (!value.trim() || sending || busy) return;
    const text = value;
    setValue("");
    setSending(true);
    try {
      // Pass both text and the current mode to the parent
      await onSend?.(text, mode);
    } finally {
      setSending(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  const hasContent = value.trim().length > 0;
  const currentMode = MODES.find((m_) => m_.id === mode) || MODES[0];

  return (
    <div className="px-3 pb-2 pt-2">
      {/* Input card — NOTE: no overflow-hidden so the mode dropdown can escape upward */}
      <div
        className={cn(
          "mx-auto max-w-3xl rounded-2xl border bg-background transition-all duration-200",
          isFocused
            ? "border-primary/50 shadow-[0_0_0_3px_rgba(var(--primary),0.1)]"
            : "border-border shadow-sm",
        )}
      >
        {/* Top focus highlight bar */}
        {isFocused && (
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        )}

        {/* Textarea */}
        <div className="px-4 pt-3.5 pb-1">
          <textarea
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={
              mode === "research"
                ? "Ask a research question… (searches your documents)"
                : "Ask anything… (quick LLM answer)"
            }
            rows={1}
            className="w-full resize-none bg-transparent text-[15px] leading-relaxed text-foreground outline-none placeholder:text-muted-foreground scrollbar-thin"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between px-2 pb-2 pt-1">
          {/* Left: Attach + Mode selector */}
          <div className="flex items-center gap-1.5">
            <Tooltip>
              <ComposerActionsPopover>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
              </ComposerActionsPopover>
              <TooltipContent side="top">Attach file</TooltipContent>
            </Tooltip>

            {/* ── Mode Selector ── */}
            <ModeSelector mode={mode} onChange={setMode} />
          </div>

          {/* Right: Mic + Send */}
          <div className="flex items-center gap-1.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
                >
                  <Mic className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Voice input</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleSend}
                  disabled={!hasContent && !busy}
                  size="icon"
                  className={cn(
                    "h-8 w-8 rounded-full transition-all duration-200",
                    hasContent || busy
                      ? `bg-gradient-to-br ${currentMode.gradient} text-white shadow-md hover:opacity-90 hover:scale-105`
                      : "bg-muted text-muted-foreground cursor-not-allowed opacity-50",
                  )}
                >
                  {sending || busy ? (
                    <StopCircle className="h-4 w-4" />
                  ) : (
                    <Send className="h-4 w-4 ml-0.5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                {busy ? "Stop" : `Send · ${currentMode.label} mode`}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  );
});

export default Composer;
