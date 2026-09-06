import { useState, useEffect } from "react";
import type { AuthUser, Page, UploadedFile } from "../types";
import { db, auth, collection, onSnapshot } from "../lib/firebase";

interface Props {
  user: AuthUser;
  onNavigate: (p: Page) => void;
}

export default function UserDashboard({ user, onNavigate }: Props) {
  const [docs, setDocs] = useState<UploadedFile[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "documents"),
      (snapshot) => {
        const items: UploadedFile[] = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            name: data.name || "Document",
            size: data.size || "15 KB",
            type: (data.type || "TXT").toUpperCase(),
            status: data.status || "indexed",
            uploadedAt: data.uploadedAt || "Recently",
          };
        });
        setDocs(items);
      },
      (err) => {
        console.warn("User dashboard docs sync:", err);
      }
    );
    return () => unsub();
  }, []);

  const stats = [
    { label: "Documents Indexed", value: String(docs.length), delta: docs.length === 0 ? "Ready for upload" : `${docs.length} active files`, color: "text-blue-600", bg: "bg-blue-50", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
    { label: "Active AI Models", value: "Gemini 2.5", delta: "Vertex AI Powered", color: "text-purple-600", bg: "bg-purple-50", icon: "M13 10V3L4 14h7v7l9-11h-7z" },
    { label: "Model Armor Status", value: "Guarded", delta: "Zero-Trust active", color: "text-emerald-600", bg: "bg-emerald-50", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
    { label: "Account Role", value: user.role.toUpperCase(), delta: user.department, color: "text-slate-700", bg: "bg-slate-50", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
  ];

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900" style={{ fontFamily: "Instrument Sans, sans-serif" }}>
            Welcome, {user.name.split(" ")[0]}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Your unified workspace for enterprise document intelligence and Indian health accessibility analysis.
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs text-emerald-700 font-medium font-mono">Firebase Auth Verified</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-200 p-4 hover:border-slate-300 transition-colors shadow-xs">
            <div className={`w-9 h-9 ${s.bg} rounded-xl flex items-center justify-center mb-3`}>
              <svg className={`w-4.5 h-4.5 ${s.color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={s.icon} />
              </svg>
            </div>
            <p className={`text-2xl font-bold ${s.color} font-mono`} style={{ fontFamily: "Instrument Sans, sans-serif" }}>{s.value}</p>
            <p className="text-xs font-semibold text-slate-700 mt-0.5">{s.label}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{s.delta}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: "Upload Documents", desc: "Manage Uploaded Documents", icon: "M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12", page: "workspace" as Page, primary: true },
            { label: "AI Assistant", desc: "Unified Q&A & Health Desert Finder", icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z", page: "chat" as Page, primary: false },
            { label: "User Profile", desc: "Security and account settings", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z", page: "profile" as Page, primary: false },
          ].map((a) => (
            <button
              key={a.label}
              onClick={() => onNavigate(a.page)}
              className={`flex items-center gap-3.5 p-4 rounded-2xl text-left transition-all cursor-pointer border ${
                a.primary
                  ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700 shadow-xs"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${a.primary ? "bg-white/20" : "bg-blue-50"}`}>
                <svg className={`w-5 h-5 ${a.primary ? "text-white" : "text-blue-600"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={a.icon} />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{a.label}</p>
                <p className={`text-xs mt-0.5 ${a.primary ? "text-blue-100" : "text-slate-400"}`}>{a.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Two-column lower */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Real Documents from Firestore */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800" style={{ fontFamily: "Instrument Sans, sans-serif" }}>
              Recent Uploaded Documents
            </h3>
            <button onClick={() => onNavigate("workspace")} className="text-xs text-blue-600 font-semibold hover:text-blue-800 cursor-pointer">
              View all →
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {docs.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-xs text-slate-500">No documents uploaded yet.</p>
                <button
                  onClick={() => onNavigate("workspace")}
                  className="mt-2 text-xs text-blue-600 font-semibold hover:underline cursor-pointer"
                >
                  Upload your first file in Uploaded Documents
                </button>
              </div>
            ) : (
              docs.slice(0, 4).map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => onNavigate("workspace")}
                  className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-7 h-7 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold">
                      {doc.type}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">{doc.name}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{doc.size} · {doc.uploadedAt}</p>
                    </div>
                  </div>
                  <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
                    Indexed
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* AI Assistant Quick Starters */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800" style={{ fontFamily: "Instrument Sans, sans-serif" }}>
              DocuFlow AI Assistant Highlights
            </h3>
            <button onClick={() => onNavigate("chat")} className="text-xs text-blue-600 font-semibold hover:text-blue-800 cursor-pointer">
              Open Assistant →
            </button>
          </div>
          <div className="p-5 space-y-3">
            <div
              onClick={() => onNavigate("chat")}
              className="p-3 bg-slate-50 hover:bg-blue-50/60 rounded-xl border border-slate-200 transition-colors cursor-pointer"
            >
              <p className="text-xs font-semibold text-slate-800">Health Desert Finder (India)</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Identify neighborhoods in Delhi, Mumbai, or Bengaluru needing mobile clinics, with Social Impact Scores out of 100.
              </p>
            </div>

            <div
              onClick={() => onNavigate("chat")}
              className="p-3 bg-slate-50 hover:bg-blue-50/60 rounded-xl border border-slate-200 transition-colors cursor-pointer"
            >
              <p className="text-xs font-semibold text-slate-800">Cross-Document Synthesis</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Extract clauses, compare metrics, and verify statements with inline citations from your uploaded files.
              </p>
            </div>

            <div
              onClick={() => onNavigate("chat")}
              className="p-3 bg-slate-50 hover:bg-blue-50/60 rounded-xl border border-slate-200 transition-colors cursor-pointer"
            >
              <p className="text-xs font-semibold text-slate-800">Google Cloud Model Armor Defense</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Real-time prompt injection filtering and sensitive data redaction on every query.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
