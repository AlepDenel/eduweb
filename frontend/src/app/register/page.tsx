"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/api";
import Toast from "@/components/Toast";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await auth.register(name, email, password);
      // No browser alert — redirect immediately; /login page is the implicit success confirmation
      router.push("/login");
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during registration.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-6">
            <span className="text-xl font-bold tracking-tight select-none">
              <span className="text-slate-900">Edu</span><span className="text-blue-600">Web</span>
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Create your account</h1>
          <p className="text-slate-500 mt-1.5 text-sm">Join EduWeb to start your learning journey</p>
        </div>

        {/* Card */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
          {error && (
            <div role="alert" className="mb-6 flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
              <span className="mt-0.5 flex-shrink-0">⚠</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-5" noValidate>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                required
                disabled={isLoading}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-400 transition-shadow"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@example.com"
                required
                disabled={isLoading}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-400 transition-shadow"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Choose a strong password"
                required
                disabled={isLoading}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-400 transition-shadow"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 mt-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-semibold rounded-xl transition-colors duration-150 disabled:cursor-not-allowed"
            >
              {isLoading ? "Creating account…" : "Create Account"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-500 mt-6">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-700 transition-colors">
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
}
