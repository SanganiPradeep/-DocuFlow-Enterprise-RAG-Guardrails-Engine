import React from 'react';
import { 
  ShieldAlert, 
  Database, 
  Sliders, 
  Activity, 
  GitFork, 
  LogIn, 
  LogOut, 
  ChevronDown, 
  User, 
  CheckCircle2, 
  Lock 
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

interface HeaderProps {
  activeTab: 'chat' | 'knowledge' | 'config' | 'audit' | 'architecture';
  setActiveTab: (tab: 'chat' | 'knowledge' | 'config' | 'audit' | 'architecture') => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  const { user, openAuthModal, logout, switchRole } = useAuth();
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = React.useState(false);

  const getClearanceBadge = (clearance: string) => {
    switch (clearance) {
      case 'Restricted':
        return 'bg-[#FCE8E6] text-[#D93025] border-[#F1998E]';
      case 'Confidential':
        return 'bg-[#FEF7E0] text-[#B06000] border-[#FEEFC3]';
      default:
        return 'bg-[#E8F0FE] text-[#1967D2] border-[#ADCCF9]';
    }
  };

  const getAvatarBg = (role?: UserRole) => {
    switch (role) {
      case 'security_auditor':
        return 'bg-[#EA4335]';
      case 'compliance_officer':
        return 'bg-[#F9AB00] text-[#202124]';
      default:
        return 'bg-[#1A73E8] text-white';
    }
  };

  return (
    <header className="bg-white border-b border-[#DADCE0] sticky top-0 z-40 shrink-0">
      {/* Top Professional GCP Status Ribbon */}
      <div className="bg-[#202124] text-[#BDC1C6] text-[11px] py-1 px-6 flex items-center justify-between border-b border-[#3C4043]">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 font-medium text-white">
            <span className="inline-block w-2 h-2 rounded-full bg-[#34A853] animate-pulse"></span>
            Google Cloud Model Armor: Active
          </span>
          <span className="text-[#5F6368]">|</span>
          <span className="text-[#9AA0A6]">Vertex AI Vector Search (asia-east1)</span>
          <span className="text-[#5F6368]">|</span>
          <span className="text-[#9AA0A6]">Gemini 3.8 Flash Grounding</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[#9AA0A6] flex items-center gap-1">
            <Lock className="w-3 h-3 text-[#EA4335]" />
            Zero-Trust Semantic Interception
          </span>
          <span className="text-[#5F6368]">|</span>
          <span className="text-white font-mono text-[11px]">Firebase Auth SecOps</span>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="px-6 h-14 flex items-center justify-between">
        {/* Logo & Platform Title */}
        <div 
          className="flex items-center gap-3 cursor-pointer" 
          onClick={() => setActiveTab('chat')}
        >
          <div className="w-8 h-8 bg-[#1A73E8] rounded flex items-center justify-center shadow-sm text-white shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
            </svg>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-semibold tracking-tight text-[#202124]">
              DocuFlow <span className="text-[#1A73E8] font-normal">GCP</span>
            </span>
            <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-medium tracking-wider uppercase bg-[#E8F0FE] text-[#1967D2] border border-[#ADCCF9]">
              Enterprise RAG
            </span>
          </div>
        </div>

        {/* Center Navigation Links */}
        <nav className="hidden md:flex items-center gap-1.5">
          <button
            id="nav-chat-btn"
            onClick={() => setActiveTab('chat')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'chat'
                ? 'bg-[#E8F0FE] text-[#1967D2] border border-[#ADCCF9] shadow-2xs'
                : 'text-[#5F6368] hover:text-[#202124] hover:bg-[#F8F9FA]'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Secure RAG Chat
          </button>

          <button
            id="nav-knowledge-btn"
            onClick={() => setActiveTab('knowledge')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'knowledge'
                ? 'bg-[#E8F0FE] text-[#1967D2] border border-[#ADCCF9] shadow-2xs'
                : 'text-[#5F6368] hover:text-[#202124] hover:bg-[#F8F9FA]'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            Knowledge Base
          </button>

          <button
            id="nav-config-btn"
            onClick={() => setActiveTab('config')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'config'
                ? 'bg-[#E8F0FE] text-[#1967D2] border border-[#ADCCF9] shadow-2xs'
                : 'text-[#5F6368] hover:text-[#202124] hover:bg-[#F8F9FA]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Model Armor Rules
          </button>

          <button
            id="nav-audit-btn"
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'audit'
                ? 'bg-[#E8F0FE] text-[#1967D2] border border-[#ADCCF9] shadow-2xs'
                : 'text-[#5F6368] hover:text-[#202124] hover:bg-[#F8F9FA]'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Audit Telemetry
          </button>

          <button
            id="nav-arch-btn"
            onClick={() => setActiveTab('architecture')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'architecture'
                ? 'bg-[#E8F0FE] text-[#1967D2] border border-[#ADCCF9] shadow-2xs'
                : 'text-[#5F6368] hover:text-[#202124] hover:bg-[#F8F9FA]'
            }`}
          >
            <GitFork className="w-3.5 h-3.5" />
            Architecture Flow
          </button>
        </nav>

        {/* Right Section: Model Armor Badge & User Profile */}
        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-[#E8F0FE] rounded-full border border-[#ADCCF9]">
            <div className="w-2 h-2 rounded-full bg-[#34A853]"></div>
            <span className="text-[11px] font-medium text-[#1967D2] uppercase tracking-wider">
              Model Armor Active
            </span>
          </div>

          {user ? (
            <div className="relative flex items-center gap-3 pl-4 border-l border-[#DADCE0]">
              <button
                id="user-profile-menu-btn"
                onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                className="flex items-center gap-2.5 p-1 rounded-full hover:bg-[#F8F9FA] transition-all text-left"
              >
                <div className={`w-8 h-8 rounded-full ${getAvatarBg(user.role)} text-white flex items-center justify-center text-xs font-bold shadow-xs`}>
                  {user.displayName.substring(0, 2).toUpperCase()}
                </div>
                <div className="hidden sm:block">
                  <div className="text-xs font-medium text-[#202124] flex items-center gap-1.5">
                    {user.email}
                    <span className={`text-[9px] px-1.5 py-0.2 rounded border font-semibold ${getClearanceBadge(user.clearanceLevel)}`}>
                      {user.clearanceLevel}
                    </span>
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-[#70757A]" />
              </button>

              {/* Role Switcher & Profile Dropdown */}
              {isRoleDropdownOpen && (
                <div 
                  id="role-dropdown-menu"
                  className="absolute right-0 top-11 w-72 bg-white rounded-xl shadow-lg border border-[#DADCE0] py-2 z-50"
                >
                  <div className="px-4 py-2 border-b border-[#F1F3F4]">
                    <p className="text-xs font-semibold text-[#202124]">Enterprise Identity Profile</p>
                    <p className="text-xs text-[#5F6368] truncate">{user.email}</p>
                    <p className="text-[11px] text-[#1A73E8] font-medium mt-0.5">{user.department}</p>
                  </div>

                  <div className="px-2 py-2">
                    <p className="text-[10px] uppercase font-bold text-[#70757A] px-2 py-1 tracking-wider">
                      Switch Enterprise Role / Persona
                    </p>
                    <button
                      onClick={() => {
                        switchRole('security_auditor');
                        setIsRoleDropdownOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-2 rounded-md text-xs flex items-center justify-between transition-colors ${
                        user.role === 'security_auditor' ? 'bg-[#FCE8E6] text-[#D93025] font-semibold' : 'hover:bg-[#F8F9FA] text-[#3C4043]'
                      }`}
                    >
                      <div>
                        <p className="font-medium">Security Auditor (Elena Vance)</p>
                        <p className="text-[10px] text-[#70757A]">Restricted Clearance • Full Telemetry</p>
                      </div>
                      {user.role === 'security_auditor' && <CheckCircle2 className="w-4 h-4 text-[#D93025]" />}
                    </button>

                    <button
                      onClick={() => {
                        switchRole('compliance_officer');
                        setIsRoleDropdownOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-2 rounded-md text-xs flex items-center justify-between transition-colors ${
                        user.role === 'compliance_officer' ? 'bg-[#FEF7E0] text-[#B06000] font-semibold' : 'hover:bg-[#F8F9FA] text-[#3C4043]'
                      }`}
                    >
                      <div>
                        <p className="font-medium">Compliance Officer (Marcus Chen)</p>
                        <p className="text-[10px] text-[#70757A]">Confidential Clearance • Policy Audits</p>
                      </div>
                      {user.role === 'compliance_officer' && <CheckCircle2 className="w-4 h-4 text-[#F9AB00]" />}
                    </button>

                    <button
                      onClick={() => {
                        switchRole('knowledge_worker');
                        setIsRoleDropdownOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-2 rounded-md text-xs flex items-center justify-between transition-colors ${
                        user.role === 'knowledge_worker' ? 'bg-[#E8F0FE] text-[#1967D2] font-semibold' : 'hover:bg-[#F8F9FA] text-[#3C4043]'
                      }`}
                    >
                      <div>
                        <p className="font-medium">Knowledge Worker (Sarah Jenkins)</p>
                        <p className="text-[10px] text-[#70757A]">Internal Clearance • Standard RAG</p>
                      </div>
                      {user.role === 'knowledge_worker' && <CheckCircle2 className="w-4 h-4 text-[#1A73E8]" />}
                    </button>
                  </div>

                  <div className="border-t border-[#F1F3F4] pt-1 px-2">
                    <button
                      onClick={() => {
                        setIsRoleDropdownOpen(false);
                        openAuthModal();
                      }}
                      className="w-full text-left px-2.5 py-1.5 text-xs text-[#5F6368] hover:text-[#202124] hover:bg-[#F8F9FA] rounded-md flex items-center gap-2"
                    >
                      <User className="w-3.5 h-3.5" />
                      Manage Firebase Credentials
                    </button>

                    <button
                      onClick={() => {
                        setIsRoleDropdownOpen(false);
                        logout();
                      }}
                      className="w-full text-left px-2.5 py-1.5 text-xs text-[#D93025] hover:bg-[#FCE8E6] rounded-md flex items-center gap-2 mt-0.5"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="pl-4 border-l border-[#DADCE0]">
              <button
                id="sign-in-nav-btn"
                onClick={openAuthModal}
                className="px-3.5 py-1.5 bg-[#1A73E8] hover:bg-[#1557B0] text-white text-xs font-medium rounded-md shadow-xs flex items-center gap-1.5 transition-colors"
              >
                <LogIn className="w-3.5 h-3.5" />
                Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
