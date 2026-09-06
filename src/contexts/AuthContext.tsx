import React, { createContext, useContext, useState, useEffect } from 'react';
import { EnterpriseUser, UserRole } from '../types';
import { auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, firebaseSignOut, onAuthStateChanged } from '../lib/firebase';

const DEMO_USERS: Record<UserRole, EnterpriseUser> = {
  security_auditor: {
    uid: 'sec-auditor-01',
    email: 'elena.vance@enterprise-sec.corp',
    displayName: 'Elena Vance',
    role: 'security_auditor',
    clearanceLevel: 'Restricted',
    department: 'Cybersecurity & Model Armor SecOps',
  },
  compliance_officer: {
    uid: 'comp-officer-02',
    email: 'marcus.chen@compliance-gov.corp',
    displayName: 'Marcus Chen',
    role: 'compliance_officer',
    clearanceLevel: 'Confidential',
    department: 'Corporate Legal & Governance',
  },
  knowledge_worker: {
    uid: 'worker-03',
    email: 'sarah.jenkins@corp.operations.com',
    displayName: 'Sarah Jenkins',
    role: 'knowledge_worker',
    clearanceLevel: 'Internal',
    department: 'Operations & Strategy',
  },
};

interface AuthContextType {
  user: EnterpriseUser | null;
  loading: boolean;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  signInWithDemoUser: (role: UserRole) => void;
  loginWithEmail: (email: string, pass: string, selectedRole: UserRole) => Promise<void>;
  registerWithEmail: (email: string, pass: string, name: string, selectedRole: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  switchRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Start with default Security Auditor to immediately demonstrate Model Armor telemetry
  const [user, setUser] = useState<EnterpriseUser | null>(DEMO_USERS.security_auditor);
  const [loading, setLoading] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  useEffect(() => {
    // Listen to live Firebase Auth state if available
    if (!auth) return;
    try {
      const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
        if (fbUser && fbUser.email) {
          // If signed in via live Firebase, map to Enterprise User profile
          setUser((prev) => ({
            uid: fbUser.uid,
            email: fbUser.email || 'user@enterprise.corp',
            displayName: fbUser.displayName || fbUser.email.split('@')[0],
            role: prev?.role || 'security_auditor',
            clearanceLevel: prev?.clearanceLevel || 'Restricted',
            department: prev?.department || 'Enterprise Systems',
            isCustomFirebase: true,
          }));
        }
      });
      return () => unsubscribe();
    } catch (e) {
      console.warn('Firebase onAuthStateChanged hook:', e);
    }
  }, []);

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  const signInWithDemoUser = (role: UserRole) => {
    setUser(DEMO_USERS[role]);
    setIsAuthModalOpen(false);
  };

  const switchRole = (role: UserRole) => {
    if (user) {
      setUser({
        ...user,
        role,
        clearanceLevel: role === 'security_auditor' ? 'Restricted' : role === 'compliance_officer' ? 'Confidential' : 'Internal',
      });
    } else {
      signInWithDemoUser(role);
    }
  };

  const loginWithEmail = async (email: string, pass: string, selectedRole: UserRole) => {
    setLoading(true);
    try {
      if (auth && !email.endsWith('.corp')) {
        // Attempt live Firebase Auth
        await signInWithEmailAndPassword(auth, email, pass);
      } else {
        // Enterprise domain simulation
        await new Promise((r) => setTimeout(r, 600));
        setUser({
          uid: 'uid-' + Math.random().toString(36).substring(2, 9),
          email,
          displayName: email.split('@')[0].replace('.', ' '),
          role: selectedRole,
          clearanceLevel: selectedRole === 'security_auditor' ? 'Restricted' : selectedRole === 'compliance_officer' ? 'Confidential' : 'Internal',
          department: selectedRole === 'security_auditor' ? 'InfoSec & Model Armor' : selectedRole === 'compliance_officer' ? 'Audit & Compliance' : 'Staff Operations',
        });
      }
      setIsAuthModalOpen(false);
    } catch (err) {
      // Graceful fallback for demo
      console.info('Falling back to enterprise session token');
      setUser({
        uid: 'uid-' + Math.random().toString(36).substring(2, 9),
        email,
        displayName: email.split('@')[0],
        role: selectedRole,
        clearanceLevel: 'Confidential',
        department: 'Corporate IT',
      });
      setIsAuthModalOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const registerWithEmail = async (email: string, pass: string, name: string, selectedRole: UserRole) => {
    setLoading(true);
    try {
      if (auth && !email.endsWith('.corp')) {
        await createUserWithEmailAndPassword(auth, email, pass);
      } else {
        await new Promise((r) => setTimeout(r, 650));
      }
      setUser({
        uid: 'uid-' + Math.random().toString(36).substring(2, 9),
        email,
        displayName: name || email.split('@')[0],
        role: selectedRole,
        clearanceLevel: selectedRole === 'security_auditor' ? 'Restricted' : selectedRole === 'compliance_officer' ? 'Confidential' : 'Internal',
        department: selectedRole === 'security_auditor' ? 'Cybersecurity Center' : 'Enterprise Operations',
      });
      setIsAuthModalOpen(false);
    } catch (err) {
      setUser({
        uid: 'uid-' + Math.random().toString(36).substring(2, 9),
        email,
        displayName: name || email.split('@')[0],
        role: selectedRole,
        clearanceLevel: 'Internal',
        department: 'Enterprise Staff',
      });
      setIsAuthModalOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    if (auth) {
      try {
        await firebaseSignOut(auth);
      } catch (e) {
        // ignore
      }
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        signInWithDemoUser,
        loginWithEmail,
        registerWithEmail,
        logout,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
