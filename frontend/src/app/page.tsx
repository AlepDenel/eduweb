"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/api";

// ─── Static data ──────────────────────────────────────────────────────────────

const features = [
  {
    icon: "📖",
    title: "Courses",
    description:
      "Browse structured modules, access learning resources, and complete quizzes to reinforce your understanding at your own pace.",
  },
  {
    icon: "🎯",
    title: "Student Portal",
    description:
      "Monitor your learning progress across all courses, revisit saved resources, and review your bookstore order history in one dashboard.",
  },
  {
    icon: "💬",
    title: "Forum",
    description:
      "Start discussions, reply to classmates' posts, and flag inappropriate content for moderator review — all in a structured academic space.",
  },
  {
    icon: "📚",
    title: "Bookstore",
    description:
      "Search academic books by title or category, view detailed book pages, manage your cart, and track your order history.",
  },
];

const steps = [
  {
    number: "01",
    title: "Log in or register",
    description:
      "Create a student account or sign in to access the full EduWeb platform.",
  },
  {
    number: "02",
    title: "Learn and participate",
    description:
      "Study course modules, take quizzes, discuss with peers on the forum, and purchase reference books.",
  },
  {
    number: "03",
    title: "Track your activity",
    description:
      "Use your personal portal to monitor progress, saved materials, and all past transactions.",
  },
];

const roles = [
  {
    label: "Student",
    color: "text-blue-700 bg-blue-50 border-blue-200",
    dot: "bg-blue-500",
    items: [
      "Browse and enrol in courses",
      "Complete quizzes and mark resources",
      "Save resources to personal portal",
      "Post and reply on the forum",
      "Report inappropriate forum posts",
      "Purchase books and view orders",
    ],
  },
  {
    label: "Moderator",
    color: "text-indigo-700 bg-indigo-50 border-indigo-200",
    dot: "bg-indigo-500",
    items: [
      "All student permissions",
      "Review flagged forum reports",
      "Hide or unhide reported posts",
      "Permanently remove violating content",
    ],
  },
  {
    label: "Admin",
    color: "text-slate-700 bg-slate-100 border-slate-300",
    dot: "bg-slate-500",
    items: [
      "All moderator permissions",
      "Read-only user account dashboard",
      "Read-only academic content overview",
      "Read-only bookstore inventory",
      "Read-only order history dashboard",
    ],
  },
];

// ─── Page component ────────────────────────────────────────────────────────────

export default function HomePage() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    auth
      .me()
      .then((session) => {
        if (session.authenticated) {
          router.replace("/courses");
        } else {
          setIsChecking(false);
        }
      })
      .catch(() => setIsChecking(false));
  }, [router]);

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="w-8 h-8 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">

      {/* ── 1. Hero ─────────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-14">
        <div className="max-w-2xl">
          <span className="inline-block text-xs font-bold tracking-widest text-blue-600 uppercase mb-5">
            EduWeb Academic Portal
          </span>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 leading-tight mb-5">
            A centralized learning platform for students
          </h1>
          <p className="text-base text-slate-500 leading-relaxed mb-8">
            EduWeb brings together structured courses, module quizzes, progress tracking,
            peer forum discussions, and a curated bookstore — everything a student needs,
            organized in one academic portal.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/login"
              className="px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors duration-150"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-6 py-2.5 bg-white text-slate-700 text-sm font-semibold rounded-xl border border-slate-300 hover:bg-slate-50 transition-colors duration-150"
            >
              Create Account
            </Link>
          </div>
        </div>
      </section>

      {/* ── Divider ─────────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-6">
        <div className="border-t border-slate-200" />
      </div>

      {/* ── 2. Features ─────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-14">
        <div className="mb-8">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
            Platform Features
          </h2>
          <p className="text-xl font-bold text-slate-900">
            Everything you need as a student, in one place
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm"
            >
              <div className="flex items-start gap-4">
                <span className="text-2xl mt-0.5 flex-shrink-0">{f.icon}</span>
                <div>
                  <h3 className="text-base font-semibold text-slate-900 mb-1.5">
                    {f.title}
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    {f.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Divider ─────────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-6">
        <div className="border-t border-slate-200" />
      </div>

      {/* ── 3. How It Works ─────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-14">
        <div className="mb-8">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
            Getting Started
          </h2>
          <p className="text-xl font-bold text-slate-900">How EduWeb works</p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {steps.map((step) => (
            <div
              key={step.number}
              className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm"
            >
              <p className="text-3xl font-black text-slate-100 mb-4 leading-none select-none">
                {step.number}
              </p>
              <h3 className="text-base font-semibold text-slate-900 mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Divider ─────────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-6">
        <div className="border-t border-slate-200" />
      </div>

      {/* ── 4. Role-Based Access ────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-14">
        <div className="mb-8">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
            Access Control
          </h2>
          <p className="text-xl font-bold text-slate-900">Role-based permissions</p>
          <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
            EduWeb supports three distinct roles, each with appropriate levels of access and responsibility.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {roles.map((role) => (
            <div
              key={role.label}
              className={`rounded-2xl border p-6 ${role.color}`}
            >
              <div className="flex items-center gap-2 mb-4">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${role.dot}`} />
                <h3 className="text-sm font-bold uppercase tracking-wide">
                  {role.label}
                </h3>
              </div>
              <ul className="space-y-2">
                {role.items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm leading-snug">
                    <span className="mt-0.5 text-xs flex-shrink-0 opacity-60">—</span>
                    <span className="opacity-80">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ── 5. Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <span className="font-bold text-slate-600 text-sm">
              <span className="text-slate-900">Edu</span><span className="text-blue-600">Web</span>
            </span>
            <span className="w-px h-3 bg-slate-300" />
            <span>Academic learning portal</span>
          </div>
          <span>CSS3333 Web Technology — Group Project</span>
        </div>
      </footer>

    </main>
  );
}
