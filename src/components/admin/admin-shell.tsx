"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  FileText,
  LogOut,
  Wrench,
  LayoutPanelTop,
  Megaphone,
  Users,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { can, type Permission } from "@/lib/permissions";

const NAV: {
  href: string;
  label: string;
  icon: typeof BarChart3;
  exact?: boolean;
  perm?: Permission;
}[] = [
  { href: "/admin", label: "Dashboard", icon: BarChart3, exact: true, perm: "view:dashboard" },
  { href: "/admin/blogs", label: "Blog CMS", icon: FileText, perm: "manage:ownBlogs" },
  { href: "/admin/tool-builder", label: "Tool Builder", icon: Wrench, perm: "manage:tools" },
  { href: "/admin/footer", label: "Footer Builder", icon: LayoutPanelTop, perm: "manage:footer" },
  { href: "/admin/ads", label: "Advertisements", icon: Megaphone, perm: "manage:ads" },
  { href: "/admin/users", label: "Users & Roles", icon: Users, perm: "manage:users" },
];

export function AdminShell({
  user,
  signOutAction,
  children,
}: {
  user: { name: string; email: string; role: string };
  signOutAction: () => Promise<void>;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const nav = NAV.filter((item) => !item.perm || can(user.role, item.perm));

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 md:flex">
        <div className="px-2 py-3 text-lg font-bold">ConvertFlow</div>
        <nav className="mt-4 flex-1 space-y-1">
          {nav.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-sky-600 text-white"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
                )}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-400 hover:text-slate-600"
        >
          <ExternalLink className="size-3.5" /> View live site
        </Link>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-1 overflow-x-auto text-sm md:hidden">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="whitespace-nowrap rounded px-2 py-1 text-slate-600 hover:bg-slate-100 dark:text-slate-300"
              >
                {item.label}
              </Link>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-3 text-sm">
            <span className="text-slate-500">
              {user.name}
              <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-500 dark:bg-slate-800">
                {user.role}
              </span>
            </span>
            <form action={signOutAction}>
              <Button variant="ghost" size="sm" type="submit">
                <LogOut className="size-4" /> Sign out
              </Button>
            </form>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
