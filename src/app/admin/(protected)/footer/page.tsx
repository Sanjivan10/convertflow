import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { can } from "@/lib/permissions";
import { getFooterConfig } from "@/lib/footer";
import { FooterBuilder } from "@/components/admin/footer-builder";

export const dynamic = "force-dynamic";

export default async function FooterAdminPage() {
  const session = await auth();
  if (!session?.user || !can(session.user.role, "manage:footer")) {
    redirect("/admin");
  }
  const config = await getFooterConfig();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Footer builder</h1>
        <p className="text-sm text-slate-500">
          Drag columns to reorder, edit links inline, pick colours, and preview
          live. Saving updates the footer across the whole site.
        </p>
      </div>
      <FooterBuilder config={config} />
    </div>
  );
}
