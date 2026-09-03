"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { KeyRound, Loader2, Trash2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ROLES } from "@/lib/permissions";
import {
  createUser,
  deleteUser,
  resetUserPassword,
  updateUserRole,
} from "@/app/admin/(protected)/user-actions";
import { formatDate } from "@/lib/utils";
import type { UserView } from "@/lib/users";

function Pending({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? <Loader2 className="size-4 animate-spin" /> : null}
      {label}
    </Button>
  );
}

export function UserManager({
  users,
  currentUserId,
}: {
  users: UserView[];
  currentUserId: string;
}) {
  const [resetting, setResetting] = useState<string | null>(null);
  const [newPass, setNewPass] = useState("");

  return (
    <div className="space-y-8">
      <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-400 dark:bg-slate-950">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Posts</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3">
                  <p className="font-medium">
                    {u.name || u.email}
                    {u.id === currentUserId && (
                      <span className="ml-2 text-xs text-slate-400">(you)</span>
                    )}
                  </p>
                  <p className="text-xs text-slate-400">{u.email}</p>
                </td>
                <td className="px-4 py-3">
                  <form
                    action={updateUserRole}
                    className="flex items-center gap-2"
                  >
                    <input type="hidden" name="id" value={u.id} />
                    <Select
                      name="role"
                      defaultValue={u.role}
                      className="h-8 w-28 text-xs"
                    >
                      {ROLES.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </Select>
                    <button
                      type="submit"
                      className="text-xs text-sky-600 hover:underline"
                    >
                      update
                    </button>
                  </form>
                </td>
                <td className="px-4 py-3 tabular-nums text-slate-500">
                  {u.postCount}
                </td>
                <td className="px-4 py-3 text-slate-400">
                  {formatDate(u.createdAt)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setResetting(resetting === u.id ? null : u.id);
                        setNewPass("");
                      }}
                      className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-sky-600"
                    >
                      <KeyRound className="size-3.5" /> Password
                    </button>
                    {u.id !== currentUserId && (
                      <form action={deleteUser}>
                        <input type="hidden" name="id" value={u.id} />
                        <button
                          type="submit"
                          className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="size-3.5" /> Delete
                        </button>
                      </form>
                    )}
                  </div>
                  {resetting === u.id && (
                    <form
                      action={resetUserPassword}
                      className="mt-2 flex items-center gap-2"
                    >
                      <input type="hidden" name="id" value={u.id} />
                      <Input
                        name="password"
                        type="text"
                        placeholder="New password"
                        value={newPass}
                        onChange={(e) => setNewPass(e.target.value)}
                        className="h-8 w-40 text-xs"
                      />
                      <Pending label="Set" />
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
        <p className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <UserPlus className="size-4" /> Invite a user
        </p>
        <form action={createUser} className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="nu-email">Email</Label>
            <Input id="nu-email" name="email" type="email" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nu-name">Name</Label>
            <Input id="nu-name" name="name" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nu-pass">Temporary password</Label>
            <Input id="nu-pass" name="password" type="text" required minLength={6} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nu-role">Role</Label>
            <Select id="nu-role" name="role" defaultValue="AUTHOR">
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label} — {r.blurb}
                </option>
              ))}
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Pending label="Create user" />
          </div>
        </form>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {ROLES.map((r) => (
          <div
            key={r.value}
            className="rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-800"
          >
            <Badge variant="outline">{r.label}</Badge>
            <p className="mt-2 text-xs text-slate-500">{r.blurb}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
