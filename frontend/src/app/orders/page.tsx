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
        <div className="w-12 h-12 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-500 font-medium text-lg">Memuatkan pesanan...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-8">
          <Link href="/bookstore" className="text-sm font-semibold text-slate-500 hover:text-slate-900">
            ← Kembali ke Kedai Buku
          </Link>
          <h1 className="mt-3 text-4xl font-extrabold text-slate-900">Sejarah Pesanan</h1>
        </div>

        {error ? (
          <div className="bg-red-50 text-red-700 p-6 rounded-2xl border border-red-200">
            {error}
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center">
            <p className="text-slate-500 font-medium">Anda belum mempunyai sebarang pesanan.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
              >
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Pesanan #{order.id}</h2>
                  <p className="text-sm text-slate-500 mt-1">
                    {new Date(order.created_at).toLocaleDateString("ms-MY", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                <div className="flex flex-col md:items-end">
                  <p className="text-lg font-black text-slate-900">RM {Number(order.total_amount).toFixed(2)}</p>
                  <p className="text-sm text-slate-500 uppercase tracking-wider">{order.status}</p>
                  <Link
                    href={`/orders/${order.id}`}
                    className="mt-3 text-sm font-semibold text-emerald-600 hover:text-emerald-700"
                  >
                    Lihat Detail →
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
