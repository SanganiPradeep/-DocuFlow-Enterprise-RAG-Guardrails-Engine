import { AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { MONTHLY_USERS, DEPT_BREAKDOWN } from "../data";

const QUERY_TYPES = [
  { name: "Document Q&A", value: 48, color: "#4285F4" },
  { name: "Summarization", value: 22, color: "#34A853" },
  { name: "Contract Analysis", value: 17, color: "#FBBC04" },
  { name: "Data Extraction", value: 13, color: "#EA4335" },
];

const DAILY_ACTIVITY = [
  { hour: "6am", queries: 12 },
  { hour: "8am", queries: 89 },
  { hour: "10am", queries: 234 },
  { hour: "12pm", queries: 187 },
  { hour: "2pm", queries: 312 },
  { hour: "4pm", queries: 278 },
  { hour: "6pm", queries: 134 },
  { hour: "8pm", queries: 45 },
];

const SECURITY_TREND = [
  { week: "Aug W1", blocked: 28, sanitized: 8 },
  { week: "Aug W2", blocked: 35, sanitized: 11 },
  { week: "Aug W3", blocked: 31, sanitized: 9 },
  { week: "Aug W4", blocked: 44, sanitized: 14 },
  { week: "Sep W1", blocked: 42, sanitized: 12 },
];

export default function AnalyticsPage() {
  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8,Month,Users,Documents\n" +
      MONTHLY_USERS.map((e) => `${e.month},${e.users},${e.docs}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "docuflow_analytics_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-5 max-w-7xl">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900" style={{ fontFamily: "Instrument Sans, sans-serif" }}>Analytics</h2>
        <p className="text-sm text-slate-500 mt-0.5">Platform usage insights & model telemetry</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Queries (MTD)", value: "8,342", change: "+14.2%", up: true },
          { label: "Avg Response Time", value: "1.4s", change: "-0.3s", up: true },
          { label: "User Adoption Rate", value: "78.9%", change: "+6.1%", up: true },
          { label: "Avg Docs / User", value: "7.5", change: "+1.2", up: true },
        ].map((k) => (
          <div key={k.label} className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-medium text-slate-500">{k.label}</p>
            <p className="text-2xl font-bold text-slate-900 mt-1 font-mono" style={{ fontFamily: "Instrument Sans, sans-serif" }}>
              {k.value}
            </p>
            <p className={`text-xs font-medium mt-0.5 ${k.up ? "text-green-600" : "text-red-600"}`}>
              {k.up ? "↑" : "↓"} {k.change} vs last month
            </p>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* User Growth */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-1" style={{ fontFamily: "Instrument Sans, sans-serif" }}>Platform Growth</h3>
          <p className="text-xs text-slate-400 mb-4">Users and documents indexed</p>
          <div className="w-full h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MONTHLY_USERS} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gU" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4285F4" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#4285F4" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gD" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34A853" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#34A853" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E2E8F0" }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="users" name="Users" stroke="#4285F4" strokeWidth={2} fill="url(#gU)" dot={{ r: 3, fill: "#4285F4" }} />
                <Area type="monotone" dataKey="docs" name="Documents" stroke="#34A853" strokeWidth={2} fill="url(#gD)" dot={{ r: 3, fill: "#34A853" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Daily Activity */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-1" style={{ fontFamily: "Instrument Sans, sans-serif" }}>Daily Query Pattern</h3>
          <p className="text-xs text-slate-400 mb-4">Queries by hour of day</p>
          <div className="w-full h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={DAILY_ACTIVITY} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="hour" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E2E8F0" }} />
                <Bar dataKey="queries" name="Queries" fill="#4285F4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Query Types Pie */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-1" style={{ fontFamily: "Instrument Sans, sans-serif" }}>Query Type Distribution</h3>
          <p className="text-xs text-slate-400 mb-4">By category this month</p>
          <div className="w-full h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={QUERY_TYPES} cx="50%" cy="50%" innerRadius={48} outerRadius={76} dataKey="value" paddingAngle={2}>
                  {QUERY_TYPES.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E2E8F0" }} formatter={(v) => [`${v}%`, ""]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1.5 mt-2">
            {QUERY_TYPES.map((q) => (
              <div key={q.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-xs flex-shrink-0" style={{ background: q.color }}></span>
                  <span className="text-xs text-slate-600">{q.name}</span>
                </div>
                <span className="text-xs font-mono font-semibold text-slate-800">{q.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Dept Usage */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-1" style={{ fontFamily: "Instrument Sans, sans-serif" }}>Users by Department</h3>
          <p className="text-xs text-slate-400 mb-4">Current distribution</p>
          <div className="w-full h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={DEPT_BREAKDOWN} layout="vertical" margin={{ top: 0, right: 5, left: 0, bottom: 0 }}>
                <XAxis type="number" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <YAxis dataKey="dept" type="category" tick={{ fontSize: 10, fill: "#64748B" }} axisLine={false} tickLine={false} width={70} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E2E8F0" }} />
                <Bar dataKey="count" name="Users" fill="#4285F4" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Security Trend */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-1" style={{ fontFamily: "Instrument Sans, sans-serif" }}>Security Incident Trend</h3>
          <p className="text-xs text-slate-400 mb-4">Threats blocked vs sanitized</p>
          <div className="w-full h-60">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={SECURITY_TREND} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="week" tick={{ fontSize: 9, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E2E8F0" }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="blocked" name="Blocked" stroke="#EA4335" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="sanitized" name="Sanitized" stroke="#4285F4" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Export */}
      <div className="flex justify-end gap-3 pt-2">
        <button
          onClick={handleExportCSV}
          className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
        >
          Export CSV
        </button>
        <button
          onClick={handleExportPDF}
          className="px-4 py-2 text-sm font-semibold text-white bg-blue-500 hover:bg-blue-600 rounded-xl transition-colors cursor-pointer shadow-xs"
        >
          Download PDF Report
        </button>
      </div>
    </div>
  );
}
