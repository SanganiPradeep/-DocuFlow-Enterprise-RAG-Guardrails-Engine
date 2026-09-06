import { useState, useEffect } from "react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { MONTHLY_USERS, DEPT_BREAKDOWN } from "../data";
import type { Page, ManagedUser } from "../types";
import { db, collection, onSnapshot, doc, updateDoc, deleteDoc } from "../lib/firebase";

interface Props {
  onNavigate: (p: Page) => void;
}

export default function AdminOverviewPage({ onNavigate }: Props) {
  const [usersList, setUsersList] = useState<ManagedUser[]>([]);
  const [docCount, setDocCount] = useState(0);

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      const list: ManagedUser[] = snapshot.docs.map((d) => {
        const data = d.data();
        const email = (data.email || "").toLowerCase();
        const isAdmin = email === "pradeepsangani92@gmail.com" || data.role === "admin";
        return {
          id: d.id,
          name: data.name || (isAdmin ? "Pradeep Sangani" : email.split("@")[0]),
          email: email,
          role: isAdmin ? "admin" : "user",
          department: data.department || (isAdmin ? "Enterprise Security" : "Engineering"),
          status: data.status || "active",
          lastLogin: data.lastLogin ? new Date(data.lastLogin).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Recently",
          docsUploaded: data.docsUploaded || 0,
          joinedAt: data.createdAt ? new Date(data.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "Recently",
        };
      });

      if (!list.some((u) => u.email === "pradeepsangani92@gmail.com")) {
        list.unshift({
          id: "admin-pradeep",
          name: "Pradeep Sangani",
          email: "pradeepsangani92@gmail.com",
          role: "admin",
          department: "Enterprise Security",
          status: "active",
          lastLogin: "Active Now",
          docsUploaded: 0,
          joinedAt: "Sep 2026",
        });
      }

      setUsersList(list);
    });

    const unsubDocs = onSnapshot(collection(db, "documents"), (snapshot) => {
      setDocCount(snapshot.docs.length);
    });

    return () => {
      unsubUsers();
      unsubDocs();
    };
  }, []);

  const metrics = [
    { label: "Total Users", value: String(usersList.length || 1), delta: "Real-time accounts", color: "text-blue-600", bg: "bg-blue-50", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" },
    { label: "Active Accounts", value: String(usersList.filter((u) => u.status === "active").length || 1), delta: "Firebase Auth", color: "text-green-600", bg: "bg-green-50", icon: "M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0M19 21a7 7 0 11-14 0 7 7 0 0114 0z" },
    { label: "Documents Indexed", value: String(docCount), delta: "Knowledge Base", color: "text-purple-600", bg: "bg-purple-50", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
    { label: "AI & Armor Status", value: "Active", delta: "Model Armor Input/Output Shields", color: "text-emerald-600", bg: "bg-emerald-50", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
  ];

  const pendingUsers = usersList.filter((u) => u.status === "pending");
  const recentUsers = usersList.filter((u) => u.status !== "pending").slice(0, 4);

  const handleApprove = async (id: string) => {
    try {
      await updateDoc(doc(db, "users", id), { status: "active" });
    } catch {
      setUsersList((prev) =>
        prev.map((u) => (u.id === id ? { ...u, status: "active", lastLogin: "Just approved" } : u))
      );
    }
  };

  const handleDeny = async (id: string) => {
    try {
      await deleteDoc(doc(db, "users", id));
    } catch {
      setUsersList((prev) => prev.filter((u) => u.id !== id));
    }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900" style={{ fontFamily: "Instrument Sans, sans-serif" }}>Admin Overview</h2>
        <p className="text-sm text-slate-500 mt-0.5">Enterprise security metrics and workspace operations</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {metrics.map((m) => (
          <div key={m.label} className="bg-white rounded-xl border border-slate-200 p-4 hover:border-slate-300 transition-colors">
            <div className={`w-8 h-8 ${m.bg} rounded-lg flex items-center justify-center mb-2.5`}>
              <svg className={`w-4 h-4 ${m.color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={m.icon} />
              </svg>
            </div>
            <p className={`text-2xl font-bold ${m.color} font-mono`} style={{ fontFamily: "Instrument Sans, sans-serif" }}>{m.value}</p>
            <p className="text-xs font-medium text-slate-700 mt-0.5 leading-tight">{m.label}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{m.delta}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* User Growth */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-800" style={{ fontFamily: "Instrument Sans, sans-serif" }}>User Growth & Document Volume</h3>
              <p className="text-xs text-slate-400">Monthly progression</p>
            </div>
          </div>
          <div className="w-full h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MONTHLY_USERS} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4285F4" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#4285F4" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gDocs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34A853" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#34A853" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E2E8F0" }} />
                <Area type="monotone" dataKey="users" name="Users" stroke="#4285F4" strokeWidth={2} fill="url(#gUsers)" dot={false} />
                <Area type="monotone" dataKey="docs" name="Docs" stroke="#34A853" strokeWidth={2} fill="url(#gDocs)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-1.5"><span className="w-3 h-2 rounded-xs bg-blue-500 inline-block"></span><span className="text-xs text-slate-500">Users</span></div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-2 rounded-xs bg-green-500 inline-block"></span><span className="text-xs text-slate-500">Documents</span></div>
          </div>
        </div>

        {/* Dept Breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-4" style={{ fontFamily: "Instrument Sans, sans-serif" }}>Users by Department</h3>
          <div className="w-full h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={DEPT_BREAKDOWN} layout="vertical" margin={{ top: 0, right: 5, left: 0, bottom: 0 }}>
                <XAxis type="number" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <YAxis dataKey="dept" type="category" tick={{ fontSize: 10, fill: "#64748B" }} axisLine={false} tickLine={false} width={72} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E2E8F0" }} />
                <Bar dataKey="count" name="Users" fill="#4285F4" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Pending Approvals */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-800" style={{ fontFamily: "Instrument Sans, sans-serif" }}>Pending Access Requests</h3>
              {pendingUsers.length > 0 && (
                <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">{pendingUsers.length}</span>
              )}
            </div>
            <button onClick={() => onNavigate("admin-users")} className="text-xs text-blue-500 font-medium hover:text-blue-700 cursor-pointer">Manage →</button>
          </div>
          {pendingUsers.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <p className="text-sm text-slate-400">No pending access requests at this time.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {pendingUsers.map((u) => (
                <div key={u.id} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-xs font-bold text-orange-700">
                      {u.name.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-800">{u.name}</p>
                      <p className="text-[11px] text-slate-400">{u.email} · {u.department}</p>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleApprove(u.id)}
                      className="px-2.5 py-1 bg-green-50 text-green-700 text-xs font-medium border border-green-200 rounded-lg hover:bg-green-100 transition-colors cursor-pointer"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleDeny(u.id)}
                      className="px-2.5 py-1 bg-red-50 text-red-700 text-xs font-medium border border-red-200 rounded-lg hover:bg-red-100 transition-colors cursor-pointer"
                    >
                      Deny
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Users */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-800" style={{ fontFamily: "Instrument Sans, sans-serif" }}>Recent Users</h3>
            <button onClick={() => onNavigate("admin-users")} className="text-xs text-blue-500 font-medium hover:text-blue-700 cursor-pointer">View all →</button>
          </div>
          <div className="divide-y divide-slate-50">
            {recentUsers.map((u) => (
              <div key={u.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                  {u.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-800 truncate">{u.name}</p>
                  <p className="text-[11px] text-slate-400 truncate">{u.department} · {u.lastLogin}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${u.role === "admin" ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-600"}`}>
                    {u.role === "admin" ? "Admin" : "User"}
                  </span>
                  <span className={`w-2 h-2 rounded-full ${u.status === "active" ? "bg-green-500" : "bg-slate-300"}`}></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
