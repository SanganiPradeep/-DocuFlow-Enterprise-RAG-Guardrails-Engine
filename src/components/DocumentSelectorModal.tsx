import React, { useState, useMemo, useRef } from "react";
import type { ChangeEvent, DragEvent } from "react";
import type { UploadedFile } from "../types";
import {
  FileText,
  Upload,
  Search,
  Check,
  X,
  FileCheck,
  FileSpreadsheet,
  AlertCircle,
  Clock,
  HardDrive,
  Layers,
} from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  availableDocs: UploadedFile[];
  selectedDoc: string | null;
  onSelectDoc: (docName: string) => void;
  onClearDoc?: () => void;
  onUploadNew: (file: File) => Promise<void>;
  isUploading: boolean;
}

export default function DocumentSelectorModal({
  isOpen,
  onClose,
  availableDocs,
  selectedDoc,
  onSelectDoc,
  onClearDoc,
  onUploadNew,
  isUploading,
}: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "PDF" | "DOC" | "SHEET">("ALL");
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredDocs = useMemo(() => {
    return availableDocs.filter((doc) => {
      const matchesSearch =
        doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (doc.summary && doc.summary.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchesSearch) return false;

      if (typeFilter === "PDF") {
        return doc.type === "PDF" || doc.name.toLowerCase().endsWith(".pdf");
      }
      if (typeFilter === "DOC") {
        return (
          doc.type === "DOC" ||
          doc.type === "DOCX" ||
          doc.name.toLowerCase().endsWith(".doc") ||
          doc.name.toLowerCase().endsWith(".docx")
        );
      }
      if (typeFilter === "SHEET") {
        return (
          doc.type === "CSV" ||
          doc.type === "XLSX" ||
          doc.name.toLowerCase().endsWith(".csv") ||
          doc.name.toLowerCase().endsWith(".xlsx")
        );
      }
      return true;
    });
  }, [availableDocs, searchTerm, typeFilter]);

  if (!isOpen) return null;

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadNew(file);
    }
    if (e.target) e.target.value = "";
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      onUploadNew(file);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const getDocIcon = (doc: UploadedFile) => {
    const name = doc.name.toLowerCase();
    if (name.endsWith(".csv") || name.endsWith(".xlsx") || doc.type === "CSV") {
      return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />;
    }
    return <FileText className="w-5 h-5 text-blue-600" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.txt,.csv,.json,.md"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Select Document for Chat</h3>
              <p className="text-xs text-slate-500">
                Upload once, select anytime — your chat will remember this document for all questions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Upload Zone */}
        <div className="p-5 border-b border-slate-100 bg-white flex-shrink-0">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`border-2 border-dashed rounded-xl p-4 text-center transition-all ${
              isDragOver
                ? "border-blue-500 bg-blue-50/60"
                : "border-slate-200 hover:border-slate-300 bg-slate-50/50"
            }`}
          >
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3 text-left">
                <div className="p-2.5 bg-blue-100 rounded-lg text-blue-600">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800">
                    Need to chat with a new PDF or document?
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Upload once to your library (.pdf, .docx, .txt, .csv)
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-2 flex-shrink-0"
              >
                {isUploading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Processing Document...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload New File</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center gap-2 flex-shrink-0">
          <div className="relative flex-1 w-full">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search uploaded documents by name..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500"
            />
          </div>

          {/* Type Filter Buttons */}
          <div className="flex items-center gap-1 w-full sm:w-auto overflow-x-auto">
            {(["ALL", "PDF", "DOC", "SHEET"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                  typeFilter === t
                    ? "bg-slate-800 text-white"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {t === "ALL" ? "All Docs" : t}
              </button>
            ))}
          </div>
        </div>

        {/* Documents List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredDocs.length === 0 ? (
            <div className="py-10 text-center">
              <AlertCircle className="w-8 h-8 mx-auto text-slate-400 mb-2" />
              <p className="text-sm font-semibold text-slate-700">No documents found</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                {searchTerm
                  ? `No documents matching "${searchTerm}". Try another search or upload a file above.`
                  : "No documents in library yet. Upload a PDF or doc above to get started!"}
              </p>
            </div>
          ) : (
            filteredDocs.map((doc) => {
              const isSelected = selectedDoc === doc.name;

              return (
                <div
                  key={doc.id || doc.name}
                  onClick={() => {
                    onSelectDoc(doc.name);
                    onClose();
                  }}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? "bg-blue-50/90 border-blue-400 shadow-xs ring-1 ring-blue-400"
                      : "bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50/80"
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div
                      className={`p-2.5 rounded-lg flex-shrink-0 ${
                        isSelected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {getDocIcon(doc)}
                    </div>

                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {doc.name}
                        </span>
                        {isSelected && (
                          <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 flex-shrink-0">
                            <Check className="w-2.5 h-2.5" />
                            Active for this Chat
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5">
                        <span className="font-mono bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                          {doc.type}
                        </span>
                        <span className="flex items-center gap-1">
                          <HardDrive className="w-3 h-3 text-slate-400" />
                          {doc.size}
                        </span>
                        {doc.uploadedAt && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {doc.uploadedAt}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isSelected ? (
                      <span className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5" />
                        Selected
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectDoc(doc.name);
                          onClose();
                        }}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                      >
                        Select
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50/70 flex items-center justify-between flex-shrink-0">
          <div>
            {selectedDoc && (
              <button
                type="button"
                onClick={() => {
                  onClearDoc();
                  onClose();
                }}
                className="text-xs text-red-600 hover:text-red-700 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                Unlink Document (General AI Chat)
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
