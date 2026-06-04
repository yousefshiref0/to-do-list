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
  loginAdmin: (password: string) => boolean; // Keeping for backward compatibility or future use
  login: (email: string, pass: string) => Promise<{ error: Error | null }>;
  logout: () => Promise<{ error: Error | null }>;
  setEmployeeMode: () => void;
}

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const role: Role = user?.user_metadata?.role === "admin" ? "admin" : "employee";

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Listen for changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loginAdmin = useCallback((password: string) => {
    // Temporary mock for admin login until real admin accounts are set up
    if (password === "Modern@2026$") {
      // In a real app, you would sign in with an admin email/pass
      return true;
    }
    return false;
  }, []);

  const login = useCallback(async (email: string, pass: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    return { error: error as Error | null };
  }, []);

  const logout = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    return { error: error as Error | null };
  }, []);

  const setEmployeeMode = useCallback(() => {
    // This could optionally sign out or just change UI state
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      role,
      isAdmin: role === "admin",
      isLoading,
      loginAdmin,
      login,
      logout,
      setEmployeeMode,
    }),
    [user, role, isLoading, loginAdmin, login, logout, setEmployeeMode],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
