import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

export type Role = "admin" | "employee";

interface AuthState {
  user: User | null;
  role: Role;
  isAdmin: boolean;
  isLoading: boolean;
  loginAdmin: (password: string) => boolean; // Keeping for signature compatibility
  login: (email: string, pass: string) => Promise<{ error: Error | null }>;
  logout: () => Promise<{ error: Error | null }>;
  setEmployeeMode: () => void;
}

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const role: Role = useMemo(() => {
    return user?.user_metadata?.role === "admin" ? "admin" : "employee";
  }, [user]);

  const isAdmin = role === "admin";

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (mounted) {
          setUser(user);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const loginAdmin = useCallback((_password: string) => {
    // Deprecated: Real admin login should use login() with email/password
    return false;
  }, []);

  const login = useCallback(async (email: string, pass: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
      return { error: error as Error | null };
    } catch (error) {
      return { error: error as Error };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      return { error: error as Error | null };
    } catch (error) {
      return { error: error as Error };
    }
  }, []);

  const setEmployeeMode = useCallback(() => {
    // No-op in real auth mode unless we implement switching via metadata
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      role,
      isAdmin,
      isLoading,
      loginAdmin,
      login,
      logout,
      setEmployeeMode,
    }),
    [user, role, isAdmin, isLoading, loginAdmin, login, logout, setEmployeeMode],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
