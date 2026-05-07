"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { adminApi, AdminUser } from "@/lib/api";
import { requireAdminAccess, withAdminTimeout } from "@/lib/adminAuth";

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const access = await requireAdminAccess();

        if (access.status === "unauthenticated") {
          router.push("/login");
          return;
        }

        if (access.status === "denied") {
          setHasAccess(false);
          return;
        }

        setHasAccess(true);

        const data = await withAdminTimeout(adminApi.getUsers(), "Admin users request timed out.");
        setUsers(data.users || []);
      } catch (err: any) {
        if (
          typeof err.message === "string" &&
          err.message.includes("This route requires one of these roles:")
        ) {
          setHasAccess(false);
          setUsers([]);
        } else {
          setError(err.message || "Failed to load admin users.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadUsers();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-500 font-medium text-lg">Memuatkan pengguna...</p>
      </div>
    );
  }

  if (hasAccess === false) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center max-w-xl w-full">
          <p className="text-red-600 mb-3 font-medium">Akses ditolak.</p>
          <p className="text-slate-500 mb-6">Halaman ini hanya untuk Admin.</p>
          <button
            onClick={() => router.push("/portal")}
            className="px-6 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
          >
            Kembali ke Portal
          </button>
        </div>
      </div>
    );
  }

  if (hasAccess !== true && !error) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      <header className="bg-white border-b border-slate-200 pt-16 pb-10 px-6">
        <div className="max-w-6xl mx-auto">
          <Link href="/admin" className="text-sm font-semibold text-slate-500 hover:text-slate-700">
            Back to Admin
          </Link>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-900 mt-4 mb-3">
            Admin Users
          </h1>
          <p className="text-slate-500 leading-relaxed font-light text-lg">
            Paparan read-only untuk pengguna berdaftar dan peranan mereka.
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 mt-10">
        {error ? (
          <div className="bg-white rounded-2xl border border-red-200 p-6 text-red-600">
            {error}
          </div>
        ) : users.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-slate-500">
            Tiada pengguna untuk dipaparkan.
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">ID</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Name</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Email</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Role</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-semibold text-slate-800">{user.id}</td>
                    <td className="px-6 py-4 text-sm text-slate-700">{user.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{user.email}</td>
                    <td className="px-6 py-4 text-sm text-slate-700">{user.role_name || user.role_id}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(user.created_at).toLocaleDateString("ms-MY", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
