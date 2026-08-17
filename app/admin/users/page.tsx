"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";

type UserRow = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  role: string;
  isActive: boolean;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);

  const load = () => fetch("/api/admin/users").then((r) => r.json()).then(setUsers);
  useEffect(() => {
    load();
  }, []);

  const updateUser = async (id: string, data: Partial<UserRow>) => {
    await fetch(`/api/admin/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    load();
  };

  return (
    <AdminShell>
      <div className="mx-auto max-w-6xl">
        <h1 className="text-2xl font-semibold">User Management</h1>
        <p className="mt-1 text-sm text-muted">View users, change roles, enable or disable accounts.</p>

        <div className="mt-8 overflow-x-auto rounded-2xl border border-border">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-border bg-card text-muted">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Role</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-border/50">
                  <td className="px-4 py-3">{[user.firstName, user.lastName].filter(Boolean).join(" ") || "—"}</td>
                  <td className="px-4 py-3">{user.email}</td>
                  <td className="px-4 py-3">
                    <select
                      value={user.role}
                      onChange={(e) => updateUser(user.id, { role: e.target.value })}
                      className="rounded-lg border border-border bg-background px-2 py-1 text-sm"
                    >
                      <option value="employee">employee</option>
                      <option value="manager">manager</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <span className={user.isActive ? "text-emerald-400" : "text-red-400"}>
                      {user.isActive ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => updateUser(user.id, { isActive: !user.isActive })}
                      className="rounded-lg border border-border px-3 py-1 text-xs hover:bg-card-hover"
                    >
                      {user.isActive ? "Disable" : "Enable"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}
