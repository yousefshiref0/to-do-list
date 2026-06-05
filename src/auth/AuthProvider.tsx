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
import { useNavigate } from "@tanstack/react-router";

export type Role = "admin" | "employee";

interface AuthState {
  user: User | null;
  role: Role;
  isAdmin: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<{ error: Error | null }>;
  logout: () => Promise<{ error: Error | null }>;
}

const INITIAL_AUTH: AuthState = {
  user: null,
  role: "employee",
  isAdmin: false,
  isLoading: true,
  login: async () => ({ error: null }),
  logout: async () => ({ error: null }),
};

const Ctx = createContext<AuthState>(INITIAL_AUTH);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const role: Role = useMemo(() => {
    if (!user) return "employee";
    return user.user_metadata?.role === "admin" ? "admin" : "employee";
  }, [user]);

  const isAdmin = useMemo(() => role === "admin", [role]);

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();
        if (mounted) {
          setUser(currentUser);
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
      if (mounted) {
        const newUser = session?.user ?? null;
        setUser(newUser);
        setIsLoading(false);

        if (_event === "SIGNED_IN" && newUser) {
          navigate({ to: "/dashboard", replace: true });
        }

        if (_event === "SIGNED_OUT") {
          navigate({ to: "/", replace: true });
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  // Navigation guards removed for instant dashboard access

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

  const value = useMemo<AuthState>(
    () => ({
      user,
      role,
      isAdmin,
      isLoading,
      login,
      logout,
    }),
    [user, role, isAdmin, isLoading, login, logout],
  );

  // Loading spinner removed for instant access

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  return ctx ?? INITIAL_AUTH;
}
