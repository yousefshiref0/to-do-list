import { Outlet, Link, createRootRoute, HeadContent, Scripts, type ErrorComponentProps } from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { I18nProvider } from "@/i18n/I18nProvider";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { TaskProvider } from "@/store/tasks";
import { AuthProvider } from "@/auth/AuthProvider";

function ErrorComponent({ error }: ErrorComponentProps) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-urgent-soft text-urgent mb-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            className="size-8"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h1 className="font-display font-bold text-2xl text-foreground">Critical Error</h1>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          An unexpected error occurred in the application shell.
        </p>
        <div className="mt-4 p-3 bg-surface border border-border rounded-xl text-left font-mono text-[10px] text-urgent overflow-auto max-h-32">
          {error instanceof Error ? error.message : String(error)}
        </div>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => window.location.reload()}
            className="w-full sm:w-auto inline-flex items-center justify-center rounded-full bg-foreground px-6 py-2.5 text-sm font-bold text-background transition-opacity hover:opacity-90"
          >
            Reload Page
          </button>
          <Link
            to="/"
            className="w-full sm:w-auto inline-flex items-center justify-center rounded-full border border-border px-6 py-2.5 text-sm font-bold text-foreground hover:bg-accent transition-colors"
          >
            Back Home
          </Link>
        </div>
      </div>
    </div>
  );
}

function NotFoundComponent() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display font-bold text-7xl text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Instructions - Modern Company" },
      {
        name: "description",
        content:
          "Daily operations command for Modern Enterprise — admins dispatch instructions, employees execute from anywhere.",
      },
      { property: "og:title", content: "Instructions - Modern Company" },
      {
        property: "og:description",
        content: "Operations command for an import & export business.",
      },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "https://i.postimg.cc/N0VY5rgN/logo-for-blal.jpg" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <AuthProvider>
          <TaskProvider>
            <Outlet />
          </TaskProvider>
        </AuthProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
