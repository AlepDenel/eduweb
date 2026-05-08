"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { auth, Book, bookstore, Category } from "@/lib/api";
import Toast from "@/components/Toast";

export default function BookstorePage() {
  const router = useRouter();
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState<number | null>(null);

  const [toast, setToast] = useState({ visible: false, message: "", type: "success" as "success" | "error" | "info" });
  const showToast = (message: string, type: "success" | "error" | "info" = "success") =>
    setToast({ visible: true, message, type });
  const dismissToast = useCallback(() => setToast((t) => ({ ...t, visible: false })), []);

  const loadBooks = async (options?: { category_id?: string | number; search?: string; silent?: boolean }) => {
    const silent = options?.silent === true;
    if (silent) setIsFiltering(true); else setIsLoading(true);
    try {
      const data = await bookstore.getBooks({ category_id: options?.category_id, search: options?.search });
      setBooks(data.books || []);
      setError("");
    } catch (err: any) {
      setError(err.message || "Failed to load bookstore inventory.");
    } finally {
      if (silent) setIsFiltering(false); else setIsLoading(false);
    }
  };

  useEffect(() => {
    const initBookstore = async () => {
      try {
        const session = await auth.me();
        if (!session.authenticated) { router.push("/login"); return; }
        const categoriesData = await bookstore.getCategories();
        setCategories(categoriesData.categories || []);
        await loadBooks();
      } catch (err: any) {
        if (err.message === "You must log in before using this route.") {
          router.push("/login");
        } else {
          setError(err.message || "Failed to load bookstore inventory.");
          setIsLoading(false);
        }
      }
    };
    initBookstore();
  }, [router]);

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await loadBooks({ category_id: selectedCategory || undefined, search: searchTerm.trim() || undefined, silent: true });
  };

  const handleCategoryChange = async (value: string) => {
    setSelectedCategory(value);
    await loadBooks({ category_id: value || undefined, search: searchTerm.trim() || undefined, silent: true });
  };

  const handleAddToCart = async (book_id: number) => {
    try {
      setProcessingId(book_id);
      const response = await bookstore.addToCart(book_id, 1);
      showToast(response.message || "Book added to cart.", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to add to cart.", "error");
    } finally {
      setProcessingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <div className="w-10 h-10 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
        <p className="mt-4 text-slate-500 text-sm font-medium">Loading bookstore…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <Toast message={toast.message} type={toast.type} visible={toast.visible} onDismiss={dismissToast} />

      {/* Sticky Filter Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-16 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-slate-900">Bookstore</h1>
              <p className="text-xs text-slate-500 mt-0.5">Academic reference materials for students.</p>
            </div>
            <div className="flex gap-2.5">
              <Link href="/cart" className="px-4 py-2 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-150">Cart</Link>
              <Link href="/orders" className="px-4 py-2 rounded-xl text-sm font-semibold bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 transition-colors duration-150">Orders</Link>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-3 mt-3">
            <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2.5">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search title or author…"
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="submit"
                disabled={isFiltering}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors duration-150 ${isFiltering ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700"}`}
              >
                {isFiltering ? "Loading…" : "Search"}
              </button>
            </form>

            <select
              value={selectedCategory}
              onChange={(e) => void handleCategoryChange(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={String(cat.id)}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Book Grid */}
      <main className="max-w-6xl mx-auto px-6 mt-8">
        {error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-2xl text-sm text-center">{error}</div>
        ) : books.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
            <p className="text-3xl mb-3">📚</p>
            <h3 className="text-base font-semibold text-slate-800">No Books Found</h3>
            <p className="text-sm text-slate-500 mt-1">Try adjusting your search or category filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {books.map((book) => (
              <div key={book.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col hover:border-blue-200 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                <div className="h-40 bg-slate-100 rounded-xl mb-5 flex items-center justify-center border border-slate-200">
                  <span className="text-4xl opacity-40">📖</span>
                </div>
                <span className="inline-block self-start text-xs font-semibold uppercase tracking-wide text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md mb-3">
                  {book.category_name}
                </span>
                <h2 className="text-sm font-bold text-slate-900 leading-snug mb-1">{book.title}</h2>
                <p className="text-xs text-slate-500 mb-5">By <span className="text-slate-700 font-medium">{book.author}</span></p>

                <div className="mt-auto pt-4 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-black text-slate-900">RM {Number(book.price).toFixed(2)}</p>
                      <p className={`text-xs font-medium mt-0.5 ${book.stock_quantity > 0 ? "text-green-600" : "text-red-500"}`}>
                        {book.stock_quantity > 0 ? `${book.stock_quantity} in stock` : "Out of Stock"}
                      </p>
                    </div>
                    <Link href={`/bookstore/${book.id}`} className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors">
                      View Details →
                    </Link>
                  </div>

                  <button
                    onClick={() => handleAddToCart(book.id)}
                    disabled={processingId === book.id || book.stock_quantity <= 0}
                    className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                      book.stock_quantity <= 0
                        ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                        : processingId === book.id
                        ? "bg-blue-100 text-blue-500 cursor-wait"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    {book.stock_quantity <= 0 ? "Out of Stock" : processingId === book.id ? "Adding…" : "Add to Cart"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
