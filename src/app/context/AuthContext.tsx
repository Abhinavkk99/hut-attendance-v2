// Authentication context. Provides the current user's login state, profile
// (including role), and login/logout actions to the whole component tree via the
// useAuth() hook. Roles drive feature access across the app:
//   staff   — mark attendance and view training only
//   manager — staff permissions + register/enrol participants
//   admin   — full access including search, reports, programs, and approvals
import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase, isSupabaseConfigured, Profile } from '../../lib/supabase';

interface AuthContextType {
  isAuthenticated: boolean;
  user: { name: string; role: 'staff' | 'manager' | 'admin'; id: string; email: string } | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{ name: string; role: 'staff' | 'manager' | 'admin'; id: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount, restore any existing Supabase session (persisted in the browser) so
  // a logged-in user stays logged in across page refreshes.
  useEffect(() => {
    checkUser();
  }, []);

  // Restores the session, loads the matching profile row, and enforces the
  // admin-approval gate: unapproved accounts are signed out immediately.
  const checkUser = async () => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (authUser) {
        // Fetch profile from profiles table
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          setLoading(false);
          return;
        }

        if (profile) {
          // Check if user is approved
          if (!profile.approved) {
            await supabase.auth.signOut();
            setLoading(false);
            return;
          }

          setIsAuthenticated(true);
          setUser({
            id: profile.id,
            name: profile.full_name,
            role: profile.role,
            email: profile.email
          });
        }
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  // Authenticates against Supabase Auth, loads the profile, and blocks unapproved
  // accounts. Returns a typed result so the Login screen can show a clear message.
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured) {
      return { success: false, error: 'Supabase is not configured' };
    }

    try {
      // Sign in with Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        // Fetch user profile from profiles table
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profileError) {
          return { success: false, error: 'Profile not found. Please contact administrator.' };
        }

        if (profile) {
          // Check if user is approved
          if (!profile.approved) {
            await supabase.auth.signOut();
            return { success: false, error: 'Your account is pending approval. Please wait for administrator confirmation.' };
          }

          setIsAuthenticated(true);
          setUser({
            id: profile.id,
            name: profile.full_name,
            role: profile.role,
            email: profile.email
          });
          return { success: true };
        }
      }

      return { success: false, error: 'Login failed' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  // Ends the Supabase session and clears local auth state, which causes the route
  // guards to redirect back to /login on the next render.
  const logout = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, loading }}>
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