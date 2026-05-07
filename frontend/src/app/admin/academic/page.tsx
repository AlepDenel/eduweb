"use client";

import Link from "next/link";
import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  adminApi,
  AdminAnswerOption,
  AdminCourse,
  AdminModule,
  AdminQuestion,
  AdminQuiz,
  AdminResource,
} from "@/lib/api";
import { requireAdminAccess, withAdminTimeout } from "@/lib/adminAuth";

type SectionErrors = {
  courses: string;
  modules: string;
  resources: string;
  quizzes: string;
  questions: string;
  answerOptions: string;
};

function SectionCard({
  title,
  description,
  error,
  emptyMessage,
  children,
}: {
  title: string;
  description: string;
  error: string;
  emptyMessage: string;
  children: ReactNode;
}) {
  const hasContent = Boolean(children);

  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-100">
        <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
        <p className="text-sm text-slate-500 mt-1">{description}</p>
      </div>

      {error ? (
        <div className="p-6 text-red-600">{error}</div>
      ) : hasContent ? (
        children
      ) : (
        <div className="p-6 text-slate-500">{emptyMessage}</div>
      )}
    </section>
  );
}

export default function AdminAcademicPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [pageError, setPageError] = useState("");
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [modules, setModules] = useState<AdminModule[]>([]);
  const [resources, setResources] = useState<AdminResource[]>([]);
  const [quizzes, setQuizzes] = useState<AdminQuiz[]>([]);
  const [questions, setQuestions] = useState<AdminQuestion[]>([]);
  const [answerOptions, setAnswerOptions] = useState<AdminAnswerOption[]>([]);
  const [errors, setErrors] = useState<SectionErrors>({
    courses: "",
    modules: "",
    resources: "",
    quizzes: "",
    questions: "",
    answerOptions: "",
  });

  useEffect(() => {
    const loadAcademicOverview = async () => {
      try {
        const access = await requireAdminAccess();

        if (access.status === "unauthenticated") {
          router.push("/login");
          return;
        }

        if (access.status === "denied") {
          setHasAccess(false);
          return;
        }

        setHasAccess(true);

        const nextErrors: SectionErrors = {
          courses: "",
          modules: "",
          resources: "",
          quizzes: "",
          questions: "",
          answerOptions: "",
        };

        let loadedCourses: AdminCourse[] = [];
        try {
          const response = await withAdminTimeout(
            adminApi.getCourses(),
            "Admin courses request timed out."
          );
          loadedCourses = response.courses || [];
          setCourses(loadedCourses);
        } catch (err: any) {
          nextErrors.courses = err.message || "Failed to load admin courses.";
          setCourses([]);
        }

        let loadedModules: AdminModule[] = [];
        if (loadedCourses.length > 0) {
          const moduleResults = await Promise.allSettled(
            loadedCourses.map((course) =>
              withAdminTimeout(
                adminApi.getModulesForCourse(course.id),
                `Admin modules request timed out for course ${course.id}.`
              )
            )
          );

          const failedModules = moduleResults.filter((result) => result.status === "rejected");
          if (failedModules.length > 0) {
            nextErrors.modules = "Sebahagian senarai modul gagal dimuatkan.";
          }

          loadedModules = moduleResults
            .filter(
              (result): result is PromiseFulfilledResult<{ status: string; course_id: number; modules: AdminModule[] }> =>
                result.status === "fulfilled"
            )
            .flatMap((result) => result.value.modules || []);
        } else if (nextErrors.courses) {
          nextErrors.modules = "Modul tidak dapat ditemui kerana senarai kursus gagal dimuatkan.";
        }
        setModules(loadedModules);

        let loadedResources: AdminResource[] = [];
        if (loadedModules.length > 0) {
          const resourceResults = await Promise.allSettled(
            loadedModules.map((module) =>
              withAdminTimeout(
                adminApi.getResourcesForModule(module.id),
                `Admin resources request timed out for module ${module.id}.`
              )
            )
          );

          const failedResources = resourceResults.filter((result) => result.status === "rejected");
          if (failedResources.length > 0) {
            nextErrors.resources = "Sebahagian senarai resource gagal dimuatkan.";
          }

          loadedResources = resourceResults
            .filter(
              (result): result is PromiseFulfilledResult<{ status: string; module_id: number; resources: AdminResource[] }> =>
                result.status === "fulfilled"
            )
            .flatMap((result) => result.value.resources || []);
        } else if (nextErrors.modules) {
          nextErrors.resources = "Resource tidak dapat ditemui kerana modul gagal dimuatkan.";
        }
        setResources(loadedResources);

        let loadedQuizzes: AdminQuiz[] = [];
        if (loadedModules.length > 0) {
          const quizResults = await Promise.allSettled(
            loadedModules.map((module) =>
              withAdminTimeout(
                adminApi.getQuizzesForModule(module.id),
                `Admin quizzes request timed out for module ${module.id}.`
              )
            )
          );

          const failedQuizzes = quizResults.filter((result) => result.status === "rejected");
          if (failedQuizzes.length > 0) {
            nextErrors.quizzes = "Sebahagian senarai kuiz gagal dimuatkan.";
          }

          loadedQuizzes = quizResults
            .filter(
              (result): result is PromiseFulfilledResult<{ status: string; module_id: number; quizzes: AdminQuiz[] }> =>
                result.status === "fulfilled"
            )
            .flatMap((result) => result.value.quizzes || []);
        } else if (nextErrors.modules) {
          nextErrors.quizzes = "Kuiz tidak dapat ditemui kerana modul gagal dimuatkan.";
        }
        setQuizzes(loadedQuizzes);

        let loadedQuestions: AdminQuestion[] = [];
        if (loadedQuizzes.length > 0) {
          const questionResults = await Promise.allSettled(
            loadedQuizzes.map((quiz) =>
              withAdminTimeout(
                adminApi.getQuestionsForQuiz(quiz.id),
                `Admin questions request timed out for quiz ${quiz.id}.`
              )
            )
          );

          const failedQuestions = questionResults.filter((result) => result.status === "rejected");
          if (failedQuestions.length > 0) {
            nextErrors.questions = "Sebahagian senarai soalan gagal dimuatkan.";
          }

          loadedQuestions = questionResults
            .filter(
              (result): result is PromiseFulfilledResult<{ status: string; quiz_id: number; questions: AdminQuestion[] }> =>
                result.status === "fulfilled"
            )
            .flatMap((result) => result.value.questions || []);
        } else if (nextErrors.quizzes) {
          nextErrors.questions = "Soalan tidak dapat ditemui kerana kuiz gagal dimuatkan.";
        }
        setQuestions(loadedQuestions);

        let loadedOptions: AdminAnswerOption[] = [];
        if (loadedQuestions.length > 0) {
          const optionResults = await Promise.allSettled(
            loadedQuestions.map((question) =>
              withAdminTimeout(
                adminApi.getAnswerOptionsForQuestion(question.id),
                `Admin answer options request timed out for question ${question.id}.`
              )
            )
          );

          const failedOptions = optionResults.filter((result) => result.status === "rejected");
          if (failedOptions.length > 0) {
            nextErrors.answerOptions = "Sebahagian senarai answer option gagal dimuatkan.";
          }

          loadedOptions = optionResults
            .filter(
              (result): result is PromiseFulfilledResult<{ status: string; question_id: number; answer_options: AdminAnswerOption[] }> =>
                result.status === "fulfilled"
            )
            .flatMap((result) => result.value.answer_options || []);
        } else if (nextErrors.questions) {
          nextErrors.answerOptions = "Answer option tidak dapat ditemui kerana soalan gagal dimuatkan.";
        }
        setAnswerOptions(loadedOptions);

        setErrors(nextErrors);
      } catch (err: any) {
        setPageError(err.message || "Failed to load admin academic overview.");
      } finally {
        setIsLoading(false);
      }
    };

    loadAcademicOverview();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-500 font-medium text-lg">Memuatkan akademik admin...</p>
      </div>
    );
  }

  if (hasAccess === false) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center max-w-xl w-full">
          <p className="text-red-600 mb-3 font-medium">Akses ditolak.</p>
          <p className="text-slate-500 mb-6">Halaman ini hanya untuk Admin.</p>
          <button
            onClick={() => router.push("/portal")}
            className="px-6 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
          >
            Kembali ke Portal
          </button>
        </div>
      </div>
    );
  }

  if (hasAccess !== true && !pageError) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      <header className="bg-white border-b border-slate-200 pt-16 pb-10 px-6">
        <div className="max-w-7xl mx-auto">
          <Link href="/admin" className="text-sm font-semibold text-slate-500 hover:text-slate-700">
            Back to Admin
          </Link>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-900 mt-4 mb-3">
            Admin Academic Overview
          </h1>
          <p className="text-slate-500 leading-relaxed font-light text-lg">
            Ringkasan read-only untuk struktur akademik tanpa sebarang tindakan CRUD.
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 mt-10 space-y-8">
        {pageError && (
          <div className="bg-white rounded-2xl border border-red-200 p-6 text-red-600">
            {pageError}
          </div>
        )}

        <SectionCard
          title="Courses"
          description="Senarai kursus utama beserta bilangan modul."
          error={errors.courses}
          emptyMessage="Tiada kursus untuk dipaparkan."
        >
          {courses.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">ID</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Title</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Modules</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {courses.map((course) => (
                    <tr key={course.id}>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-800">{course.id}</td>
                      <td className="px-6 py-4 text-sm text-slate-700">
                        <p className="font-medium">{course.title}</p>
                        <p className="text-slate-500 mt-1">{course.description}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{course.module_count}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {new Date(course.created_at).toLocaleDateString("ms-MY")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </SectionCard>

        <SectionCard
          title="Modules"
          description="Gabungan modul yang ditemui daripada semua kursus admin."
          error={errors.modules}
          emptyMessage="Tiada modul untuk dipaparkan."
        >
          {modules.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {modules.map((module) => (
                <article key={module.id} className="p-5 border-b border-slate-100 md:border md:rounded-xl md:m-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Module #{module.id} | Course #{module.course_id}
                  </p>
                  <h3 className="text-lg font-semibold text-slate-900">{module.title}</h3>
                  <p className="text-slate-500 mt-2">{module.description}</p>
                </article>
              ))}
            </div>
          ) : null}
        </SectionCard>

        <SectionCard
          title="Resources"
          description="Paparan ringkas resource yang ditemui daripada modul admin."
          error={errors.resources}
          emptyMessage="Tiada resource untuk dipaparkan."
        >
          {resources.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">ID</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Module</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Title</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {resources.map((resource) => (
                    <tr key={resource.id}>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-800">{resource.id}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{resource.module_id}</td>
                      <td className="px-6 py-4 text-sm text-slate-700">{resource.title}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{resource.resource_type}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </SectionCard>

        <SectionCard
          title="Quizzes"
          description="Paparan kuiz admin yang ditemui melalui modul."
          error={errors.quizzes}
          emptyMessage="Tiada kuiz untuk dipaparkan."
        >
          {quizzes.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {quizzes.map((quiz) => (
                <article key={quiz.id} className="p-5 border-b border-slate-100 md:border md:rounded-xl md:m-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Quiz #{quiz.id} | Module #{quiz.module_id}
                  </p>
                  <h3 className="text-lg font-semibold text-slate-900">{quiz.title}</h3>
                  <p className="text-slate-500 mt-2">{quiz.description || "Tiada deskripsi."}</p>
                </article>
              ))}
            </div>
          ) : null}
        </SectionCard>

        <SectionCard
          title="Questions"
          description="Senarai soalan yang ditemui melalui kuiz."
          error={errors.questions}
          emptyMessage="Tiada soalan untuk dipaparkan."
        >
          {questions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">ID</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Quiz</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Question</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Type</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {questions.map((question) => (
                    <tr key={question.id}>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-800">{question.id}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{question.quiz_id}</td>
                      <td className="px-6 py-4 text-sm text-slate-700">{question.question_text}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{question.question_type}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{question.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </SectionCard>

        <SectionCard
          title="Answer Options"
          description="Senarai answer option yang ditemui melalui soalan."
          error={errors.answerOptions}
          emptyMessage="Tiada answer option untuk dipaparkan."
        >
          {answerOptions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">ID</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Question</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Option</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Correct</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {answerOptions.map((option) => (
                    <tr key={option.id}>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-800">{option.id}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{option.question_id}</td>
                      <td className="px-6 py-4 text-sm text-slate-700">{option.option_text}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {option.is_correct ? "Yes" : "No"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </SectionCard>
      </main>
    </div>
  );
}
