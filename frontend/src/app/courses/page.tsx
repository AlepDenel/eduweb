"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { academic, auth, Course } from "@/lib/api";

export default function CoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const session = await auth.me();
        if (!session.authenticated) {
          router.push("/login");
          return;
        }

        const data = await academic.getCourses();
        setCourses(data.courses || []);
      } catch (err: any) {
        if (err.message === "You must log in before using this route.") {
          router.push("/login");
        } else {
          setError(err.message || "Failed to load courses catalog.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourses();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <div className="w-10 h-10 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
        <p className="mt-4 text-slate-500 text-sm font-medium">Loading courses…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="max-w-6xl mx-auto px-6 pt-10">

        {/* Page Header */}
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Course Catalogue
            </h1>
            <p className="text-slate-500 mt-1.5 text-sm leading-relaxed">
              Explore available learning modules and start or continue a course.
            </p>
          </div>
          <div className="w-full md:w-72">
            <input
              type="text"
              placeholder="Search courses…"
              disabled
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-400 placeholder:text-slate-400 shadow-sm cursor-not-allowed"
              aria-label="Course search (not yet available)"
            />
          </div>
        </header>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-2xl text-sm mb-8">
            <p className="font-semibold mb-2">Could not load courses</p>
            <p>{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!error && courses.length === 0 && (
          <div className="bg-white border border-dashed border-slate-300 rounded-2xl py-20 text-center">
            <p className="text-3xl mb-3">📭</p>
            <h3 className="text-base font-semibold text-slate-800">No Courses Found</h3>
            <p className="text-sm text-slate-500 mt-1">
              No courses are available at the moment. Please check back later.
            </p>
          </div>
        )}

        {/* Course Grid */}
        {!error && courses.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div
                key={course.id}
                className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col hover:border-blue-200 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                {/* Badge */}
                <span className="inline-block self-start px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-semibold uppercase tracking-wide mb-4">
                  Academic
                </span>

                <h2 className="text-base font-semibold text-slate-900 leading-snug mb-2">
                  {course.title}
                </h2>
                <p className="text-sm text-slate-500 leading-relaxed flex-1">
                  {course.description.length > 110
                    ? `${course.description.substring(0, 110)}…`
                    : course.description}
                </p>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    {new Date(course.created_at).toLocaleDateString()}
                  </span>
                  <a
                    href={`/courses/${course.id}`}
                    className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-150"
                  >
                    View Course
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
