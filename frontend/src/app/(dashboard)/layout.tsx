"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthGuard } from "@/components/auth/auth-guard";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

const NAV_ITEMS = [
  { href: "/students", label: "Students" },
] as const;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen">
        <DesktopSidebar />
        <div className="flex flex-1 flex-col">
          <MobileHeader />
          <main className="flex-1 overflow-y-auto bg-muted/20 p-4 sm:p-6 md:p-8">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}

function MobileHeader() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Top bar for mobile */}
      <header className="flex items-center justify-between border-b bg-background px-4 py-3 md:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Open navigation menu"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
            />
          </svg>
        </button>
        <span className="text-sm font-semibold">PISA Performance</span>
        <div className="w-5" /> {/* Spacer for centering */}
      </header>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/20"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <aside className="absolute left-0 top-0 h-full w-64 border-r bg-background shadow-lg flex flex-col">
            <div className="px-5 py-5">
              <h1 className="text-lg font-semibold tracking-tight">
                PISA Performance
              </h1>
              <p className="text-xs text-muted-foreground">
                Student Analytics
              </p>
            </div>
            <Separator />
            <nav className="flex-1 space-y-1 px-3 py-4" aria-label="Main navigation">
              {NAV_ITEMS.map((item) => {
                const active = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      active
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <Separator />
            <div className="flex items-center gap-3 px-4 py-4">
              <div className="flex-1 truncate">
                <p className="truncate text-sm font-medium">
                  {user?.display_name || "Teacher"}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="text-xs"
              >
                Logout
              </Button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

function DesktopSidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const initials = user?.display_name
    ? user.display_name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "T";

  return (
    <aside className="hidden w-64 flex-col border-r bg-background md:flex">
      {/* Brand */}
      <div className="px-5 py-5">
        <h1 className="text-lg font-semibold tracking-tight">
          PISA Performance
        </h1>
        <p className="text-xs text-muted-foreground">Student Analytics</p>
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4" aria-label="Main navigation">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              }`}
              aria-current={active ? "page" : undefined}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <Separator />

      {/* User section */}
      <div className="flex items-center gap-3 px-4 py-4">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 truncate">
          <p className="truncate text-sm font-medium">
            {user?.display_name || "Teacher"}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {user?.email}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={logout}
          className="text-xs text-muted-foreground hover:text-foreground"
          aria-label="Log out"
        >
          Logout
        </Button>
      </div>
    </aside>
  );
}
