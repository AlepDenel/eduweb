"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, Cart, CartItem, bookstore } from "@/lib/api";

const REQUEST_TIMEOUT_MS = 8000;

function withTimeout<T>(promise: Promise<T>, message: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(message)), REQUEST_TIMEOUT_MS);
    }),
  ]);
}

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [activeAction, setActiveAction] = useState<string | null>(null);

  const fetchCart = async () => {
    try {
      const session = await withTimeout(auth.me(), "Cart request timed out.");
      if (!session.authenticated) {
        router.push("/login");
        return;
      }

      const data = await withTimeout(bookstore.getCart(), "Cart request timed out.");
      setCart(data.cart);
      setError("");
    } catch (err: any) {
      if (err.message === "You must log in before using this route.") {
        router.push("/login");
      } else {
        setError(err.message || "Failed to load cart.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [router]);

  const handleUpdateQuantity = async (item: CartItem, quantity: number) => {
    setFeedback("");
    try {
      setActiveAction(`update-${item.id}`);
      const response = await bookstore.updateCartItem(item.id, quantity);
      setCart(response.cart || null);
      setFeedback(response.message || "Troli berjaya dikemas kini.");
    } catch (err: any) {
      setFeedback(err.message || "Gagal mengemas kini kuantiti.");
    } finally {
      setActiveAction(null);
    }
  };

  const handleRemoveItem = async (item_id: number) => {
    setFeedback("");
    try {
      setActiveAction(`remove-${item_id}`);
      const response = await bookstore.removeCartItem(item_id);
      setCart(response.cart || null);
      setFeedback(response.message || "Item berjaya dibuang daripada troli.");
    } catch (err: any) {
      setFeedback(err.message || "Gagal membuang item.");
    } finally {
      setActiveAction(null);
    }
  };

  const handleCheckout = async () => {
    setFeedback("");
    try {
      setActiveAction("checkout");
      const response = await bookstore.checkout();
      setFeedback(response.message || "Checkout berjaya diselesaikan.");
      await fetchCart();
    } catch (err: any) {
      setFeedback(err.message || "Checkout gagal.");
    } finally {
      setActiveAction(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-500 font-medium text-lg">Memuatkan troli...</p>
      </div>
    );
  }

  const items = cart?.items || [];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <Link href="/bookstore" className="text-sm font-semibold text-slate-500 hover:text-slate-900">
              ← Kembali ke Kedai Buku
            </Link>
            <h1 className="mt-3 text-4xl font-extrabold text-slate-900">Troli</h1>
          </div>
          <Link
            href="/orders"
            className="px-5 py-3 rounded-xl font-bold bg-white text-slate-700 border border-slate-200 hover:border-slate-400 text-center"
          >
            Lihat Pesanan
          </Link>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 text-red-700 p-4 rounded-2xl border border-red-200">
            {error}
          </div>
        )}

        {feedback && (
          <div className="mb-6 bg-emerald-50 text-emerald-700 p-4 rounded-2xl border border-emerald-200">
            {feedback}
          </div>
        )}

        {items.length === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center">
            <p className="text-slate-500 font-medium">Troli anda masih kosong.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6"
                >
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-slate-900">{item.title}</h2>
                    <p className="text-sm text-slate-500 mt-1">Oleh: {item.author}</p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Harga</p>
                        <p className="text-sm font-semibold text-slate-700">RM {Number(item.price).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Stok</p>
                        <p className="text-sm font-semibold text-slate-700">{item.stock_quantity}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Subtotal</p>
                        <p className="text-sm font-semibold text-slate-700">RM {Number(item.line_subtotal).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row lg:flex-col gap-3 lg:items-end">
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min={1}
                        max={Math.max(item.stock_quantity, 1)}
                        defaultValue={item.quantity}
                        onBlur={(e) => {
                          const nextQuantity = Math.max(1, Number(e.target.value) || item.quantity);
                          if (nextQuantity !== item.quantity) {
                            void handleUpdateQuantity(item, nextQuantity);
                          }
                        }}
                        disabled={activeAction === `update-${item.id}`}
                        className="w-24 px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={() => void handleUpdateQuantity(item, item.quantity)}
                        disabled
                        className="hidden"
                      />
                    </div>

                    <button
                      onClick={() => void handleRemoveItem(item.id)}
                      disabled={activeAction === `remove-${item.id}`}
                      className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                        activeAction === `remove-${item.id}`
                          ? "bg-red-100 text-red-400 cursor-not-allowed"
                          : "bg-red-600 text-white hover:bg-red-500"
                      }`}
                    >
                      {activeAction === `remove-${item.id}` ? "Memproses..." : "Buang"}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500">Jumlah Item: {cart?.total_items || 0}</p>
                <p className="text-3xl font-black text-slate-900">
                  RM {Number(cart?.total_amount || 0).toFixed(2)}
                </p>
              </div>
              <button
                onClick={() => void handleCheckout()}
                disabled={activeAction === "checkout"}
                className={`px-6 py-3 rounded-xl font-bold transition-colors ${
                  activeAction === "checkout"
                    ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                    : "bg-emerald-500 text-white hover:bg-emerald-600"
                }`}
              >
                {activeAction === "checkout" ? "Memproses..." : "Checkout"}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
