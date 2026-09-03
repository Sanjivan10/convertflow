import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  trustHost: true,
  pages: {
    signIn: "/admin/login",
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email = String(credentials?.email ?? "")
          .trim()
          .toLowerCase();
        const password = String(credentials?.password ?? "");
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        const role =
          user.role === "ADMIN"
            ? "ADMIN"
            : user.role === "EDITOR"
              ? "EDITOR"
              : "AUTHOR";
        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
          role,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.uid = user.id;
        token.role =
          (user as { role?: "ADMIN" | "EDITOR" | "AUTHOR" }).role ?? "AUTHOR";
      }
      return token;
    },
    session({ session, token }) {
      const t = token as {
        uid?: string;
        role?: "ADMIN" | "EDITOR" | "AUTHOR";
      };
      if (session.user) {
        session.user.id = t.uid ?? session.user.id;
        session.user.role = t.role ?? "AUTHOR";
      }
      return session;
    },
  },
});
