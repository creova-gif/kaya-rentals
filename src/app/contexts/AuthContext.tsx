import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '/src/lib/supabase';
import { projectId, publicAnonKey } from '/utils/supabase/info';

interface User {
  id: string;
  email: string;
  name: string;
  role?: string;
  phone?: string;
  subscriptionTier?: string;
  subscriptionStatus?: string;
}

interface Session {
  access_token: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string, role?: 'landlord' | 'tenant' | 'contractor') => Promise<{ success: boolean; error?: string }>;
  signIn: (email: string, password: string) => Promise<void>;
  signInDemoTenant: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    checkSession();

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth state changed:', event);
        
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name,
            role: session.user.user_metadata?.role || 'landlord',
            phone: session.user.user_metadata?.phone,
            subscriptionTier: session.user.user_metadata?.subscriptionTier,
            subscriptionStatus: session.user.user_metadata?.subscriptionStatus,
            user_metadata: session.user.user_metadata,
          });
          setSession({
            access_token: session.access_token,
          });
        } else {
          setUser(null);
          setSession(null);
        }
        
        setLoading(false);
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const checkSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ Session check error:', error);
        setLoading(false);
        return;
      }

      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name,
          role: session.user.user_metadata?.role || 'landlord',
          phone: session.user.user_metadata?.phone,
          subscriptionTier: session.user.user_metadata?.subscriptionTier,
          subscriptionStatus: session.user.user_metadata?.subscriptionStatus,
          user_metadata: session.user.user_metadata,
        });
        setSession({
          access_token: session.access_token,
        });
      }
    } catch (error) {
      console.error('❌ Error checking session:', error);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (
    email: string,
    password: string,
    name: string,
    role: 'landlord' | 'tenant' | 'contractor' = 'landlord'
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2071350e/auth/signup`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ email, password, name, role }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        console.error('❌ Signup error:', result);
        return { success: false, error: result.error || 'Failed to create account' };
      }

      console.log('✅ Signup successful:', result);

      await signIn(email, password);
      return { success: true };

    } catch (error: any) {
      console.error('❌ Signup error:', error);
      return { success: false, error: error.message || 'An unexpected error occurred' };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (
    email: string, 
    password: string
  ): Promise<void> => {
    try {
      setLoading(true);

      // Demo account — credentials must be set in environment variables
      // Set VITE_DEMO_EMAIL and VITE_DEMO_PASSWORD in .env to enable demo login
      const demoEmail = import.meta.env.VITE_DEMO_EMAIL as string | undefined;
      const demoPassword = import.meta.env.VITE_DEMO_PASSWORD as string | undefined;
      const isDemoLogin = demoEmail && demoPassword
        && email.toLowerCase() === demoEmail.toLowerCase()
        && password === demoPassword;

      if (isDemoLogin) {
        const demoUser = {
          id: 'demo-user-id',
          email: demoEmail,
          name: 'Demo Landlord',
          role: 'landlord',
          phone: '+1 416 555 0100',
          subscriptionTier: 'pro',
          subscriptionStatus: 'active',
        };
        setUser(demoUser);
        setSession({ access_token: 'demo-session-token' });
        console.log('✅ Demo login successful');
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ Sign in error:', error);
        throw new Error(error.message || 'Invalid email or password');
      }

      if (data.user) {
        setUser({
          id: data.user.id,
          email: data.user.email || '',
          name: data.user.user_metadata?.name,
          role: data.user.user_metadata?.role || 'landlord',
          phone: data.user.user_metadata?.phone,
          subscriptionTier: data.user.user_metadata?.subscriptionTier,
          subscriptionStatus: data.user.user_metadata?.subscriptionStatus,
          user_metadata: data.user.user_metadata,
        });
        setSession({
          access_token: data.session.access_token,
        });

        console.log('✅ Sign in successful:', data.user.email);
        
      } else {
        throw new Error('Failed to sign in');
      }

    } catch (error: any) {
      console.error('❌ Sign in error:', error);
      throw new Error(error.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      // Always clear local state immediately
      setUser(null);
      setSession(null);

      // Skip Supabase call for demo sessions
      const isDemoSession = session?.access_token === 'demo-session-token'
        || session?.access_token === 'demo-tenant-session-token';
      if (!isDemoSession) {
        const { error } = await supabase.auth.signOut();
        if (error) console.error('❌ Sign out error:', error);
      }

      console.log('✅ Signed out successfully');
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    } catch (error) {
      console.error('❌ Sign out error:', error);
      setUser(null);
      setSession(null);
      if (typeof window !== 'undefined') window.location.href = '/';
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        console.error('❌ Password reset error:', error);
        throw new Error(error.message);
      }

      console.log('✅ Password reset email sent');
      
    } catch (error: any) {
      console.error('❌ Password reset error:', error);
      throw new Error(error.message || 'Failed to send reset email');
    }
  };

  const signInDemoTenant = async (): Promise<void> => {
    const demoEmail = import.meta.env.VITE_DEMO_EMAIL as string | undefined;
    setUser({
      id: 'demo-tenant-id',
      email: demoEmail || 'tenant@kaya.ca',
      name: 'Demo Tenant',
      role: 'tenant',
      phone: '+1 647 555 0199',
      subscriptionTier: 'pro',
      subscriptionStatus: 'active',
    });
    setSession({ access_token: 'demo-tenant-session-token' });
    console.log('✅ Demo tenant login successful');
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signInDemoTenant,
    signOut,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Export supabase client for direct use if needed
export { supabase };