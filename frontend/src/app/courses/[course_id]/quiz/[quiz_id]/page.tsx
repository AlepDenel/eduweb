"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  api,
  AnswerOption,
  auth,
  quizApi,
  Quiz,
  QuizAttempt,
  Question,
  QuizResult,
} from "@/lib/api";

type QuizQuestion = Question & { options?: AnswerOption[] };
type QuizState = "intro" | "attempting" | "submitted" | "results";
type QuizAttemptsResponse = { status: string; quiz_attempts: QuizAttempt[] };
type AttemptAnswer = {
  id: number;
  quiz_attempt_id: number;
  question_id: number;
  answer_option_id: number | null;
  short_answer_text: string | null;
};
type AttemptAnswersResponse = { status: string; attempt_answers: AttemptAnswer[] };

export default function QuizPage({ params }: { params: { course_id: string; quiz_id: string } }) {
  const router = useRouter();
  const quizId = params.quiz_id;

  const [quizState, setQuizState] = useState<QuizState>("intro");
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [results, setResults] = useState<QuizResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingState, setProcessingState] = useState("");
  const [mcqAnswers, setMcqAnswers] = useState<Record<number, number>>({});
  const [shortAnswers, setShortAnswers] = useState<Record<number, string>>({});

  const loadQuizQuestions = async () => {
    const questionsData = await quizApi.getQuestions(quizId);

    return Promise.all(
      questionsData.questions.map(async (question) => {
        if (question.question_type !== "multiple_choice") {
          return question;
        }

        const optionsData = await quizApi.getAnswerOptions(question.id);
        return {
          ...question,
          options: optionsData.answer_options,
        };
      })
    );
  };

  const loadAttemptAnswers = async (attemptId: string | number) => {
    const answersData = await api.get<AttemptAnswersResponse>(`/quiz-attempts/${attemptId}/answers`);
    return answersData.attempt_answers;
  };

  const hydrateAttempt = async (attemptId: string | number) => {
    const [attemptData, questionsData, savedAnswers] = await Promise.all([
      quizApi.getAttempt(attemptId),
      loadQuizQuestions(),
      loadAttemptAnswers(attemptId),
    ]);

    const nextMcqAnswers: Record<number, number> = {};
    const nextShortAnswers: Record<number, string> = {};

    for (const savedAnswer of savedAnswers) {
      if (savedAnswer.answer_option_id !== null) {
        nextMcqAnswers[savedAnswer.question_id] = savedAnswer.answer_option_id;
      }

      if (savedAnswer.short_answer_text) {
        nextShortAnswers[savedAnswer.question_id] = savedAnswer.short_answer_text;
      }
    }

    setAttempt(attemptData.quiz_attempt);
    setQuestions(questionsData);
    setMcqAnswers(nextMcqAnswers);
    setShortAnswers(nextShortAnswers);

    if (attemptData.quiz_attempt.status === "graded") {
      const resultsData = await quizApi.getResults(attemptData.quiz_attempt.id);
      setResults(resultsData.result);
      setQuizState("results");
      return;
    }

    if (attemptData.quiz_attempt.submitted_at || attemptData.quiz_attempt.status !== "in_progress") {
      setQuizState("submitted");
      return;
    }

    setQuizState("attempting");
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const session = await auth.me();
        if (!session.authenticated) {
          router.push("/login");
          return;
        }

        const [quizData, attemptsData] = await Promise.all([
          quizApi.getQuiz(quizId),
          api.get<QuizAttemptsResponse>(`/quizzes/${quizId}/attempts`),
        ]);

        setQuiz(quizData.quiz);

        const activeAttempt = attemptsData.quiz_attempts.find(
          (quizAttempt) =>
            quizAttempt.user_id === session.user?.id &&
            quizAttempt.status === "in_progress" &&
            !quizAttempt.submitted_at
        );

        if (activeAttempt) {
          await hydrateAttempt(activeAttempt.id);
        }
      } catch (err: any) {
        setError(err.message || "Gagal memuatkan maklumat kuiz.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, [quizId, router]);

  const handleStartQuiz = async () => {
    if (attempt && attempt.status === "in_progress" && !attempt.submitted_at) {
      setQuizState("attempting");
      return;
    }

    try {
      setProcessingState("Memulakan kuiz...");

      const startData = await quizApi.startAttempt(quizId);
      const attemptId = startData.quiz_attempt.id;

      await hydrateAttempt(attemptId);
    } catch (err: any) {
      alert(`Ralat: ${err.message || "Gagal memulakan kuiz."}`);
    } finally {
      setProcessingState("");
    }
  };

  const handleSaveAnswer = async (question: QuizQuestion) => {
    if (!attempt) return;

    try {
      setProcessingState(`Menyimpan jawapan soalan ${question.id}...`);

      const payload: { question_id: number; answer_option_id?: number; short_answer_text?: string } = {
        question_id: question.id,
      };

      if (question.question_type === "multiple_choice") {
        const selectedId = mcqAnswers[question.id];
        if (!selectedId) {
          throw new Error("Sila pilih jawapan terlebih dahulu.");
        }
        payload.answer_option_id = selectedId;
      } else {
        const text = shortAnswers[question.id];
        if (!text || !text.trim()) {
          throw new Error("Sila masukkan jawapan terlebih dahulu.");
        }
        payload.short_answer_text = text.trim();
      }

      await quizApi.submitAnswer(attempt.id, payload);
      alert("Jawapan berjaya disimpan.");
    } catch (err: any) {
      alert(`Ralat menyimpan: ${err.message}`);
    } finally {
      setProcessingState("");
    }
  };

  const handleSubmitQuiz = async () => {
    if (!attempt) return;

    const confirmSubmit = window.confirm(
      "Adakah anda pasti mahu menghantar kuiz ini? Pastikan semua soalan telah disimpan."
    );
    if (!confirmSubmit) return;

    try {
      setProcessingState("Menghantar kuiz...");
      const submitData = await quizApi.submitAttempt(attempt.id);
      setAttempt(submitData.quiz_attempt);
      setQuizState("submitted");
    } catch (err: any) {
      alert(`Ralat menghantar kuiz: ${err.message}`);
    } finally {
      setProcessingState("");
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600"></div>
        <p className="mt-4 text-sm uppercase tracking-widest text-slate-500">Memuatkan Sistem Kuiz...</p>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="mb-6 text-red-500">{error || "Kuiz tidak dijumpai"}</p>
          <button
            onClick={() => router.back()}
            className="rounded-lg bg-slate-900 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
          >
            Kembali
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24 font-sans text-slate-900">
      {processingState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-sm">
          <div className="flex items-center gap-4 rounded-xl bg-white px-6 py-4 shadow-lg">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600"></div>
            <p className="font-medium text-slate-700">{processingState}</p>
          </div>
        </div>
      )}

      <header className="mb-12 border-b border-slate-200 bg-white px-6 py-8">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">{quiz.title}</h1>
            <p className="mt-1 text-slate-500">Ujian Pemahaman Modul</p>
          </div>
          <button
            onClick={() => router.push(`/courses/${params.course_id}`)}
            className="rounded-lg border border-transparent px-4 py-2 text-sm font-medium text-slate-400 transition-colors hover:border-slate-200 hover:text-slate-900"
          >
            Batal & Kembali
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6">
        {quizState === "intro" && (
          <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-indigo-50 text-3xl text-indigo-600">
              Q
            </div>
            <h2 className="mb-6 text-2xl font-bold text-slate-800">Sedia untuk bermula?</h2>

            <div className="mb-10 flex flex-col justify-center gap-6 sm:flex-row">
              <div className="rounded-xl border border-slate-100 bg-slate-50 px-6 py-4">
                <p className="mb-1 text-sm text-slate-500">Masa Diperuntukkan</p>
                <p className="text-xl font-semibold text-slate-800">{quiz.time_limit_minutes ?? "-"} Minit</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 px-6 py-4">
                <p className="mb-1 text-sm text-slate-500">Markah Lulus</p>
                <p className="text-xl font-semibold text-slate-800">{quiz.passing_score ?? "-"}</p>
              </div>
            </div>

            <button
              onClick={handleStartQuiz}
              className="w-full rounded-xl bg-indigo-600 px-8 py-3.5 text-lg font-bold text-white transition-all hover:bg-indigo-700 hover:shadow-lg sm:w-auto"
            >
              Mulakan Kuiz Sekarang
            </button>
          </div>
        )}

        {quizState === "attempting" && attempt && (
          <div className="space-y-8">
            <div className="sticky top-4 z-10 flex items-center justify-between rounded-xl border border-indigo-100 bg-indigo-50 p-4 shadow-sm">
              <span className="font-semibold text-indigo-900">ID Percubaan: #{attempt.id}</span>
              <button
                onClick={handleSubmitQuiz}
                className="rounded-lg bg-indigo-600 px-6 py-2 font-bold text-white transition-colors hover:bg-indigo-700"
              >
                Hantar Kuiz
              </button>
            </div>

            {questions.map((question, index) => (
              <div key={question.id} className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                <div className="mb-6 flex items-start gap-4">
                  <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-600">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="text-lg font-medium leading-snug text-slate-900">{question.question_text}</h3>
                    <span className="mt-2 block text-xs font-medium uppercase tracking-wider text-slate-400">
                      {question.points} Markah |{" "}
                      {question.question_type === "multiple_choice" ? "Objektif" : "Subjektif"}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 pl-12">
                  {question.question_type === "multiple_choice" && question.options && (
                    <div className="space-y-3">
                      {question.options.map((option) => (
                        <label
                          key={option.id}
                          className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-all ${
                            mcqAnswers[question.id] === option.id
                              ? "border-indigo-500 bg-indigo-50 shadow-sm"
                              : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          <input
                            type="radio"
                            name={`question_${question.id}`}
                            value={option.id}
                            checked={mcqAnswers[question.id] === option.id}
                            onChange={() => setMcqAnswers({ ...mcqAnswers, [question.id]: option.id })}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span
                            className={
                              mcqAnswers[question.id] === option.id
                                ? "font-medium text-indigo-900"
                                : "text-slate-700"
                            }
                          >
                            {option.option_text}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}

                  {question.question_type === "short_answer" && (
                    <textarea
                      rows={3}
                      placeholder="Taip jawapan anda di sini..."
                      value={shortAnswers[question.id] || ""}
                      onChange={(event) =>
                        setShortAnswers({ ...shortAnswers, [question.id]: event.target.value })
                      }
                      className="w-full rounded-xl border border-slate-300 p-4 text-slate-800 outline-none transition-shadow focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  )}

                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={() => handleSaveAnswer(question)}
                      className="rounded-lg border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50"
                    >
                      Simpan Jawapan Ini
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {quizState === "submitted" && attempt && (
          <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-indigo-100 text-4xl text-indigo-600">
              !
            </div>
            <h2 className="mb-3 text-3xl font-extrabold text-slate-900">Kuiz Telah Dihantar</h2>
            <p className="mb-3 text-lg text-slate-500">
              Percubaan anda telah berjaya dihantar dan sedang menunggu proses grading.
            </p>
            <p className="mb-10 text-sm text-slate-400">
              Status semasa: {attempt.status}
              {attempt.submitted_at
                ? ` | Dihantar pada ${new Date(attempt.submitted_at).toLocaleString("ms-MY")}`
                : ""}
            </p>

            <button
              onClick={() => router.push(`/courses/${params.course_id}`)}
              className="rounded-xl bg-slate-900 px-8 py-3.5 font-bold text-white transition-colors hover:bg-slate-800"
            >
              Kembali ke Modul Kursus
            </button>
          </div>
        )}

        {quizState === "results" && results && (
          <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-indigo-100 text-4xl text-indigo-600">
              R
            </div>
            <h2 className="mb-2 text-3xl font-extrabold text-slate-900">Keputusan Kuiz</h2>
            <p className="mb-8 text-lg text-slate-500">
              Markah keseluruhan anda: {results.total_score ?? 0}
            </p>

            <div className="mb-10 flex justify-center gap-12 rounded-2xl border border-slate-100 bg-slate-50 p-6">
              <div className="text-center">
                <p className="mb-1 text-sm font-semibold uppercase tracking-wider text-slate-500">
                  Jawapan Betul
                </p>
                <p className="text-2xl font-bold text-slate-900">{results.correct_answers}</p>
              </div>
              <div className="w-px bg-slate-200"></div>
              <div className="text-center">
                <p className="mb-1 text-sm font-semibold uppercase tracking-wider text-slate-500">
                  Jawapan Salah
                </p>
                <p className="text-2xl font-bold text-slate-900">{results.incorrect_answers}</p>
              </div>
            </div>

            <button
              onClick={() => router.push(`/courses/${params.course_id}`)}
              className="rounded-xl bg-slate-900 px-8 py-3.5 font-bold text-white transition-colors hover:bg-slate-800"
            >
              Kembali ke Modul Kursus
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
