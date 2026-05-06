"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { academic, auth, Course, Module, quizApi, Quiz, Resource } from "@/lib/api";

type ModuleWithResources = Module & { resources: Resource[]; quizzes: Quiz[] };

export default function CourseDetailPage({ params }: { params: { course_id: string } }) {
  const router = useRouter();
  const course_id = params.course_id;

  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<ModuleWithResources[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState<number | null>(null);

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        // 1. Check Auth
        const session = await auth.me();
        if (!session.authenticated) {
          router.push("/login");
          return;
        }

        // 2. Fetch Course Detail
        const courseData = await academic.getCourse(course_id);
        setCourse(courseData.course);

        // 3. Fetch Modules
        const modulesData = await academic.getModules(course_id);
        const fetchedModules = modulesData.modules || [];

        // 4. Fetch Resources and quizzes for each module concurrently
        const modulesWithResources: ModuleWithResources[] = await Promise.all(
          fetchedModules.map(async (mod) => {
            try {
              const [resData, quizzesData] = await Promise.all([
                academic.getResources(mod.id),
                quizApi.getQuizzesForModule(mod.id).catch((e) => {
                  console.error(`Failed to fetch quizzes for module ${mod.id}`, e);
                  return { status: "error", module_id: mod.id, quizzes: [] };
                }),
              ]);

              return {
                ...mod,
                resources: resData.resources || [],
                quizzes: quizzesData.quizzes || [],
              };
            } catch (e) {
              console.error(`Failed to fetch module content for module ${mod.id}`, e);
              return { ...mod, resources: [], quizzes: [] };
            }
          })
        );

        setModules(modulesWithResources);
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
      alert("Tanda Selesai berjaya direkodkan!");
      // In a real app, you might refetch the progress here to update the UI
    } catch (err: any) {
      alert(`Ralat: ${err.message || "Gagal menanda selesai"}`);
    } finally {
      setProcessingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-50">
        <div className="w-10 h-10 border-2 border-neutral-200 border-t-neutral-800 rounded-full animate-spin"></div>
        <p className="mt-4 text-neutral-500 text-sm uppercase tracking-widest">Memuatkan kursus...</p>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-neutral-100 text-center max-w-lg w-full">
          <p className="text-red-500 mb-6">{error || "Kursus tidak dijumpai"}</p>
          <button 
            onClick={() => router.push("/courses")}
            className="px-6 py-2 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors"
          >
            Kembali ke Senarai Kursus
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 font-sans text-neutral-900 pb-24">
      {/* Exclusive Minimalist Header */}
      <header className="bg-white border-b border-neutral-200 pt-20 pb-16 px-6">
        <div className="max-w-4xl mx-auto">
          <button 
            onClick={() => router.push("/courses")}
            className="text-neutral-400 hover:text-neutral-900 transition-colors text-sm font-medium mb-8 inline-flex items-center"
          >
            ← Kembali
          </button>
          <h1 className="text-4xl md:text-5xl font-light tracking-tight text-neutral-900 mb-4">
            {course.title}
          </h1>
          <p className="text-lg text-neutral-500 leading-relaxed font-light">
            {course.description}
          </p>
        </div>
      </header>

      {/* Modules Content */}
      <main className="max-w-4xl mx-auto px-6 mt-16">
        {modules.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-neutral-300 rounded-2xl">
            <p className="text-neutral-500">Tiada modul disediakan untuk kursus ini lagi.</p>
          </div>
        ) : (
          <div className="space-y-12">
            {modules.map((mod, index) => (
              <section key={mod.id} className="relative">
                <div className="flex items-baseline gap-4 mb-6">
                  <span className="text-2xl font-light text-neutral-300">
                    {(index + 1).toString().padStart(2, '0')}
                  </span>
                  <div>
                    <h2 className="text-2xl font-medium text-neutral-800">{mod.title}</h2>
                    <p className="text-neutral-500 text-sm mt-1">{mod.description}</p>
                  </div>
                </div>

                <div className="pl-10 space-y-4 border-l border-neutral-200 ml-3">
                  {mod.quizzes.length > 0 && (
                    <div className="space-y-3">
                      {mod.quizzes.map((quiz) => (
                        <div
                          key={quiz.id}
                          className="bg-white p-5 rounded-xl border border-neutral-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-xs font-bold tracking-wider uppercase bg-neutral-100 text-neutral-600 px-2.5 py-1 rounded-md">
                                Kuiz
                              </span>
                              <h3 className="text-lg font-medium text-neutral-800">{quiz.title}</h3>
                            </div>

                            {quiz.description && (
                              <p className="text-neutral-600 text-sm leading-relaxed">
                                {quiz.description}
                              </p>
                            )}
                          </div>

                          <div className="shrink-0">
                            <Link
                              href={`/courses/${course_id}/quiz/${quiz.id}`}
                              className="inline-flex px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm border bg-white text-neutral-700 border-neutral-200 hover:border-neutral-900 hover:text-neutral-900"
                            >
                              Buka Kuiz
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {mod.resources.length === 0 ? (
                    <p className="text-sm text-neutral-400 italic">Tiada bahan pembelajaran.</p>
                  ) : (
                    mod.resources.map((res) => (
                      <div 
                        key={res.id} 
                        className="bg-white p-6 rounded-xl border border-neutral-100 shadow-sm hover:shadow-md transition-shadow group flex flex-col md:flex-row md:items-center justify-between gap-6"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-xs font-bold tracking-wider uppercase bg-neutral-100 text-neutral-600 px-2.5 py-1 rounded-md">
                              {res.resource_type}
                            </span>
                            <h3 className="text-lg font-medium text-neutral-800 group-hover:text-neutral-900 transition-colors">
                              {res.title}
                            </h3>
                          </div>
                          
                          {res.resource_type === 'text' && res.content_text && (
                            <p className="text-neutral-600 text-sm leading-relaxed mt-3 bg-neutral-50 p-4 rounded-lg">
                              {res.content_text}
                            </p>
                          )}
                          
                          {(res.resource_type === 'video' || res.resource_type === 'link') && res.content_url && (
                            <a 
                              href={res.content_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:text-blue-800 hover:underline mt-2 inline-block"
                            >
                              Buka pautan {res.resource_type} ↗
                            </a>
                          )}
                        </div>

                        <div className="shrink-0">
                          <button
                            onClick={() => handleMarkComplete(res.id)}
                            disabled={processingId === res.id}
                            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm border ${
                              processingId === res.id 
                                ? "bg-neutral-100 text-neutral-400 border-neutral-200 cursor-not-allowed" 
                                : "bg-white text-neutral-700 border-neutral-200 hover:border-neutral-900 hover:text-neutral-900"
                            }`}
                          >
                            {processingId === res.id ? "Memproses..." : "✓ Tanda Selesai"}
                          </button>
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
