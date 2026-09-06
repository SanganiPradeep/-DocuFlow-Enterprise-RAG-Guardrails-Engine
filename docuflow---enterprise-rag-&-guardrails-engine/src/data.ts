import type { AuthUser, ManagedUser, AuditEntry } from './types';

export const ADMIN_CONFIG = {
  email: 'pradeepsangani92@gmail.com',
  password: 'Pradeep@123',
  name: 'Pradeep Sangani',
  role: 'admin' as const,
  department: 'Enterprise Security',
};

export const MONTHLY_USERS = [
  { month: "Apr", users: 40, active: 25, docs: 18 },
  { month: "May", users: 75, active: 50, docs: 35 },
  { month: "Jun", users: 110, active: 85, docs: 62 },
  { month: "Jul", users: 145, active: 110, docs: 95 },
  { month: "Aug", users: 180, active: 140, docs: 130 },
  { month: "Sep", users: 220, active: 175, docs: 180 },
];

export const DEPT_BREAKDOWN = [
  { dept: "Engineering", count: 45, color: "#4285F4" },
  { dept: "Enterprise Security", count: 28, color: "#EA4335" },
  { dept: "Public Health & Ops", count: 35, color: "#34A853" },
  { dept: "Compliance", count: 20, color: "#FBBC04" },
  { dept: "Operations", count: 15, color: "#00ACC1" },
];

export const AUDIT_LOG: AuditEntry[] = [];
export const MANAGED_USERS: ManagedUser[] = [];
export const MOCK_USERS: AuthUser[] = [];
