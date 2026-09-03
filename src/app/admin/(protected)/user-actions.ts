"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/permissions";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || !can(session.user.role, "manage:users")) {
    throw new Error("Only full admins can manage users.");
  }
  return session.user;
}

const ROLE = z.enum(["ADMIN", "EDITOR", "AUTHOR"]);

const createSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  name: z.string().trim().optional().or(z.literal("")),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: ROLE.default("AUTHOR"),
});

export async function createUser(formData: FormData) {
  await requireAdmin();
  const parsed = createSchema.parse({
    email: formData.get("email"),
    name: formData.get("name") ?? "",
    password: formData.get("password"),
    role: formData.get("role") ?? "AUTHOR",
  });

  const existing = await prisma.user.findUnique({
    where: { email: parsed.email },
  });
  if (existing) throw new Error("A user with that email already exists.");

  await prisma.user.create({
    data: {
      email: parsed.email,
      name: parsed.name || null,
      role: parsed.role,
      passwordHash: await bcrypt.hash(parsed.password, 10),
      mustReset: true,
    },
  });
  revalidatePath("/admin/users");
}

export async function updateUserRole(formData: FormData) {
  const me = await requireAdmin();
  const id = String(formData.get("id"));
  const role = ROLE.parse(formData.get("role"));

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) throw new Error("User not found.");

  if (target.id === me.id && role !== "ADMIN") {
    throw new Error("You cannot remove your own admin access.");
  }
  if (target.role === "ADMIN" && role !== "ADMIN") {
    const admins = await prisma.user.count({ where: { role: "ADMIN" } });
    if (admins <= 1) throw new Error("At least one full admin must remain.");
  }

  await prisma.user.update({ where: { id }, data: { role } });
  revalidatePath("/admin/users");
}

export async function resetUserPassword(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const password = z
    .string()
    .min(6, "Password must be at least 6 characters")
    .parse(formData.get("password"));
  await prisma.user.update({
    where: { id },
    data: { passwordHash: await bcrypt.hash(password, 10), mustReset: true },
  });
  revalidatePath("/admin/users");
}

export async function deleteUser(formData: FormData) {
  const me = await requireAdmin();
  const id = String(formData.get("id"));
  if (id === me.id) throw new Error("You cannot delete your own account.");

  const target = await prisma.user.findUnique({ where: { id } });
  if (target?.role === "ADMIN") {
    const admins = await prisma.user.count({ where: { role: "ADMIN" } });
    if (admins <= 1) throw new Error("At least one full admin must remain.");
  }
  await prisma.user.delete({ where: { id } });
  revalidatePath("/admin/users");
}
