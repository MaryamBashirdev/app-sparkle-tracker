import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { Background } from "@/components/Background";
import { Sidebar, MobileNav } from "@/components/Sidebar";

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
      { name: "theme-color", content: "#080810" },
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
