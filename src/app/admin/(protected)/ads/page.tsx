import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { can } from "@/lib/permissions";
import { AD_ZONES, getAllPlacements } from "@/lib/ads";
import { AdPlacementForm } from "@/components/admin/ad-placement-form";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function AdsAdminPage() {
  const session = await auth();
  if (!session?.user || !can(session.user.role, "manage:ads")) {
    redirect("/admin");
  }
  const placements = await getAllPlacements();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Advertisements</h1>
        <p className="text-sm text-slate-500">
          Place banner images, ad-network embeds, or AdSense units into named
          zones across the site. Every zone reserves fixed height, so ads never
          cause layout shift.
        </p>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold">
          Current placements ({placements.length})
        </h2>
        {placements.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-500 dark:border-slate-700">
            No placements yet. Public ad zones fall back to the AdSense/placeholder
            slot. Add one below.
          </p>
        ) : (
          <div className="space-y-4">
            {placements.map((p) => (
              <div key={p.id}>
                <div className="mb-1 flex items-center gap-2 text-xs text-slate-400">
                  <Badge variant={p.enabled ? "success" : "muted"}>
                    {p.enabled ? "live" : "off"}
                  </Badge>
                  <span>
                    {AD_ZONES.find((z) => z.id === p.zone)?.label ?? p.zone}
                  </span>
                </div>
                <AdPlacementForm placement={p} zones={[...AD_ZONES]} />
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Add a placement</h2>
        <AdPlacementForm zones={[...AD_ZONES]} />
      </section>
    </div>
  );
}
