"use client";
import { motion, AnimatePresence } from "framer-motion";
import {
  PanelLeftClose,
  PanelLeftOpen,
  SearchIcon,
  Plus,
  FolderIcon,
  Settings,
  PenSquare,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { TrishulLogo } from "./TrishulLogo";
import SidebarSection from "./SidebarSection";
import ConversationRow from "./ConversationRow";
import FolderRow from "./FolderRow";
import TemplateRow from "./TemplateRow";
import FolderPopover from "./CreateFolderModal";
import TemplatePopover from "./CreateTemplateModal";
import SearchPopover from "./SearchModal";
import SettingsPopover from "./SettingsPopover";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { cls } from "./utils";
import { useState, useEffect } from "react";

// ── Date grouping helpers ────────────────────────────────────────────────────
function groupByDate(conversations) {
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  const startOf7DaysAgo = new Date(startOfToday);
  startOf7DaysAgo.setDate(startOfToday.getDate() - 7);
  const startOf30DaysAgo = new Date(startOfToday);
  startOf30DaysAgo.setDate(startOfToday.getDate() - 30);

  const groups = {
    Today: [],
    Yesterday: [],
    "Previous 7 Days": [],
    "Previous 30 Days": [],
    Older: [],
  };

  for (const c of conversations) {
    const d = new Date(c.updatedAt || c.updated_at || 0);
    if (d >= startOfToday) groups["Today"].push(c);
    else if (d >= startOfYesterday) groups["Yesterday"].push(c);
    else if (d >= startOf7DaysAgo) groups["Previous 7 Days"].push(c);
    else if (d >= startOf30DaysAgo) groups["Previous 30 Days"].push(c);
    else groups["Older"].push(c);
  }
  return groups;
}

// ── Icon button reused throughout ───────────────────────────────────────────
function SidebarIconBtn({ onClick, title, children }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="group relative inline-flex h-7 w-7 items-center justify-center rounded-lg border border-white/60 bg-white/40 backdrop-blur-sm text-zinc-500 shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-all duration-200 hover:border-violet-200/80 hover:bg-white/80 hover:text-violet-600 hover:shadow-[0_2px_8px_rgba(124,58,237,0.15)] active:scale-95 dark:border-white/[0.06] dark:bg-white/[0.04] dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-400 dark:hover:shadow-[0_2px_8px_rgba(124,58,237,0.2)]"
    >
      {children}
    </button>
  );
}

// ── Collapsed rail ───────────────────────────────────────────────────────────
function CollapsedSidebar({
  setSidebarCollapsed,
  createNewChat,
  conversations,
  selectedId,
  onSelect,
  onUserUpdate,
}) {
  return (
    <motion.aside
      initial={{ width: 240 }}
      animate={{ width: 48 }}
      transition={{ type: "spring", stiffness: 280, damping: 30 }}
      className="z-50 flex h-full shrink-0 flex-col border-r border-white/40 bg-white/60 backdrop-blur-xl dark:border-white/[0.06] dark:bg-zinc-950/80"
    >
      <div className="flex items-center justify-center border-b border-white/50 px-1.5 py-2.5 dark:border-white/[0.06]">
        <SidebarIconBtn
          onClick={() => setSidebarCollapsed(false)}
          title="Open sidebar"
        >
          <PanelLeftOpen className="h-3.5 w-3.5" />
        </SidebarIconBtn>
      </div>

      <div className="flex flex-1 flex-col items-center gap-1.5 pt-3 px-1">
        <SidebarIconBtn onClick={createNewChat} title="New Chat">
          <PenSquare className="h-3.5 w-3.5" />
        </SidebarIconBtn>

        <SearchPopover
          conversations={conversations}
          onSelect={onSelect}
          createNewChat={createNewChat}
        >
          <SidebarIconBtn title="Search">
            <SearchIcon className="h-3.5 w-3.5" />
          </SidebarIconBtn>
        </SearchPopover>

        <FolderPopover
          onCreateFolder={() => {
            setSidebarCollapsed(false);
          }}
        >
          <SidebarIconBtn title="Folders">
            <FolderIcon className="h-3.5 w-3.5" />
          </SidebarIconBtn>
        </FolderPopover>
      </div>

      <div className="flex flex-col items-center gap-1 pb-3 px-1">
        <SettingsPopover onUserUpdate={onUserUpdate}>
          <SidebarIconBtn title="Settings">
            <Settings className="h-3.5 w-3.5" />
          </SidebarIconBtn>
        </SettingsPopover>
      </div>
    </motion.aside>
  );
}

// ── Main Sidebar ─────────────────────────────────────────────────────────────
export default function Sidebar({
  open,
  onClose,
  collapsed,
  setCollapsed,
  conversations,
  pinned,
  recent,
  folders,
  folderCounts,
  selectedId,
  onSelect,
  togglePin,
  query,
  setQuery,
  searchRef,
  createFolder,
  deleteFolder,
  renameFolder,
  createNewChat,
  templates = [],
  setTemplates = () => { },
  onUseTemplate = () => { },
  sidebarCollapsed = false,
  setSidebarCollapsed = () => { },
  onDeleteConversation = () => { },
  onRenameConversation = () => { },
  user = null,
  onUserUpdate = () => { },
}) {
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [expandedFolder, setExpandedFolder] = useState(null);

  useEffect(() => {
    const timer = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(timer);
  }, []);

  const toggleGroup = (label) => {
    setCollapsedGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const getConversationsByFolder = (folderName) =>
    conversations.filter((c) => c.folder === folderName);

  const handleCreateFolder = (name) => createFolder(name);
  const handleDeleteFolder = (name) => deleteFolder?.(name);
  const handleRenameFolder = (old, next) => renameFolder?.(old, next);

  const handleCreateTemplate = (data) => {
    if (editingTemplate) {
      setTemplates(
        templates.map((t) =>
          t.id === editingTemplate.id ? { ...data, id: editingTemplate.id } : t,
        ),
      );
      setEditingTemplate(null);
    } else {
      setTemplates([...templates, { ...data, id: Date.now().toString() }]);
    }
  };

  const handleEditTemplate = (t) => {
    setEditingTemplate(t);
  };
  const handleRenameTemplate = (id, name) =>
    setTemplates(templates.map((t) => (t.id === id ? { ...t, name } : t)));
  const handleDeleteTemplate = (id) =>
    setTemplates(templates.filter((t) => t.id !== id));
  const handleUseTemplate = (t) => onUseTemplate(t);

  const userInitials = user
    ? (
      (user.first_name?.[0] || "") + (user.last_name?.[0] || "")
    ).toUpperCase() ||
    user.username?.[0]?.toUpperCase() ||
    "U"
    : "U";
  const userName = user
    ? `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.username
    : "Loading…";

  const nonPinned = (recent || []).filter((c) => !c.pinned);
  const grouped = groupByDate(nonPinned);
  const groupOrder = [
    "Today",
    "Yesterday",
    "Previous 7 Days",
    "Previous 30 Days",
    "Older",
  ];

  if (sidebarCollapsed) {
    return (
      <CollapsedSidebar
        setSidebarCollapsed={setSidebarCollapsed}
        createNewChat={createNewChat}
        conversations={conversations}
        selectedId={selectedId}
        onSelect={onSelect}
        onUserUpdate={onUserUpdate}
      />
    );
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {(open || mounted) && (
          <motion.aside
            key="sidebar"
            initial={{ x: -240 }}
            animate={{ x: 0 }}
            exit={{ x: -240 }}
            transition={{ type: "spring", stiffness: 280, damping: 30 }}
            className={cls(
              "z-50 flex h-full w-[240px] shrink-0 flex-col",
              "border-r border-white/50 bg-white/70 backdrop-blur-xl",
              "dark:border-white/[0.06] dark:bg-zinc-950/80 dark:backdrop-blur-xl",
              "fixed inset-y-0 left-0 md:static md:translate-x-0",
              "shadow-[1px_0_20px_rgba(0,0,0,0.06)] md:shadow-[1px_0_20px_rgba(0,0,0,0.04)]",
            )}
          >
            {/* Header */}
            <div className="relative flex items-center gap-1.5 border-b border-white/50 px-2.5 py-2 dark:border-white/[0.06] bg-white/30 dark:bg-white/[0.02] backdrop-blur-sm">
              {/* Subtle top glow */}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-300/50 to-transparent dark:via-violet-500/20" />

              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <TrishulLogo
                  size="sm"
                  showWordmark
                  wordmark="Trishul AI"
                  animate={false}
                />
              </div>

              <div className="flex items-center gap-0.5">
                <SidebarIconBtn onClick={createNewChat} title="New Chat (⌘N)">
                  <PenSquare className="h-3.5 w-3.5" />
                </SidebarIconBtn>
                <SidebarIconBtn
                  onClick={() => setSidebarCollapsed(true)}
                  title="Collapse sidebar"
                >
                  <PanelLeftClose className="h-3.5 w-3.5 hidden md:block" />
                </SidebarIconBtn>
                <button
                  onClick={onClose}
                  className="md:hidden inline-flex h-7 w-7 items-center justify-center rounded-lg border border-white/60 bg-white/40 backdrop-blur-sm text-zinc-500 shadow-sm transition-all hover:border-violet-200/80 hover:bg-white/80 hover:text-violet-600 dark:border-white/[0.06] dark:bg-white/[0.04] dark:text-zinc-400 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 active:scale-95"
                >
                  <PanelLeftClose className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="px-2.5 pt-2.5 space-y-2">
              {/* New Chat — glass button */}
              <button
                onClick={createNewChat}
                className="group relative flex w-full items-center justify-between overflow-hidden rounded-xl border border-white/70 bg-white/60 px-3 py-2 backdrop-blur-sm shadow-[0_1px_6px_rgba(0,0,0,0.07)] transition-all duration-200 hover:border-violet-200/80 hover:bg-white/90 hover:shadow-[0_4px_16px_rgba(124,58,237,0.14)] active:scale-[0.98] dark:border-white/[0.08] dark:bg-white/[0.05] dark:hover:border-violet-500/40 dark:hover:bg-violet-500/10 dark:hover:shadow-[0_4px_16px_rgba(124,58,237,0.2)]"
              >
                {/* Shimmer sweep */}
                <span className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/50 to-transparent dark:via-white/10" />
                <div className="flex items-center gap-2">
                  <div className="flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-br from-violet-100 to-blue-100 text-violet-700 dark:from-violet-500/20 dark:to-blue-500/20 dark:text-violet-400 shadow-sm">
                    <Plus className="h-3 w-3" />
                  </div>
                  <span className="text-[12px] font-semibold text-zinc-800 group-hover:text-violet-700 dark:text-zinc-200 dark:group-hover:text-violet-400 transition-colors">
                    New Chat
                  </span>
                </div>
                <div className="rounded-md border border-zinc-100/80 bg-zinc-50/80 px-1 py-0.5 text-[10px] font-bold text-zinc-400 dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-zinc-500">
                  ⌘N
                </div>
              </button>

              {/* Search — glass input */}
              <div className="relative group">
                <SearchPopover
                  conversations={conversations}
                  onSelect={onSelect}
                  createNewChat={createNewChat}
                >
                  <div className="relative">
                    <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-400 group-focus-within:text-violet-500 dark:group-focus-within:text-violet-400 transition-colors" />
                    <input
                      ref={searchRef}
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search chats…"
                      className="w-full rounded-xl border border-white/70 bg-white/50 backdrop-blur-sm py-1.5 pl-8 pr-2.5 text-[12px] text-zinc-800 placeholder:text-zinc-400 outline-none ring-0 shadow-[0_1px_4px_rgba(0,0,0,0.05)] transition-all hover:border-violet-200/60 hover:bg-white/70 focus:border-violet-300/80 focus:bg-white/90 focus:shadow-[0_0_0_3px_rgba(124,58,237,0.1)] dark:border-white/[0.07] dark:bg-white/[0.04] dark:text-zinc-200 dark:placeholder:text-zinc-600 dark:hover:border-violet-500/20 dark:focus:border-violet-500/40 dark:focus:shadow-[0_0_0_3px_rgba(124,58,237,0.15)] cursor-pointer"
                      readOnly
                    />
                  </div>
                </SearchPopover>
              </div>
            </div>

            {/* Nav */}
            <nav className="mt-1 flex min-h-0 flex-1 flex-col overflow-y-auto px-2 pb-2 scrollbar-thin scrollbar-thumb-zinc-200/60 dark:scrollbar-thumb-zinc-800/60">
              {/* Folders Dropdown */}
              <div className="mt-2 relative">
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      className={cls(
                        "group relative flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-left",
                        "border transition-all duration-200",
                        "border-white/60 bg-white/40 backdrop-blur-sm shadow-[0_1px_4px_rgba(0,0,0,0.06)]",
                        "hover:border-violet-200/80 hover:bg-white/70 hover:shadow-[0_2px_8px_rgba(124,58,237,0.08)]",
                        "dark:border-white/[0.07] dark:bg-white/[0.04] dark:backdrop-blur-sm dark:shadow-[0_1px_4px_rgba(0,0,0,0.3)]",
                        "dark:hover:border-violet-500/30 dark:hover:bg-white/[0.07] dark:hover:shadow-[0_2px_8px_rgba(124,58,237,0.12)]",
                        "active:scale-[0.99]",
                      )}
                    >
                      <span className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-t-xl bg-gradient-to-r from-transparent via-violet-300/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 dark:via-violet-500/30" />
                      <div className="flex items-center gap-2">
                        <FolderIcon className="h-3.5 w-3.5 text-zinc-400 group-hover:text-violet-500 dark:text-zinc-500 dark:group-hover:text-violet-400 transition-colors" />
                        <span className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-zinc-500 group-hover:text-violet-600 dark:text-zinc-400 dark:group-hover:text-violet-400 transition-colors duration-200">
                          Folders
                        </span>
                      </div>
                      <span className="flex h-4 w-4 items-center justify-center rounded-md bg-zinc-100/80 group-hover:bg-violet-100 dark:bg-white/[0.06] dark:group-hover:bg-violet-500/20 transition-colors">
                        <ChevronDown className="h-2.5 w-2.5 text-zinc-400 group-hover:text-violet-500 dark:text-zinc-500 dark:group-hover:text-violet-400 transition-colors" />
                      </span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="start"
                    side="bottom"
                    sideOffset={4}
                    className="w-[220px] p-1.5 rounded-xl border border-white/60 bg-white/80 backdrop-blur-xl shadow-xl dark:border-white/[0.08] dark:bg-zinc-950/90 z-50"
                  >
                    <div className="max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-200/60 dark:scrollbar-thumb-zinc-800/60 space-y-0.5">
                      <FolderPopover onCreateFolder={handleCreateFolder}>
                        <button className="group relative mb-0.5 flex w-full items-center gap-1.5 overflow-hidden rounded-lg border border-white/60 bg-white/40 backdrop-blur-sm px-2 py-1.5 text-left text-[11px] font-medium text-zinc-500 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all duration-150 hover:border-violet-200/70 hover:bg-white/70 hover:text-violet-600 hover:shadow-[0_2px_8px_rgba(124,58,237,0.1)] dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-zinc-500 dark:hover:border-violet-500/25 dark:hover:bg-violet-500/10 dark:hover:text-violet-400 active:scale-[0.98]">
                          <Plus className="h-3 w-3" /> New folder
                        </button>
                      </FolderPopover>
                      {folders.map((f) => (
                        <FolderRow
                          key={f.id}
                          name={f.name}
                          count={folderCounts[f.name] || 0}
                          conversations={getConversationsByFolder(f.name)}
                          selectedId={selectedId}
                          onSelect={onSelect}
                          togglePin={togglePin}
                          onDeleteFolder={handleDeleteFolder}
                          onRenameFolder={handleRenameFolder}
                          onDeleteConversation={onDeleteConversation}
                          onRenameConversation={onRenameConversation}
                          isExpanded={expandedFolder === f.id}
                          onToggle={() =>
                            setExpandedFolder((prev) => (prev === f.id ? null : f.id))
                          }
                        />
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Templates Dropdown */}
              <div className="mt-2 relative">
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      className={cls(
                        "group relative flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-left",
                        "border transition-all duration-200",
                        "border-white/60 bg-white/40 backdrop-blur-sm shadow-[0_1px_4px_rgba(0,0,0,0.06)]",
                        "hover:border-violet-200/80 hover:bg-white/70 hover:shadow-[0_2px_8px_rgba(124,58,237,0.08)]",
                        "dark:border-white/[0.07] dark:bg-white/[0.04] dark:backdrop-blur-sm dark:shadow-[0_1px_4px_rgba(0,0,0,0.3)]",
                        "dark:hover:border-violet-500/30 dark:hover:bg-white/[0.07] dark:hover:shadow-[0_2px_8px_rgba(124,58,237,0.12)]",
                        "active:scale-[0.99]",
                      )}
                    >
                      <span className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-t-xl bg-gradient-to-r from-transparent via-violet-300/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 dark:via-violet-500/30" />
                      <div className="flex items-center gap-2">
                        <PenSquare className="h-3.5 w-3.5 text-zinc-400 group-hover:text-violet-500 dark:text-zinc-500 dark:group-hover:text-violet-400 transition-colors" />
                        <span className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-zinc-500 group-hover:text-violet-600 dark:text-zinc-400 dark:group-hover:text-violet-400 transition-colors duration-200">
                          Templates
                        </span>
                      </div>
                      <span className="flex h-4 w-4 items-center justify-center rounded-md bg-zinc-100/80 group-hover:bg-violet-100 dark:bg-white/[0.06] dark:group-hover:bg-violet-500/20 transition-colors">
                        <ChevronDown className="h-2.5 w-2.5 text-zinc-400 group-hover:text-violet-500 dark:text-zinc-500 dark:group-hover:text-violet-400 transition-colors" />
                      </span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="start"
                    side="bottom"
                    sideOffset={4}
                    className="w-[220px] p-1.5 rounded-xl border border-white/60 bg-white/80 backdrop-blur-xl shadow-xl dark:border-white/[0.08] dark:bg-zinc-950/90 z-50"
                  >
                    <div className="max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-200/60 dark:scrollbar-thumb-zinc-800/60 space-y-0.5">
                      <TemplatePopover
                        onCreateTemplate={handleCreateTemplate}
                        editingTemplate={editingTemplate}
                      >
                        <button className="group relative mb-0.5 flex w-full items-center gap-1.5 overflow-hidden rounded-lg border border-white/60 bg-white/40 backdrop-blur-sm px-2 py-1.5 text-left text-[11px] font-medium text-zinc-500 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all duration-150 hover:border-violet-200/70 hover:bg-white/70 hover:text-violet-600 hover:shadow-[0_2px_8px_rgba(124,58,237,0.1)] dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-zinc-500 dark:hover:border-violet-500/25 dark:hover:bg-violet-500/10 dark:hover:text-violet-400 active:scale-[0.98]">
                          <Plus className="h-3 w-3" /> New template
                        </button>
                      </TemplatePopover>
                      {(Array.isArray(templates) ? templates : []).map((t) => (
                        <TemplateRow
                          key={t.id}
                          template={t}
                          onUseTemplate={handleUseTemplate}
                          onEditTemplate={handleEditTemplate}
                          onRenameTemplate={handleRenameTemplate}
                          onDeleteTemplate={handleDeleteTemplate}
                        />
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Pinned */}
              {pinned && pinned.length > 0 && (
                <SidebarSection
                  title="Pinned"
                  collapsed={collapsed.pinned}
                  onToggle={() =>
                    setCollapsed((s) => ({ ...s, pinned: !s.pinned }))
                  }
                >
                  {pinned.map((c) => (
                    <ConversationRow
                      key={c.id}
                      data={c}
                      active={c.id === selectedId}
                      onSelect={() => {
                        onSelect(c.id);
                        onClose?.();
                      }}
                      onTogglePin={() => togglePin(c.id)}
                      onDelete={onDeleteConversation}
                      onRename={onRenameConversation}
                    />
                  ))}
                </SidebarSection>
              )}

              {/* Grouped by date */}
              {groupOrder.map((label) => {
                const items = grouped[label];
                if (!items || items.length === 0) return null;
                return (
                  <SidebarSection
                    key={label}
                    title={label}
                    collapsed={collapsedGroups[label]}
                    onToggle={() => toggleGroup(label)}
                  >
                    {items.map((c) => (
                      <ConversationRow
                        key={c.id}
                        data={c}
                        active={c.id === selectedId}
                        onSelect={() => {
                          onSelect(c.id);
                          onClose?.();
                        }}
                        onTogglePin={() => togglePin(c.id)}
                        onDelete={onDeleteConversation}
                        onRename={onRenameConversation}
                      />
                    ))}
                  </SidebarSection>
                );
              })}

              {/* Empty state */}
              {(!recent || recent.length === 0) &&
                (!pinned || pinned.length === 0) && (
                  <div className="mt-8 select-none rounded-[20px] border border-dashed border-white/60 bg-white/30 backdrop-blur-sm px-4 py-8 text-center text-[12px] text-zinc-400 dark:border-white/[0.06] dark:bg-white/[0.02] dark:text-zinc-600">
                    <div className="mb-2 flex justify-center opacity-30">
                      <TrishulLogo size="lg" glow animate={false} />
                    </div>
                    No conversations yet.
                    <br />
                    Start a new chat to begin.
                  </div>
                )}


            </nav>

            {/* Footer / Profile */}
            <div className="mt-auto p-2 border-t border-white/40 dark:border-white/[0.05] bg-white/20 dark:bg-white/[0.01] backdrop-blur-sm">
              {/* Subtle glow at top of footer */}
              <SettingsPopover onUserUpdate={onUserUpdate}>
                <button className="group relative flex w-full items-center gap-2 overflow-hidden rounded-xl border border-white/60 bg-white/40 backdrop-blur-sm px-2 py-1.5 text-left shadow-[0_1px_6px_rgba(0,0,0,0.05)] transition-all duration-200 hover:border-violet-200/80 hover:bg-white/80 hover:shadow-[0_4px_16px_rgba(124,58,237,0.12)] active:scale-[0.98] dark:border-white/[0.07] dark:bg-white/[0.04] dark:hover:border-violet-500/35 dark:hover:bg-violet-500/[0.08] dark:hover:shadow-[0_4px_16px_rgba(124,58,237,0.18)]">
                  {/* Shimmer sweep */}
                  <span className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/50 to-transparent dark:via-white/10" />

                  {/* Avatar with gradient glow ring */}
                  <div className="relative shrink-0">
                    <div className="absolute -inset-0.5 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 opacity-0 group-hover:opacity-60 blur-[4px] transition-opacity duration-300" />
                    <div className="relative flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-blue-600 text-[10px] font-bold text-white shadow-md">
                      {userInitials}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border-[1.5px] border-white/80 bg-emerald-500 shadow-[0_0_4px_rgba(52,211,153,0.6)] dark:border-zinc-950" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[12px] font-semibold text-zinc-800 group-hover:text-zinc-900 dark:text-zinc-200 dark:group-hover:text-zinc-100 transition-colors">
                      {userName}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-zinc-500">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.7)]" />
                      Free plan
                    </div>
                  </div>

                  <ChevronRight className="h-3.5 w-3.5 text-zinc-400 opacity-0 group-hover:opacity-100 group-hover:text-violet-500 transition-all duration-150" />
                </button>
              </SettingsPopover>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
