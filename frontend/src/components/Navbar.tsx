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
  }, [hideNavbar, pathname]); // Re-check on route change if needed

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
    <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center h-20">
          
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <span className="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center text-lg">E</span>
              EduTech
            </Link>
          </div>

          {/* Center Links (Only if authenticated) */}
          <div className="hidden md:flex items-center space-x-1">
            {isAuthenticated && navLinks.map((link) => {
              const isActive = pathname === link.href || pathname?.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    isActive 
                      ? "bg-slate-100 text-indigo-700" 
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>

          {/* Right Side Auth Actions */}
          <div className="flex items-center gap-4">
            {isLoading ? (
              <div className="w-24 h-8 bg-slate-100 rounded animate-pulse"></div>
            ) : isAuthenticated && user ? (
              <div className="flex items-center gap-5">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-bold text-slate-900 leading-none">{user.name}</p>
                  <p className="text-xs font-medium text-indigo-600 mt-1">{user.role}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-5 py-2.5 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-sm font-bold transition-all shadow-sm hover:shadow"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="px-5 py-2.5 text-slate-700 hover:text-slate-900 font-bold text-sm transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="px-5 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl text-sm font-bold transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
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
