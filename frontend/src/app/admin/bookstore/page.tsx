"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { adminApi, Book, Category } from "@/lib/api";
import { requireAdminAccess, withAdminTimeout } from "@/lib/adminAuth";

export default function AdminBookstorePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [categoryError, setCategoryError] = useState("");
  const [bookError, setBookError] = useState("");

  useEffect(() => {
    const loadInventory = async () => {
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

        const [categoriesResult, booksResult] = await Promise.allSettled([
          withAdminTimeout(adminApi.getCategories(), "Admin categories request timed out."),
          withAdminTimeout(adminApi.getBooks(), "Admin books request timed out."),
        ]);

        if (categoriesResult.status === "fulfilled") {
          setCategories(categoriesResult.value.categories || []);
        } else {
          setCategoryError("Failed to load admin categories.");
          setCategories([]);
        }

        if (booksResult.status === "fulfilled") {
          setBooks(booksResult.value.books || []);
        } else {
          setBookError("Failed to load admin books.");
          setBooks([]);
        }
      } catch (err: any) {
        if (
          typeof err.message === "string" &&
          err.message.includes("This route requires one of these roles:")
        ) {
          setHasAccess(false);
        } else {
          setCategoryError(err.message || "Failed to load admin bookstore overview.");
          setBookError(err.message || "Failed to load admin bookstore overview.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadInventory();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-500 font-medium text-lg">Memuatkan inventori admin...</p>
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

  if (hasAccess !== true && !categoryError && !bookError) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      <header className="bg-white border-b border-slate-200 pt-16 pb-10 px-6">
        <div className="max-w-7xl mx-auto">
          <Link href="/admin" className="text-sm font-semibold text-slate-500 hover:text-slate-700">
            Back to Admin
          </Link>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-900 mt-4 mb-3">
            Admin Bookstore Overview
          </h1>
          <p className="text-slate-500 leading-relaxed font-light text-lg">
            Paparan read-only untuk kategori dan inventori buku.
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 mt-10 space-y-8">
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100">
            <h2 className="text-xl font-semibold text-slate-900">Categories</h2>
            <p className="text-sm text-slate-500 mt-1">Senarai kategori buku yang tersedia.</p>
          </div>
          {categoryError ? (
            <div className="p-6 text-red-600">{categoryError}</div>
          ) : categories.length === 0 ? (
            <div className="p-6 text-slate-500">Tiada kategori untuk dipaparkan.</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-3 p-6">
              {categories.map((category) => (
                <article key={category.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Category #{category.id}
                  </p>
                  <h3 className="text-lg font-semibold text-slate-900">{category.name}</h3>
                  <p className="text-sm text-slate-500 mt-2">
                    {new Date(category.created_at).toLocaleDateString("ms-MY")}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100">
            <h2 className="text-xl font-semibold text-slate-900">Books</h2>
            <p className="text-sm text-slate-500 mt-1">Paparan inventori buku tanpa tindakan ubah data.</p>
          </div>
          {bookError ? (
            <div className="p-6 text-red-600">{bookError}</div>
          ) : books.length === 0 ? (
            <div className="p-6 text-slate-500">Tiada buku untuk dipaparkan.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">ID</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Title</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Author</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Category</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Price</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {books.map((book) => (
                    <tr key={book.id}>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-800">{book.id}</td>
                      <td className="px-6 py-4 text-sm text-slate-700">{book.title}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{book.author}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{book.category_name}</td>
                      <td className="px-6 py-4 text-sm text-slate-700">RM {Number(book.price).toFixed(2)}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{book.stock_quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
