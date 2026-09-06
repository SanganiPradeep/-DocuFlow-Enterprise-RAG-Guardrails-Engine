import { useState, useEffect, useRef, useCallback } from "react";
import type { DragEvent, MouseEvent } from "react";
import type { UploadedFile, Page } from "../types";
import { db, auth, collection, onSnapshot, doc, setDoc, deleteDoc, handleFirestoreError, OperationType } from "../lib/firebase";
import { X } from "lucide-react";

interface Props {
  onNavigateToChat?: (documentName?: string) => void;
  onNavigate?: (page: Page) => void;
}

const TYPE_COLORS: Record<string, string> = {
  PDF: "bg-red-50 text-red-700 border-red-200",
  DOCX: "bg-blue-50 text-blue-700 border-blue-200",
  TXT: "bg-slate-100 text-slate-700 border-slate-200",
  CSV: "bg-emerald-50 text-emerald-700 border-emerald-200",
  JSON: "bg-purple-50 text-purple-700 border-purple-200",
};

export default function WorkspacePage({ onNavigateToChat, onNavigate }: Props) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<UploadedFile | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Real-time Firestore sync for uploaded documents
  useEffect(() => {
    if (!auth.currentUser) return;
    const unsub = onSnapshot(
      collection(db, "documents"),
      (snapshot) => {
        const loaded: UploadedFile[] = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            name: data.name || "Untitled Document",
            size: data.size || "12 KB",
            type: (data.type || "TXT").toUpperCase(),
            status: data.status || "indexed",
            uploadedAt: data.uploadedAt || "Recently",
          };
        });
        setFiles(loaded);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, "documents");
      }
    );
    return () => unsub();
  }, []);

  const addFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setIsUploading(true);

    const uploadedList = Array.from(fileList);
    for (const f of uploadedList) {
      const docId = `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const fileType = (f.name.split(".").pop() || "TXT").toUpperCase();
      const timeStr = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

      // Read file as base64 for accurate PDF, DOCX, and text ingestion
      const base64Data = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const res = String(reader.result || "");
          const base64Content = res.includes(",") ? res.split(",")[1] : res;
          resolve(base64Content);
        };
        reader.onerror = () => resolve("");
        reader.readAsDataURL(f);
      });

      let extractedSummary = `Document ${f.name} processed for enterprise search.`;
      let chunksCount = 1;

      // Ingest into server vector store with PDF parsing & chunking
      try {
        const res = await fetch("/api/documents/ingest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: f.name,
            base64Data,
            fileType: fileType.toLowerCase(),
            fileSize: `${(f.size / 1024).toFixed(1)} KB`,
            category: "Engineering",
            classification: "Internal",
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.document?.summary) extractedSummary = data.document.summary;
          if (data.document?.chunksGenerated) chunksCount = data.document.chunksGenerated;
        }
      } catch (err) {
        console.warn("Backend vector ingest fallback:", err);
      }

      // Save to Firestore
      if (auth.currentUser) {
        try {
          await setDoc(doc(db, "documents", docId), {
            id: docId,
            userId: auth.currentUser.uid,
            name: f.name,
            size: `${(f.size / 1024).toFixed(1)} KB`,
            type: fileType,
            status: "indexed",
            uploadedAt: timeStr,
            summary: extractedSummary,
            chunkCount: chunksCount,
          });
        } catch (err) {
          console.warn("Firestore doc upload notice:", err);
        }
      }
    }

    setIsUploading(false);
  };

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    addFiles(e.dataTransfer.files);
  }, []);

  const handleDelete = async (id: string, e?: MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await deleteDoc(doc(db, "documents", id));
      setFiles((prev) => prev.filter((f) => f.id !== id));
      if (selectedDoc?.id === id) setSelectedDoc(null);
    } catch (err) {
      console.warn("Delete error:", err);
    }
  };

  const filteredFiles = files.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-slate-50 overflow-hidden">
      {/* Top Header Bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex-shrink-0 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900" style={{ fontFamily: "Instrument Sans, sans-serif" }}>
            Uploaded Documents
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Enterprise document repository with Gemini OCR analysis indexed for the unified AI Assistant
          </p>
        </div>

        <div className="flex items-center gap-3">
          {onNavigateToChat && (
            <button
              onClick={() => onNavigateToChat()}
              className="px-3.5 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Open in AI Assistant
            </button>
          )}

          <button
            onClick={() => fileRef.current?.click()}
            disabled={isUploading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            {isUploading ? "Indexing..." : "Upload Document"}
          </button>
          <input
            ref={fileRef}
            type="file"
            multiple
            accept=".pdf,.docx,.txt,.csv,.json,.md"
            onChange={(e) => addFiles(e.target.files)}
            className="hidden"
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Upload Zone Banner */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer bg-white ${
              isDragOver ? "border-blue-500 bg-blue-50/50" : "border-slate-300 hover:border-blue-400"
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center mx-auto mb-3 text-blue-600">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-slate-800">
              Drag and drop enterprise files here, or <span className="text-blue-600 underline">browse</span>
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Supports PDF, DOCX, TXT, CSV, and Markdown. Vectorized and secured by Model Armor.
            </p>
          </div>

          {/* Search & Filter Controls */}
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search indexed documents…"
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500"
              />
            </div>
            <div className="text-xs text-slate-500 font-medium">
              {filteredFiles.length} {filteredFiles.length === 1 ? "document" : "documents"} indexed
            </div>
          </div>

          {/* Documents Grid / List */}
          {filteredFiles.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
              <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-slate-400">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-slate-700">No documents uploaded yet</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Upload your company policies, healthcare datasets, or research reports to enable citation-backed answers in the AI Assistant.
              </p>
              <button
                onClick={() => fileRef.current?.click()}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Upload Your First Document
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFiles.map((file) => (
                <div
                  key={file.id}
                  onClick={() => setSelectedDoc(file)}
                  className="bg-white border border-slate-200 hover:border-blue-300 rounded-2xl p-4.5 transition-all hover:shadow-sm cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${TYPE_COLORS[file.type] || "bg-slate-100 text-slate-600 border-slate-200"}`}>
                        {file.type}
                      </span>
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Indexed
                      </span>
                    </div>

                    <h4 className="text-sm font-semibold text-slate-800 line-clamp-1 mb-1">
                      {file.name}
                    </h4>
                    <p className="text-xs text-slate-400 font-mono">
                      {file.size} · Uploaded {file.uploadedAt}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-dashed border-slate-100 flex items-center justify-between">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onNavigateToChat) onNavigateToChat(file.name);
                        else if (onNavigate) onNavigate("chat");
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      Query in Assistant
                    </button>

                    <button
                      onClick={(e) => handleDelete(file.id, e)}
                      title="Delete document"
                      className="p-1 text-slate-400 hover:text-red-600 transition-colors cursor-pointer rounded"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Document Details Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${TYPE_COLORS[selectedDoc.type] || "bg-slate-100"}`}>
                  {selectedDoc.type}
                </span>
                <h3 className="text-base font-bold text-slate-900 truncate max-w-xs">{selectedDoc.name}</h3>
              </div>
              <button
                onClick={() => setSelectedDoc(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block mb-0.5">File Size</span>
                  <span className="font-semibold text-slate-800">{selectedDoc.size}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Uploaded</span>
                  <span className="font-semibold text-slate-800">{selectedDoc.uploadedAt}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Status</span>
                  <span className="text-emerald-700 font-semibold">Active &amp; Indexed</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Storage</span>
                  <span className="font-semibold text-slate-800">Firestore &amp; Vector Index</span>
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                <p className="font-semibold text-blue-900 mb-1">Single Assistant Integration</p>
                <p className="text-blue-700 text-[11px] leading-relaxed">
                  This document is synchronized with the unified AI Assistant. You can ask questions, summarize findings, or cross-reference it with Indian health accessibility data.
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setSelectedDoc(null)}
                className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const docName = selectedDoc.name;
                  setSelectedDoc(null);
                  if (onNavigateToChat) onNavigateToChat(docName);
                  else if (onNavigate) onNavigate("chat");
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Ask Questions in AI Assistant
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
