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
        // 1. Check if user is logged in
        const session = await auth.me();
        if (!session.authenticated) {
          router.push("/login");
          return; // Stop execution
        }

        // 2. Fetch courses
        const data = await academic.getCourses();
        setCourses(data.courses || []);
      } catch (err: any) {
        // If the API throws a 401 error directly, catch it and redirect
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
        <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-500 font-medium text-lg">Fetching available courses...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-16">
      <div className="max-w-7xl mx-auto px-6 pt-12">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
          <div className="flex-1">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-2 text-slate-800 bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600">
              Course Catalog
            </h1>
            <p className="text-lg text-slate-500 leading-relaxed max-w-2xl">
              Discover top-tier educational content designed to elevate your skills.
            </p>
          </div>
          <div className="w-full md:w-80">
            <input 
              type="text" 
              placeholder="Search courses..." 
              className="w-full px-5 py-3 rounded-xl border border-slate-200 bg-white text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              disabled
            />
          </div>
        </header>

        {error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 p-8 rounded-2xl text-center max-w-2xl mx-auto my-16 shadow-sm">
            <p className="text-lg font-medium">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-6 py-2.5 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors shadow-sm"
            >
              Try Again
            </button>
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center p-16 md:p-24 bg-white rounded-3xl border border-dashed border-slate-300 max-w-4xl mx-auto shadow-sm">
            <span className="text-6xl block mb-4">🔍</span>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">No Courses Found</h3>
            <p className="text-slate-500 text-lg">We couldn't find any courses available at the moment. Please check back later.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course) => (
              <div 
                key={course.id} 
                className="group bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl border border-slate-100 flex flex-col transition-all duration-300 hover:-translate-y-1"
              >
                <div className="mb-6">
                  <span className="inline-block px-3.5 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold tracking-wide uppercase">
                    Academic
                  </span>
                </div>
                
                <h2 className="text-2xl font-bold text-slate-900 mb-4 leading-tight group-hover:text-blue-600 transition-colors">
                  {course.title}
                </h2>
                <p className="text-slate-600 leading-relaxed mb-8 flex-1">
                  {course.description.length > 120 
                    ? \`\${course.description.substring(0, 120)}...\` 
                    : course.description}
                </p>

                <div className="mt-auto flex justify-between items-center border-t border-slate-100 pt-6">
                  <div className="text-sm text-slate-400 font-medium">
                    Added: {new Date(course.created_at).toLocaleDateString()}
                  </div>
                  <a 
                    href={\`/courses/\${course.id}\`} 
                    className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-md shadow-blue-500/20"
                  >
                    View Details
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
