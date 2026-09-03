import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { AdminShell } from "@/components/admin/admin-shell";

export default async function ProtectedAdminLayout({
  children,
}: LayoutProps<"/admin">) {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");

  async function doSignOut() {
    "use server";
    await signOut({ redirectTo: "/admin/login" });
  }

  return (
    <AdminShell
      user={{
        name: session.user.name ?? session.user.email ?? "Admin",
        email: session.user.email ?? "",
        role: session.user.role,
      }}
      signOutAction={doSignOut}
    >
      {children}
    </AdminShell>
  );
}
