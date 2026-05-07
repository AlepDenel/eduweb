"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { requireAdminAccess } from "@/lib/adminAuth";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const checkAccess = async () => {
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
      } catch (err: any) {
        setError(err.message || "Failed to prepare admin dashboard.");
      } finally {
        setIsLoading(false);
      }
    };

    checkAccess();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-500 font-medium text-lg">Memuatkan Admin...</p>
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

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-red-200 text-center max-w-xl w-full">
          <p className="text-red-600 mb-3 font-medium">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-500 transition-colors"
          >
            Cuba Lagi
          </button>
        </div>
      </div>
    );
  }

  const sections = [
    {
      href: "/admin/users",
      title: "Admin Users",
      description: "Semakan pengguna, emel, peranan, dan rekod asas akaun.",
    },
    {
      href: "/admin/academic",
      title: "Admin Academic",
      description: "Paparan read-only untuk kursus, modul, resource, kuiz, soalan, dan option jawapan.",
    },
    {
      href: "/admin/bookstore",
      title: "Admin Bookstore",
      description: "Semakan kategori dan inventori buku tanpa tindakan ubah data.",
    },
    {
      href: "/admin/orders",
      title: "Admin Orders",
      description: "Semakan pesanan pengguna untuk tujuan review dan demo visibility.",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      <header className="bg-white border-b border-slate-200 pt-16 pb-12 px-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-semibold tracking-tight text-slate-900 mb-3">
            Admin Dashboard Shell
          </h1>
          <p className="text-slate-500 leading-relaxed font-light text-lg max-w-3xl">
            Halaman rangka read-only untuk mendedahkan keupayaan Admin backend yang telah disahkan,
            tanpa menambah CRUD atau tindakan destruktif.
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 mt-10">
        <div className="grid gap-6 md:grid-cols-2">
          {sections.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <h2 className="text-xl font-semibold text-slate-900 mb-2">{section.title}</h2>
              <p className="text-slate-500 leading-relaxed mb-4">{section.description}</p>
              <span className="text-sm font-semibold text-slate-700">Open section</span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
