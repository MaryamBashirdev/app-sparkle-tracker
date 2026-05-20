import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  Navigate,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
  useRouterState,
} from "@tanstack/react-router";
import { Toaster } from "sonner";


import appCss from "../styles.css?url";
import { Background } from "@/components/Background";
import { Sidebar, MobileNav } from "@/components/Sidebar";
import { AuthProvider, useAuth } from "@/lib/auth";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass max-w-md p-10 text-center">
        <h1 className="text-7xl font-bold text-gradient-violet">404</h1>
        <p className="mt-4 text-slate-400">This page doesn't exist.</p>
        <Link to="/" className="mt-6 inline-block rounded-lg bg-violet-600 px-5 py-2 text-sm font-medium hover:bg-violet-500">
          Go home
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error }: { error: Error }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass max-w-md p-8 text-center">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-slate-400">{error.message}</p>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "JobTrack — Application Tracker" },
      { name: "description", content: "Premium job application tracker with live Google Sheets sync." },
      { name: "theme-color", content: "#080811" },
      { property: "og:title", content: "JobTrack — Application Tracker" },
      { name: "twitter:title", content: "JobTrack — Application Tracker" },
      { property: "og:description", content: "Premium job application tracker with live Google Sheets sync." },
      { name: "twitter:description", content: "Premium job application tracker with live Google Sheets sync." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/4ca47f30-a624-48a5-a022-c17f8e2c71a6/id-preview-268ad726--fb45055c-d288-4a0b-a7cc-562e137efda8.lovable.app-1779189340796.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/4ca47f30-a624-48a5-a022-c17f8e2c71a6/id-preview-268ad726--fb45055c-d288-4a0b-a7cc-562e137efda8.lovable.app-1779189340796.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
      },
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
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AuthGate />
      </AuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "rgba(10,10,20,0.9)",
            border: "1px solid rgba(124,58,237,0.4)",
            color: "#f1f5f9",
            backdropFilter: "blur(20px)",
          },
        }}
      />
    </QueryClientProvider>
  );
}

function AuthGate() {
  const { user, ready } = useAuth();
  const pathname = useRouterStatePath();

  const isLogin = pathname === "/login";

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Background />
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  if (!user && !isLogin) {
    return <Navigate to="/login" replace />;
  }

  if (isLogin || !user) {
    return <Outlet />;
  }

  return (
    <>
      <Background />
      <Sidebar />
      <main className="min-h-screen md:pl-16 pb-20 md:pb-0">
        <div className="mx-auto max-w-[1400px] px-4 md:px-8 py-6">
          <Outlet />
        </div>
      </main>
      <MobileNav />
      <footer className="py-6 text-center text-xs text-slate-500 md:pl-16">
        ⚡ Powered by n8n • Live sync with Google Sheets • Auto-updates every 30s
      </footer>
    </>
  );
}

function useRouterStatePath() {
  return useRouterState({ select: (s) => s.location.pathname });
}
