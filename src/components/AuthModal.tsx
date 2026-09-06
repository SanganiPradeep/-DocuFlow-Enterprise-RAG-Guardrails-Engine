import React, { useState } from 'react';
import { X, Shield, Lock, Mail, Key, UserCheck, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, signInWithDemoUser, loginWithEmail, registerWithEmail, loading, user } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup' | 'demo'>('demo');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('security_auditor');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    try {
      if (mode === 'signin') {
        if (!email || !password) {
          setErrorMessage('Please enter both email and password.');
          return;
        }
        await loginWithEmail(email, password, selectedRole);
      } else if (mode === 'signup') {
        if (!email || !password || !displayName) {
          setErrorMessage('Please complete all required fields.');
          return;
        }
        await registerWithEmail(email, password, displayName, selectedRole);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication error occurred.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#202124]/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-[#DADCE0] w-full max-w-md overflow-hidden relative">
        {/* Modal Top Header */}
        <div className="bg-[#202124] p-6 text-white relative">
          <button
            onClick={closeAuthModal}
            className="absolute top-4 right-4 p-1.5 rounded-full text-[#BDC1C6] hover:text-white hover:bg-[#3C4043] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1A73E8] flex items-center justify-center text-white shadow-md">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold tracking-tight">DocuFlow Enterprise Auth</h2>
              <p className="text-xs text-[#8AB4F8]">Firebase Identity & Zero-Trust Access Control</p>
            </div>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-[#DADCE0] bg-[#F8F9FA] text-xs font-medium">
          <button
            onClick={() => setMode('demo')}
            className={`flex-1 py-3 text-center transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'demo' ? 'bg-white text-[#1A73E8] border-b-2 border-[#1A73E8] font-bold' : 'text-[#5F6368] hover:text-[#202124]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#1A73E8]" />
            Personas
          </button>
          <button
            onClick={() => setMode('signin')}
            className={`flex-1 py-3 text-center transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'signin' ? 'bg-white text-[#1A73E8] border-b-2 border-[#1A73E8] font-bold' : 'text-[#5F6368] hover:text-[#202124]'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            Firebase Sign In
          </button>
          <button
            onClick={() => setMode('signup')}
            className={`flex-1 py-3 text-center transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'signup' ? 'bg-white text-[#1A73E8] border-b-2 border-[#1A73E8] font-bold' : 'text-[#5F6368] hover:text-[#202124]'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            Register
          </button>
        </div>

        <div className="p-6">
          {errorMessage && (
            <div className="mb-4 p-3 bg-[#FCE8E6] border border-[#F1998E] text-[#D93025] text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#D93025]" />
              <span>{errorMessage}</span>
            </div>
          )}

          {mode === 'demo' ? (
            <div className="space-y-3">
              <p className="text-xs text-[#5F6368]">
                Select an authorized enterprise profile to test Role-Based Access Control (RBAC) and Model Armor clearance:
              </p>

              {/* Persona 1 */}
              <div
                onClick={() => signInWithDemoUser('security_auditor')}
                className="p-3.5 rounded-xl border border-[#F1998E] bg-[#FCE8E6]/40 hover:bg-[#FCE8E6] transition-all cursor-pointer flex items-center justify-between group"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-[#202124]">Elena Vance</span>
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-[#FCE8E6] text-[#D93025] border border-[#F1998E]">
                      Restricted Clearance
                    </span>
                  </div>
                  <p className="text-[11px] text-[#5F6368] mt-0.5">elena.vance@enterprise-sec.corp</p>
                  <p className="text-[10px] text-[#D93025] font-medium mt-1">Role: Security Auditor (Full SecOps)</p>
                </div>
                <div className="w-6 h-6 rounded-full bg-white border border-[#F1998E] flex items-center justify-center text-[#D93025] group-hover:scale-110 transition-transform">
                  →
                </div>
              </div>

              {/* Persona 2 */}
              <div
                onClick={() => signInWithDemoUser('compliance_officer')}
                className="p-3.5 rounded-xl border border-[#FEEFC3] bg-[#FEF7E0]/40 hover:bg-[#FEF7E0] transition-all cursor-pointer flex items-center justify-between group"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-[#202124]">Marcus Chen</span>
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-[#FEF7E0] text-[#B06000] border border-[#FEEFC3]">
                      Confidential Clearance
                    </span>
                  </div>
                  <p className="text-[11px] text-[#5F6368] mt-0.5">marcus.chen@compliance-gov.corp</p>
                  <p className="text-[10px] text-[#B06000] font-medium mt-1">Role: Corporate Compliance Officer</p>
                </div>
                <div className="w-6 h-6 rounded-full bg-white border border-[#FEEFC3] flex items-center justify-center text-[#B06000] group-hover:scale-110 transition-transform">
                  →
                </div>
              </div>

              {/* Persona 3 */}
              <div
                onClick={() => signInWithDemoUser('knowledge_worker')}
                className="p-3.5 rounded-xl border border-[#ADCCF9] bg-[#E8F0FE]/40 hover:bg-[#E8F0FE] transition-all cursor-pointer flex items-center justify-between group"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-[#202124]">Sarah Jenkins</span>
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-[#E8F0FE] text-[#1967D2] border border-[#ADCCF9]">
                      Internal Clearance
                    </span>
                  </div>
                  <p className="text-[11px] text-[#5F6368] mt-0.5">sarah.jenkins@corp.operations.com</p>
                  <p className="text-[10px] text-[#1967D2] font-medium mt-1">Role: Knowledge Worker (Standard Q&A)</p>
                </div>
                <div className="w-6 h-6 rounded-full bg-white border border-[#ADCCF9] flex items-center justify-center text-[#1967D2] group-hover:scale-110 transition-transform">
                  →
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-medium text-[#3C4043] mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full px-3 py-2 text-xs border border-[#DADCE0] rounded-lg focus:ring-2 focus:ring-[#1A73E8] focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-[#3C4043] mb-1">Enterprise Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#70757A] absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@company.com"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-[#DADCE0] rounded-lg focus:ring-2 focus:ring-[#1A73E8] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#3C4043] mb-1">Password</label>
                <div className="relative">
                  <Key className="w-4 h-4 text-[#70757A] absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-[#DADCE0] rounded-lg focus:ring-2 focus:ring-[#1A73E8] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#3C4043] mb-1">Role Assignment (Clearance)</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 text-xs border border-[#DADCE0] rounded-lg focus:ring-2 focus:ring-[#1A73E8] focus:outline-none bg-white"
                >
                  <option value="security_auditor">Security Auditor (Restricted Clearance)</option>
                  <option value="compliance_officer">Compliance Officer (Confidential Clearance)</option>
                  <option value="knowledge_worker">Knowledge Worker (Internal Clearance)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 rounded-md bg-[#1A73E8] hover:bg-[#1557B0] text-white font-medium text-xs transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    {mode === 'signin' ? 'Sign In with Firebase' : 'Create Enterprise Account'}
                  </>
                )}
              </button>
            </form>
          )}

          <div className="mt-5 pt-4 border-t border-[#DADCE0] flex items-center justify-between text-[11px] text-[#70757A]">
            <span>Status: Connected to Firebase Project</span>
            <span className="font-mono text-[10px] bg-[#F1F3F4] px-2 py-0.5 rounded text-[#3C4043]">
              docuflow-enterprise
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
