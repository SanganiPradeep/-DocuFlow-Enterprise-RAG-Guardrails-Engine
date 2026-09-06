import { useState, useEffect } from "react";
import type { AuthUser, Page } from "./types";
import { 
  auth, 
  db, 
  onAuthStateChanged, 
  firebaseSignOut, 
  doc, 
  getDoc 
} from "./lib/firebase";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import AppShell from "./pages/AppShell";
import UserDashboard from "./pages/UserDashboard";
import WorkspacePage from "./pages/WorkspacePage";
import ChatPage from "./pages/ChatPage";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";
import AdminOverviewPage from "./pages/AdminOverviewPage";
import UserManagementPage from "./pages/UserManagementPage";
import SecurityPage from "./pages/SecurityPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import { ChatProvider } from "./contexts/ChatContext";

type AuthView = "login" | "register";

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem("docuflow_active_session");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [authLoading, setAuthLoading] = useState(true);
  const [authView, setAuthView] = useState<AuthView>("login");
  const [page, setPage] = useState<Page>("dashboard");
  const [chatTargetDoc, setChatTargetDoc] = useState<string | null>(null);

  // Real-time Firebase Authentication listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser && fbUser.email) {
        const email = fbUser.email.toLowerCase();
        const isAdmin = email === "pradeepsangani92@gmail.com";
        let userData: any = null;

        try {
          const snap = await getDoc(doc(db, "users", fbUser.uid));
          if (snap.exists()) {
            userData = snap.data();
          }
        } catch (e) {
          console.warn("Could not retrieve Firestore user document:", e);
        }

        const authUser: AuthUser = {
          id: fbUser.uid,
          name: userData?.name || (isAdmin ? "Pradeep Sangani" : fbUser.displayName || email.split("@")[0]),
          email: email,
          role: isAdmin ? "admin" : (userData?.role || "user"),
          department: userData?.department || (isAdmin ? "Enterprise Security" : "Engineering"),
          avatar: (userData?.name || email).substring(0, 2).toUpperCase(),
          joinedAt: userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "Recently",
          lastLogin: "Just now",
          status: userData?.status || "active",
        };

        setUser(authUser);
        localStorage.setItem("docuflow_active_session", JSON.stringify(authUser));
        if (isAdmin && page === "dashboard") {
          setPage("admin-overview");
        }
      } else {
        const savedSession = localStorage.getItem("docuflow_active_session");
        if (savedSession) {
          try {
            const parsed = JSON.parse(savedSession);
            if (parsed && parsed.email) {
              setUser(parsed);
              setAuthLoading(false);
              return;
            }
          } catch {
            // continue
          }
        }
        setUser(null);
      }
      setAuthLoading(false);
    });

    return () => unsub();
  }, []);

  const handleLogin = (u: AuthUser) => {
    setUser(u);
    localStorage.setItem("docuflow_active_session", JSON.stringify(u));
    setPage(u.role === "admin" ? "admin-overview" : "dashboard");
  };

  const handleLogout = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      console.warn("Sign out error:", e);
    }
    localStorage.removeItem("docuflow_active_session");
    setUser(null);
    setAuthView("login");
    setPage("dashboard");
  };

  const navigate = (p: Page) => {
    if (!user) return;
    if (p.startsWith("admin") && user.role !== "admin") {
      setPage(p); // Triggers AccessDenied view
      return;
    }
    setPage(p);
  };

  const handleOpenInChat = (documentName?: string) => {
    setChatTargetDoc(documentName || null);
    setPage("chat");
  };

  // Loading state while verifying Firebase auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4"></div>
        <p className="font-semibold text-sm text-slate-200" style={{ fontFamily: "Instrument Sans, sans-serif" }}>
          DocuFlow Enterprise
        </p>
        <p className="text-xs text-slate-500 font-mono mt-1">Connecting to Firebase Auth…</p>
      </div>
    );
  }

  // Not logged in -> Show Login or Register with Firebase
  if (!user) {
    return authView === "login" ? (
      <LoginPage 
        onLogin={handleLogin} 
        onGoRegister={() => setAuthView("register")} 
      />
    ) : (
      <RegisterPage 
        onGoLogin={() => setAuthView("login")} 
        onLogin={handleLogin}
      />
    );
  }

  const renderPage = () => {
    switch (page) {
      case "dashboard":
        return <UserDashboard user={user} onNavigate={navigate} />;
      case "workspace":
        return (
          <WorkspacePage 
            onNavigateToChat={handleOpenInChat} 
            onNavigate={navigate} 
          />
        );
      case "chat":
        return (
          <ChatPage 
            initialDocument={chatTargetDoc}
            onClearInitialDoc={() => setChatTargetDoc(null)}
          />
        );
      case "profile":
        return <ProfilePage user={user} />;
      case "settings":
        return <SettingsPage />;

      // Conditional RBAC Guards for Admin Pages
      case "admin-overview":
        return user.role === "admin" ? <AdminOverviewPage onNavigate={navigate} /> : <AccessDenied onBack={() => setPage("dashboard")} />;
      case "admin-users":
        return user.role === "admin" ? <UserManagementPage /> : <AccessDenied onBack={() => setPage("dashboard")} />;
      case "admin-security":
        return user.role === "admin" ? <SecurityPage /> : <AccessDenied onBack={() => setPage("dashboard")} />;
      case "admin-analytics":
        return user.role === "admin" ? <AnalyticsPage /> : <AccessDenied onBack={() => setPage("dashboard")} />;

      default:
        return <UserDashboard user={user} onNavigate={navigate} />;
    }
  };

  return (
    <ChatProvider>
      <AppShell
        user={user}
        currentPage={page}
        onNavigate={navigate}
        onLogout={handleLogout}
      >
        {renderPage()}
      </AppShell>
    </ChatProvider>
  );
}

function AccessDenied({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-20 text-center max-w-md mx-auto">
      <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-4 border border-red-200">
        <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      </div>
      <span className="px-2.5 py-0.5 bg-red-100 text-red-800 rounded-full text-xs font-mono font-semibold mb-2">
        RBAC_ACCESS_RESTRICTED (403)
      </span>
      <h3 className="font-bold text-slate-800 text-lg" style={{ fontFamily: "Instrument Sans, sans-serif" }}>
        Administrator Privileges Required
      </h3>
      <p className="text-slate-500 text-sm mt-1.5 leading-relaxed">
        Your current account does not have administrative privileges. Contact security lead Pradeep Sangani for access.
      </p>
      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={onBack}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer shadow-xs"
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  );
}
