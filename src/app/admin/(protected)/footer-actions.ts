"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/permissions";

export async function saveFooter(formData: FormData) {
  const session = await auth();
  if (!session?.user || !can(session.user.role, "manage:footer")) {
    throw new Error("Not allowed.");
  }

  const payloadRaw = String(formData.get("payload") ?? "{}");
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(payloadRaw);
  } catch {
    throw new Error("Malformed footer payload.");
  }

  const str = (k: string, fallback: string) =>
    typeof payload[k] === "string" && (payload[k] as string).trim()
      ? (payload[k] as string)
      : fallback;

  const data = {
    data: JSON.stringify({
      columns: Array.isArray(payload.columns) ? payload.columns : [],
      tagline: str("tagline", ""),
      bottomText: str("bottomText", ""),
    }),
    bgColor: str("bgColor", "#f8fafc"),
    textColor: str("textColor", "#64748b"),
    headingColor: str("headingColor", "#334155"),
    linkColor: str("linkColor", "#0284c7"),
    columnsCount: Math.min(5, Math.max(2, Number(payload.columnsCount) || 4)),
    align: payload.align === "center" ? "center" : "left",
  };

  await prisma.footerConfig.upsert({
    where: { id: "site" },
    update: data,
    create: { id: "site", ...data },
  });

  revalidatePath("/", "layout");
  revalidatePath("/admin/footer");
}
