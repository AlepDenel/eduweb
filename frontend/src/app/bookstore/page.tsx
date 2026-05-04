"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, bookstore, Book } from "@/lib/api";

export default function BookstorePage() {
  const router = useRouter();
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  useEffect(() => {
    const initBookstore = async () => {
      try {
        // 1. Check Auth (Bookstore might be public or protected, but cart needs auth)
        // Let's ensure they are logged in since they can add to cart.
        const session = await auth.me();
        if (!session.authenticated) {
          router.push("/login");
          return;
        }

        // 2. Fetch Books
        const data = await bookstore.getBooks();
        setBooks(data.books || []);
      } catch (err: any) {
        if (err.message === "You must log in before using this route.") {
          router.push("/login");
        } else {
          setError(err.message || "Failed to load bookstore inventory.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    initBookstore();
  }, [router]);

  const handleAddToCart = async (book_id: number) => {
    try {
      setProcessingId(book_id);
      await bookstore.addToCart({ book_id, quantity: 1 });
      alert("Buku berjaya ditambah ke dalam troli (Cart)!");
    } catch (err: any) {
      alert(\`Ralat: \${err.message || "Gagal menambah ke troli."}\`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleCheckout = async () => {
    // In a real app, you'd probably show a cart page first, but the prompt asks for a simple Checkout button.
    try {
      setIsCheckingOut(true);
      await bookstore.checkout();
      alert("Pembayaran berjaya! Terima kasih kerana sudi membeli belah.");
    } catch (err: any) {
      alert(\`Ralat Checkout: \${err.message || "Gagal melakukan pembayaran."}\`);
    } finally {
      setIsCheckingOut(false);
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
      {/* Header and Checkout Section */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Kedai Buku EduTech</h1>
            <p className="text-slate-500 text-sm mt-1">Bahan bacaan premium untuk masa depan anda.</p>
          </div>
          <div>
            <button
              onClick={handleCheckout}
              disabled={isCheckingOut}
              className={\`px-6 py-3 rounded-xl font-bold shadow-md transition-all \${
                isCheckingOut 
                  ? "bg-slate-300 text-slate-500 cursor-not-allowed" 
                  : "bg-emerald-500 hover:bg-emerald-600 text-white hover:shadow-lg hover:-translate-y-0.5"
              }\`}
            >
              {isCheckingOut ? "Memproses..." : "🛒 Checkout Semua Item"}
            </button>
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
            <h3 className="text-2xl font-bold text-slate-800">Katalog Kosong</h3>
            <p className="text-slate-500 mt-2">Tiada buku disediakan buat masa ini.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {books.map((book) => (
              <div 
                key={book.id} 
                className="bg-white rounded-3xl p-6 shadow-sm hover:shadow-xl border border-slate-100 flex flex-col transition-all duration-300"
              >
                {/* Book Cover Placeholder */}
                <div className="h-48 bg-slate-100 rounded-2xl mb-6 flex items-center justify-center border border-slate-200">
                  <span className="text-5xl opacity-50">📖</span>
                </div>

                <div className="mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                    Buku Fizikal / Digital
                  </span>
                </div>

                <h2 className="text-xl font-bold text-slate-900 leading-tight mb-1">
                  {book.title}
                </h2>
                <p className="text-sm font-medium text-slate-500 mb-4">
                  Oleh: <span className="text-slate-700">{book.author}</span>
                </p>

                <p className="text-slate-600 text-sm leading-relaxed mb-6 flex-1 line-clamp-3">
                  {book.description}
                </p>

                <div className="flex items-center justify-between mt-auto pt-6 border-t border-slate-100">
                  <div>
                    <p className="text-2xl font-black text-slate-900">
                      RM {Number(book.price).toFixed(2)}
                    </p>
                    <p className={\`text-xs font-medium mt-1 \${book.stock_quantity > 0 ? "text-emerald-600" : "text-red-500"}\`}>
                      {book.stock_quantity > 0 ? \`Stok: \${book.stock_quantity} unit\` : "Kehabisan Stok"}
                    </p>
                  </div>

                  <button
                    onClick={() => handleAddToCart(book.id)}
                    disabled={processingId === book.id || book.stock_quantity <= 0}
                    className={\`px-5 py-2.5 rounded-xl text-sm font-bold transition-all \${
                      book.stock_quantity <= 0 
                        ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                        : processingId === book.id
                          ? "bg-emerald-100 text-emerald-500 cursor-wait"
                          : "bg-slate-900 text-white hover:bg-slate-800 shadow-md hover:shadow-lg"
                    }\`}
                  >
                    {book.stock_quantity <= 0 
                      ? "Habis" 
                      : processingId === book.id 
                        ? "Menambah..." 
                        : "Add to Cart"
                    }
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
