export type Role = "ADMIN" | "EDITOR" | "AUTHOR";

export const ROLES: { value: Role; label: string; blurb: string }[] = [
  {
    value: "ADMIN",
    label: "Full admin",
    blurb: "Everything, including users, footer, ads, and settings.",
  },
  {
    value: "EDITOR",
    label: "Editor",
    blurb: "Create and publish any blog post or tool. No user/site settings.",
  },
  {
    value: "AUTHOR",
    label: "Author",
    blurb: "Write and manage their own blog posts only.",
  },
];

export type Permission =
  | "view:dashboard"
  | "manage:blogs" // any post
  | "manage:ownBlogs" // only posts you authored
  | "publish:blogs"
  | "manage:tools"
  | "manage:users"
  | "manage:footer"
  | "manage:ads";

const MATRIX: Record<Role, Permission[]> = {
  ADMIN: [
    "view:dashboard",
    "manage:blogs",
    "manage:ownBlogs",
    "publish:blogs",
    "manage:tools",
    "manage:users",
    "manage:footer",
    "manage:ads",
  ],
  EDITOR: [
    "view:dashboard",
    "manage:blogs",
    "manage:ownBlogs",
    "publish:blogs",
    "manage:tools",
  ],
  AUTHOR: ["view:dashboard", "manage:ownBlogs"],
};

export function normalizeRole(role: string | undefined | null): Role {
  return role === "ADMIN" || role === "EDITOR" || role === "AUTHOR"
    ? role
    : "AUTHOR";
}

export function can(role: string | undefined | null, permission: Permission): boolean {
  return MATRIX[normalizeRole(role)].includes(permission);
}

/** Can this user edit/delete a specific post? */
export function canEditPost(
  role: string | undefined | null,
  userId: string,
  postAuthorId: string | null,
): boolean {
  if (can(role, "manage:blogs")) return true;
  return can(role, "manage:ownBlogs") && postAuthorId === userId;
}
