"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, Order, ordersApi } from "@/lib/api";

const REQUEST_TIMEOUT_MS = 8000;

function withTimeout<T>(promise: Promise<T>, message: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(message)), REQUEST_TIMEOUT_MS);
    }),
  ]);
}

const statusClass = (status: string) => {
  if (status === "completed") return "bg-green-100 text-green-700";
  if (status === "pending") return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-600";
};

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const session = await withTimeout(auth.me(), "Orders request timed out.");
        if (!session.authenticated) {
          router.push("/login");
          return;
        }

        const data = await withTimeout(ordersApi.getOrders(), "Orders request timed out.");
        setOrders(data.orders || []);
      } catch (err: any) {
        if (err.message === "You must log in before using this route.") {
          router.push("/login");
        } else {
          setError(err.message || "Failed to load order history.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <div className="w-10 h-10 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
        <p className="mt-4 text-slate-500 text-sm font-medium">Loading orders…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <main className="max-w-5xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <Link
            href="/bookstore"
            className="text-sm text-slate-400 hover:text-slate-700 font-medium transition-colors inline-flex items-center gap-1"
          >
            ← Back to Bookstore
          </Link>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Order History</h1>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-2xl text-sm mb-6">
            {error}
          </div>
        )}

        {/* Empty State */}
        {!error && orders.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-300 rounded-2xl py-16 text-center">
            <p className="text-3xl mb-3">📦</p>
            <h3 className="text-base font-semibold text-slate-800">No Orders Yet</h3>
            <p className="text-sm text-slate-500 mt-1">
              You haven&apos;t placed any orders.
            </p>
            <Link
              href="/bookstore"
              className="inline-block mt-5 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors"
            >
              Visit Bookstore
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
              >
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Order #{order.id.toString().padStart(5, "0")}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {new Date(order.created_at).toLocaleDateString("ms-MY", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                <div className="flex flex-col md:items-end gap-2">
                  <p className="text-lg font-black text-slate-900">
                    RM {Number(order.total_amount).toFixed(2)}
                  </p>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${statusClass(
                      order.status
                    )}`}
                  >
                    {order.status}
                  </span>
                  <Link
                    href={`/orders/${order.id}`}
                    className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    View Details →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
