"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  auth, 
  portal, 
  savedResourcesApi, 
  ordersApi, 
  CourseProgressSummary, 
  SavedResource, 
  Order 
} from "@/lib/api";

const REQUEST_TIMEOUT_MS = 8000;

function withTimeout<T>(promise: Promise<T>, message: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(message)), REQUEST_TIMEOUT_MS);
    }),
  ]);
}

export default function PortalPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<CourseProgressSummary[]>([]);
  const [savedResources, setSavedResources] = useState<SavedResource[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPortalData = async () => {
      try {
        const session = await withTimeout(auth.me(), "Portal request timed out.");
        if (!session.authenticated) {
          router.push("/login");
          return;
        }

        const [progressRes, savedRes, ordersRes] = await Promise.allSettled([
          withTimeout(
            portal.getProgressOverview({ status: "in_progress" }),
            "Portal progress request timed out."
          ),
          withTimeout(
            savedResourcesApi.getSavedResources(),
            "Saved resources request timed out."
          ),
          withTimeout(ordersApi.getOrders(), "Portal orders request timed out.")
        ]);

        if (progressRes.status === "fulfilled") {
          setCourses(progressRes.value.courses || []);
        } else {
          console.error("Failed to load portal progress overview", progressRes.reason);
          setCourses([]);
        }

        if (savedRes.status === "fulfilled") {
          setSavedResources(savedRes.value.saved_resources || []);
        } else {
          console.error("Failed to load saved resources", savedRes.reason);
          setSavedResources([]);
        }

        if (ordersRes.status === "fulfilled") {
          const sortedOrders = (ordersRes.value.orders || []).sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
          setOrders(sortedOrders);
        } else {
          console.error("Failed to load portal orders", ordersRes.reason);
          setOrders([]);
        }

      } catch (err: any) {
        if (err.message === "You must log in before using this route.") {
          router.push("/login");
        } else {
          setError(err.message || "Failed to load portal data");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchPortalData();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-500 font-medium text-lg tracking-wide">Menyiapkan Dashboard Anda...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-red-50 p-8 rounded-2xl border border-red-200 text-center max-w-lg w-full">
          <p className="text-red-600 mb-6 font-medium">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-colors"
          >
            Cuba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-24">
      {/* Header */}
      <header className="bg-indigo-900 text-white pt-20 pb-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-900 to-indigo-800 z-0"></div>
        {/* Decorative circle */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-white">
            Portal Pelajar
          </h1>
          <p className="text-indigo-200 text-lg max-w-2xl font-light">
            Pantau kemajuan pembelajaran, akses bahan disimpan, dan semak sejarah pesanan anda di satu tempat.
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 -mt-12 relative z-20 space-y-12">
        
        {/* Section 1: Course Progress */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-800">Pembelajaran Semasa</h2>
            <a href="/courses" className="text-sm font-semibold text-indigo-600 hover:text-indigo-800">Lihat Semua →</a>
          </div>

          {courses.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl shadow-sm border border-slate-200 text-center">
              <div className="text-5xl mb-4">🎓</div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Tiada Kursus Aktif</h3>
              <p className="text-slate-500">Mula belajar hari ini untuk mencapai matlamat anda.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <div key={course.course_id} className="bg-white p-6 rounded-3xl shadow-sm hover:shadow-lg transition-all border border-slate-100 flex flex-col group">
                  <h3 className="text-xl font-bold text-slate-800 mb-4 group-hover:text-indigo-600 transition-colors line-clamp-2">
                    {course.course_title}
                  </h3>
                  
                  <div className="mb-6 flex-1">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-sm font-medium text-slate-500">Kemajuan</span>
                      <span className="text-lg font-extrabold text-indigo-600">{course.progress_percentage}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-1000"
                        style={{ width: `${course.progress_percentage}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-slate-400 mt-3 font-medium text-right">
                      {course.completed_resources} / {course.total_resources} Bahan Selesai
                    </p>
                  </div>

                  <a 
                    href={`/courses/${course.course_id}`}
                    className="w-full py-3 bg-slate-50 text-slate-700 hover:bg-indigo-600 hover:text-white rounded-xl text-sm font-bold text-center transition-colors"
                  >
                    Sambung Belajar
                  </a>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Section 2: Saved Resources */}
          <section className="lg:col-span-1">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Bahan Disimpan</h2>
            
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
              {savedResources.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-4xl mb-3 opacity-50">🔖</div>
                  <p className="text-slate-500 text-sm font-medium">Tiada bahan disimpan setakat ini.</p>
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {savedResources.map((item) => (
                    <li key={item.id} className="p-5 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className="text-sm font-bold text-slate-800 line-clamp-2 mb-1">
                            {item.resource_title}
                          </h4>
                          <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-xs font-semibold uppercase tracking-wider">
                            {item.resource_type}
                          </span>
                        </div>
                        <a 
                          href={`/resources/${item.resource_id}`} // Adjust link based on routing logic
                          className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-100 transition-colors"
                        >
                          →
                        </a>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          {/* Section 3: Book Orders */}
          <section className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Sejarah Pesanan Buku</h2>
            
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
              {orders.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="text-5xl mb-4 opacity-50">📦</div>
                  <p className="text-slate-500 font-medium">Anda belum membuat sebarang pesanan.</p>
                  <a href="/bookstore" className="inline-block mt-4 text-indigo-600 font-semibold hover:underline">
                    Kunjungi Kedai Buku
                  </a>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">ID Pesanan</th>
                        <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Tarikh</th>
                        <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Jumlah (RM)</th>
                        <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {orders.map((order) => (
                        <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-4 px-6 text-sm font-semibold text-slate-800">
                            #{order.id.toString().padStart(5, '0')}
                          </td>
                          <td className="py-4 px-6 text-sm text-slate-500">
                            {new Date(order.created_at).toLocaleDateString('ms-MY', {
                              year: 'numeric', month: 'short', day: 'numeric'
                            })}
                          </td>
                          <td className="py-4 px-6 text-sm font-bold text-slate-900">
                            {Number(order.total_amount).toFixed(2)}
                          </td>
                          <td className="py-4 px-6">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                              order.status === 'completed'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-slate-100 text-slate-700'
                            }`}>
                              {order.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
