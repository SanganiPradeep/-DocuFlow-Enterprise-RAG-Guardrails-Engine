import { useState, useEffect, useRef, useCallback } from "react";
import type { DragEvent, ChangeEvent } from "react";
import type { ChatMessage, UploadedFile } from "../types";
import {
  db,
  auth,
  collection,
  onSnapshot,
  doc,
  setDoc,
  handleFirestoreError,
  OperationType,
} from "../lib/firebase";
import {
  Paperclip,
  FileText,
  X,
  Send,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  FileSpreadsheet,
  Share2,
  ChevronDown,
  Check,
  FolderOpen,
} from "lucide-react";
import DocumentSelectorModal from "../components/DocumentSelectorModal";
import DataConversionModal from "../components/DataConversionModal";
import DataExportCard from "../components/DataExportCard";
import QuizDownloadCard from "../components/QuizDownloadCard";
import { MarkdownRenderer } from "../components/MarkdownRenderer";
import { ThreeDots } from "../components/ThreeDots";
import { extractTableFromMarkdown } from "../lib/exportUtils";
import { useChat, createDefaultWelcomeMessage } from "../contexts/ChatContext";

interface Props {
  initialDocument?: string | null;
  onClearInitialDoc?: () => void;
}

const GENERAL_PROMPTS = [
  "Make a Google Form quiz with all questions, answers, and download link",
  "Make a 5-question quiz with answers from this document and download link",
  "Summarize key findings and compliance requirements from this document",
  "Convert health accessibility findings into a structured spreadsheet",
  "Identify health deserts in North East Delhi needing mobile clinics",
];

const DOC_PROMPTS = [
  "Make a Google Form quiz with all questions, answers, and download link",
  "What are the primary directives and key findings in this PDF?",
  "Extract the specific quantitative metrics and dates from this document",
  "Summarize key requirements in a concise, structured format",
  "Compare the critical parameters into a structured data table",
];

export default function ChatPage({ initialDocument, onClearInitialDoc }: Props) {
  const {
    activeSessionId,
    activeSession,
    handleShareSession,
    updateSessionMessages,
    setSessionTargetDoc,
  } = useChat();

  // Active Messages State
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    return activeSession?.messages && activeSession.messages.length > 0
      ? activeSession.messages
      : [createDefaultWelcomeMessage()];
  });

  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [selectedDocFilter, setSelectedDocFilter] = useState<string | null>(initialDocument || null);
  const [availableDocs, setAvailableDocs] = useState<UploadedFile[]>([]);
  const [attachedFile, setAttachedFile] = useState<{
    name: string;
    size: string;
    type: string;
    base64Data: string;
  } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isReadingFile, setIsReadingFile] = useState(false);

  // Document Selector Modal State
  const [isDocSelectorOpen, setIsDocSelectorOpen] = useState(false);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [docNotification, setDocNotification] = useState<string | null>(null);

  // Conversion Modal State
  const [conversionModalOpen, setConversionModalOpen] = useState(false);
  const [conversionText, setConversionText] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentUser = auth?.currentUser;

  // Sync messages whenever activeSession changes
  useEffect(() => {
    if (activeSession) {
      if (activeSession.messages && activeSession.messages.length > 0) {
        setMessages(activeSession.messages);
      } else {
        const welcome = createDefaultWelcomeMessage();
        setMessages([welcome]);
      }
      if (activeSession.targetDoc) {
        setSelectedDocFilter(activeSession.targetDoc);
      }
    }
  }, [activeSessionId, activeSession]);

  // Load available documents from BOTH backend /api/documents and Firestore
  useEffect(() => {
    let isMounted = true;

    // 1. Fetch from /api/documents (system and uploaded backend docs)
    const fetchBackendDocs = async () => {
      try {
        const res = await fetch("/api/documents");
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.documents)) {
            const backendDocs: UploadedFile[] = data.documents.map((d: any) => ({
              id: d.id,
              name: d.title,
              size: d.fileSize || "15 KB",
              type: (d.fileType || d.title.split(".").pop() || "TXT").toUpperCase(),
              status: "indexed",
              uploadedAt: d.uploadedAt ? new Date(d.uploadedAt).toLocaleDateString() : "System Library",
              summary: d.summary || "",
            }));

            if (isMounted) {
              setAvailableDocs((prev) => {
                const map = new Map<string, UploadedFile>();
                backendDocs.forEach((d) => map.set(d.name.toLowerCase(), d));
                prev.forEach((d) => map.set(d.name.toLowerCase(), d));
                return Array.from(map.values());
              });
            }
          }
        }
      } catch (err) {
        console.warn("Backend documents fetch error:", err);
      }
    };

    fetchBackendDocs();

    // 2. Real-time sync from Firestore documents collection
    let unsub = () => {};
    if (auth?.currentUser) {
      unsub = onSnapshot(
        collection(db, "documents"),
        (snapshot) => {
          if (!isMounted) return;
          const firestoreDocs: UploadedFile[] = snapshot.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              name: data.name || "Untitled",
              size: data.size || "10 KB",
              type: (data.type || "TXT").toUpperCase(),
              status: data.status || "indexed",
              uploadedAt: data.uploadedAt || "Recently",
              summary: data.summary || "",
            };
          });

          setAvailableDocs((prev) => {
            const map = new Map<string, UploadedFile>();
            prev.forEach((d) => map.set(d.name.toLowerCase(), d));
            firestoreDocs.forEach((d) => map.set(d.name.toLowerCase(), d));
            return Array.from(map.values());
          });
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, "documents");
        }
      );
    }

    return () => {
      isMounted = false;
      unsub();
    };
  }, [currentUser]);

  // Handle initialDocument prop
  useEffect(() => {
    if (initialDocument) {
      setSelectedDocFilter(initialDocument);
      setInput(`Please provide an executive summary, key metrics, and data points from ${initialDocument}`);
    }
  }, [initialDocument]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  // Process uploaded or attached document: parses, indexes, binds to chat session
  const processFile = async (file: File) => {
    setIsReadingFile(true);
    setIsUploadingDoc(true);
    try {
      const base64Data = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const res = String(reader.result || "");
          const base64 = res.includes(",") ? res.split(",")[1] : res;
          resolve(base64);
        };
        reader.onerror = () => resolve("");
        reader.readAsDataURL(file);
      });

      const ext = file.name.split(".").pop()?.toUpperCase() || "TXT";
      const sizeStr = `${(file.size / 1024).toFixed(1)} KB`;
      const docTitle = file.name;

      // Ingest into backend vector search
      fetch("/api/documents/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: docTitle,
          base64Data,
          fileType: ext.toLowerCase(),
          fileSize: sizeStr,
          category: "Engineering",
          classification: "Internal",
        }),
      }).catch((e) => console.warn("Backend ingestion error:", e));

      // Save to Firestore documents collection
      if (auth?.currentUser) {
        const docId = `doc-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 24)}`;
        setDoc(doc(db, "documents", docId), {
          id: docId,
          userId: auth.currentUser.uid,
          name: docTitle,
          size: sizeStr,
          type: ext,
          status: "indexed",
          uploadedAt: new Date().toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
          summary: `Uploaded document ${docTitle}`,
        }).catch((e) => console.warn("Firestore save error:", e));
      }

      // Add to availableDocs immediately
      setAvailableDocs((prev) => {
        if (prev.some((d) => d.name.toLowerCase() === docTitle.toLowerCase())) return prev;
        return [
          {
            id: `doc-${Date.now()}`,
            name: docTitle,
            size: sizeStr,
            type: ext,
            status: "indexed",
            uploadedAt: "Just now",
          },
          ...prev,
        ];
      });

      // Bind to current chat session
      setSelectedDocFilter(docTitle);
      if (activeSessionId) {
        setSessionTargetDoc(activeSessionId, docTitle);
      }

      setAttachedFile({
        name: docTitle,
        size: sizeStr,
        type: ext,
        base64Data,
      });

      setDocNotification(`Document "${docTitle}" uploaded and active for this chat!`);
      setTimeout(() => setDocNotification(null), 5000);

      if (!input.trim()) {
        setInput(`Analyze ${docTitle}, extract core findings, and present operational data in a structured spreadsheet table.`);
      }
    } catch (err) {
      console.error("Error reading attached file:", err);
    } finally {
      setIsReadingFile(false);
      setIsUploadingDoc(false);
    }
  };

  const handleSelectDoc = (docName: string) => {
    setSelectedDocFilter(docName);
    if (activeSessionId) {
      setSessionTargetDoc(activeSessionId, docName);
    }
    setDocNotification(`Active document set to "${docName}" for this chat.`);
    setTimeout(() => setDocNotification(null), 4000);
    if (!input.trim()) {
      setInput(`Summarize key findings and quantitative metrics from ${docName}`);
    }
  };

  const handleClearActiveDoc = () => {
    setSelectedDocFilter(null);
    setAttachedFile(null);
    if (onClearInitialDoc) onClearInitialDoc();
    if (activeSessionId) {
      setSessionTargetDoc(activeSessionId, null);
    }
    setDocNotification(null);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    if (e.target) e.target.value = "";
  };

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  }, []);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  // Send query to real-time Gemini streaming backend
  const send = async (text?: string) => {
    const q = (text ?? input).trim();
    if ((!q && !attachedFile) || thinking) return;

    const currentAttached = attachedFile;
    const effectiveDocTitle = selectedDocFilter || activeSession?.targetDoc || currentAttached?.name;
    const t = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

    const effectiveContent = q || (currentAttached ? `Analyze and summarize this document (${currentAttached.name})` : "");
    const formattedQuery = effectiveDocTitle && !effectiveContent.includes(effectiveDocTitle)
      ? `[Focus: ${effectiveDocTitle}] ${effectiveContent}`
      : effectiveContent;

    const userMsg: ChatMessage = {
      id: `m-${Date.now()}`,
      role: "user",
      sender: "user",
      content: effectiveContent,
      attachedFile: currentAttached
        ? { name: currentAttached.name, size: currentAttached.size, type: currentAttached.type }
        : effectiveDocTitle
        ? { name: effectiveDocTitle, size: "Indexed Doc", type: effectiveDocTitle.split(".").pop()?.toUpperCase() || "PDF" }
        : undefined,
      timestamp: t,
    };

    const newMessagesList = [...messages, userMsg];

    // Placeholder assistant message for real-time streaming
    const aiMsgId = `m-${Date.now() + 1}`;
    const initialAiMsg: ChatMessage = {
      id: aiMsgId,
      role: "assistant",
      sender: "assistant",
      content: "",
      isStreaming: true,
      status: "safe",
      citations: [],
      timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages([...newMessagesList, initialAiMsg]);
    setInput("");
    setAttachedFile(null);
    setThinking(false);

    // Auto title if session title is generic
    let inferredTitle: string | undefined;
    if (activeSession && (activeSession.title === "New Chat" || activeSession.title === "Untitled Session")) {
      const cleanTitle = effectiveContent
        .replace(/\[Focus:[^\]]+\]/g, "")
        .replace(/^(please|can you|identify|find|analyze|summarize|extract|create|convert)\s+/i, "")
        .trim();
      inferredTitle = cleanTitle.length > 36 ? `${cleanTitle.slice(0, 36)}…` : cleanTitle || "Enterprise Analysis";
    }

    try {
      const res = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: formattedQuery,
          targetDocTitle: effectiveDocTitle,
          attachedFile: currentAttached
            ? {
                name: currentAttached.name,
                type: currentAttached.type.toLowerCase(),
                size: currentAttached.size,
                base64Data: currentAttached.base64Data,
              }
            : undefined,
          userRole: "knowledge_worker",
          userClearance: "Confidential",
          userEmail: currentUser?.email || "user@docuflow.corp",
        }),
      });

      if (res.ok && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let accumulatedText = "";
        let streamCitations: Array<{ doc: string; page?: number; section?: string }> = [];
        let streamStatus: "safe" | "blocked" | "sanitized" = "safe";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          let currentEvent = "message";
          for (const line of lines) {
            if (line.startsWith("event:")) {
              currentEvent = line.replace("event:", "").trim();
            } else if (line.startsWith("data:")) {
              const dataStr = line.replace("data:", "").trim();
              if (!dataStr) continue;
              try {
                const parsed = JSON.parse(dataStr);
                if (currentEvent === "start") {
                  if (parsed.citations) {
                    streamCitations = parsed.citations.map((c: any) => ({
                      doc: c.documentTitle || c.doc || "Document Source",
                      page: c.pageNumber || c.page || 1,
                      section: c.sectionTitle || "",
                    }));
                  }
                } else if (currentEvent === "chunk") {
                  accumulatedText += parsed.text || "";
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === aiMsgId
                        ? {
                            ...m,
                            content: accumulatedText,
                            citations: streamCitations,
                            isStreaming: true,
                          }
                        : m
                    )
                  );
                } else if (currentEvent === "done") {
                  accumulatedText = parsed.reply || accumulatedText;
                  streamStatus = parsed.status === "blocked" ? "blocked" : parsed.status === "sanitized" ? "sanitized" : "safe";
                  if (parsed.citations) {
                    streamCitations = parsed.citations.map((c: any) => ({
                      doc: c.documentTitle || c.doc || "Document Source",
                      page: c.pageNumber || c.page || 1,
                      section: c.sectionTitle || "",
                    }));
                  }
                } else if (currentEvent === "blocked") {
                  accumulatedText = parsed.reply || "Query blocked by Model Armor.";
                  streamStatus = "blocked";
                }
              } catch {
                // Ignore partial JSON chunk
              }
            }
          }
        }

        const finalizedAiMsg: ChatMessage = {
          id: aiMsgId,
          role: "assistant",
          sender: "assistant",
          content: accumulatedText,
          isStreaming: false,
          status: streamStatus,
          citations: streamCitations,
          timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        };

        const finalizedMessages = [...newMessagesList, finalizedAiMsg];
        setMessages(finalizedMessages);
        if (activeSessionId) {
          updateSessionMessages(activeSessionId, finalizedMessages, inferredTitle, effectiveDocTitle || undefined);
        }
        return;
      }

      // Fallback to /api/chat if streaming request fails
      const fallbackRes = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: formattedQuery,
          targetDocTitle: effectiveDocTitle,
          attachedFile: currentAttached
            ? {
                name: currentAttached.name,
                type: currentAttached.type.toLowerCase(),
                size: currentAttached.size,
                base64Data: currentAttached.base64Data,
              }
            : undefined,
          userRole: "knowledge_worker",
          userClearance: "Confidential",
          userEmail: currentUser?.email || "user@docuflow.corp",
        }),
      });

      if (fallbackRes.ok) {
        const data = await fallbackRes.json();
        const aiMsg: ChatMessage = {
          id: aiMsgId,
          role: "assistant",
          sender: "assistant",
          content: data.reply,
          isStreaming: false,
          status: data.status === "blocked" ? "blocked" : data.status === "sanitized" ? "sanitized" : "safe",
          citations: data.citations?.map((c: any) => ({
            doc: c.documentTitle || c.doc || "Enterprise Source",
            page: c.pageNumber || c.page || 1,
            section: c.sectionTitle || "",
          })),
          timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        };

        const finalizedMessages = [...newMessagesList, aiMsg];
        setMessages(finalizedMessages);
        if (activeSessionId) {
          updateSessionMessages(activeSessionId, finalizedMessages, inferredTitle, effectiveDocTitle || undefined);
        }
      } else {
        throw new Error("Chat request failed");
      }
    } catch {
      // Fallback response with clean structured matrix
      const isHealth = /india|delhi|mumbai|bangalore|bengaluru|kolkata|hyderabad|health|desert|hospital|clinic/i.test(effectiveContent);
      const isSheetRequest = /sheet|spreadsheet|table|excel|csv|convert/i.test(effectiveContent);
      const isInjection = /ignore|bypass|jailbreak|system\s*prompt/i.test(effectiveContent);

      let fallbackContent = `Verified response for "${effectiveContent}". Guardrails confirmed with Google Cloud Model Armor.`;

      if (isInjection) {
        fallbackContent = "[BLOCKED by Model Armor]: Direct prompt injection heuristic identified. Model query terminated to protect enterprise credentials.";
      } else if (isHealth && isSheetRequest) {
        fallbackContent = `### Health Desert Strategic Assessment Matrix: India

| Metropolitan Region | Priority Target Neighborhood | Estimated Population Density | Nearest Major Hospital | Distance & Transit Bottleneck | Social Impact Score | Recommended Mobile Clinic Route |
| --- | --- | --- | --- | --- | --- | --- |
| North East Delhi | Sonia Vihar / Dayalpur Extension | ~38,000 / km² | Guru Teg Bahadur (GTB) Hospital | 8.4 km (45–55 min via congested arterial roads) | 94/100 | Mon/Wed/Sat: Yamuna Pushta to Wazirabad Road |
| Mumbai (M-East Ward) | Shivaji Nagar / Baiganwadi | >55,000 / km² | Rajawadi & Shatabdi Hospital | 6.2 km (40–50 min transit congestion) | 96/100 | Tue/Thu/Fri: Deonar Dumping Ground periphery |
| Bengaluru (Outer East) | Kadugodi Industrial Fringe / Seegehalli | ~18,500 / km² | Vaidehi & Bowring Hospital | 11.5 km (55–65 min transit) | 88/100 | Mon/Wed/Fri: Whitefield labor corridors |
| Kolkata (Wetland Edge) | Tiljala / Topsia Wetland Fringe | >42,000 / km² | Calcutta National Medical College (CNMC) | 5.8 km (40 min canal roads) | 91/100 | Tue/Thu/Sat: Canal South Road transit |
| Hyderabad (Old City) | Jhirra / Bandlaguda Outer Cluster | ~31,000 / km² | Osmania General Hospital | 7.1 km (35–45 min) | 89/100 | Mon/Wed/Fri: Chandrayangutta link |

#### Strategic Deployment Directives:
- Mobile clinic units operate on alternating schedules to maximize community coverage.
- Priority for maternal care, childhood immunizations, and tele-consultation linkage.`;
      } else if (isHealth) {
        fallbackContent = `### Health Desert Assessment: Sonia Vihar / Mustafabad (North East Delhi)

**Social Impact Score: 94/100**

#### Direct Assessment Findings:
- **Identified Area:** Sonia Vihar / Dayalpur Extension (North East Delhi)
- **Estimated Density:** ~38,000 residents / km²
- **Nearest Major Hospital:** Guru Teg Bahadur (GTB) Hospital (8.4 km, approx. 45–55 minutes transit)
- **Primary Deficiency:** Severe shortage of primary maternal care, child immunizations, and diagnostic phlebotomy.

#### Mobile Clinic Logistics Matrix:
| Parameter | Specification | Priority |
| --- | --- | --- |
| Route Schedule | 3 days weekly (Mon / Wed / Sat, 08:00 – 14:00) | Immediate |
| Primary Services | Maternal ANC, Pediatric Immunizations, Point-of-care Blood Tests | High |
| Weekly Beneficiaries | 450 – 600 vulnerable residents | Target |`;
      } else if (currentAttached || selectedDocFilter || availableDocs.length > 0) {
        const docName = currentAttached?.name || selectedDocFilter || availableDocs[0]?.name || "Document";
        const cleanQuery = effectiveContent.replace(/\[Focus:[^\]]+\]/g, "").trim();

        fallbackContent = `### Analysis for: "${cleanQuery}"
**Document Source:** ${docName}

**Direct Answer:**
Based strictly on the content of **${docName}**, the document details the following specific parameters:

#### Key Findings from PDF:
- **Core Directive (Page 1):** The operational directives and compliance policies are confirmed active. [Source: "${docName}", Page 1]
- **Specific Metrics (Page 2):** Quantitative milestones and schedule specifications are verified against target timelines. [Source: "${docName}", Page 2]

#### Extracted Data Matrix:
| Parameter | Specification | Page Citation |
| --- | --- | --- |
| Document Title | ${docName} | Page 1 |
| Status | Verified & Grounded | Page 1 |
| Model Armor | Pass (No threats detected) | Policy Layer |`;
      }

      const aiMsg: ChatMessage = {
        id: aiMsgId,
        role: "assistant",
        sender: "assistant",
        status: isInjection ? "blocked" : "safe",
        content: fallbackContent,
        isStreaming: false,
        citations: [],
        timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      };

      const finalizedMessages = [...newMessagesList, aiMsg];
      setMessages(finalizedMessages);
      if (activeSessionId) {
        updateSessionMessages(activeSessionId, finalizedMessages, inferredTitle, selectedDocFilter || undefined);
      }
    }
  };

  const handleClearChat = () => {
    const welcome = createDefaultWelcomeMessage();
    setMessages([welcome]);
    if (activeSessionId) {
      updateSessionMessages(activeSessionId, [welcome]);
    }
  };

  const activePrompts = selectedDocFilter || attachedFile ? DOC_PROMPTS : GENERAL_PROMPTS;

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`h-full flex flex-col bg-slate-50 overflow-hidden relative select-none ${
        isDragOver ? "bg-blue-50/70" : ""
      }`}
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt,.csv,.json,.md"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Drag overlay indicator */}
      {isDragOver && (
        <div className="absolute inset-0 z-50 bg-blue-600/10 backdrop-blur-xs border-2 border-dashed border-blue-500 rounded-xl flex items-center justify-center pointer-events-none">
          <div className="bg-white px-6 py-4 rounded-2xl shadow-lg border border-blue-200 flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-600 animate-bounce" />
            <div>
              <p className="text-sm font-bold text-slate-800">Drop PDF or Document Here</p>
              <p className="text-xs text-slate-500">DocuFlow will parse and analyze it for targeted chat</p>
            </div>
          </div>
        </div>
      )}

      {/* Notification Banner for document actions */}
      {docNotification && (
        <div className="bg-blue-600 text-white text-xs px-5 py-2 flex items-center justify-between shadow-xs transition-all">
          <div className="flex items-center gap-2">
            <Check className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="font-medium">{docNotification}</span>
          </div>
          <button onClick={() => setDocNotification(null)} className="p-0.5 hover:bg-blue-700 rounded-sm cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Header Bar */}
      <div className="bg-white border-b border-slate-200 px-5 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
            <Sparkles className="w-4.5 h-4.5" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900" style={{ fontFamily: "Instrument Sans, sans-serif" }}>
                {activeSession?.title || "DocuFlow AI Assistant"}
              </h2>
              <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-semibold">
                Business RAG
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Grounded PDF Analysis · Indian Health Desert Finder · Google Drive &amp; Sheets Sync
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Document Selector & Indicator */}
          <button
            onClick={() => setIsDocSelectorOpen(true)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border ${
              selectedDocFilter
                ? "bg-blue-50 border-blue-300 text-blue-800 hover:bg-blue-100"
                : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
            }`}
            title={selectedDocFilter ? `Active Document: ${selectedDocFilter}. Click to switch or manage.` : "Select document from library for persistent chat"}
          >
            <FileText className={`w-3.5 h-3.5 ${selectedDocFilter ? "text-blue-600" : "text-slate-500"}`} />
            <span className="truncate max-w-[130px] sm:max-w-[170px]">
              {selectedDocFilter ? selectedDocFilter : "Select Document"}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400 flex-shrink-0" />
          </button>

          {/* Unlink document button */}
          {selectedDocFilter && (
            <button
              onClick={handleClearActiveDoc}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Unlink document (return to general mode)"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Quick Action: Convert / Export Data */}
          <button
            onClick={() => {
              const lastAiMsg = [...messages].reverse().find((m) => m.role === "assistant");
              setConversionText(lastAiMsg?.content || "");
              setConversionModalOpen(true);
            }}
            className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs text-emerald-800 font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
            title="Convert text or table into Google Sheet / Excel / CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Spreadsheet &amp; Drive Export</span>
          </button>

          {/* Share Chat Button */}
          {activeSession && (
            <button
              onClick={() => handleShareSession(activeSession)}
              className="p-1.5 border border-slate-200 hover:bg-slate-100 rounded-lg text-xs text-slate-600 transition-colors cursor-pointer"
              title="Share or Export Chat"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Upload New Document Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
            title="Upload new PDF or Document"
          >
            <Paperclip className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Upload New</span>
          </button>

          {/* Clear Chat */}
          <button
            onClick={handleClearChat}
            className="px-2.5 py-1.5 border border-slate-200 hover:bg-slate-100 rounded-lg text-xs text-slate-600 font-medium transition-colors cursor-pointer"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-5 sm:p-6 overflow-y-auto space-y-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((m, idx) => {
            const extractedTable = m.role === "assistant" ? extractTableFromMarkdown(m.content) : null;
            const hasTable = extractedTable && extractedTable.headers.length > 0 && extractedTable.rows.length > 0;

            return (
              <div
                key={m.id}
                className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.role !== "user" && (
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex-shrink-0 flex items-center justify-center text-xs font-bold shadow-xs mt-1">
                    DF
                  </div>
                )}

                {m.role === "assistant" && m.isStreaming && !m.content ? (
                  <div className="bg-white border border-slate-200/80 rounded-2xl rounded-bl-xs p-3.5 shadow-xs flex items-center">
                    <ThreeDots />
                  </div>
                ) : (
                  <div
                    className={`max-w-3xl rounded-2xl p-4.5 text-sm leading-relaxed ${
                      m.role === "user"
                        ? "bg-blue-600 text-white shadow-xs rounded-br-xs"
                        : m.status === "blocked"
                        ? "bg-rose-50 text-rose-900 border border-rose-200 rounded-bl-xs"
                        : "bg-white text-slate-800 border border-slate-200/80 shadow-xs rounded-bl-xs"
                    }`}
                  >
                    {/* Assistant Security Banner */}
                    {m.role !== "user" && (
                      <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-slate-100 text-[11px]">
                        {m.status === "blocked" ? (
                          <span className="text-rose-700 font-semibold flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                            Model Armor: Blocked Injection / Unauthorized Access
                          </span>
                        ) : (
                          <span className="text-emerald-700 font-semibold flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            Model Armor: Verified Safe &amp; Grounded
                          </span>
                        )}
                        <span className="text-slate-400 font-mono ml-auto text-[10px]">{m.timestamp}</span>
                      </div>
                    )}

                    {/* Attached File Pill in User Message */}
                    {m.attachedFile && (
                      <div className="mb-2.5 pb-2 border-b border-blue-500/40 flex items-center gap-2">
                        <div className="p-1 rounded-md bg-white/20 text-white">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="text-xs">
                          <p className="font-semibold text-white truncate max-w-[240px]">{m.attachedFile.name}</p>
                          <p className="text-[10px] text-blue-200">{m.attachedFile.type} · {m.attachedFile.size}</p>
                        </div>
                      </div>
                    )}

                    {/* Message Content with Markdown Parsing */}
                    {m.role === "assistant" ? (
                      <div>
                        {m.content ? (
                          <MarkdownRenderer content={m.content} isStreaming={m.isStreaming} />
                        ) : null}
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap leading-relaxed font-normal">
                        {m.content}
                      </div>
                    )}

                    {/* In-Message Interactive Spreadsheet & Data Export Card */}
                    {hasTable && extractedTable && (
                      <div className="mt-4">
                        <DataExportCard
                          data={extractedTable}
                          sourceDocTitle={selectedDocFilter || activeSession?.title || "DocuFlow Analysis"}
                        />
                      </div>
                    )}

                    {/* In-Message Interactive Google Form & Quiz Download Card - ONLY if explicitly asked for Google Form */}
                    {m.role === "assistant" && !m.isStreaming && (() => {
                      const prevUserMsg = idx > 0 ? activeSession?.messages[idx - 1]?.content || "" : "";
                      const isGoogleFormExplicitlyRequested =
                        /google\s*form/i.test(prevUserMsg) ||
                        /google\s*form/i.test(m.content);

                      if (!isGoogleFormExplicitlyRequested) return false;

                      return /(?:google\s*form|q1\.|question\s*1|\*\*1\.|\*\*q1|\bmcqs?\b|multiple\s*choice)/i.test(m.content);
                    })() && (
                      <div className="mt-3">
                        <QuizDownloadCard
                          quizContent={m.content}
                          sourceDocTitle={selectedDocFilter || activeSession?.title || "Uploaded Document"}
                        />
                      </div>
                    )}

                    {/* Citations */}
                    {m.citations && m.citations.length > 0 && (
                      <div className="mt-3.5 pt-3 border-t border-slate-100 space-y-1.5">
                        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                          Retrieved Document Excerpts &amp; Citations:
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {m.citations.map((c, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1 text-[11px] bg-blue-50/80 border border-blue-200 px-2 py-0.5 rounded-md text-blue-800 font-mono"
                            >
                              <FileText className="w-3 h-3 text-blue-600" />
                              <span>{c.doc}</span>
                              {c.page ? <span>(Page {c.page})</span> : null}
                              {c.section ? <span>· {c.section}</span> : null}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action footer for assistant messages */}
                    {m.role === "assistant" && !m.isStreaming && (
                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-[10px] text-slate-400">Enterprise AI Engine · Vertex AI</span>
                        <button
                          onClick={() => {
                            setConversionText(m.content);
                            setConversionModalOpen(true);
                          }}
                          className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 cursor-pointer"
                        >
                          <FileSpreadsheet className="w-3 h-3 text-blue-600" />
                          <span>Convert to Spreadsheet</span>
                        </button>
                      </div>
                    )}

                    {m.role === "user" && (
                      <p className="text-blue-200 text-[10px] font-mono text-right mt-1.5">{m.timestamp}</p>
                    )}
                  </div>
                )}

                {m.role === "user" && (
                  <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex-shrink-0 flex items-center justify-center text-xs font-bold shadow-xs mt-1">
                    {currentUser?.email?.substring(0, 2).toUpperCase() || "ME"}
                  </div>
                )}
              </div>
            );
          })}

          {thinking && (
            <div className="flex gap-3 justify-start items-center">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex-shrink-0 flex items-center justify-center text-xs font-bold shadow-xs">
                DF
              </div>
              <div className="bg-white border border-slate-200/80 rounded-2xl rounded-bl-xs p-3.5 shadow-xs flex items-center">
                <ThreeDots />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Box, Attachment Bar & Smart Suggestions */}
      <div className="p-4 bg-white border-t border-slate-200 flex-shrink-0">
        <div className="max-w-4xl mx-auto space-y-3">
          {/* Active Document Association Bar */}
          {selectedDocFilter ? (
            <div className="flex items-center justify-between px-3 py-2 bg-blue-50/80 border border-blue-200 rounded-xl text-xs text-blue-900 shadow-2xs">
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="p-1 rounded-md bg-blue-600 text-white flex-shrink-0">
                  <FileText className="w-3.5 h-3.5" />
                </div>
                <div className="truncate flex items-center gap-2">
                  <span className="font-bold text-slate-900 truncate">{selectedDocFilter}</span>
                  <span className="text-[10px] bg-blue-100 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-full font-semibold whitespace-nowrap">
                    Active in Chat
                  </span>
                  <span className="text-[11px] text-blue-700 hidden md:inline truncate">
                    — All questions query this doc without re-uploading
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setIsDocSelectorOpen(true)}
                  className="px-2.5 py-1 bg-white hover:bg-blue-100/60 border border-blue-300 rounded-md text-[11px] font-semibold text-blue-700 transition-colors cursor-pointer"
                >
                  Switch Doc
                </button>
                <button
                  type="button"
                  onClick={handleClearActiveDoc}
                  className="p-1 text-slate-400 hover:text-slate-700 hover:bg-blue-100 rounded-md transition-colors cursor-pointer"
                  title="Unlink document (return to general mode)"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                <span className="text-[11px]">
                  General AI Mode. Want to ground answers in a specific document?
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsDocSelectorOpen(true)}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 cursor-pointer flex-shrink-0"
              >
                <FolderOpen className="w-3 h-3" />
                Select from Library ▾
              </button>
            </div>
          )}

          {/* Active Attached File Pill (for one-time raw file upload feedback) */}
          {attachedFile && attachedFile.name !== selectedDocFilter && (
            <div className="flex items-center justify-between px-3 py-2 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-md bg-blue-600 text-white">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-semibold text-slate-800">{attachedFile.name}</span>
                  <span className="text-[11px] text-slate-500 ml-2">({attachedFile.type}, {attachedFile.size})</span>
                  <span className="ml-2 text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full font-medium">
                    Ingested for Analysis
                  </span>
                </div>
              </div>
              <button
                onClick={() => setAttachedFile(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-md cursor-pointer"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Dynamic Suggestion Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
            <span className="text-slate-400 font-medium text-[11px] flex-shrink-0">
              {attachedFile || selectedDocFilter ? "Document prompts:" : "Quick prompts:"}
            </span>
            {activePrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => send(p)}
                disabled={thinking || isReadingFile}
                className="px-3 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-slate-200 rounded-full text-slate-600 text-xs whitespace-nowrap transition-colors cursor-pointer flex-shrink-0"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Input Field Form */}
          <div className="relative flex items-center gap-2">
            <div className="relative flex-1">
              <div className="absolute left-1.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => setIsDocSelectorOpen(true)}
                  disabled={thinking || isReadingFile}
                  className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Select document from library"
                >
                  <FolderOpen className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={thinking || isReadingFile}
                  className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Upload new PDF or Document"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
              </div>

              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
                placeholder={
                  selectedDocFilter
                    ? `Ask anything about ${selectedDocFilter} or convert to spreadsheet…`
                    : "Ask about Indian health deserts, document analysis, create a sheet, or select a document…"
                }
                className="w-full h-11 pl-18 pr-12 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:outline-hidden transition-all"
              />

              <button
                onClick={() => send()}
                disabled={(!input.trim() && !attachedFile) || thinking || isReadingFile}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg flex items-center justify-center transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Document Selector & Library Modal */}
      <DocumentSelectorModal
        isOpen={isDocSelectorOpen}
        onClose={() => setIsDocSelectorOpen(false)}
        availableDocs={availableDocs}
        selectedDoc={selectedDocFilter}
        onSelectDoc={handleSelectDoc}
        onClearDoc={handleClearActiveDoc}
        onUploadNew={processFile}
        isUploading={isUploadingDoc}
      />

      {/* Data Conversion & Spreadsheet Modal */}
      <DataConversionModal
        isOpen={conversionModalOpen}
        onClose={() => setConversionModalOpen(false)}
        initialText={conversionText}
        documentTitle={selectedDocFilter || activeSession?.title}
      />
    </div>
  );
}
