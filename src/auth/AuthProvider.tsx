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
  const [mockAdmin, setMockAdmin] = useState(false);

  const role: Role = useMemo(() => {
    if (mockAdmin) return "admin";
    return user?.user_metadata?.role === "admin" ? "admin" : "employee";
  }, [user, mockAdmin]);

  const isAdmin = role === "admin";

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
      setMockAdmin(true);
      return true;
    }
    return false;
  }, []);

  const login = useCallback(async (email: string, pass: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (!error) setMockAdmin(false); // Reset mock admin if real login succeeds
    return { error: error as Error | null };
  }, []);

  const logout = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    setMockAdmin(false);
    return { error: error as Error | null };
  }, []);

  const setEmployeeMode = useCallback(() => {
    setMockAdmin(false);
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
