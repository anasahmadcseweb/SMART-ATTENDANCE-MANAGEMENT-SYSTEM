import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppUser, UserRole, StudentUser, FacultyUser, AdminUser } from '../types';
import { storage } from '../services/storage';

interface AuthContextType {
  currentUser: AppUser | null;
  role: UserRole | null;
  loading: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; message?: string }>;
  register: (user: Partial<AppUser>) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  resetPassword: (email: string) => Promise<{ success: boolean; message?: string }>;
  switchDemoUser: (userId: string) => void;
  availableDemoUsers: AppUser[];
  updateCurrentUserProfile: (updates: Partial<AppUser>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize and load active user
  useEffect(() => {
    const initAuth = () => {
      const activeId = storage.getActiveUserId();
      if (activeId) {
        const user = storage.getUserById(activeId);
        setCurrentUser(user);
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    };

    initAuth();
    // Subscribe to storage changes (e.g. cross-tab sync or user edits)
    const unsubscribe = storage.subscribe(() => {
      const activeId = storage.getActiveUserId();
      if (activeId) {
        const user = storage.getUserById(activeId);
        setCurrentUser(user);
      } else {
        setCurrentUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string): Promise<{ success: boolean; message?: string }> => {
    setLoading(true);
    // Simulate brief network verification
    await new Promise((res) => setTimeout(res, 250));

    const user = storage.getUserByEmail(email.trim());
    if (!user) {
      setLoading(false);
      return { success: false, message: 'No registered account found with this email address.' };
    }

    storage.setActiveUserId(user.id);
    setCurrentUser(user);
    setLoading(false);
    return { success: true };
  };

  const register = async (userData: Partial<AppUser>): Promise<{ success: boolean; message?: string }> => {
    if (!userData.email || !userData.name || !userData.role) {
      return { success: false, message: 'Name, email, and role are required.' };
    }

    const existing = storage.getUserByEmail(userData.email.trim());
    if (existing) {
      return { success: false, message: 'An account with this email already exists.' };
    }

    const id = `user_${Date.now()}`;
    const newUser: AppUser = {
      id,
      name: userData.name,
      email: userData.email.trim().toLowerCase(),
      role: userData.role,
      createdAt: new Date().toISOString(),
      ...(userData.role === 'student'
        ? {
            rollNumber: (userData as StudentUser).rollNumber || `21CS0${Math.floor(Math.random() * 90 + 10)}`,
            department: (userData as StudentUser).department || 'Computer Science & Engineering',
            semester: (userData as StudentUser).semester || 5,
            section: (userData as StudentUser).section || 'A',
          }
        : {}),
      ...(userData.role === 'faculty'
        ? {
            department: (userData as FacultyUser).department || 'Computer Science & Engineering',
            assignedSubjects: (userData as FacultyUser).assignedSubjects || ['subj_dbms'],
            designation: (userData as FacultyUser).designation || 'Assistant Professor',
          }
        : {}),
      ...(userData.role === 'admin'
        ? {
            department: (userData as AdminUser).department || 'Computer Science & Engineering',
          }
        : {}),
    } as AppUser;

    storage.saveUser(newUser);
    storage.setActiveUserId(newUser.id);
    setCurrentUser(newUser);
    return { success: true };
  };

  const logout = () => {
    storage.setActiveUserId(null);
    setCurrentUser(null);
  };

  const resetPassword = async (email: string): Promise<{ success: boolean; message?: string }> => {
    await new Promise((res) => setTimeout(res, 300));
    const user = storage.getUserByEmail(email.trim());
    if (!user) {
      return { success: false, message: 'If an account exists, a password reset link has been dispatched.' };
    }
    return { success: true, message: `Password reset instructions sent to ${email}.` };
  };

  const switchDemoUser = (userId: string) => {
    const user = storage.getUserById(userId);
    if (user) {
      storage.setActiveUserId(user.id);
      setCurrentUser(user);
    }
  };

  const updateCurrentUserProfile = (updates: Partial<AppUser>) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...updates } as AppUser;
    storage.saveUser(updated);
    setCurrentUser(updated);
  };

  const availableDemoUsers = storage.getUsers();

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role: currentUser?.role || null,
        loading,
        login,
        register,
        logout,
        resetPassword,
        switchDemoUser,
        availableDemoUsers,
        updateCurrentUserProfile,
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
