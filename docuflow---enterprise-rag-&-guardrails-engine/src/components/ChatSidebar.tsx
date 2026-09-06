import { useState } from "react";
import type { MouseEvent } from "react";
import type { ChatSession } from "../types";
import {
  Plus,
  MessageSquare,
  Edit2,
  Share2,
  Trash2,
  Search,
  Check,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  Calendar,
  FileText,
} from "lucide-react";

interface Props {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onRenameSession: (id: string, newTitle: string) => void;
  onDeleteSession: (id: string) => void;
  onShareSession: (session: ChatSession) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export default function ChatSidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onRenameSession,
  onDeleteSession,
  onShareSession,
  collapsed,
  onToggleCollapse,
}: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const startRename = (session: ChatSession, e: MouseEvent) => {
    e.stopPropagation();
    setEditingId(session.id);
    setEditTitle(session.title);
  };

  const saveRename = (id: string, e: MouseEvent) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      onRenameSession(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const cancelRename = (e: MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const handleDelete = (id: string, e: MouseEvent) => {
    e.stopPropagation();
    onDeleteSession(id);
    setConfirmDeleteId(null);
  };

  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.preview && s.preview.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (collapsed) {
    return (
      <div className="w-16 bg-slate-900 border-r border-slate-800 flex flex-col items-center py-4 px-2 select-none">
        <button
          onClick={onToggleCollapse}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer mb-4"
          title="Expand Chat Sidebar"
        >
          <PanelLeftOpen className="w-5 h-5" />
        </button>

        <button
          onClick={onNewChat}
          className="w-10 h-10 bg-blue-600 hover:bg-blue-500 text-white rounded-xl flex items-center justify-center shadow-md cursor-pointer transition-transform active:scale-95 mb-6"
          title="Start New Chat"
        >
          <Plus className="w-5 h-5" />
        </button>

        <div className="flex-1 w-full space-y-2 overflow-y-auto no-scrollbar">
          {sessions.slice(0, 8).map((s) => {
            const isActive = s.id === activeSessionId;
            return (
              <button
                key={s.id}
                onClick={() => onSelectSession(s.id)}
                className={`w-10 h-10 rounded-xl mx-auto flex items-center justify-center transition-colors cursor-pointer ${
                  isActive
                    ? "bg-blue-500/20 text-blue-400 border border-blue-500/40"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                }`}
                title={s.title}
              >
                <MessageSquare className="w-4 h-4" />
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <aside className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col h-full select-none text-slate-200">
      {/* Top action header */}
      <div className="p-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Conversations
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
            {sessions.length}
          </span>
        </div>
        <button
          onClick={onToggleCollapse}
          className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md cursor-pointer"
          title="Collapse sidebar"
        >
          <PanelLeftClose className="w-4 h-4" />
        </button>
      </div>

      {/* New Chat Button */}
      <div className="p-3">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded-xl shadow-xs transition-all active:scale-98 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Chat</span>
        </button>
      </div>

      {/* Search Input */}
      {sessions.length > 3 && (
        <div className="px-3 pb-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chat history..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-800/80 border border-slate-700/60 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-blue-500"
            />
          </div>
        </div>
      )}

      {/* Chat Sessions List */}
      <div className="flex-1 overflow-y-auto px-2 space-y-1 py-1">
        {filteredSessions.length === 0 ? (
          <div className="py-8 px-4 text-center">
            <MessageSquare className="w-8 h-8 mx-auto text-slate-700 mb-2" />
            <p className="text-xs text-slate-400 font-medium">No conversations found</p>
            <p className="text-[11px] text-slate-600 mt-1">
              Click &quot;New Chat&quot; to start an enterprise inquiry
            </p>
          </div>
        ) : (
          filteredSessions.map((session) => {
            const isActive = session.id === activeSessionId;
            const isEditing = editingId === session.id;
            const isConfirmingDelete = confirmDeleteId === session.id;

            return (
              <div
                key={session.id}
                onClick={() => !isEditing && onSelectSession(session.id)}
                className={`group relative rounded-xl px-3 py-2.5 transition-colors cursor-pointer border ${
                  isActive
                    ? "bg-slate-800 border-blue-500/50 text-white"
                    : "border-transparent text-slate-300 hover:bg-slate-800/50 hover:text-white"
                }`}
              >
                {isEditing ? (
                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveRename(session.id, e as any);
                        if (e.key === "Escape") cancelRename(e as any);
                      }}
                      autoFocus
                      className="flex-1 text-xs bg-slate-950 border border-blue-400 rounded-md px-2 py-1 text-white focus:outline-hidden"
                    />
                    <button
                      onClick={(e) => saveRename(session.id, e)}
                      className="p-1 text-emerald-400 hover:bg-slate-700 rounded-md cursor-pointer"
                      title="Save"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={cancelRename}
                      className="p-1 text-slate-400 hover:bg-slate-700 rounded-md cursor-pointer"
                      title="Cancel"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : isConfirmingDelete ? (
                  <div className="flex items-center justify-between text-xs py-0.5" onClick={(e) => e.stopPropagation()}>
                    <span className="text-red-400 text-[11px] font-medium">Delete chat?</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => handleDelete(session.id, e)}
                        className="px-2 py-0.5 bg-red-600 hover:bg-red-500 text-white rounded text-[11px] font-bold cursor-pointer"
                      >
                        Yes
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDeleteId(null);
                        }}
                        className="px-1.5 py-0.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-[11px] cursor-pointer"
                      >
                        No
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-medium truncate flex-1 leading-snug">
                        {session.title}
                      </span>

                      {/* Action buttons on hover */}
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => startRename(session, e)}
                          className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded-md cursor-pointer"
                          title="Rename Chat"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onShareSession(session);
                          }}
                          className="p-1 text-slate-400 hover:text-blue-400 hover:bg-slate-700 rounded-md cursor-pointer"
                          title="Share Chat"
                        >
                          <Share2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDeleteId(session.id);
                          }}
                          className="p-1 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-md cursor-pointer"
                          title="Delete Chat"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {session.targetDoc && (
                      <div className="flex items-center gap-1 mt-1 text-[10px] text-blue-300 bg-blue-950/70 border border-blue-800/60 rounded px-1.5 py-0.5 max-w-full">
                        <FileText className="w-2.5 h-2.5 flex-shrink-0 text-blue-400" />
                        <span className="truncate">{session.targetDoc}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                      <span className="truncate max-w-[130px]">
                        {session.preview || "No messages yet"}
                      </span>
                      <span className="flex-shrink-0 flex items-center gap-0.5 text-slate-500">
                        <Calendar className="w-2.5 h-2.5" />
                        {new Date(session.updatedAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
        <span className="font-medium">Business Cloud Sync</span>
        <span className="text-emerald-400 font-mono text-[10px] flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          Active
        </span>
      </div>
    </aside>
  );
}
