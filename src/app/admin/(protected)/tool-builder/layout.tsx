import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { can } from "@/lib/permissions";

export default async function ToolBuilderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user || !can(session.user.role, "manage:tools")) {
    redirect("/admin");
  }
  return <>{children}</>;
}
