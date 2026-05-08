"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { auth, User } from "@/lib/api";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const hideNavbar = pathname === "/login" || pathname === "/register";

  useEffect(() => {
    const checkAuth = async () => {
      if (hideNavbar) {
        setIsAuthenticated(false);
        setUser(null);
        setIsLoading(false);
        return;
      }

      try {
        const session = await auth.me();
        setIsAuthenticated(session.authenticated);
        if (session.authenticated && session.user) {
          setUser(session.user);
        } else {
          setUser(null);
        }
      } catch (err) {
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [hideNavbar, pathname]);

  const handleLogout = async () => {
    try {
      await auth.logout();
    } catch (err: any) {
      console.error("Logout request failed, clearing local session view anyway.", err);
    } finally {
      setIsAuthenticated(false);
      setUser(null);
      router.push("/login");
      router.refresh();
    }
  };

  const navLinks = [
    { name: "Courses", href: "/courses" },
    { name: "Dashboard", href: "/portal" },
    { name: "Bookstore", href: "/bookstore" },
    { name: "Forum", href: "/forum" },
  ];

  if (user?.role === "Moderator" || user?.role === "Admin") {
    navLinks.push({ name: "Moderation", href: "/moderation/reports" });
  }

  if (user?.role === "Admin") {
    navLinks.push({ name: "Admin", href: "/admin" });
  }

  if (hideNavbar) {
    return null;
  }

  return (
    <nav className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center h-16">

          {/* Logo / Wordmark */}
          <div className="flex-shrink-0">
            <Link
              href="/"
              className="flex items-center"
              aria-label="EduWeb home"
            >
              <span className="text-xl font-bold tracking-tight select-none">
                <span className="text-slate-900">Edu</span><span className="text-blue-600">Web</span>
              </span>
            </Link>
          </div>

          {/* Centre Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            {isAuthenticated &&
              navLinks.map((link) => {
                const isActive =
                  pathname === link.href ||
                  pathname?.startsWith(`${link.href}/`);
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                      isActive
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
          </div>

          {/* Right: Auth Actions */}
          <div className="flex items-center gap-3">
            {isLoading ? (
              <div className="w-20 h-8 bg-slate-100 rounded-lg animate-pulse" />
            ) : isAuthenticated && user ? (
              <div className="flex items-center gap-4">
                <div className="hidden sm:block text-right leading-none">
                  <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                  <p className="text-xs font-medium text-blue-600 mt-0.5">{user.role}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 transition-colors duration-150"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2 text-slate-700 hover:text-slate-900 text-sm font-medium transition-colors duration-150"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-150"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
}
