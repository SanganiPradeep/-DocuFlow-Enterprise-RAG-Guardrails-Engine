import { useState } from "react";
import type { AuthUser } from "../types";
import { FileText, MessageSquare, Edit3, Shield, Check } from "lucide-react";

interface Props {
  user: AuthUser;
}

export default function ProfilePage({ user }: Props) {
  const [form, setForm] = useState({
    name: user.name,
    email: user.email,
    department: user.department,
    phone: "+1 (415) 555-0192",
    timezone: "America/Los_Angeles",
    notifications: { email: true, security: true, digest: false },
  });
  const [saved, setSaved] = useState(false);

  const save = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const activity = [
    { action: "Uploaded Q3_Financial_Report.pdf", time: "Today, 09:14", type: "file" },
    { action: "Queried: key findings in Q3 report", time: "Today, 09:15", type: "chat" },
    { action: "Uploaded Legal_Contract_v2.docx", time: "Today, 09:22", type: "file" },
    { action: "Inspected document vector tokens", time: "Today, 09:28", type: "edit" },
    { action: "Model Armor verified clean clearance", time: "Yesterday, 16:44", type: "shield" },
  ];

  return (
    <div className="max-w-4xl space-y-6">
      {/* Profile Header */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-blue-500 to-blue-700"></div>
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-10 mb-4">
            <div
              className="w-20 h-20 rounded-2xl bg-white border-4 border-white shadow-lg flex items-center justify-center text-2xl font-bold text-blue-600"
              style={{ fontFamily: "Instrument Sans, sans-serif" }}
            >
              {user.avatar}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-slate-900" style={{ fontFamily: "Instrument Sans, sans-serif" }}>
                {user.name}
              </h2>
              <p className="text-sm text-slate-500">
                {user.department} ·{" "}
                <span className={`font-medium ${user.role === "admin" ? "text-blue-600" : "text-slate-600"}`}>
                  {user.role === "admin" ? "Administrator" : "Standard User"}
                </span>
              </p>
            </div>
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full text-xs font-medium flex items-center gap-1.5 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>Active
              </span>
              {user.role === "admin" && (
                <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-medium font-mono">
                  Admin
                </span>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
            {[
              { label: "Joined", value: user.joinedAt },
              { label: "Last Login", value: user.lastLogin },
              { label: "Documents", value: "87" },
              { label: "Queries", value: "342" },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-xs text-slate-400">{s.label}</p>
                <p className="text-sm font-semibold text-slate-800 mt-0.5 font-mono">{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Edit Profile */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-800 mb-4" style={{ fontFamily: "Instrument Sans, sans-serif" }}>
              Personal Information
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { label: "Full Name", key: "name", type: "text" },
                { label: "Work Email", key: "email", type: "email" },
                { label: "Department", key: "department", type: "text" },
                { label: "Phone", key: "phone", type: "tel" },
              ].map((f) => (
                <div key={f.key}>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">{f.label}</label>
                  <input
                    type={f.type}
                    value={(form as any)[f.key]}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:bg-white focus:border-blue-400 transition-colors"
                  />
                </div>
              ))}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Timezone</label>
                <select
                  value={form.timezone}
                  onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:bg-white focus:border-blue-400 transition-colors"
                >
                  <option value="America/Los_Angeles">Pacific Time (PT)</option>
                  <option value="America/Chicago">Central Time (CT)</option>
                  <option value="America/New_York">Eastern Time (ET)</option>
                  <option value="Europe/London">GMT / BST</option>
                  <option value="Asia/Kolkata">India Standard Time (IST)</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end mt-5">
              <button
                onClick={save}
                className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  saved ? "bg-green-600 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                {saved ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Saved</span>
                  </>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-800 mb-4" style={{ fontFamily: "Instrument Sans, sans-serif" }}>
              Notification Preferences
            </h3>
            <div className="space-y-3">
              {[
                { key: "email", label: "Email notifications", desc: "Receive important account updates via email" },
                { key: "security", label: "Security alerts", desc: "Get notified of suspicious activity immediately" },
                { key: "digest", label: "Weekly digest", desc: "Weekly summary of documents and queries" },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{item.label}</p>
                    <p className="text-xs text-slate-400">{item.desc}</p>
                  </div>
                  <button
                    onClick={() =>
                      setForm({
                        ...form,
                        notifications: {
                          ...form.notifications,
                          [item.key]: !(form.notifications as any)[item.key],
                        },
                      })
                    }
                    className={`relative rounded-full transition-colors duration-200 flex-shrink-0 cursor-pointer ${
                      (form.notifications as any)[item.key] ? "bg-blue-500" : "bg-slate-200"
                    }`}
                    style={{ width: 40, height: 22 }}
                  >
                    <span
                      className="absolute rounded-full bg-white shadow-xs transition-transform duration-200"
                      style={{
                        width: 18,
                        height: 18,
                        top: 2,
                        left: (form.notifications as any)[item.key] ? 20 : 2,
                      }}
                    ></span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Security */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-800 mb-4" style={{ fontFamily: "Instrument Sans, sans-serif" }}>
              Security Credentials
            </h3>
            <div className="space-y-3">
              {["Current Password", "New Password", "Confirm New Password"].map((label) => (
                <div key={label}>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">{label}</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:bg-white focus:border-blue-400 transition-colors"
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center mt-5">
              <button className="text-xs text-slate-500 hover:text-slate-700 transition-colors cursor-pointer">
                Configure Two-Factor Authentication (2FA)
              </button>
              <button
                onClick={() => alert("Password updated successfully.")}
                className="px-5 py-2 text-sm font-semibold bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors cursor-pointer"
              >
                Update Password
              </button>
            </div>
          </div>
        </div>

        {/* Right: Activity + Sessions */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-800" style={{ fontFamily: "Instrument Sans, sans-serif" }}>
                Recent Activity
              </h3>
            </div>
            <div className="divide-y divide-slate-50">
              {activity.map((a, i) => (
                <div key={i} className="px-5 py-3 flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-slate-100 text-slate-600 mt-0.5">
                    {a.type === "file" && <FileText className="w-3.5 h-3.5 text-blue-600" />}
                    {a.type === "chat" && <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />}
                    {a.type === "edit" && <Edit3 className="w-3.5 h-3.5 text-purple-600" />}
                    {a.type === "shield" && <Shield className="w-3.5 h-3.5 text-amber-600" />}
                  </div>
                  <div>
                    <p className="text-xs text-slate-700 leading-snug">{a.action}</p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">{a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-800 mb-3" style={{ fontFamily: "Instrument Sans, sans-serif" }}>
              Active Sessions
            </h3>
            {[
              { device: "MacBook Pro · Chrome 127", location: "San Francisco, CA", current: true },
              { device: "iPhone 16 · Safari", location: "San Francisco, CA", current: false },
            ].map((s, i) => (
              <div key={i} className="flex items-start justify-between py-2.5 border-b border-slate-50 last:border-0">
                <div>
                  <p className="text-xs font-medium text-slate-800">{s.device}</p>
                  <p className="text-[10px] text-slate-400 font-mono">{s.location}</p>
                  {s.current && <span className="text-xs text-green-600 font-medium">This device</span>}
                </div>
                {!s.current && (
                  <button className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors cursor-pointer">
                    Revoke
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="bg-red-50 border border-red-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-red-800 mb-1" style={{ fontFamily: "Instrument Sans, sans-serif" }}>
              Danger Zone
            </h3>
            <p className="text-xs text-red-600 mb-3">Permanently delete your account and all associated document access logs.</p>
            <button
              onClick={() => alert("Deletion request sent to IT Security administrator.")}
              className="w-full py-2 text-xs font-semibold text-red-600 border border-red-300 rounded-lg hover:bg-red-100 transition-colors cursor-pointer"
            >
              Request Account Deletion
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
