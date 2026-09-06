import { useState, useEffect } from "react";
import { AUDIT_LOG } from "../data";
import type { AuditEntry } from "../types";
import { Check, ShieldCheck, ShieldAlert, AlertTriangle } from "lucide-react";

export default function SecurityPage() {
  const [filters, setFilters] = useState({
    blockInjection: true,
    sanitizePII: true,
    scanPDFs: true,
    blockFinancial: true,
    jailbreakDetection: true,
  });
  const [sensitivity, setSensitivity] = useState(30);
  const [auditFilter, setAuditFilter] = useState<"all" | "BLOCKED" | "SANITIZED" | "FLAGGED">("all");
  const [log, setLog] = useState<AuditEntry[]>(AUDIT_LOG);
  const [showBanner, setShowBanner] = useState(true);
  const [appliedNotice, setAppliedNotice] = useState(false);

  useEffect(() => {
    fetch("/api/telemetry")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.recentAuditLog) && data.recentAuditLog.length > 0) {
          setLog(data.recentAuditLog);
        }
      })
      .catch(() => {});
  }, []);

  const toggle = (k: keyof typeof filters) => setFilters((f) => ({ ...f, [k]: !f[k] }));
  const filtered = log.filter((e) => auditFilter === "all" || e.action === auditFilter);

  const handleApplyConfig = () => {
    setAppliedNotice(true);
    setTimeout(() => setAppliedNotice(false), 2500);
  };

  const ActionBadge = ({ action }: { action: AuditEntry["action"] }) => {
    const s = {
      BLOCKED: "bg-red-50 text-red-700 border-red-200",
      FLAGGED: "bg-yellow-50 text-yellow-700 border-yellow-200",
      SANITIZED: "bg-blue-50 text-blue-700 border-blue-200",
    }[action];
    return <span className={`inline-flex px-2 py-0.5 rounded text-xs font-mono font-medium border ${s}`}>{action}</span>;
  };

  return (
    <div className="space-y-5 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900" style={{ fontFamily: "Instrument Sans, sans-serif" }}>Security Console</h2>
          <p className="text-sm text-slate-500 mt-0.5">Model Armor configuration & real-time threat monitoring</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-xl">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          <span className="text-xs font-semibold text-green-700 font-mono">Security Health: 98.4%</span>
        </div>
      </div>

      {/* Alert Banner */}
      {showBanner && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-800">3 security incidents neutralized in the last hour</p>
            <p className="text-xs text-red-600 mt-0.5">
              2 prompt injections blocked · 1 PII sanitized · All payloads neutralized by Google Cloud Model Armor
            </p>
          </div>
          <button onClick={() => setShowBanner(false)} className="text-xs text-red-600 font-medium hover:text-red-800 transition-colors flex-shrink-0 cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Prompts Screened", value: "14,820", sub: "Today", color: "text-slate-800", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
          { label: "Injections Blocked", value: "42", sub: "Last 24 hrs", color: "text-red-600", icon: "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" },
          { label: "PII Prevented", value: "12", sub: "Sanitized", color: "text-blue-600", icon: "M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" },
          { label: "System Health", value: "98.4%", sub: "All filters active", color: "text-green-600", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
        ].map((m) => (
          <div key={m.label} className="bg-white rounded-xl border border-slate-200 p-4">
            <svg className={`w-4 h-4 ${m.color} mb-2`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={m.icon} />
            </svg>
            <p className={`text-2xl font-bold font-mono ${m.color}`} style={{ fontFamily: "Instrument Sans, sans-serif" }}>{m.value}</p>
            <p className="text-xs font-medium text-slate-700 mt-0.5">{m.label}</p>
            <p className="text-[11px] text-slate-400">{m.sub}</p>
          </div>
        ))}
      </div>

      {/* Policy Config */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-5">
          <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <h3 className="font-semibold text-slate-800" style={{ fontFamily: "Instrument Sans, sans-serif" }}>Model Armor Policy Configuration</h3>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 space-y-3">
            {[
              { key: "blockInjection" as const, label: "Block Prompt Injection", desc: "Detect and block jailbreak, system prompt extraction, and override attempts" },
              { key: "sanitizePII" as const, label: "Sanitize PII / Personal Data", desc: "Redact SSN, passport numbers, email addresses, and phone numbers before model input" },
              { key: "blockFinancial" as const, label: "Block Financial Data Leaks", desc: "Prevent credit card numbers, IBANs, and wire transfer credentials from model telemetry" },
              { key: "scanPDFs" as const, label: "Scan Uploaded Files for Malware", desc: "Deep heuristics scan for PDF, DOCX, and TXT payloads during vectorization" },
              { key: "jailbreakDetection" as const, label: "Jailbreak Pattern Detection", desc: "Identify DAN, AIM, Developer Mode, and persona override patterns" },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-slate-800">{item.label}</p>
                  <p className="text-xs text-slate-400">{item.desc}</p>
                </div>
                <button
                  type="button"
                  onClick={() => toggle(item.key)}
                  className={`relative rounded-full transition-colors duration-200 flex-shrink-0 cursor-pointer ${
                    filters[item.key] ? "bg-blue-500" : "bg-slate-200"
                  }`}
                  style={{ width: 40, height: 22 }}
                >
                  <span
                    className="absolute rounded-full bg-white shadow-xs transition-transform duration-200"
                    style={{
                      width: 18,
                      height: 18,
                      top: 2,
                      left: filters[item.key] ? 20 : 2,
                    }}
                  ></span>
                </button>
              </div>
            ))}
          </div>

          <div className="lg:w-72 border-t lg:border-t-0 lg:border-l border-slate-100 lg:pl-8 pt-4 lg:pt-0">
            <p className="text-sm font-semibold text-slate-800 mb-1">Detection Sensitivity</p>
            <p className="text-xs text-slate-400 mb-4">Adjust the statistical threshold for flagging suspicious prompts.</p>
            <input
              type="range"
              min={0}
              max={100}
              value={sensitivity}
              onChange={(e) => setSensitivity(Number(e.target.value))}
              className="w-full accent-blue-500 cursor-pointer"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1.5">
              <span>Strict (0%)</span>
              <span className="font-mono font-semibold text-blue-600">{sensitivity}%</span>
              <span>Lenient (100%)</span>
            </div>

            {/* Condition: Sensitivity classification */}
            <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1">
                {sensitivity < 25 ? (
                  <>
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                    <span>Very Strict</span>
                  </>
                ) : sensitivity < 50 ? (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Balanced (Recommended)</span>
                  </>
                ) : sensitivity < 75 ? (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Lenient</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Minimal Protection</span>
                  </>
                )}
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                {sensitivity < 25
                  ? "Maximum protection. Zero tolerance for ambiguous keywords. May generate false positives on complex legal terminology."
                  : sensitivity < 50
                  ? "Optimal balance between zero-trust security and developer usability."
                  : sensitivity < 75
                  ? "Higher tolerance threshold. Some obfuscated adversarial payloads might bypass preliminary screening."
                  : "Warning: Low security threshold. Not recommended for regulated enterprise deployments."}
              </p>
            </div>

            <button
              type="button"
              onClick={handleApplyConfig}
              className={`w-full mt-3 py-2 text-sm font-semibold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                appliedNotice ? "bg-green-600 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              {appliedNotice ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Policy Applied</span>
                </>
              ) : (
                "Apply Configuration"
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-4 border-b border-slate-100 gap-3">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-800 text-sm" style={{ fontFamily: "Instrument Sans, sans-serif" }}>Live Model Armor Audit Log</h3>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 rounded-full text-xs font-medium font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>Live Stream
            </span>
          </div>
          <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
            {(["all", "BLOCKED", "SANITIZED", "FLAGGED"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setAuditFilter(f)}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors capitalize cursor-pointer ${
                  auditFilter === f ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {f.charAt(0) + f.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {["Timestamp", "User ID", "Violation Type", "Payload Snippet", "Action Taken"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5 font-mono text-slate-500 whitespace-nowrap">{row.timestamp}</td>
                  <td className="px-5 py-3.5 font-mono text-blue-600">{row.userId}</td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                        row.violationType.includes("Injection")
                          ? "bg-red-50 text-red-700 border border-red-200"
                          : row.violationType.includes("PII")
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : row.violationType.includes("Financial")
                          ? "bg-orange-50 text-orange-700 border border-orange-200"
                          : "bg-yellow-50 text-yellow-700 border border-yellow-200"
                      }`}
                    >
                      {row.violationType}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-slate-500 max-w-xs truncate">{row.payloadSnippet}</td>
                  <td className="px-5 py-3.5"><ActionBadge action={row.action} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-slate-100">
          {filtered.map((row) => (
            <div key={row.id} className="p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-mono text-xs text-slate-400">{row.timestamp}</span>
                <ActionBadge action={row.action} />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-blue-600">{row.userId}</span>
              </div>
              <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                row.violationType.includes("Injection") ? "bg-red-50 text-red-700" : "bg-yellow-50 text-yellow-700"
              }`}>{row.violationType}</span>
              <p className="font-mono text-xs text-slate-500 truncate">{row.payloadSnippet}</p>
            </div>
          ))}
        </div>

        <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-400">Showing {filtered.length} incidents logged</p>
          <button
            onClick={() => alert("Exported security audit report (CSV).")}
            className="text-xs text-blue-500 font-medium hover:text-blue-700 transition-colors cursor-pointer"
          >
            Download CSV Report
          </button>
        </div>
      </div>
    </div>
  );
}
