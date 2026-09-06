import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { ChatSession, ChatMessage } from "../types";
import {
  db,
  auth,
  collection,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  handleFirestoreError,
  OperationType,
} from "../lib/firebase";

const INITIAL_WELCOME_CONTENT = `Hello. I am DocuFlow, your real-time document intelligence assistant powered by Google Cloud Vertex AI and Google Cloud Model Armor.

Enterprise Capabilities:
1. Real-Time Chat with PDFs: Attach or select any PDF or document to chat in real time. Answers are grounded strictly in your document with concise, structured output and exact page citations.
2. Necessary & Structured Answers: Responses deliver direct answers, key metrics, and structured markdown data tables without unnecessary filler.
3. Health Desert Finder for India: Identify specific neighborhoods far from tertiary hospitals across Indian cities, analyze population density, and calculate Social Impact Scores (out of 100) for mobile clinic deployment.
4. Automated Spreadsheet Export: Generate clean data tables with one-click export to Excel (.xlsx), CSV, JSON, Google Sheets, and Google Drive.
5. Google Cloud Model Armor Guardrails: Real-time zero-trust inspection defending against prompt injections, sensitive data leakage, and compliance risks.

Attach a PDF or ask any targeted question to begin.`;

export const createDefaultWelcomeMessage = (): ChatMessage => ({
  id: `welcome-${Date.now()}`,
  role: "assistant",
  sender: "assistant",
  content: INITIAL_WELCOME_CONTENT,
  timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
});

interface ChatContextType {
  sessions: ChatSession[];
  activeSessionId: string | null;
  activeSession: ChatSession | null;
  setActiveSessionId: (id: string) => void;
  handleNewChat: () => string;
  handleSelectSession: (id: string) => void;
  handleRenameSession: (id: string, newTitle: string) => Promise<void>;
  handleDeleteSession: (id: string) => Promise<void>;
  handleShareSession: (session: ChatSession) => void;
  updateSessionMessages: (
    sessionId: string,
    messages: ChatMessage[],
    inferredTitle?: string,
    targetDoc?: string
  ) => Promise<void>;
  setSessionTargetDoc: (sessionId: string, targetDoc: string | null) => Promise<void>;
  shareModalOpen: boolean;
  sessionToShare: ChatSession | null;
  closeShareModal: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [sessionToShare, setSessionToShare] = useState<ChatSession | null>(null);

  const currentUser = auth?.currentUser;
  const userIdentifier = currentUser?.uid || "enterprise_user";

  const persistSessionsLocally = (updated: ChatSession[]) => {
    try {
      localStorage.setItem(`docuflow_sessions_${userIdentifier}`, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const loadLocalSessions = (): ChatSession[] => {
    try {
      const saved = localStorage.getItem(`docuflow_sessions_${userIdentifier}`);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return [];
  };

  const initializeDefaultSession = useCallback(() => {
    const defaultId = `session-${Date.now()}`;
    const initialMsg = createDefaultWelcomeMessage();
    const defaultSession: ChatSession = {
      id: defaultId,
      userId: userIdentifier,
      title: "Document & Health Desert Analysis",
      preview: "Initial consultation session for enterprise analysis",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messageCount: 1,
      messages: [initialMsg],
    };

    setSessions([defaultSession]);
    setActiveSessionId(defaultId);
    persistSessionsLocally([defaultSession]);

    setDoc(doc(db, "chat_sessions", defaultId), defaultSession).catch(() => {});
    return defaultId;
  }, [userIdentifier]);

  // Load and sync sessions
  useEffect(() => {
    const local = loadLocalSessions();
    if (local.length > 0) {
      setSessions(local);
      if (!activeSessionId) {
        setActiveSessionId(local[0].id);
      }
    }

    const unsub = onSnapshot(
      collection(db, "chat_sessions"),
      (snapshot) => {
        if (!snapshot.empty) {
          const loadedSessions: ChatSession[] = snapshot.docs
            .map((d) => {
              const data = d.data();
              return {
                id: d.id,
                userId: data.userId || userIdentifier,
                title: data.title || "Enterprise Chat",
                preview: data.preview || "Active consultation session",
                createdAt: data.createdAt || new Date().toISOString(),
                updatedAt: data.updatedAt || new Date().toISOString(),
                targetDoc: data.targetDoc || undefined,
                messageCount: data.messageCount || 1,
                messages: data.messages || [],
              };
            })
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

          setSessions(loadedSessions);
          persistSessionsLocally(loadedSessions);

          setActiveSessionId((prev) => {
            if (prev && loadedSessions.some((s) => s.id === prev)) {
              return prev;
            }
            return loadedSessions[0]?.id || null;
          });
        } else if (local.length === 0) {
          initializeDefaultSession();
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, "chat_sessions");
        if (local.length === 0) {
          initializeDefaultSession();
        }
      }
    );

    return () => unsub();
  }, [userIdentifier, initializeDefaultSession]);

  const handleNewChat = (): string => {
    const newId = `session-${Date.now()}`;
    const welcome = createDefaultWelcomeMessage();
    const newSession: ChatSession = {
      id: newId,
      userId: userIdentifier,
      title: "New Chat",
      preview: "Ready for document analysis or health desert inquiry",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messageCount: 1,
      messages: [welcome],
    };

    const updated = [newSession, ...sessions];
    setSessions(updated);
    setActiveSessionId(newId);
    persistSessionsLocally(updated);

    setDoc(doc(db, "chat_sessions", newId), newSession).catch((err) => {
      console.warn("Firestore new chat error:", err);
    });

    return newId;
  };

  const handleSelectSession = (id: string) => {
    setActiveSessionId(id);
  };

  const handleRenameSession = async (id: string, newTitle: string) => {
    const updated = sessions.map((s) => (s.id === id ? { ...s, title: newTitle } : s));
    setSessions(updated);
    persistSessionsLocally(updated);

    try {
      await setDoc(
        doc(db, "chat_sessions", id),
        { title: newTitle, updatedAt: new Date().toISOString() },
        { merge: true }
      );
    } catch (err) {
      console.warn("Firestore rename error:", err);
    }
  };

  const handleDeleteSession = async (id: string) => {
    const updated = sessions.filter((s) => s.id !== id);
    setSessions(updated);
    persistSessionsLocally(updated);

    try {
      await deleteDoc(doc(db, "chat_sessions", id));
    } catch (err) {
      console.warn("Firestore delete error:", err);
    }

    if (activeSessionId === id) {
      if (updated.length > 0) {
        setActiveSessionId(updated[0].id);
      } else {
        handleNewChat();
      }
    }
  };

  const handleShareSession = (session: ChatSession) => {
    setSessionToShare(session);
    setShareModalOpen(true);
  };

  const closeShareModal = () => {
    setShareModalOpen(false);
    setSessionToShare(null);
  };

  const updateSessionMessages = async (
    sessionId: string,
    updatedMessages: ChatMessage[],
    inferredTitle?: string,
    targetDoc?: string
  ) => {
    const lastMsg = updatedMessages[updatedMessages.length - 1];
    const previewText = lastMsg
      ? lastMsg.content.slice(0, 75).replace(/\n/g, " ")
      : "Active conversation";

    setSessions((prev) => {
      const next = prev.map((s) => {
        if (s.id === sessionId) {
          return {
            ...s,
            title: inferredTitle || s.title,
            preview: previewText,
            updatedAt: new Date().toISOString(),
            messageCount: updatedMessages.length,
            messages: updatedMessages,
            targetDoc: targetDoc !== undefined ? targetDoc : s.targetDoc,
          };
        }
        return s;
      });
      persistSessionsLocally(next);
      return next;
    });

    const currentSession = sessions.find((s) => s.id === sessionId);
    const finalTargetDoc = targetDoc !== undefined ? targetDoc : currentSession?.targetDoc;

    try {
      await setDoc(
        doc(db, "chat_sessions", sessionId),
        {
          userId: userIdentifier,
          title: inferredTitle || currentSession?.title || "Enterprise Chat",
          preview: previewText,
          updatedAt: new Date().toISOString(),
          messageCount: updatedMessages.length,
          messages: updatedMessages,
          targetDoc: finalTargetDoc || null,
        },
        { merge: true }
      );
    } catch (err) {
      console.warn("Firestore session update error:", err);
    }
  };

  const setSessionTargetDoc = async (sessionId: string, targetDoc: string | null) => {
    setSessions((prev) => {
      const next = prev.map((s) => {
        if (s.id === sessionId) {
          return {
            ...s,
            targetDoc: targetDoc || undefined,
            updatedAt: new Date().toISOString(),
          };
        }
        return s;
      });
      persistSessionsLocally(next);
      return next;
    });

    try {
      await setDoc(
        doc(db, "chat_sessions", sessionId),
        {
          targetDoc: targetDoc || null,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (err) {
      console.warn("Firestore setSessionTargetDoc error:", err);
    }
  };

  const activeSession = sessions.find((s) => s.id === activeSessionId) || null;

  return (
    <ChatContext.Provider
      value={{
        sessions,
        activeSessionId,
        activeSession,
        setActiveSessionId,
        handleNewChat,
        handleSelectSession,
        handleRenameSession,
        handleDeleteSession,
        handleShareSession,
        updateSessionMessages,
        setSessionTargetDoc,
        shareModalOpen,
        sessionToShare,
        closeShareModal,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};
