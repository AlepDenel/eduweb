"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, OrderDetail, ordersApi } from "@/lib/api";

export default function OrderDetailPage({ params }: { params: { order_id: string } }) {
  const router = useRouter();
  const order_id = params.order_id;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const session = await auth.me();
        if (!session.authenticated) {
          router.push("/login");
          return;
        }

        const data = await ordersApi.getOrder(order_id);
        setOrder(data.order);
      } catch (err: any) {
        if (err.message === "You must log in before using this route.") {
          router.push("/login");
        } else {
          setError(err.message || "Failed to load order details.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [order_id, router]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-500 font-medium text-lg">Memuatkan butiran pesanan...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-center max-w-lg w-full">
          <p className="text-red-600 mb-6">{error || "Pesanan tidak dijumpai."}</p>
          <Link
            href="/orders"
            className="inline-flex px-6 py-3 rounded-xl font-bold bg-slate-900 text-white hover:bg-slate-800 transition-colors"
          >
            Kembali ke Pesanan
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      <main className="max-w-5xl mx-auto px-6 py-12">
        <Link href="/orders" className="text-sm font-semibold text-slate-500 hover:text-slate-900">
          ← Kembali ke Pesanan
        </Link>

        <div className="mt-8 bg-white rounded-3xl border border-slate-200 shadow-sm p-8 space-y-8">
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Order ID</p>
              <p className="mt-2 text-xl font-bold text-slate-900">#{order.id}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Status</p>
              <p className="mt-2 text-xl font-bold text-slate-900">{order.status}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Jumlah</p>
              <p className="mt-2 text-xl font-bold text-slate-900">RM {Number(order.total_amount).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Tarikh</p>
              <p className="mt-2 text-sm font-medium text-slate-700">
                {new Date(order.created_at).toLocaleDateString("ms-MY", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Item Pesanan</h2>
            {order.items.length === 0 ? (
              <div className="bg-slate-50 rounded-2xl border border-dashed border-slate-300 p-6 text-center">
                <p className="text-slate-500">Tiada item direkodkan untuk pesanan ini.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="bg-slate-50 rounded-2xl border border-slate-100 p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                  >
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{item.title}</h3>
                      <p className="text-sm text-slate-500 mt-1">Book ID: {item.book_id}</p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3 md:text-right">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Kuantiti</p>
                        <p className="text-sm font-semibold text-slate-700">{item.quantity}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Harga</p>
                        <p className="text-sm font-semibold text-slate-700">RM {Number(item.price).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Subtotal</p>
                        <p className="text-sm font-semibold text-slate-700">
                          RM {Number(item.line_subtotal).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
