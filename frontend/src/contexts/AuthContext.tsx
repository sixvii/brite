import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch, apiJson, getAuthToken, setAuthToken } from '@/lib/api';

interface Profile {
  id: string;
  name: string;
  email: string;
  accountType: string;
  phone: string | null;
  avatarUrl: string | null;
  isRestricted: boolean;
  roles: string[];
}

interface AuthContextType {
  user: Profile | null;
  profile: Profile | null;
  isAdmin: boolean;
  isOrganizer: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, metadata: { name: string; account_type: string; phone?: string }) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Profile | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      const token = getAuthToken();
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const me = await apiFetch<Profile>('/auth/me');
        setUser(me);
        setProfile(me);
        setIsAdmin(me.roles?.includes('admin'));
        setIsOrganizer(me.accountType === 'company' || me.roles?.includes('organizer') || me.roles?.includes('admin'));
      } catch (error) {
        setAuthToken(null);
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const response = await apiJson<{ token: string; user: Profile }>('/auth/login', 'POST', {
        email,
        password,
      });
      setAuthToken(response.token);
      setUser(response.user);
      setProfile(response.user);
      setIsAdmin(response.user.roles?.includes('admin'));
      setIsOrganizer(response.user.accountType === 'company' || response.user.roles?.includes('organizer') || response.user.roles?.includes('admin'));
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUp = async (email: string, password: string, metadata: { name: string; account_type: string; phone?: string }) => {
    try {
      const response = await apiJson<{ token: string; user: Profile }>('/auth/register', 'POST', {
        email,
        password,
        name: metadata.name,
        accountType: metadata.account_type,
        phone: metadata.phone,
      });
      setAuthToken(response.token);
      setUser(response.user);
      setProfile(response.user);
      setIsAdmin(response.user.roles?.includes('admin'));
      setIsOrganizer(response.user.accountType === 'company' || response.user.roles?.includes('organizer') || response.user.roles?.includes('admin'));
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    setAuthToken(null);
    setUser(null);
    setProfile(null);
    setIsAdmin(false);
    setIsOrganizer(false);
  };

  const refreshProfile = async () => {
    if (!user) return;
    try {
      const me = await apiFetch<Profile>('/auth/me');
      setUser(me);
      setProfile(me);
      setIsAdmin(me.roles?.includes('admin'));
      setIsOrganizer(me.accountType === 'company' || me.roles?.includes('organizer') || me.roles?.includes('admin'));
    } catch (error) {
      setAuthToken(null);
      setUser(null);
      setProfile(null);
      setIsAdmin(false);
      setIsOrganizer(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAdmin,
        isOrganizer,
        loading,
        signIn,
        signUp,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};