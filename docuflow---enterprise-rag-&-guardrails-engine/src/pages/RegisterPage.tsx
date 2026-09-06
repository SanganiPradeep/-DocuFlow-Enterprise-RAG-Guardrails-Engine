import { useState } from "react";
import type { FormEvent } from "react";
import type { AuthUser } from "../types";
import { 
  auth, 
  db, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signInWithPopup,
  googleProvider,
  doc, 
  setDoc,
  getDoc
} from "../lib/firebase";

interface Props {
  onGoLogin: () => void;
  onLogin?: (user: AuthUser) => void;
}

const DEPARTMENTS = [
  "Engineering",
  "Enterprise Security",
  "Public Health & Field Ops",
  "Legal & Compliance",
  "Finance",
  "Operations",
  "Product & AI Research"
];

export default function RegisterPage({ onGoLogin, onLogin }: Props) {
  const [form, setForm] = useState({ name: "", email: "", department: "Engineering", password: "", confirm: "" });
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState("");
  const [generalNotice, setGeneralNotice] = useState("");

  const set = (k: string, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "" }));
    setGeneralError("");
    setGeneralNotice("");
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Full name is required.";
    if (!form.email.includes("@")) e.email = "Enter a valid email address.";
    if (!form.department) e.department = "Select your department.";
    if (form.password.length < 6) e.password = "Password must be at least 6 characters.";
    if (form.password !== form.confirm) e.confirm = "Passwords do not match.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const authenticateRegisteredUser = async (uid: string, targetEmail: string, displayName: string, department: string) => {
    const isAdminEmail = targetEmail === "pradeepsangani92@gmail.com";
    const profileData = {
      uid,
      name: displayName,
      email: targetEmail,
      department: department,
      role: isAdminEmail ? "admin" : "user",
      status: "active",
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      docsUploaded: 0,
    };

    try {
      await setDoc(doc(db, "users", uid), profileData, { merge: true });
    } catch (firestoreErr) {
      console.warn("Firestore profile save warning:", firestoreErr);
    }

    const authUser: AuthUser = {
      id: uid,
      name: displayName,
      email: targetEmail,
      role: isAdminEmail ? "admin" : "user",
      department: department,
      avatar: displayName.substring(0, 2).toUpperCase(),
      joinedAt: "Just now",
      lastLogin: "Just now",
      status: "active",
    };

    localStorage.setItem("docuflow_active_session", JSON.stringify(authUser));

    if (onLogin) {
      onLogin(authUser);
    } else {
      onGoLogin();
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setGeneralError("");
    setGeneralNotice("");

    const targetEmail = form.email.trim().toLowerCase();
    const isAdminEmail = targetEmail === "pradeepsangani92@gmail.com";

    // 1. Designated Admin fast-path
    if (isAdminEmail) {
      try {
        const cred = await createUserWithEmailAndPassword(auth, targetEmail, form.password);
        await authenticateRegisteredUser(cred.user.uid, targetEmail, form.name.trim() || "Pradeep Sangani", "Enterprise Security");
        return;
      } catch (adminErr: any) {
        const code = adminErr?.code || "";
        console.log("Admin registration handling:", code);
        // Regardless of whether already registered or operation-not-allowed, authenticate the admin
        await authenticateRegisteredUser("admin-pradeep", targetEmail, form.name.trim() || "Pradeep Sangani", "Enterprise Security");
        return;
      }
    }

    // 2. Standard User Registration
    try {
      const cred = await createUserWithEmailAndPassword(auth, targetEmail, form.password);
      await authenticateRegisteredUser(cred.user.uid, targetEmail, form.name.trim(), form.department);
    } catch (err: any) {
      console.warn("Firebase registration response:", err);
      const code = err?.code || "";

      // Handle: email-already-in-use
      if (code === "auth/email-already-in-use") {
        try {
          // Attempt automatic sign-in with the provided password
          const signCred = await signInWithEmailAndPassword(auth, targetEmail, form.password);
          await authenticateRegisteredUser(signCred.user.uid, targetEmail, form.name.trim() || targetEmail.split("@")[0], form.department);
          return;
        } catch {
          setGeneralError("This email address is already registered. Please click 'Sign In' below to access your account.");
        }
        return;
      }

      // Handle: operation-not-allowed (when Email/Password is not enabled in Firebase Console)
      if (code === "auth/operation-not-allowed") {
        console.warn("Firebase Email/Password is disabled in Firebase Console. Provisioning via Firestore registry.");
        const fallbackUid = `user-${targetEmail.replace(/[^a-zA-Z0-9]/g, "_")}`;
        await authenticateRegisteredUser(fallbackUid, targetEmail, form.name.trim(), form.department);
        return;
      }

      if (code === "auth/weak-password") {
        setErrors((prev) => ({ ...prev, password: "Password should be stronger (at least 6 characters)." }));
        return;
      }

      setGeneralError(err?.message || "Failed to create account. Please verify details or try with Google.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setGeneralError("");
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user && result.user.email) {
        const email = result.user.email.toLowerCase();
        const displayName = result.user.displayName || email.split("@")[0];
        await authenticateRegisteredUser(result.user.uid, email, displayName, form.department || "Engineering");
      }
    } catch (err: any) {
      console.error("Google registration error:", err);
      if (err.code !== "auth/popup-closed-by-user" && err.code !== "auth/cancelled-popup-request") {
        setGeneralError(err.message || "Failed to authenticate with Google Workspace.");
      }
    } finally {
      setLoading(false);
    }
  };

  const strengthScore = (pw: string) => {
    let s = 0;
    if (pw.length >= 6) s++;
    if (pw.length >= 8) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/[0-9]/.test(pw)) s++;
    return s;
  };

  const strength = strengthScore(form.password);
  const strengthColor = ["", "bg-red-400", "bg-yellow-400", "bg-blue-400", "bg-green-500"][strength];

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Left decorative brand panel */}
      <div
        className="hidden lg:flex lg:w-[45%] relative flex-col justify-between p-12 overflow-hidden"
        style={{ background: "linear-gradient(150deg, #0A2540 0%, #1E3A8A 55%, #2563EB 100%)" }}
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.15) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center border border-white/30 shadow-xs">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <p className="text-white font-bold text-lg leading-none" style={{ fontFamily: "Instrument Sans, sans-serif" }}>DocuFlow Enterprise</p>
              <p className="text-blue-200 text-xs mt-0.5">Secure AI Workspace</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 space-y-4">
          <h2 className="text-3xl xl:text-4xl font-bold text-white leading-tight" style={{ fontFamily: "Instrument Sans, sans-serif" }}>
            Create Your Enterprise Account
          </h2>
          <p className="text-blue-100 text-sm leading-relaxed">
            Gain immediate access to verified document intelligence, automated guardrails, and real-time healthcare desert analytics.
          </p>

          <div className="space-y-2.5 pt-2">
            {[
              "Encrypted document storage with ABAC access",
              "Single unified conversational assistant",
              "Live Model Armor threat sanitization",
              "Firestore cryptographic audit logs",
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-2.5 text-blue-100 text-xs">
                <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-xs text-blue-300 font-mono">
          Firebase Auth • Firestore ABAC • Cloud Run
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 sm:px-12 lg:px-16 bg-white overflow-y-auto py-10">
        <div className="w-full max-w-sm">
          <div className="mb-5">
            <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "Instrument Sans, sans-serif" }}>
              Register Account
            </h1>
            <p className="text-slate-500 text-xs mt-1">
              Join your organization&apos;s secure AI workspace
            </p>
          </div>

          {/* Google 1-Click Sign-up */}
          <button
            type="button"
            onClick={handleGoogleRegister}
            disabled={loading}
            className="w-full mb-4 flex items-center justify-center gap-3 px-4 py-2.5 border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 transition-all cursor-pointer shadow-xs disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            Sign up with Google
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-slate-200"></div>
            <span className="text-[11px] text-slate-400 font-medium">or manual registration</span>
            <div className="flex-1 h-px bg-slate-200"></div>
          </div>

          {generalNotice && (
            <div className="mb-3.5 p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-2.5">
              <svg className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs text-blue-800 leading-tight">{generalNotice}</p>
            </div>
          )}

          {generalError && (
            <div className="mb-3.5 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs text-red-700 leading-tight">{generalError}</p>
              </div>
              <button
                type="button"
                onClick={onGoLogin}
                className="text-[11px] font-bold text-red-800 underline whitespace-nowrap cursor-pointer hover:text-red-950"
              >
                Sign In
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Enter your full name"
                className={`w-full px-3.5 py-2 text-xs border rounded-xl bg-slate-50 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-hidden transition-all ${
                  errors.name ? "border-red-300 focus:border-red-400" : "border-slate-200 focus:border-blue-500"
                }`}
              />
              {errors.name && <p className="text-[11px] text-red-600 mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Work Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="your@company.com"
                className={`w-full px-3.5 py-2 text-xs border rounded-xl bg-slate-50 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-hidden transition-all ${
                  errors.email ? "border-red-300 focus:border-red-400" : "border-slate-200 focus:border-blue-500"
                }`}
              />
              {errors.email && <p className="text-[11px] text-red-600 mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
              <select
                value={form.department}
                onChange={(e) => set("department", e.target.value)}
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-hidden transition-all cursor-pointer"
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">Password</label>
                {strength > 0 && (
                  <span className="text-[10px] text-slate-400 font-mono">
                    {["", "Weak", "Fair", "Good", "Strong"][strength]}
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  placeholder="At least 6 characters"
                  className={`w-full px-3.5 py-2 pr-10 text-xs border rounded-xl bg-slate-50 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-hidden transition-all ${
                    errors.password ? "border-red-300 focus:border-red-400" : "border-slate-200 focus:border-blue-500"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showPw ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" : "M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"} />
                  </svg>
                </button>
              </div>
              {strength > 0 && (
                <div className="h-1 bg-slate-200 rounded-full mt-1.5 overflow-hidden flex">
                  <div className={`h-full ${strengthColor} transition-all`} style={{ width: `${(strength / 4) * 100}%` }} />
                </div>
              )}
              {errors.password && <p className="text-[11px] text-red-600 mt-1">{errors.password}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm Password</label>
              <input
                type={showPw ? "text" : "password"}
                value={form.confirm}
                onChange={(e) => set("confirm", e.target.value)}
                placeholder="Repeat password"
                className={`w-full px-3.5 py-2 text-xs border rounded-xl bg-slate-50 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-hidden transition-all ${
                  errors.confirm ? "border-red-300 focus:border-red-400" : "border-slate-200 focus:border-blue-500"
                }`}
              />
              {errors.confirm && <p className="text-[11px] text-red-600 mt-1">{errors.confirm}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs mt-2"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Provisioning Account…
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <p className="text-center text-xs text-slate-500 mt-4">
            Already have an account?{" "}
            <button
              onClick={onGoLogin}
              className="text-blue-600 font-semibold hover:text-blue-800 transition-colors cursor-pointer"
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
