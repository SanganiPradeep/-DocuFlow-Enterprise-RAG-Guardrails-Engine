import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import type { ManagedUser } from "../types";
import { 
  db, 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  handleFirestoreError, 
  OperationType 
} from "../lib/firebase";

type Filter = "all" | "active" | "inactive" | "pending";

export default function UserManagementPage() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "user">("user");
  const [inviteDept, setInviteDept] = useState("Engineering");

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        const loaded: ManagedUser[] = snapshot.docs.map((d) => {
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

        // Ensure designated administrator is visible if collection has not seeded yet
        if (!loaded.some((u) => u.email === "pradeepsangani92@gmail.com")) {
          loaded.unshift({
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

        setUsers(loaded);
        setLoading(false);
      },
      (error) => {
        console.warn("Firestore users sync:", error);
        handleFirestoreError(error, OperationType.LIST, "users");
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  const filtered = users.filter((u) => {
    const matchFilter = filter === "all" || u.status === filter;
    const s = search.toLowerCase();
    const matchSearch =
      !search ||
      u.name.toLowerCase().includes(s) ||
      u.email.toLowerCase().includes(s) ||
      u.department.toLowerCase().includes(s);
    return matchFilter && matchSearch;
  });

  const toggleSelect = (id: string) => {
    setSelected((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  };

  const approveUser = async (id: string) => {
    try {
      await updateDoc(doc(db, "users", id), { status: "active", lastLogin: new Date().toISOString() });
    } catch {
      setUsers((p) => p.map((u) => (u.id === id ? { ...u, status: "active" } : u)));
    }
  };

  const deactivateUser = async (id: string) => {
    try {
      await updateDoc(doc(db, "users", id), { status: "inactive" });
    } catch {
      setUsers((p) => p.map((u) => (u.id === id ? { ...u, status: "inactive" } : u)));
    }
  };

  const activateUser = async (id: string) => {
    try {
      await updateDoc(doc(db, "users", id), { status: "active" });
    } catch {
      setUsers((p) => p.map((u) => (u.id === id ? { ...u, status: "active" } : u)));
    }
  };

  const handleBulkDeactivate = async () => {
    for (const uid of selected) {
      try {
        await updateDoc(doc(db, "users", uid), { status: "inactive" });
      } catch {
        // Continue
      }
    }
    setUsers((p) => p.map((u) => (selected.includes(u.id) ? { ...u, status: "inactive" } : u)));
    setSelected([]);
  };

  const handleSendInvite = async (e: FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    const targetEmail = inviteEmail.trim().toLowerCase();
    const newId = `user-${Date.now()}`;
    const newUser: ManagedUser = {
      id: newId,
      name: inviteName.trim() || targetEmail.split("@")[0].replace(".", " "),
      email: targetEmail,
      role: targetEmail === "pradeepsangani92@gmail.com" ? "admin" : inviteRole,
      department: inviteDept,
      status: "active",
      lastLogin: "Invited",
      docsUploaded: 0,
      joinedAt: "Today",
    };

    try {
      await setDoc(doc(db, "users", newId), {
        uid: newId,
        name: newUser.name,
        email: targetEmail,
        role: newUser.role,
        department: newUser.department,
        status: "active",
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        docsUploaded: 0,
      });
    } catch (err) {
      console.warn("Invite save error:", err);
    }

    setUsers((p) => [newUser, ...p]);
    setInviteEmail("");
    setInviteName("");
    setShowInvite(false);
  };

  const counts = {
    all: users.length,
    active: users.filter((u) => u.status === "active").length,
    inactive: users.filter((u) => u.status === "inactive").length,
    pending: users.filter((u) => u.status === "pending").length,
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 overflow-hidden">
      {/* Top Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex-shrink-0 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900" style={{ fontFamily: "Instrument Sans, sans-serif" }}>
            User &amp; Access Management
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Role-Based Access Control and Firestore account verification
          </p>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Invite User
        </button>
      </div>

      {/* Main Table Container */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-4">
          {/* Filter tabs & Search */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-1">
              {(["all", "active", "pending", "inactive"] as Filter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all cursor-pointer ${
                    filter === f
                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {f} ({counts[f]})
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {selected.length > 0 && (
                <button
                  onClick={handleBulkDeactivate}
                  className="px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-semibold hover:bg-red-100 transition-colors cursor-pointer"
                >
                  Deactivate Selected ({selected.length})
                </button>
              )}
              <div className="relative flex-1 sm:w-64">
                <svg className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, email, department…"
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                  <tr>
                    <th className="p-3.5 w-8">
                      <input
                        type="checkbox"
                        checked={selected.length === filtered.length && filtered.length > 0}
                        onChange={() =>
                          setSelected(selected.length === filtered.length ? [] : filtered.map((u) => u.id))
                        }
                        className="rounded border-slate-300 accent-blue-600 cursor-pointer"
                      />
                    </th>
                    <th className="p-3.5">User</th>
                    <th className="p-3.5">Role</th>
                    <th className="p-3.5">Department</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Last Login</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        No enterprise accounts found matching filter.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3.5">
                          <input
                            type="checkbox"
                            checked={selected.includes(u.id)}
                            onChange={() => toggleSelect(u.id)}
                            className="rounded border-slate-300 accent-blue-600 cursor-pointer"
                          />
                        </td>
                        <td className="p-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-[10px] flex-shrink-0">
                              {u.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800 leading-tight">{u.name}</p>
                              <p className="text-[11px] text-slate-400">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                              u.role === "admin"
                                ? "bg-purple-50 text-purple-700 border-purple-200"
                                : "bg-slate-100 text-slate-700 border-slate-200"
                            }`}
                          >
                            {u.role.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3.5 font-medium">{u.department}</td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border inline-flex items-center gap-1 ${
                              u.status === "active"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : u.status === "pending"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-slate-100 text-slate-600 border-slate-200"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                u.status === "active"
                                  ? "bg-emerald-500"
                                  : u.status === "pending"
                                  ? "bg-amber-500"
                                  : "bg-slate-400"
                              }`}
                            ></span>
                            {u.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-400 font-mono text-[11px]">{u.lastLogin}</td>
                        <td className="p-3.5 text-right">
                          {u.status === "pending" ? (
                            <button
                              onClick={() => approveUser(u.id)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                            >
                              Approve
                            </button>
                          ) : u.status === "active" ? (
                            <button
                              onClick={() => deactivateUser(u.id)}
                              disabled={u.email === "pradeepsangani92@gmail.com"}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-red-50 hover:text-red-700 border border-slate-200 rounded-lg text-xs text-slate-600 font-medium transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              Deactivate
                            </button>
                          ) : (
                            <button
                              onClick={() => activateUser(u.id)}
                              className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold hover:bg-blue-100 transition-colors cursor-pointer"
                            >
                              Activate
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      {showInvite && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1" style={{ fontFamily: "Instrument Sans, sans-serif" }}>
              Provision Enterprise User
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Invite a new team member and provision their Firestore role permissions.
            </p>

            <form onSubmit={handleSendInvite} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="e.g. Maya Patel"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Work Email</label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Role</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as "admin" | "user")}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-blue-500 focus:outline-hidden cursor-pointer"
                  >
                    <option value="user">User (Standard)</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                  <select
                    value={inviteDept}
                    onChange={(e) => setInviteDept(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-blue-500 focus:outline-hidden cursor-pointer"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Enterprise Security">Enterprise Security</option>
                    <option value="Public Health & Ops">Public Health & Ops</option>
                    <option value="Compliance">Compliance</option>
                    <option value="Operations">Operations</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowInvite(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-xs"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
