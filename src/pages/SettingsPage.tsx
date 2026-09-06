import { useState } from "react";
import { Check } from "lucide-react";

export default function SettingsPage() {
  const [s, setS] = useState({
    language: "en",
    dateFormat: "MM/DD/YYYY",
    theme: "light",
    autoIndex: true,
    ocrEnabled: true,
    retentionDays: "365",
    sessionTimeout: "60",
    ipWhitelist: false,
    allowedIPs: "192.168.1.0/24\n10.0.0.0/8",
  });

  const [integrations, setIntegrations] = useState([
    { name: "Google Drive", desc: "Sync documents from corporate Drive folders", connected: true },
    { name: "Microsoft SharePoint", desc: "Index documents directly from SharePoint", connected: false },
    { name: "Slack Security", desc: "Receive Model Armor breach alerts in #sec-alerts", connected: true },
    { name: "Salesforce CRM", desc: "Connect enterprise agreements and contracts", connected: false },
  ]);

  const [saved, setSaved] = useState(false);
  const set = (k: keyof typeof s, v: any) => setS((p) => ({ ...p, [k]: v }));
  const save = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const toggleIntegration = (name: string) => {
    setIntegrations((prev) =>
      prev.map((i) => (i.name === name ? { ...i, connected: !i.connected } : i))
    );
  };

  const Toggle = ({ k }: { k: keyof typeof s }) => (
    <button
      type="button"
      onClick={() => set(k, !s[k])}
      className={`relative rounded-full transition-colors duration-200 flex-shrink-0 cursor-pointer ${
        s[k] ? "bg-blue-500" : "bg-slate-200"
      }`}
      style={{ width: 40, height: 22 }}
    >
      <span
        className="absolute rounded-full bg-white shadow-xs transition-transform duration-200"
        style={{
          width: 18,
          height: 18,
          top: 2,
          left: s[k] ? 20 : 2,
        }}
      ></span>
    </button>
  );

  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-900" style={{ fontFamily: "Instrument Sans, sans-serif" }}>Settings</h2>
        <p className="text-sm text-slate-500 mt-0.5">Manage your workspace preferences, enterprise security, and integrations.</p>
      </div>

      {/* General */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-800 mb-4" style={{ fontFamily: "Instrument Sans, sans-serif" }}>General Preferences</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { label: "Interface Language", key: "language", options: [["en", "English (US)"], ["es", "Español"], ["fr", "Français"], ["de", "Deutsch"]] },
            { label: "Date Format", key: "dateFormat", options: [["MM/DD/YYYY", "MM/DD/YYYY"], ["DD/MM/YYYY", "DD/MM/YYYY"], ["YYYY-MM-DD", "ISO 8601"]] },
            { label: "Theme", key: "theme", options: [["light", "Light Mode (Professional)"], ["dark", "Dark Mode"], ["system", "System Default"]] },
            { label: "Audit Retention", key: "retentionDays", options: [["90", "90 days"], ["365", "1 year (SOC-2 standard)"], ["730", "2 years"], ["never", "Never delete"]] },
          ].map((f) => (
            <div key={f.key}>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">{f.label}</label>
              <select
                value={(s as any)[f.key]}
                onChange={(e) => set(f.key as any, e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:bg-white focus:border-blue-400 transition-colors"
              >
                {f.options.map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* Document Processing */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-800 mb-4" style={{ fontFamily: "Instrument Sans, sans-serif" }}>Document Processing & Vectorization</h3>
        <div className="space-y-4">
          {[
            { key: "autoIndex" as const, label: "Auto-index on upload", desc: "Automatically generate ScANN embeddings when documents are uploaded" },
            { key: "ocrEnabled" as const, label: "OCR for scanned PDF/Images", desc: "Run Cloud Vision OCR on image-based documents before vectorization" },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
              <div>
                <p className="text-sm font-medium text-slate-800">{item.label}</p>
                <p className="text-xs text-slate-400">{item.desc}</p>
              </div>
              <Toggle k={item.key} />
            </div>
          ))}
        </div>
      </div>

      {/* Security & Access */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-800 mb-4" style={{ fontFamily: "Instrument Sans, sans-serif" }}>Security & Access Controls</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Session Inactivity Timeout</label>
            <select
              value={s.sessionTimeout}
              onChange={(e) => set("sessionTimeout", e.target.value)}
              className="w-full sm:w-64 px-3 py-2.5 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:bg-white focus:border-blue-400 transition-colors"
            >
              {[["15", "15 minutes"], ["30", "30 minutes"], ["60", "1 hour (Recommended)"], ["120", "2 hours"], ["480", "8 hours"]].map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-slate-50">
            <div>
              <p className="text-sm font-medium text-slate-800">IP Allowlist Restriction</p>
              <p className="text-xs text-slate-400">Restrict enterprise access strictly to configured CIDR blocks</p>
            </div>
            <Toggle k="ipWhitelist" />
          </div>

          {/* Condition: display textarea if ipWhitelist is true */}
          {s.ipWhitelist && (
            <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl space-y-2">
              <label className="block text-xs font-semibold text-slate-700">Allowed IP Ranges (CIDR notation)</label>
              <textarea
                value={s.allowedIPs}
                onChange={(e) => set("allowedIPs", e.target.value)}
                rows={3}
                className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg bg-white text-slate-800 focus:border-blue-400 outline-none resize-none"
              />
              <p className="text-[10px] text-blue-600 font-mono">Requests originating outside these ranges will be rejected.</p>
            </div>
          )}
        </div>
      </div>

      {/* Integrations */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-800 mb-4" style={{ fontFamily: "Instrument Sans, sans-serif" }}>Enterprise Integrations</h3>
        <div className="space-y-3">
          {integrations.map((i) => (
            <div key={i.name} className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
              <div>
                <p className="text-sm font-medium text-slate-800">{i.name}</p>
                <p className="text-xs text-slate-400">{i.desc}</p>
              </div>
              <button
                type="button"
                onClick={() => toggleIntegration(i.name)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                  i.connected
                    ? "bg-green-50 text-green-700 border border-green-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200"
                    : "bg-slate-100 text-slate-600 border border-slate-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200"
                }`}
              >
                {i.connected ? "Connected (Disconnect)" : "Connect"}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={save}
          className={`px-6 py-2.5 text-sm font-semibold rounded-xl transition-all cursor-pointer shadow-xs flex items-center gap-1.5 ${
            saved ? "bg-green-600 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
        >
          {saved ? (
            <>
              <Check className="w-4 h-4" />
              <span>Settings Saved</span>
            </>
          ) : (
            "Save Settings"
          )}
        </button>
      </div>
    </div>
  );
}
