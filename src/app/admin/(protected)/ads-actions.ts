"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/permissions";

async function guard() {
  const session = await auth();
  if (!session?.user || !can(session.user.role, "manage:ads")) {
    throw new Error("Not allowed.");
  }
}

const FORMATS = ["leaderboard", "rectangle", "sidebar", "mobile-banner"];

export async function saveAdPlacement(formData: FormData) {
  await guard();
  const id = formData.get("id") ? String(formData.get("id")) : null;
  const s = (k: string) => {
    const v = formData.get(k);
    return v ? String(v).trim() : "";
  };
  const format = FORMATS.includes(s("format")) ? s("format") : "leaderboard";

  const data = {
    name: s("name") || "Untitled placement",
    zone: s("zone") || "home-top",
    format,
    enabled: formData.get("enabled") === "on",
    imageUrl: s("imageUrl") || null,
    targetUrl: s("targetUrl") || null,
    htmlSnippet: s("htmlSnippet") || null,
    adsenseSlot: s("adsenseSlot") || null,
    position: Number(formData.get("position")) || 0,
  };

  if (id) {
    await prisma.adPlacement.update({ where: { id }, data });
  } else {
    await prisma.adPlacement.create({ data });
  }

  revalidatePath("/", "layout");
  revalidatePath("/admin/ads");
}

export async function deleteAdPlacement(formData: FormData) {
  await guard();
  await prisma.adPlacement.delete({ where: { id: String(formData.get("id")) } });
  revalidatePath("/", "layout");
  revalidatePath("/admin/ads");
}

export async function toggleAdPlacement(formData: FormData) {
  await guard();
  const id = String(formData.get("id"));
  const current = await prisma.adPlacement.findUnique({ where: { id } });
  if (current) {
    await prisma.adPlacement.update({
      where: { id },
      data: { enabled: !current.enabled },
    });
  }
  revalidatePath("/", "layout");
  revalidatePath("/admin/ads");
}
