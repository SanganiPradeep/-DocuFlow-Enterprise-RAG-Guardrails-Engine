import { useState } from "react";
import type { ChatSession, ChatMessage } from "../types";
import {
  Share2,
  Copy,
  Check,
  X,
  FileSpreadsheet,
  FileText,
  Link,
  MessageSquare,
} from "lucide-react";
import { exportToExcel, exportToText } from "../lib/exportUtils";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  session: ChatSession | null;
  messages: ChatMessage[];
}

export default function ShareChatModal({
  isOpen,
  onClose,
  session,
  messages,
}: Props) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedTranscript, setCopiedTranscript] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  if (!isOpen || !session) return null;

  const shareUrl = `${window.location.origin}?session=${session.id}`;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      showToast("Shareable session link copied to clipboard");
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      showToast("Could not copy link");
    }
  };

  const handleCopyTranscript = async () => {
    const transcript = [
      `# Enterprise Intelligence Session: ${session.title}`,
      `Date: ${new Date(session.updatedAt).toLocaleString()}`,
      `Total Exchanges: ${messages.length}`,
      "",
      "---",
      "",
      ...messages.map((m) => {
        const author = m.role === "user" || m.sender === "user" ? "USER" : "DOCUFLOW AI";
        return `### [${author}] (${new Date(m.timestamp).toLocaleTimeString()})\n${m.content}\n`;
      }),
    ].join("\n");

    try {
      await navigator.clipboard.writeText(transcript);
      setCopiedTranscript(true);
      showToast("Full transcript copied to clipboard");
      setTimeout(() => setCopiedTranscript(false), 2000);
    } catch {
      showToast("Could not copy transcript");
    }
  };

  const handleExportSpreadsheet = () => {
    const rows = messages.map((m, idx) => [
      String(idx + 1),
      m.role === "user" || m.sender === "user" ? "User" : "Assistant",
      new Date(m.timestamp).toLocaleString(),
      m.content.replace(/\n+/g, " "),
      m.status || "safe",
    ]);

    exportToExcel({
      headers: ["Index", "Sender", "Timestamp", "Message Content", "Shield Status"],
      rows,
      title: session.title,
    });
    showToast("Chat log exported to Excel (.xlsx)");
  };

  const handleDownloadTranscript = () => {
    const transcript = [
      `# Enterprise Intelligence Session: ${session.title}`,
      `Date: ${new Date(session.updatedAt).toLocaleString()}`,
      "",
      ...messages.map((m) => {
        const author = m.role === "user" || m.sender === "user" ? "USER" : "ASSISTANT";
        return `[${author} - ${new Date(m.timestamp).toLocaleTimeString()}]:\n${m.content}\n`;
      }),
    ].join("\n");

    exportToText(transcript, session.title, "md");
    showToast("Transcript (.md) downloaded");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-200">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Share Conversation</h3>
              <p className="text-xs text-slate-500">Collaborate with enterprise team members</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
            <MessageSquare className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-slate-800 truncate">{session.title}</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {messages.length} message exchanges • Last updated {new Date(session.updatedAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Share Link */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Direct Session Link
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Link className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-700 font-mono"
                />
              </div>
              <button
                onClick={handleCopyLink}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? "Copied" : "Copy"}</span>
              </button>
            </div>
          </div>

          {/* Export and Transcript Actions */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <span className="block text-xs font-semibold text-slate-700">Export &amp; Copy Options</span>

            <button
              onClick={handleCopyTranscript}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors text-xs text-left cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-slate-600" />
                <div>
                  <span className="font-semibold text-slate-800 block">Copy Markdown Transcript</span>
                  <span className="text-[11px] text-slate-500">Copy formatted conversation history to clipboard</span>
                </div>
              </div>
              {copiedTranscript ? (
                <Check className="w-4 h-4 text-emerald-600" />
              ) : (
                <Copy className="w-4 h-4 text-slate-400" />
              )}
            </button>

            <button
              onClick={handleExportSpreadsheet}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors text-xs text-left cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <div>
                  <span className="font-semibold text-slate-800 block">Export as Excel Spreadsheet (.xlsx)</span>
                  <span className="text-[11px] text-slate-500">Structured audit log of all Q&amp;A messages</span>
                </div>
              </div>
            </button>

            <button
              onClick={handleDownloadTranscript}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors text-xs text-left cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-blue-600" />
                <div>
                  <span className="font-semibold text-slate-800 block">Download Markdown File (.md)</span>
                  <span className="text-[11px] text-slate-500">Download formatted document transcript</span>
                </div>
              </div>
            </button>
          </div>

          {toast && (
            <div className="p-2.5 bg-slate-900 text-white text-xs rounded-lg flex items-center justify-between">
              <span>{toast}</span>
              <button onClick={() => setToast(null)} className="text-slate-400 hover:text-white p-1">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 hover:bg-slate-100 rounded-lg text-xs font-medium text-slate-700 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
