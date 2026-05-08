"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { auth, Book, bookstore } from "@/lib/api";
import Toast from "@/components/Toast";

export default function BookDetailPage({ params }: { params: { book_id: string } }) {
  const router = useRouter();
  const book_id = params.book_id;

  const [book, setBook] = useState<Book | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState("");

  const [toast, setToast] = useState({ visible: false, message: "", type: "success" as "success" | "error" | "info" });
  const showToast = (message: string, type: "success" | "error" | "info" = "success") =>
    setToast({ visible: true, message, type });
  const dismissToast = useCallback(() => setToast((t) => ({ ...t, visible: false })), []);

  useEffect(() => {
    const fetchBook = async () => {
      try {
        const session = await auth.me();
        if (!session.authenticated) { router.push("/login"); return; }
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
      showToast(response.message || "Book added to cart.", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to add book to cart.", "error");
    } finally {
      setIsAdding(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <div className="w-10 h-10 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
        <p className="mt-4 text-slate-500 text-sm font-medium">Loading book details…</p>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center max-w-lg w-full">
          <p className="text-red-600 mb-5 text-sm">{error || "Book not found."}</p>
          <Link href="/bookstore" className="inline-flex px-5 py-2.5 rounded-xl font-semibold text-sm bg-slate-900 text-white hover:bg-slate-800 transition-colors">
            Back to Bookstore
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <Toast message={toast.message} type={toast.type} visible={toast.visible} onDismiss={dismissToast} />

      <main className="max-w-4xl mx-auto px-6 py-10">
        <Link href="/bookstore" className="text-sm text-slate-400 hover:text-slate-700 font-medium transition-colors inline-flex items-center gap-1 mb-6">
          ← Back to Bookstore
        </Link>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 grid gap-8 md:grid-cols-[240px_1fr]">

          {/* Cover Placeholder */}
          <div className="h-72 bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-center">
            <span className="text-5xl opacity-40">📘</span>
          </div>

          {/* Book Info */}
          <div className="space-y-6">
            <div>
              <span className="inline-block text-xs font-semibold uppercase tracking-wide text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md mb-3">
                {book.category_name}
              </span>
              <h1 className="text-3xl font-bold text-slate-900 leading-tight">{book.title}</h1>
              <p className="mt-2 text-sm text-slate-500">By <span className="font-medium text-slate-700">{book.author}</span></p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Price</p>
                <p className="text-xl font-black text-slate-900">RM {Number(book.price).toFixed(2)}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Stock</p>
                <p className={`text-base font-bold ${book.stock_quantity > 0 ? "text-green-600" : "text-red-500"}`}>
                  {book.stock_quantity > 0 ? `${book.stock_quantity} units` : "Out of Stock"}
                </p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Category</p>
                <p className="text-base font-bold text-slate-700">{book.category_name}</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
              <label htmlFor="quantity" className="block text-sm font-semibold text-slate-700 mb-3">Quantity</label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  id="quantity"
                  type="number"
                  min={1}
                  max={Math.max(book.stock_quantity, 1)}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                  disabled={book.stock_quantity <= 0 || isAdding}
                  className="w-full sm:w-28 px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400"
                />
                <button
                  onClick={handleAddToCart}
                  disabled={book.stock_quantity <= 0 || isAdding}
                  className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors duration-150 ${
                    book.stock_quantity <= 0
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                      : isAdding
                      ? "bg-blue-100 text-blue-500 cursor-wait"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  {book.stock_quantity <= 0 ? "Out of Stock" : isAdding ? "Adding…" : "Add to Cart"}
                </button>
                <Link href="/cart" className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 transition-colors text-center">
                  View Cart
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
