"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  academic,
  auth,
  Course,
  Module,
  quizApi,
  Quiz,
  Resource,
  savedResourcesApi,
} from "@/lib/api";
import Toast from "@/components/Toast";

type ModuleWithResources = Module & { resources: Resource[]; quizzes: Quiz[] };
type SavedStatusState = Record<number, boolean>;
type SavedActionState = Record<number, boolean>;
type SavedFeedbackState = Record<number, string>;

export default function CourseDetailPage({ params }: { params: { course_id: string } }) {
  const router = useRouter();
  const course_id = params.course_id;

  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<ModuleWithResources[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [savedStatus, setSavedStatus] = useState<SavedStatusState>({});
  const [savingStatus, setSavingStatus] = useState<SavedActionState>({});
  const [savedFeedback, setSavedFeedback] = useState<SavedFeedbackState>({});

  // Toast
  const [toast, setToast] = useState({ visible: false, message: "", type: "success" as "success" | "error" | "info" });
  const showToast = (message: string, type: "success" | "error" | "info" = "success") =>
    setToast({ visible: true, message, type });
  const dismissToast = useCallback(() => setToast((t) => ({ ...t, visible: false })), []);

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        const session = await auth.me();
        if (!session.authenticated) { router.push("/login"); return; }

        const courseData = await academic.getCourse(course_id);
        setCourse(courseData.course);

        const modulesData = await academic.getModules(course_id);
        const fetchedModules = modulesData.modules || [];

        const modulesWithResources: ModuleWithResources[] = await Promise.all(
          fetchedModules.map(async (mod) => {
            try {
              const [resData, quizzesData] = await Promise.all([
                academic.getResources(mod.id),
                quizApi.getQuizzesForModule(mod.id).catch((err) => {
                  console.error(`Failed to fetch quizzes for module ${mod.id}`, err);
                  return { status: "error", module_id: mod.id, quizzes: [] };
                }),
              ]);
              return { ...mod, resources: resData.resources || [], quizzes: quizzesData.quizzes || [] };
            } catch (err) {
              console.error(`Failed to fetch module content for module ${mod.id}`, err);
              return { ...mod, resources: [], quizzes: [] };
            }
          })
        );
        setModules(modulesWithResources);

        const allResources = modulesWithResources.flatMap((mod) => mod.resources);
        const savedStatusEntries = await Promise.all(
          allResources.map(async (resource) => {
            try {
              const statusResponse = await savedResourcesApi.getResourceSavedStatus(resource.id);
              return [resource.id, statusResponse.saved] as const;
            } catch {
              return [resource.id, false] as const;
            }
          })
        );
        setSavedStatus(Object.fromEntries(savedStatusEntries));
      } catch (err: any) {
        if (err.message === "You must log in before using this route.") {
          router.push("/login");
        } else {
          setError(err.message || "Failed to load course details.");
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchCourseData();
  }, [course_id, router]);

  const handleMarkComplete = async (resource_id: number) => {
    try {
      setProcessingId(resource_id);
      await academic.completeResource(resource_id);
      showToast("Resource marked as complete.", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to mark complete.", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const handleToggleSaved = async (resource_id: number) => {
    setSavedFeedback((c) => ({ ...c, [resource_id]: "" }));
    try {
      setSavingStatus((c) => ({ ...c, [resource_id]: true }));
      if (savedStatus[resource_id]) {
        const response = await savedResourcesApi.unsaveResource(resource_id);
        setSavedStatus((c) => ({ ...c, [resource_id]: false }));
        setSavedFeedback((c) => ({ ...c, [resource_id]: response.message || "Removed from saved." }));
        return;
      }
      const response = await savedResourcesApi.saveResource(resource_id);
      setSavedStatus((c) => ({ ...c, [resource_id]: true }));
      setSavedFeedback((c) => ({ ...c, [resource_id]: response.message || "Resource saved." }));
    } catch (err: any) {
      setSavedFeedback((c) => ({ ...c, [resource_id]: err.message || "Failed to update saved status." }));
    } finally {
      setSavingStatus((c) => ({ ...c, [resource_id]: false }));
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <div className="w-10 h-10 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
        <p className="mt-4 text-slate-500 text-sm font-medium">Loading course…</p>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center max-w-lg w-full">
          <p className="text-red-600 mb-6 text-sm">{error || "Course not found."}</p>
          <button
            onClick={() => router.push("/courses")}
            className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-colors"
          >
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <Toast message={toast.message} type={toast.type} visible={toast.visible} onDismiss={dismissToast} />

      {/* Course Header */}
      <header className="bg-white border-b border-slate-200 px-6 pt-10 pb-10">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => router.push("/courses")}
            className="text-sm text-slate-400 hover:text-slate-700 font-medium transition-colors mb-6 inline-flex items-center gap-1"
          >
            ← Back to Courses
          </button>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-3">{course.title}</h1>
          <p className="text-slate-500 leading-relaxed">{course.description}</p>
        </div>
      </header>

      {/* Module Content */}
      <main className="max-w-4xl mx-auto px-6 mt-10">
        {modules.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-slate-300 rounded-2xl bg-white">
            <p className="text-slate-500 text-sm">No modules available for this course yet.</p>
          </div>
        ) : (
          <div className="space-y-10">
            {modules.map((mod, index) => (
              <section key={mod.id}>
                <div className="flex items-baseline gap-3 mb-5">
                  <span className="text-xl font-light text-slate-300 tabular-nums select-none">
                    {(index + 1).toString().padStart(2, "0")}
                  </span>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">{mod.title}</h2>
                    {mod.description && <p className="text-sm text-slate-500 mt-0.5">{mod.description}</p>}
                  </div>
                </div>

                <div className="pl-9 space-y-4 border-l-2 border-slate-100 ml-2.5">
                  {/* Quizzes */}
                  {mod.quizzes.length > 0 && (
                    <div className="space-y-3">
                      {mod.quizzes.map((quiz) => (
                        <div key={quiz.id} className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
                          <div className="flex-1">
                            <div className="flex items-center gap-2.5 mb-1.5">
                              <span className="text-xs font-semibold uppercase tracking-wide bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-md">Quiz</span>
                              <h3 className="text-sm font-semibold text-slate-900">{quiz.title}</h3>
                            </div>
                            {quiz.description && <p className="text-sm text-slate-500 leading-relaxed">{quiz.description}</p>}
                          </div>
                          <div className="shrink-0">
                            <Link
                              href={`/courses/${course_id}/quiz/${quiz.id}`}
                              className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-150"
                            >
                              Open Quiz
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Resources */}
                  {mod.resources.length === 0 ? (
                    <p className="text-sm text-slate-400 italic py-2">No learning materials for this module.</p>
                  ) : (
                    mod.resources.map((res) => (
                      <div key={res.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-start justify-between gap-5">
                        <div className="flex-1">
                          <div className="flex items-center gap-2.5 mb-2">
                            <span className="text-xs font-semibold uppercase tracking-wide bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-md">{res.resource_type}</span>
                            <h3 className="text-sm font-semibold text-slate-900">{res.title}</h3>
                          </div>
                          {res.resource_type === "text" && res.content_text && (
                            <p className="text-sm text-slate-600 leading-relaxed mt-2 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">{res.content_text}</p>
                          )}
                          {(res.resource_type === "video" || res.resource_type === "link") && res.content_url && (
                            <a href={res.content_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:text-blue-800 hover:underline mt-2 inline-block">
                              Open {res.resource_type} link ↗
                            </a>
                          )}
                        </div>

                        <div className="shrink-0">
                          <div className="flex flex-col items-end gap-2">
                            <button
                              onClick={() => handleToggleSaved(res.id)}
                              disabled={savingStatus[res.id] === true}
                              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-150 border ${
                                savingStatus[res.id]
                                  ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                                  : savedStatus[res.id]
                                  ? "bg-slate-900 text-white border-slate-900 hover:bg-slate-800"
                                  : "bg-white text-slate-700 border-slate-300 hover:border-slate-500 hover:text-slate-900"
                              }`}
                            >
                              {savingStatus[res.id] ? "Processing…" : savedStatus[res.id] ? "✓ Saved" : "Save Resource"}
                            </button>

                            <button
                              onClick={() => handleMarkComplete(res.id)}
                              disabled={processingId === res.id}
                              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-150 border ${
                                processingId === res.id
                                  ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                                  : "bg-white text-slate-700 border-slate-300 hover:border-slate-500 hover:text-slate-900"
                              }`}
                            >
                              {processingId === res.id ? "Processing…" : "✓ Mark Complete"}
                            </button>

                            {savedFeedback[res.id] && (
                              <p className="max-w-[200px] text-right text-xs text-slate-500">{savedFeedback[res.id]}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
