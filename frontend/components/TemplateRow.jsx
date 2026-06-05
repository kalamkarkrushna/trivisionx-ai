"use client";

import { useState, useRef, useEffect } from "react";
import { FileText, MoreHorizontal, Copy, Edit3, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function TemplateRow({
  template,
  onUseTemplate,
  onEditTemplate,
  onRenameTemplate,
  onDeleteTemplate,
}) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu]);

  const handleUse = () => {
    onUseTemplate?.(template);
    setShowMenu(false);
  };

  const handleEdit = () => {
    onEditTemplate?.(template);
    setShowMenu(false);
  };

  const handleRename = () => {
    const newName = prompt(
      `Rename template "${template.name}" to:`,
      template.name,
    );
    if (newName && newName.trim() && newName !== template.name) {
      onRenameTemplate?.(template.id, newName.trim());
    }
    setShowMenu(false);
  };

  const handleDelete = () => {
    if (
      confirm(
        `Are you sure you want to delete the template "${template.name}"?`,
      )
    ) {
      onDeleteTemplate?.(template.id);
    }
    setShowMenu(false);
  };

  return (
    <div className="group">
      <div className="flex items-center justify-between rounded-lg px-2 py-2 text-sm transition-all duration-200 border border-transparent hover:bg-white/40 hover:border-white/50 hover:shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:hover:bg-white/[0.04] dark:hover:border-white/[0.06]">
        <button
          onClick={handleUse}
          className="group/btn flex items-center gap-2 flex-1 text-left min-w-0"
          title={`Use template: ${template.snippet}`}
        >
          <FileText className="h-4 w-4 text-zinc-500 shrink-0 group-hover/btn:text-violet-500 dark:text-zinc-500 dark:group-hover/btn:text-violet-400 transition-colors" />
          <div className="min-w-0 flex-1">
            <div className="truncate font-medium text-zinc-700 group-hover/btn:text-zinc-900 dark:text-zinc-300 dark:group-hover/btn:text-zinc-100 transition-colors">{template.name}</div>
            <div className="truncate text-xs text-zinc-500 dark:text-zinc-400 group-hover/btn:text-zinc-600 dark:group-hover/btn:text-zinc-300 transition-colors">
              {template.snippet}
            </div>
          </div>
        </button>

        <div className="flex items-center gap-1">
          <span className="hidden group-hover:inline text-xs text-zinc-500 dark:text-zinc-400 px-1">
            Use
          </span>

          <div className="relative" ref={menuRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-black/10 dark:hover:bg-[#2f2f2f] transition-opacity"
            >
              <MoreHorizontal className="h-3 w-3" />
            </button>

            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute right-0 top-full mt-1 w-36 rounded-lg border border-black/10 bg-white py-1 shadow-lg dark:border-white/10 dark:bg-[#2f2f2f] z-[100]"
                >
                  <button
                    onClick={handleUse}
                    className="w-full px-3 py-1.5 text-left text-xs hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-2"
                  >
                    <Copy className="h-3 w-3" />
                    Use Template
                  </button>
                  <button
                    onClick={handleEdit}
                    className="w-full px-3 py-1.5 text-left text-xs hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-2"
                  >
                    <Edit3 className="h-3 w-3" />
                    Edit
                  </button>
                  <button
                    onClick={handleRename}
                    className="w-full px-3 py-1.5 text-left text-xs hover:bg-black/5 dark:hover:bg-white/5"
                  >
                    Rename
                  </button>
                  <button
                    onClick={handleDelete}
                    className="w-full px-3 py-1.5 text-left text-xs text-red-600 hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-2"
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
