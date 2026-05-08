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

const statusClass = (status: string) => {
  if (status === "completed") return "bg-green-100 text-green-700";
  if (status === "pending") return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-600";
};

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
          withTimeout(ordersApi.getOrders(), "Portal orders request timed out."),
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
        <div className="w-10 h-10 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
        <p className="mt-4 text-slate-500 text-sm font-medium">Preparing your dashboard…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-red-50 p-8 rounded-2xl border border-red-200 text-center max-w-lg w-full">
          <p className="text-red-600 mb-4 font-medium text-sm">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">

      {/* Page Header */}
      <header className="bg-white border-b border-slate-200 px-6 pt-10 pb-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Student Portal
          </h1>
          <p className="text-slate-500 mt-1.5 text-sm leading-relaxed">
            Track your learning progress, saved resources, and order history.
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 mt-8 space-y-10">

        {/* Section 1: Course Progress */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-slate-900">Learning Progress</h2>
            <a
              href="/courses"
              className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
            >
              Browse Courses →
            </a>
          </div>

          {courses.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-300 rounded-2xl py-12 text-center">
              <p className="text-2xl mb-3">📖</p>
              <h3 className="text-sm font-semibold text-slate-800">No Active Courses</h3>
              <p className="text-sm text-slate-500 mt-1">Start a course to see your progress here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {courses.map((course) => (
                <div
                  key={course.course_id}
                  className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col"
                >
                  <h3 className="text-sm font-semibold text-slate-900 mb-4 line-clamp-2">
                    {course.course_title}
                  </h3>

                  <div className="mb-5 flex-1">
                    <div className="flex justify-between items-baseline mb-2">
                      <span className="text-xs font-medium text-slate-500">Progress</span>
                      <span className="text-sm font-bold text-blue-600">
                        {course.progress_percentage}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-700"
                        style={{ width: `${course.progress_percentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-400 mt-2 text-right">
                      {course.completed_resources} / {course.total_resources} resources completed
                    </p>
                  </div>

                  <a
                    href={`/courses/${course.course_id}`}
                    className="w-full py-2.5 text-center text-sm font-semibold text-slate-700 border border-slate-200 rounded-xl hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all duration-150"
                  >
                    Continue Learning
                  </a>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Section 2: Saved Resources */}
          <section className="lg:col-span-1">
            <h2 className="text-lg font-semibold text-slate-900 mb-5">Saved Resources</h2>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {savedResources.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-2xl mb-2 opacity-50">🔖</p>
                  <p className="text-sm text-slate-500">No saved resources yet.</p>
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {savedResources.map((item) => (
                    <li key={item.id} className="p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="text-sm font-semibold text-slate-800 line-clamp-2 mb-1">
                            {item.resource_title}
                          </h4>
                          <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-xs font-medium uppercase tracking-wide">
                            {item.resource_type}
                          </span>
                        </div>
                        <a
                          href={`/resources/${item.resource_id}`}
                          className="flex-shrink-0 w-7 h-7 flex items-center justify-center bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors text-sm"
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
            <h2 className="text-lg font-semibold text-slate-900 mb-5">Order History</h2>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {orders.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-2xl mb-3 opacity-50">📦</p>
                  <p className="text-sm text-slate-500 font-medium">No orders placed yet.</p>
                  <a
                    href="/bookstore"
                    className="inline-block mt-4 text-sm font-semibold text-blue-600 hover:underline"
                  >
                    Visit the Bookstore
                  </a>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="py-3.5 px-5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Order ID
                        </th>
                        <th className="py-3.5 px-5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="py-3.5 px-5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Amount (RM)
                        </th>
                        <th className="py-3.5 px-5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {orders.map((order) => (
                        <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3.5 px-5 text-sm font-semibold text-slate-800">
                            #{order.id.toString().padStart(5, "0")}
                          </td>
                          <td className="py-3.5 px-5 text-sm text-slate-500">
                            {new Date(order.created_at).toLocaleDateString("ms-MY", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </td>
                          <td className="py-3.5 px-5 text-sm font-bold text-slate-900">
                            {Number(order.total_amount).toFixed(2)}
                          </td>
                          <td className="py-3.5 px-5">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${statusClass(
                                order.status
                              )}`}
                            >
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
