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
      setFeedback(response.message || "Cart updated.");
    } catch (err: any) {
      setFeedback(err.message || "Failed to update quantity.");
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
      setFeedback(response.message || "Item removed from cart.");
    } catch (err: any) {
      setFeedback(err.message || "Failed to remove item.");
    } finally {
      setActiveAction(null);
    }
  };

  const handleCheckout = async () => {
    setFeedback("");
    try {
      setActiveAction("checkout");
      const response = await bookstore.checkout();
      setFeedback(response.message || "Checkout completed successfully.");
      await fetchCart();
    } catch (err: any) {
      setFeedback(err.message || "Checkout failed.");
    } finally {
      setActiveAction(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <div className="w-10 h-10 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
        <p className="mt-4 text-slate-500 text-sm font-medium">Loading cart…</p>
      </div>
    );
  }

  const items = cart?.items || [];

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <main className="max-w-5xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <Link
              href="/bookstore"
              className="text-sm text-slate-400 hover:text-slate-700 font-medium transition-colors inline-flex items-center gap-1"
            >
              ← Back to Bookstore
            </Link>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">Your Cart</h1>
          </div>
          <Link
            href="/orders"
            className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 transition-colors text-center"
          >
            View Orders
          </Link>
        </div>

        {/* Error */}
        {error && (
          <div role="alert" className="mb-6 bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-2xl text-sm">
            {error}
          </div>
        )}

        {/* Feedback */}
        {feedback && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-5 py-4 rounded-2xl text-sm">
            {feedback}
          </div>
        )}

        {/* Empty Cart */}
        {items.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-300 rounded-2xl py-16 text-center">
            <p className="text-3xl mb-3">🛒</p>
            <h3 className="text-base font-semibold text-slate-800">Your cart is empty</h3>
            <p className="text-sm text-slate-500 mt-1">Add books from the bookstore to continue.</p>
            <Link
              href="/bookstore"
              className="inline-block mt-5 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors"
            >
              Browse Books
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Cart Items */}
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5"
                >
                  <div className="flex-1">
                    <h2 className="text-base font-bold text-slate-900">{item.title}</h2>
                    <p className="text-xs text-slate-500 mt-0.5">By {item.author}</p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Price</p>
                        <p className="text-sm font-semibold text-slate-700 mt-0.5">
                          RM {Number(item.price).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Stock</p>
                        <p className="text-sm font-semibold text-slate-700 mt-0.5">{item.stock_quantity}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Subtotal</p>
                        <p className="text-sm font-semibold text-slate-700 mt-0.5">
                          RM {Number(item.line_subtotal).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row lg:flex-col gap-3 lg:items-end">
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
                      className="w-24 px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
                    />
                    <button
                      type="button"
                      onClick={() => void handleRemoveItem(item.id)}
                      disabled={activeAction === `remove-${item.id}`}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors duration-150 ${
                        activeAction === `remove-${item.id}`
                          ? "bg-red-100 text-red-400 cursor-not-allowed"
                          : "bg-red-600 text-white hover:bg-red-700"
                      }`}
                    >
                      {activeAction === `remove-${item.id}` ? "Removing…" : "Remove"}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Cart Summary */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-xs text-slate-500 font-medium">{cart?.total_items || 0} item(s)</p>
                <p className="text-2xl font-black text-slate-900 mt-1">
                  RM {Number(cart?.total_amount || 0).toFixed(2)}
                </p>
              </div>
              <button
                onClick={() => void handleCheckout()}
                disabled={activeAction === "checkout"}
                className={`px-6 py-3 rounded-xl text-sm font-bold transition-colors duration-150 ${
                  activeAction === "checkout"
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {activeAction === "checkout" ? "Processing…" : "Proceed to Checkout"}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
