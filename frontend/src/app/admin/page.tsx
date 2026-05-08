"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { requireAdminAccess } from "@/lib/adminAuth";

const sections = [
  {
    href: "/admin/users",
    title: "Users",
    description: "Read-only view of registered accounts, roles, and basic user records.",
    icon: "👤",
  },
  {
    href: "/admin/academic",
    title: "Academic",
    description: "View courses, modules, resources, quizzes, questions, and answer options.",
    icon: "📖",
  },
  {
    href: "/admin/bookstore",
    title: "Bookstore",
    description: "View categories and book inventory without any data modification.",
    icon: "📚",
  },
  {
    href: "/admin/orders",
    title: "Orders",
    description: "Review order records for visibility and submission demonstration.",
    icon: "📦",
  },
];

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
        <div className="w-10 h-10 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
        <p className="mt-4 text-slate-500 text-sm font-medium">Loading Admin Panel…</p>
      </div>
    );
  }

  if (hasAccess === false) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center max-w-xl w-full">
          <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-xl">🔒</span>
          </div>
          <h2 className="text-base font-bold text-slate-900 mb-2">Access Denied</h2>
          <p className="text-sm text-slate-500 mb-6">This page is restricted to Administrators only.</p>
          <button
            onClick={() => router.push("/portal")}
            className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-colors"
          >
            Back to Portal
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
          <p className="text-red-600 mb-4 text-sm font-medium">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">

      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 pt-10 pb-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2.5 mb-1">
            <span className="inline-block px-2.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-xs font-semibold uppercase tracking-wide">
              Admin
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mt-2">
            Admin Dashboard
          </h1>
          <p className="text-slate-500 text-sm mt-1.5 leading-relaxed max-w-2xl">
            Read-only overview of the EduWeb system. No data modification is available from this panel.
          </p>
        </div>
      </header>

      {/* Section Grid */}
      <main className="max-w-6xl mx-auto px-6 mt-8">
        <div className="grid gap-5 md:grid-cols-2">
          {sections.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              className="group bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:border-blue-200 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="flex items-start gap-4">
                <span className="text-2xl mt-0.5">{section.icon}</span>
                <div>
                  <h2 className="text-base font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
                    {section.title}
                  </h2>
                  <p className="text-sm text-slate-500 mt-1 leading-relaxed">{section.description}</p>
                  <span className="mt-3 inline-block text-xs font-semibold text-blue-600">
                    Open section →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
