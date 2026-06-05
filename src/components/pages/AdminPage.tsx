import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/auth/AuthProvider";
import { DashboardPage } from "./DashboardPage";

/**
 * Admin page wrapper with route guard.
 * - Admin users see the admin dashboard.
 * - Non-admin users are redirected to /dashboard.
 * - Shows a loading state while auth is initializing.
 */
export function AdminPage() {
  const { isAdmin, isLoading, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return; // Wait for auth to settle

    if (!user) {
      console.warn("[AdminPage] No user session — redirecting to /");
      navigate({ to: "/", replace: true });
      return;
    }

    if (!isAdmin) {
      console.warn("[AdminPage] Access denied — user is not admin, redirecting to /dashboard");
      navigate({ to: "/dashboard", replace: true });
    } else {
      console.log("[AdminPage] Access granted — admin user:", user.email);
    }
  }, [isAdmin, isLoading, user, navigate]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="size-10 animate-spin rounded-full border-4 border-border border-t-primary" />
          <p className="text-sm text-muted-foreground">Loading admin panel…</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    // Will redirect in the useEffect above; render nothing while navigating
    return null;
  }

  return <DashboardPage />;
}
