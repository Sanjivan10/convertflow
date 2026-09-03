import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { can } from "@/lib/permissions";
import { getAllUsers } from "@/lib/users";
import { UserManager } from "@/components/admin/user-manager";

export const dynamic = "force-dynamic";

export default async function UsersAdminPage() {
  const session = await auth();
  if (!session?.user || !can(session.user.role, "manage:users")) {
    redirect("/admin");
  }
  const users = await getAllUsers();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Users &amp; roles</h1>
        <p className="text-sm text-slate-500">
          Grant access with three levels — full admin, editor, or author. Role
          changes take effect on the user&apos;s next request.
        </p>
      </div>
      <UserManager users={users} currentUserId={session.user.id} />
    </div>
  );
}
