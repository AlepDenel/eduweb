"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, Book, bookstore } from "@/lib/api";

export default function BookDetailPage({ params }: { params: { book_id: string } }) {
  const router = useRouter();
  const book_id = params.book_id;

  const [book, setBook] = useState<Book | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchBook = async () => {
      try {
        const session = await auth.me();
        if (!session.authenticated) {
          router.push("/login");
          return;
        }

        const data = await bookstore.getBook(book_id);
        setBook(data.book);
      } catch (err: any) {
        if (err.message === "You must log in before using this route.") {
          router.push("/login");
        } else {
          setError(err.message || "Failed to load book details.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchBook();
  }, [book_id, router]);

  const handleAddToCart = async () => {
    if (!book) return;

    try {
      setIsAdding(true);
      const response = await bookstore.addToCart(book.id, quantity);
      alert(response.message || "Buku berjaya ditambah ke dalam troli.");
    } catch (err: any) {
      alert(`Ralat: ${err.message || "Gagal menambah buku ke troli."}`);
    } finally {
      setIsAdding(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-500 font-medium text-lg">Memuatkan butiran buku...</p>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-center max-w-lg w-full">
          <p className="text-red-600 mb-6">{error || "Buku tidak dijumpai."}</p>
          <Link
            href="/bookstore"
            className="inline-flex px-6 py-3 rounded-xl font-bold bg-slate-900 text-white hover:bg-slate-800 transition-colors"
          >
            Kembali ke Kedai Buku
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      <main className="max-w-4xl mx-auto px-6 py-12">
        <Link href="/bookstore" className="text-sm font-semibold text-slate-500 hover:text-slate-900">
          ← Kembali ke Kedai Buku
        </Link>

        <div className="mt-8 bg-white rounded-3xl border border-slate-200 shadow-sm p-8 grid gap-8 md:grid-cols-[280px_1fr]">
          <div className="h-80 bg-slate-100 rounded-2xl border border-slate-200 flex items-center justify-center">
            <span className="text-6xl opacity-50">📘</span>
          </div>

          <div className="space-y-6">
            <div>
              <span className="inline-block text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                {book.category_name}
              </span>
              <h1 className="mt-4 text-4xl font-extrabold text-slate-900">{book.title}</h1>
              <p className="mt-2 text-lg text-slate-500">
                Oleh: <span className="text-slate-700 font-medium">{book.author}</span>
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Harga</p>
                <p className="mt-2 text-2xl font-black text-slate-900">RM {Number(book.price).toFixed(2)}</p>
              </div>
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Stok</p>
                <p className={`mt-2 text-lg font-bold ${book.stock_quantity > 0 ? "text-emerald-600" : "text-red-500"}`}>
                  {book.stock_quantity > 0 ? `${book.stock_quantity} unit` : "Kehabisan Stok"}
                </p>
              </div>
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Kategori</p>
                <p className="mt-2 text-lg font-bold text-slate-700">{book.category_name}</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
              <label htmlFor="quantity" className="block text-sm font-semibold text-slate-600 mb-3">
                Kuantiti
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  id="quantity"
                  type="number"
                  min={1}
                  max={Math.max(book.stock_quantity, 1)}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                  disabled={book.stock_quantity <= 0 || isAdding}
                  className="w-full sm:w-32 px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  onClick={handleAddToCart}
                  disabled={book.stock_quantity <= 0 || isAdding}
                  className={`px-6 py-3 rounded-xl font-bold transition-colors ${
                    book.stock_quantity <= 0
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                      : isAdding
                        ? "bg-emerald-100 text-emerald-500 cursor-wait"
                        : "bg-slate-900 text-white hover:bg-slate-800"
                  }`}
                >
                  {book.stock_quantity <= 0 ? "Habis" : isAdding ? "Menambah..." : "Add to Cart"}
                </button>
                <Link
                  href="/cart"
                  className="px-6 py-3 rounded-xl font-bold bg-white text-slate-700 border border-slate-200 hover:border-slate-400 text-center"
                >
                  Lihat Troli
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
