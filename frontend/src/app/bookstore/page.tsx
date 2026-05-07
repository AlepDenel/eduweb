"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, Book, bookstore, Category } from "@/lib/api";

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

  const loadBooks = async (options?: {
    category_id?: string | number;
    search?: string;
    silent?: boolean;
  }) => {
    const shouldBeSilent = options?.silent === true;
    if (shouldBeSilent) {
      setIsFiltering(true);
    } else {
      setIsLoading(true);
    }

    try {
      const data = await bookstore.getBooks({
        category_id: options?.category_id,
        search: options?.search,
      });
      setBooks(data.books || []);
      setError("");
    } catch (err: any) {
      setError(err.message || "Failed to load bookstore inventory.");
    } finally {
      if (shouldBeSilent) {
        setIsFiltering(false);
      } else {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    const initBookstore = async () => {
      try {
        const session = await auth.me();
        if (!session.authenticated) {
          router.push("/login");
          return;
        }

        const [categoriesData] = await Promise.all([bookstore.getCategories()]);
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
    await loadBooks({
      category_id: selectedCategory || undefined,
      search: searchTerm.trim() || undefined,
      silent: true,
    });
  };

  const handleCategoryChange = async (value: string) => {
    setSelectedCategory(value);
    await loadBooks({
      category_id: value || undefined,
      search: searchTerm.trim() || undefined,
      silent: true,
    });
  };

  const handleAddToCart = async (book_id: number) => {
    try {
      setProcessingId(book_id);
      const response = await bookstore.addToCart(book_id, 1);
      alert(response.message || "Buku berjaya ditambah ke dalam troli.");
    } catch (err: any) {
      alert(`Ralat: ${err.message || "Gagal menambah ke troli."}`);
    } finally {
      setProcessingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-500 font-medium text-lg">Memuatkan katalog buku...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col gap-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Kedai Buku EduTech</h1>
              <p className="text-slate-500 text-sm mt-1">Bahan bacaan premium untuk masa depan anda.</p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/cart"
                className="px-5 py-2.5 rounded-xl font-bold bg-slate-900 text-white hover:bg-slate-800 transition-colors"
              >
                Troli
              </Link>
              <Link
                href="/orders"
                className="px-5 py-2.5 rounded-xl font-bold bg-white text-slate-700 border border-slate-200 hover:border-slate-400 transition-colors"
              >
                Pesanan
              </Link>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-3">
            <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-3">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari tajuk atau penulis..."
                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
              <button
                type="submit"
                disabled={isFiltering}
                className={`px-5 py-3 rounded-xl font-bold transition-colors ${
                  isFiltering
                    ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                    : "bg-emerald-500 text-white hover:bg-emerald-600"
                }`}
              >
                {isFiltering ? "Memuatkan..." : "Cari"}
              </button>
            </form>

            <select
              value={selectedCategory}
              onChange={(e) => void handleCategoryChange(e.target.value)}
              className="px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Semua Kategori</option>
              {categories.map((category) => (
                <option key={category.id} value={String(category.id)}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 mt-12">
        {error ? (
          <div className="bg-red-50 text-red-700 p-6 rounded-2xl text-center border border-red-200">
            <p>{error}</p>
          </div>
        ) : books.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-slate-300">
            <span className="text-6xl block mb-4">📚</span>
            <h3 className="text-2xl font-bold text-slate-800">Tiada buku ditemui</h3>
            <p className="text-slate-500 mt-2">Cuba ubah carian atau penapis kategori.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {books.map((book) => (
              <div
                key={book.id}
                className="bg-white rounded-3xl p-6 shadow-sm hover:shadow-xl border border-slate-100 flex flex-col transition-all duration-300"
              >
                <div className="h-48 bg-slate-100 rounded-2xl mb-6 flex items-center justify-center border border-slate-200">
                  <span className="text-5xl opacity-50">📖</span>
                </div>

                <div className="mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                    {book.category_name}
                  </span>
                </div>

                <h2 className="text-xl font-bold text-slate-900 leading-tight mb-1">
                  {book.title}
                </h2>
                <p className="text-sm font-medium text-slate-500 mb-4">
                  Oleh: <span className="text-slate-700">{book.author}</span>
                </p>

                <div className="mt-auto pt-6 border-t border-slate-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-black text-slate-900">
                        RM {Number(book.price).toFixed(2)}
                      </p>
                      <p
                        className={`text-xs font-medium mt-1 ${
                          book.stock_quantity > 0 ? "text-emerald-600" : "text-red-500"
                        }`}
                      >
                        {book.stock_quantity > 0
                          ? `Stok: ${book.stock_quantity} unit`
                          : "Kehabisan Stok"}
                      </p>
                    </div>
                    <Link
                      href={`/bookstore/${book.id}`}
                      className="text-sm font-semibold text-slate-700 hover:text-slate-900"
                    >
                      Lihat Detail →
                    </Link>
                  </div>

                  <button
                    onClick={() => handleAddToCart(book.id)}
                    disabled={processingId === book.id || book.stock_quantity <= 0}
                    className={`w-full px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                      book.stock_quantity <= 0
                        ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                        : processingId === book.id
                          ? "bg-emerald-100 text-emerald-500 cursor-wait"
                          : "bg-slate-900 text-white hover:bg-slate-800 shadow-md hover:shadow-lg"
                    }`}
                  >
                    {book.stock_quantity <= 0
                      ? "Habis"
                      : processingId === book.id
                        ? "Menambah..."
                        : "Add to Cart"}
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
