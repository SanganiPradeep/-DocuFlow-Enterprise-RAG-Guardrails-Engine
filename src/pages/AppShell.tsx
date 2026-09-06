import { useState } from "react";
import type { ReactNode, MouseEvent } from "react";
import type { AuthUser, Page, ChatSession } from "../types";
import {
  FileText,
  MessageSquare,
  Plus,
  Edit2,
  Share2,
  Trash2,
  Calendar,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
  User as UserIcon,
  Settings as SettingsIcon,
  LogOut as LogOutIcon,
} from "lucide-react";
import { useChat } from "../contexts/ChatContext";
import ShareChatModal from "../components/ShareChatModal";

interface Props {
  user: AuthUser;
  currentPage: Page;
  onNavigate: (p: Page) => void;
  onLogout: () => void;
  children: ReactNode;
}

const userNav = [
  { id: "dashboard" as Page, label: "Dashboard", icon: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" },
  { id: "chat" as Page, label: "AI Assistant", icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" },
  { id: "workspace" as Page, label: "Uploaded Documents", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
];

const adminNav = [
  { id: "admin-overview" as Page, label: "Admin Overview", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
  { id: "admin-users" as Page, label: "User Management", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" },
  { id: "admin-security" as Page, label: "Security Console", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
  { id: "admin-analytics" as Page, label: "Analytics", icon: "M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" },
];

const bottomNav = [
  { id: "profile" as Page, label: "My Profile", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
  { id: "settings" as Page, label: "Settings", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" },
];

interface NavItemProps {
  id: Page;
  label: string;
  icon: string;
  active: boolean;
  collapsed: boolean;
  onClick: () => void;
  badge?: number;
  [key: string]: any;
}

function NavItem({
  label,
  icon,
  active,
  collapsed,
  onClick,
  badge,
}: NavItemProps) {
  return (
    <button
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group relative cursor-pointer ${
        active ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      }`}
    >
      <svg
        className={`w-4.5 h-4.5 flex-shrink-0 ${active ? "text-blue-600" : "text-slate-500 group-hover:text-slate-700"}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={active ? 2 : 1.5}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
      </svg>
      {!collapsed && <span className="truncate">{label}</span>}
      {active && !collapsed && (
        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0"></span>
      )}
      {!active && badge !== undefined && !collapsed && (
        <span className="ml-auto text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-500 font-mono">
          {badge}
        </span>
      )}
    </button>
  );
}

export default function AppShell({
  user,
  currentPage,
  onNavigate,
  onLogout,
  children,
}: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchModal, setShowSearchModal] = useState(false);

  // Centralized Chat State
  const {
    sessions,
    activeSessionId,
    handleNewChat,
    handleSelectSession,
    handleRenameSession,
    handleDeleteSession,
    handleShareSession,
    shareModalOpen,
    sessionToShare,
    closeShareModal,
  } = useChat();

  const [conversationsExpanded, setConversationsExpanded] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const startRename = (session: ChatSession, e: MouseEvent) => {
    e.stopPropagation();
    setEditingId(session.id);
    setEditTitle(session.title);
  };

  const saveRename = async (id: string, e?: MouseEvent) => {
    if (e) e.stopPropagation();
    if (editTitle.trim()) {
      await handleRenameSession(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const notifications = [
    { id: 1, msg: "Model Armor blocked prompt injection attempt", time: "2 min ago", type: "threat" },
    { id: 2, msg: "Enterprise Knowledge Base vectorized", time: "14 min ago", type: "info" },
    { id: 3, msg: "Google Drive and Sheets synchronization active", time: "27 min ago", type: "success" },
    { id: 4, msg: "Security scan completed — 0 vulnerabilities", time: "1 hr ago", type: "success" },
  ];

  const pageTitles: Record<Page, string> = {
    dashboard: "Dashboard",
    workspace: "Uploaded Documents",
    chat: "AI Assistant",
    profile: "My Profile",
    settings: "Settings",
    "admin-overview": "Admin Overview",
    "admin-users": "User Management",
    "admin-security": "Security Console",
    "admin-analytics": "Analytics",
  };

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <div
      className={`flex flex-col h-full ${
        mobile ? "w-72" : collapsed ? "w-16" : "w-68"
      } bg-white border-r border-slate-200 sidebar-transition flex-shrink-0 select-none`}
    >
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-4 border-b border-slate-100 ${collapsed && !mobile ? "justify-center" : ""}`}>
        <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-xs text-white">
          <Sparkles className="w-4.5 h-4.5" />
        </div>
        {(!collapsed || mobile) && (
          <div className="overflow-hidden">
            <p className="font-bold text-slate-800 text-sm leading-none truncate" style={{ fontFamily: "Instrument Sans, sans-serif" }}>
              DocuFlow-GCP
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5 font-mono">Enterprise RAG</p>
          </div>
        )}
      </div>

      {/* Nav & Chat Content */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {/* Collapsed Mode: Quick Icons */}
        {collapsed && !mobile ? (
          <div className="space-y-3">
            <button
              onClick={() => {
                handleNewChat();
                onNavigate("chat");
              }}
              className="w-10 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center mx-auto shadow-xs cursor-pointer transition-transform active:scale-95"
              title="Start New Chat"
            >
              <Plus className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              {userNav.map((n) => (
                <NavItem
                  key={n.id}
                  {...n}
                  active={currentPage === n.id}
                  collapsed={true}
                  onClick={() => onNavigate(n.id)}
                />
              ))}
            </div>

            {user.role === "admin" && (
              <div className="pt-2 border-t border-slate-100 space-y-1">
                {adminNav.map((n) => (
                  <NavItem
                    key={n.id}
                    {...n}
                    active={currentPage === n.id}
                    collapsed={true}
                    onClick={() => onNavigate(n.id)}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* SECTION 1: WORKSPACE (Screenshot 2) */}
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 px-2">
                Workspace
              </p>
              <div className="space-y-0.5">
                {userNav.map((n) => (
                  <NavItem
                    key={n.id}
                    {...n}
                    active={currentPage === n.id}
                    collapsed={false}
                    badge={n.id === "chat" ? sessions.length : undefined}
                    onClick={() => {
                      onNavigate(n.id);
                      setMobileOpen(false);
                    }}
                  />
                ))}
              </div>
            </div>

            {/* SECTION 2: CONVERSATIONS (Screenshot 1) */}
            <div className="pt-2 border-t border-slate-100">
              {/* Header with Title, Count, and Collapse Toggle */}
              <div className="flex items-center justify-between px-2 mb-2">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                    Conversations
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 font-mono font-semibold">
                    {sessions.length}
                  </span>
                </div>
                <button
                  onClick={() => setConversationsExpanded(!conversationsExpanded)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-md cursor-pointer transition-colors"
                  title={conversationsExpanded ? "Collapse conversations" : "Expand conversations"}
                >
                  {conversationsExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* + New Chat Button (Screenshot 1: Vibrant Blue Button) */}
              <button
                onClick={() => {
                  handleNewChat();
                  onNavigate("chat");
                  setMobileOpen(false);
                }}
                className="w-full mb-2 flex items-center justify-center gap-2 py-2.5 px-3 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-medium text-xs rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>New Chat</span>
              </button>

              {/* Conversations List (Screenshot 1: Card Items) */}
              {conversationsExpanded && (
                <div className="space-y-1 max-h-56 overflow-y-auto pr-0.5">
                  {sessions.length === 0 ? (
                    <p className="text-[11px] text-slate-400 px-2 py-2 text-center">No past chats yet</p>
                  ) : (
                    sessions.map((session) => {
                      const isActive = currentPage === "chat" && session.id === activeSessionId;
                      const isEditing = editingId === session.id;

                      return (
                        <div
                          key={session.id}
                          onClick={() => {
                            if (!isEditing) {
                              handleSelectSession(session.id);
                              onNavigate("chat");
                              setMobileOpen(false);
                            }
                          }}
                          className={`group relative rounded-xl px-2.5 py-2 transition-all cursor-pointer border text-left ${
                            isActive
                              ? "bg-blue-50/90 border-blue-300/80 text-blue-900 shadow-xs"
                              : "border-transparent text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-1.5">
                            <div className="flex-1 min-w-0">
                              {isEditing ? (
                                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                  <input
                                    type="text"
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") saveRename(session.id);
                                      if (e.key === "Escape") setEditingId(null);
                                    }}
                                    autoFocus
                                    className="w-full text-xs font-semibold px-1.5 py-0.5 bg-white border border-blue-400 rounded text-slate-900 focus:outline-hidden"
                                  />
                                  <button
                                    onClick={(e) => saveRename(session.id, e)}
                                    className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                                    title="Save"
                                  >
                                    <Check className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingId(null);
                                    }}
                                    className="p-1 text-slate-400 hover:bg-slate-200 rounded"
                                    title="Cancel"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <p className={`text-xs font-semibold truncate ${isActive ? "text-blue-900" : "text-slate-800"}`}>
                                    {session.title}
                                  </p>
                                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                                    {session.preview || "Ready for document analysis..."}
                                  </p>
                                </>
                              )}
                            </div>

                            {/* Date & Hover Actions */}
                            {!isEditing && (
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <span className="text-[10px] text-slate-400 font-mono group-hover:hidden flex items-center gap-1">
                                  <Calendar className="w-2.5 h-2.5" />
                                  {new Date(session.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                </span>

                                <div className="hidden group-hover:flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    onClick={(e) => startRename(session, e)}
                                    className="p-1 hover:bg-white text-slate-400 hover:text-blue-600 rounded transition-colors"
                                    title="Rename"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleShareSession(session);
                                    }}
                                    className="p-1 hover:bg-white text-slate-400 hover:text-emerald-600 rounded transition-colors"
                                    title="Share"
                                  >
                                    <Share2 className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteSession(session.id);
                                    }}
                                    className="p-1 hover:bg-white text-slate-400 hover:text-rose-600 rounded transition-colors"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* SECTION 3: Standard Clearance (Screenshot 2) */}
            {user.role === "admin" ? (
              <>
                <div className="border-t border-slate-100 my-2 mx-1"></div>
                <div className="flex items-center justify-between px-2 mb-1.5">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Administration</p>
                  <span className="px-1.5 py-0.2 bg-blue-50 text-blue-700 text-[10px] font-bold rounded">Privileged</span>
                </div>
                <div className="space-y-0.5">
                  {adminNav.map((n) => (
                    <NavItem
                      key={n.id}
                      {...n}
                      active={currentPage === n.id}
                      collapsed={false}
                      onClick={() => {
                        onNavigate(n.id);
                        setMobileOpen(false);
                      }}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="mt-2 mx-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center">
                <p className="text-[11px] text-slate-600 font-semibold">Standard Clearance</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Admin tools restricted</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Integrated User Profile Card as per Image 2 with Settings and Sign Out buttons */}
      {!collapsed || mobile ? (
        <div className="border-t border-slate-200/80 px-3 py-3 bg-white flex-shrink-0">
          {/* User profile row (Image 2) */}
          <div className="flex items-center gap-2.5 mb-2.5">
            <div className="w-9 h-9 rounded-full bg-[#1A73E8] flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-xs">
              {user.avatar || "PR"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-900 truncate">
                {user.name || "pradeep sangani"}
              </p>
              <p className="text-xs text-slate-400 truncate">
                {user.department || "Engineering"}
              </p>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded font-normal bg-slate-100 text-slate-600 flex-shrink-0 border border-slate-200/60">
              User
            </span>
          </div>

          {/* Action links: Settings and Sign Out buttons (My Profile removed as requested) */}
          <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100">
            <button
              id="sidebar-settings-btn"
              onClick={() => {
                onNavigate("settings");
                if (mobile) setMobileOpen(false);
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${
                currentPage === "settings"
                  ? "bg-blue-50 text-blue-700 border-blue-200 font-semibold"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
              }`}
            >
              <SettingsIcon className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
              <span>Settings</span>
            </button>

            <button
              id="sidebar-signout-btn"
              onClick={onLogout}
              className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-slate-50 hover:bg-rose-50 hover:text-rose-600 border border-slate-200 hover:border-rose-200 transition-colors cursor-pointer group"
            >
              <LogOutIcon className="w-3.5 h-3.5 text-slate-500 group-hover:text-rose-600 flex-shrink-0" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      ) : (
        /* Collapsed Sidebar bottom avatar */
        <div className="p-2 border-t border-slate-100 flex flex-col items-center gap-2">
          <div
            title={`${user.name || "pradeep sangani"} (${user.department || "Engineering"})`}
            className="w-8 h-8 rounded-full bg-[#1A73E8] flex items-center justify-center text-white text-xs font-bold shadow-xs"
          >
            {user.avatar || "PR"}
          </div>
          <button
            onClick={() => onNavigate("settings")}
            title="Settings"
            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
          <button
            onClick={onLogout}
            title="Sign Out"
            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
          >
            <LogOutIcon className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="h-screen flex overflow-hidden bg-slate-50">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setMobileOpen(false)} />
          <div className="relative z-10">
            <SidebarContent mobile />
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 flex-shrink-0 z-30">
          <div className="flex items-center h-14 px-4 sm:px-6 gap-4">
            {/* Mobile menu button */}
            <button onClick={() => setMobileOpen(true)} className="md:hidden p-2 -ml-2 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">
              <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Collapse toggle (desktop) */}
            <button onClick={() => setCollapsed(!collapsed)} className="hidden md:flex p-2 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer" title={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
              {collapsed ? <PanelLeftOpen className="w-4.5 h-4.5 text-slate-500" /> : <PanelLeftClose className="w-4.5 h-4.5 text-slate-500" />}
            </button>

            {/* Page title */}
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-semibold text-slate-800 truncate" style={{ fontFamily: "Instrument Sans, sans-serif" }}>
                {pageTitles[currentPage] || "Workspace"}
              </h1>
              <p className="text-xs text-slate-400 hidden sm:block truncate">
                {user.name} · {user.department} · {user.role === "admin" ? "Security Administrator" : "Standard Enterprise User"}
              </p>
            </div>

            {/* Right controls */}
            <div className="flex items-center gap-2">
              {/* Search button */}
              <button
                onClick={() => setShowSearchModal(true)}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-500 w-44 cursor-pointer hover:bg-slate-200/60 transition-colors"
              >
                <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span className="text-xs text-slate-400">Search docs…</span>
                <span className="ml-auto text-[10px] bg-white border border-slate-200 px-1 py-0.5 rounded font-mono text-slate-400">⌘K</span>
              </button>

              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setNotifOpen(!notifOpen)}
                  className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                </button>

                {notifOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                    <div className="absolute right-0 mt-1 w-80 bg-white rounded-xl border border-slate-200 shadow-xl z-50 overflow-hidden">
                      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                        <p className="text-xs font-semibold text-slate-800" style={{ fontFamily: "Instrument Sans, sans-serif" }}>Model Armor Alerts</p>
                        <button onClick={() => setNotifOpen(false)} className="text-[11px] text-blue-500 hover:text-blue-700 font-medium">Close</button>
                      </div>
                      <div className="divide-y divide-slate-50 max-h-72 overflow-y-auto">
                        {notifications.map((n) => (
                          <div key={n.id} className="px-4 py-3 hover:bg-slate-50 flex gap-3 items-start cursor-pointer">
                            <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.type === "threat" ? "bg-red-500" : n.type === "success" ? "bg-green-500" : "bg-blue-500"}`}></div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-slate-700">{n.msg}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5 font-mono">{n.time}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="px-4 py-2.5 bg-slate-50 text-center border-t border-slate-100">
                        <button
                          onClick={() => {
                            setNotifOpen(false);
                            if (user.role === "admin") onNavigate("admin-security");
                            else onNavigate("workspace");
                          }}
                          className="text-xs text-blue-600 font-medium hover:underline"
                        >
                          View Live Security Telemetry →
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Avatar Pill */}
              <button
                onClick={() => onNavigate("profile")}
                className="flex items-center gap-2 p-1 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                  {user.avatar}
                </div>
                <span className="text-xs font-medium text-slate-700 hidden sm:block">{user.name.split(" ")[0]}</span>
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto flex flex-col min-h-0">
          <div className={`flex-1 h-full min-h-0 ${currentPage === "chat" ? "p-0" : "p-4 sm:p-6"}`}>
            {children}
          </div>
        </main>
      </div>

      {/* Global Share Chat Modal */}
      <ShareChatModal
        isOpen={shareModalOpen}
        onClose={closeShareModal}
        session={sessionToShare}
        messages={sessionToShare?.messages || []}
      />

      {/* Quick Search Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search across indexed documents or navigation..."
                className="flex-1 text-sm bg-transparent outline-none text-slate-800 placeholder:text-slate-400"
              />
              <button onClick={() => setShowSearchModal(false)} className="text-xs text-slate-400 hover:text-slate-600">
                ESC
              </button>
            </div>

            <div className="p-2 divide-y divide-slate-50 max-h-80 overflow-y-auto">
              {/* Quick Navigation Results */}
              <div className="py-2">
                <p className="text-[10px] uppercase font-bold text-slate-400 px-3 mb-1">Navigation</p>
                <div
                  onClick={() => { onNavigate("dashboard"); setShowSearchModal(false); }}
                  className="px-3 py-2 hover:bg-slate-50 rounded-lg flex items-center justify-between cursor-pointer"
                >
                  <span className="text-xs text-slate-700 font-medium">Dashboard</span>
                  <span className="text-[10px] font-mono text-slate-400">Page</span>
                </div>
                <div
                  onClick={() => { onNavigate("chat"); setShowSearchModal(false); }}
                  className="px-3 py-2 hover:bg-slate-50 rounded-lg flex items-center justify-between cursor-pointer"
                >
                  <span className="text-xs text-slate-700 font-medium">AI Assistant (Chat Studio)</span>
                  <span className="text-[10px] font-mono text-slate-400">Page</span>
                </div>
                <div
                  onClick={() => { onNavigate("workspace"); setShowSearchModal(false); }}
                  className="px-3 py-2 hover:bg-slate-50 rounded-lg flex items-center justify-between cursor-pointer"
                >
                  <span className="text-xs text-slate-700 font-medium">Document Workspace</span>
                  <span className="text-[10px] font-mono text-slate-400">Page</span>
                </div>
              </div>

              {/* Quick Document Results */}
              <div className="py-2">
                <p className="text-[10px] uppercase font-bold text-slate-400 px-3 mb-1">Sample Documents</p>
                <div
                  onClick={() => { onNavigate("workspace"); setShowSearchModal(false); }}
                  className="px-3 py-2 hover:bg-slate-50 rounded-lg flex items-center justify-between cursor-pointer"
                >
                  <span className="text-xs text-slate-700 flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-blue-500" />
                    Corporate Security Policy 2026.pdf
                  </span>
                  <span className="text-[10px] font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">Restricted</span>
                </div>
                <div
                  onClick={() => { onNavigate("workspace"); setShowSearchModal(false); }}
                  className="px-3 py-2 hover:bg-slate-50 rounded-lg flex items-center justify-between cursor-pointer"
                >
                  <span className="text-xs text-slate-700 flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-blue-500" />
                    Q2 Operations Master Plan.docx
                  </span>
                  <span className="text-[10px] font-mono text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">Confidential</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
