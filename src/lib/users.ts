import "server-only";
import { prisma } from "@/lib/prisma";
import { normalizeRole, type Role } from "@/lib/permissions";

export type UserView = {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  postCount: number;
  createdAt: string;
};

export async function getAllUsers(): Promise<UserView[]> {
  const rows = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { posts: true } } },
  });
  return rows.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: normalizeRole(u.role),
    postCount: u._count.posts,
    createdAt: u.createdAt.toISOString(),
  }));
}

export async function countAdmins(): Promise<number> {
  return prisma.user.count({ where: { role: "ADMIN" } });
}
