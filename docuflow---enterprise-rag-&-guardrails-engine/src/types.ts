export type UserRole = 'security_auditor' | 'compliance_officer' | 'knowledge_worker';

export interface EnterpriseUser {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  clearanceLevel: 'Restricted' | 'Confidential' | 'Internal';
  department: string;
  isCustomFirebase?: boolean;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  department: string;
  avatar: string;
  joinedAt: string;
  lastLogin: string;
  status?: 'active' | 'inactive' | 'pending';
}

export type Page =
  | 'dashboard'
  | 'workspace'
  | 'chat'
  | 'profile'
  | 'settings'
  | 'admin-overview'
  | 'admin-users'
  | 'admin-security'
  | 'admin-analytics';

export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  department: string;
  status: 'active' | 'inactive' | 'pending';
  lastLogin: string;
  docsUploaded: number;
  joinedAt: string;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  userId: string;
  violationType: string;
  payloadSnippet: string;
  action: 'BLOCKED' | 'SANITIZED' | 'FLAGGED';
}

export interface UploadedFile {
  id: string;
  name: string;
  size: string;
  type: string;
  status: 'indexed' | 'indexing' | 'error';
  uploadedAt: string;
  summary?: string;
}

export interface DocumentChunk {
  id: string;
  content: string;
  pageNumber?: number;
  sectionTitle?: string;
  tokenCount: number;
}

export interface EnterpriseDocument {
  id: string;
  title: string;
  category: 'HR Policies' | 'Cloud Infrastructure' | 'Executive & Financial' | 'Compliance & Legal' | 'Engineering';
  classification: 'Restricted' | 'Confidential' | 'Internal';
  uploadedAt: string;
  chunkCount: number;
  summary: string;
  fileSize: string;
  chunks: DocumentChunk[];
}

export interface Citation {
  documentId?: string;
  documentTitle?: string;
  doc?: string;
  classification?: 'Restricted' | 'Confidential' | 'Internal';
  sectionTitle?: string;
  pageNumber?: number;
  page?: number;
  similarityScore?: number; // 0 - 1
  snippet?: string;
}

export type ThreatCategory = 
  | 'prompt_injection'
  | 'jailbreak'
  | 'pii_leakage'
  | 'system_prompt_extraction'
  | 'credential_harvesting'
  | 'malicious_code'
  | 'none';

export interface GuardrailCheckResult {
  passed: boolean;
  threatCategory: ThreatCategory;
  severity: 'none' | 'low' | 'medium' | 'high' | 'critical';
  confidenceScore: number;
  blockedReason?: string;
  matchedSignatures?: string[];
  sanitizedText?: string;
  redacted?: boolean;
  shieldLayer: 'input_shield' | 'output_shield';
}

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  preview: string;
  createdAt: string;
  updatedAt: string;
  targetDoc?: string;
  messageCount?: number;
  messages?: ChatMessage[];
}

export interface ExtractedTableData {
  headers: string[];
  rows: string[][];
  title?: string;
}

export interface ChatMessage {
  id: string;
  sessionId?: string;
  role?: 'user' | 'assistant' | 'system';
  sender?: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  attachedFile?: { name: string; size: string; type: string };
  extractedTable?: ExtractedTableData;
  inputShieldResult?: GuardrailCheckResult;
  outputShieldResult?: GuardrailCheckResult;
  citations?: any[];
  processingTimeMs?: number;
  retrievalLatencyMs?: number;
  generationLatencyMs?: number;
  status?: 'safe' | 'blocked' | 'sanitized' | 'error';
  isStreaming?: boolean;
  modelUsed?: string;
  userId?: string;
  userRole?: UserRole;
}

export interface TelemetryLog {
  id: string;
  timestamp: string;
  userEmail: string;
  userRole: UserRole;
  query: string;
  reply?: string;
  status: 'blocked' | 'passed' | 'sanitized';
  threatCategory: ThreatCategory;
  threatSeverity: 'none' | 'low' | 'medium' | 'high' | 'critical';
  confidenceScore: number;
  inputShieldTimeMs: number;
  vectorSearchTimeMs: number;
  geminiGenerationTimeMs: number;
  outputShieldTimeMs: number;
  totalTimeMs: number;
  blockedReason?: string;
  chunksRetrieved: number;
  modelUsed?: string;
}

export interface GuardrailConfig {
  promptInjectionShield: boolean;
  jailbreakDetector: boolean;
  piiMasking: boolean;
  credentialLeakPrevention: boolean;
  hallucinationVerifier: boolean;
  sensitivityLevel: 'standard' | 'high' | 'strict_enterprise';
  redactionChar: string;
  blockedKeywords: string[];
}
