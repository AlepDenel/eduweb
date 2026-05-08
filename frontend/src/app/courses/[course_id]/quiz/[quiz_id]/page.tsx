"use client";

import { useEffect, useState, useCallback } from "react";
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
import AppModal from "@/components/AppModal";
import Toast from "@/components/Toast";

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

  // Confirm modal for quiz submission
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Toast for save-answer feedback
  const [toast, setToast] = useState({ visible: false, message: "", type: "success" as "success" | "error" | "info" });
  const showToast = (message: string, type: "success" | "error" | "info" = "success") =>
    setToast({ visible: true, message, type });
  const dismissToast = useCallback(() => setToast((t) => ({ ...t, visible: false })), []);

  const loadQuizQuestions = async () => {
    const questionsData = await quizApi.getQuestions(quizId);
    return Promise.all(
      questionsData.questions.map(async (question) => {
        if (question.question_type !== "multiple_choice") return question;
        const optionsData = await quizApi.getAnswerOptions(question.id);
        return { ...question, options: optionsData.answer_options };
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
      if (savedAnswer.answer_option_id !== null) nextMcqAnswers[savedAnswer.question_id] = savedAnswer.answer_option_id;
      if (savedAnswer.short_answer_text) nextShortAnswers[savedAnswer.question_id] = savedAnswer.short_answer_text;
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
        if (!session.authenticated) { router.push("/login"); return; }

        const [quizData, attemptsData] = await Promise.all([
          quizApi.getQuiz(quizId),
          api.get<QuizAttemptsResponse>(`/quizzes/${quizId}/attempts`),
        ]);
        setQuiz(quizData.quiz);

        const activeAttempt = attemptsData.quiz_attempts.find(
          (a) => a.user_id === session.user?.id && a.status === "in_progress" && !a.submitted_at
        );
        if (activeAttempt) await hydrateAttempt(activeAttempt.id);
      } catch (err: any) {
        setError(err.message || "Failed to load quiz.");
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
      setProcessingState("Starting quiz…");
      const startData = await quizApi.startAttempt(quizId);
      await hydrateAttempt(startData.quiz_attempt.id);
    } catch (err: any) {
      showToast(err.message || "Failed to start quiz.", "error");
    } finally {
      setProcessingState("");
    }
  };

  const handleSaveAnswer = async (question: QuizQuestion) => {
    if (!attempt) return;
    try {
      setProcessingState(`Saving answer for question ${question.id}…`);
      const payload: { question_id: number; answer_option_id?: number; short_answer_text?: string } = {
        question_id: question.id,
      };
      if (question.question_type === "multiple_choice") {
        const selectedId = mcqAnswers[question.id];
        if (!selectedId) { showToast("Please select an answer first.", "error"); return; }
        payload.answer_option_id = selectedId;
      } else {
        const text = shortAnswers[question.id];
        if (!text || !text.trim()) { showToast("Please enter an answer first.", "error"); return; }
        payload.short_answer_text = text.trim();
      }
      await quizApi.submitAnswer(attempt.id, payload);
      showToast("Answer saved.", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to save answer.", "error");
    } finally {
      setProcessingState("");
    }
  };

  // Called when user clicks "Submit Quiz" — opens confirmation modal
  const handleSubmitClick = () => setSubmitModalOpen(true);

  // Called when user confirms submission in the modal
  const handleSubmitConfirm = async () => {
    if (!attempt) return;
    try {
      setIsSubmitting(true);
      const submitData = await quizApi.submitAttempt(attempt.id);
      setAttempt(submitData.quiz_attempt);
      setSubmitModalOpen(false);
      setQuizState("submitted");
    } catch (err: any) {
      setSubmitModalOpen(false);
      showToast(err.message || "Failed to submit quiz.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
        <p className="mt-4 text-sm text-slate-500 font-medium">Loading quiz…</p>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="mb-6 text-red-600 text-sm">{error || "Quiz not found."}</p>
          <button onClick={() => router.back()} className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <Toast message={toast.message} type={toast.type} visible={toast.visible} onDismiss={dismissToast} />

      {/* Submit Confirmation Modal */}
      <AppModal
        isOpen={submitModalOpen}
        variant="info"
        title="Submit Quiz?"
        message="Make sure all answers have been saved before submitting. This action cannot be undone."
        confirmLabel="Submit Quiz"
        cancelLabel="Cancel"
        isProcessing={isSubmitting}
        onConfirm={handleSubmitConfirm}
        onClose={() => setSubmitModalOpen(false)}
      />

      {/* Processing Overlay */}
      {processingState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-sm">
          <div className="flex items-center gap-4 rounded-2xl bg-white px-6 py-4 shadow-lg border border-slate-200">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
            <p className="text-sm font-medium text-slate-700">{processingState}</p>
          </div>
        </div>
      )}

      {/* Quiz Header */}
      <header className="border-b border-slate-200 bg-white px-6 py-6">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{quiz.title}</h1>
            <p className="mt-1 text-sm text-slate-500">Module Assessment</p>
          </div>
          <button
            onClick={() => router.push(`/courses/${params.course_id}`)}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-800"
          >
            ← Back to Course
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 mt-10">

        {/* Intro */}
        {quizState === "intro" && (
          <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-2xl text-blue-600 font-bold">Q</div>
            <h2 className="mb-2 text-xl font-bold text-slate-900">Ready to begin?</h2>
            <p className="text-sm text-slate-500 mb-8">Review the quiz details below before starting.</p>
            <div className="mb-8 flex flex-col justify-center gap-4 sm:flex-row">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-6 py-4 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Time Limit</p>
                <p className="text-lg font-bold text-slate-900">{quiz.time_limit_minutes ?? "—"} min</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-6 py-4 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Passing Score</p>
                <p className="text-lg font-bold text-slate-900">{quiz.passing_score ?? "—"}</p>
              </div>
            </div>
            <button onClick={handleStartQuiz} className="w-full rounded-xl bg-blue-600 px-8 py-3 text-base font-bold text-white transition-colors hover:bg-blue-700 sm:w-auto">
              Start Quiz
            </button>
          </div>
        )}

        {/* Attempting */}
        {quizState === "attempting" && attempt && (
          <div className="space-y-6">
            <div className="sticky top-[64px] z-10 flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50 px-5 py-3 shadow-sm">
              <span className="text-sm font-semibold text-blue-900">Attempt #{attempt.id}</span>
              <button onClick={handleSubmitClick} className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-blue-700">
                Submit Quiz
              </button>
            </div>

            {questions.map((question, index) => (
              <div key={question.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-start gap-4">
                  <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">{index + 1}</span>
                  <div>
                    <h3 className="text-base font-semibold leading-snug text-slate-900">{question.question_text}</h3>
                    <span className="mt-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">
                      {question.points} pts · {question.question_type === "multiple_choice" ? "Multiple Choice" : "Short Answer"}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 pl-11">
                  {question.question_type === "multiple_choice" && question.options && (
                    <div className="space-y-2">
                      {question.options.map((option) => (
                        <label
                          key={option.id}
                          className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-all ${
                            mcqAnswers[question.id] === option.id
                              ? "border-blue-500 bg-blue-50"
                              : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          <input
                            type="radio"
                            name={`question_${question.id}`}
                            value={option.id}
                            checked={mcqAnswers[question.id] === option.id}
                            onChange={() => setMcqAnswers({ ...mcqAnswers, [question.id]: option.id })}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                          />
                          <span className={mcqAnswers[question.id] === option.id ? "font-medium text-blue-900" : "text-slate-700"}>
                            {option.option_text}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}

                  {question.question_type === "short_answer" && (
                    <textarea
                      rows={3}
                      placeholder="Type your answer here…"
                      value={shortAnswers[question.id] || ""}
                      onChange={(e) => setShortAnswers({ ...shortAnswers, [question.id]: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 p-4 text-sm text-slate-800 outline-none transition-shadow focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  )}

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => handleSaveAnswer(question)}
                      className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50"
                    >
                      Save This Answer
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Submitted */}
        {quizState === "submitted" && attempt && (
          <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-2xl text-green-600">✓</div>
            <h2 className="mb-2 text-xl font-bold text-slate-900">Quiz Submitted</h2>
            <p className="mb-2 text-sm text-slate-500">Your attempt has been submitted and is awaiting grading.</p>
            <p className="mb-8 text-xs text-slate-400">
              Status: {attempt.status}
              {attempt.submitted_at ? ` · Submitted ${new Date(attempt.submitted_at).toLocaleString("ms-MY")}` : ""}
            </p>
            <button onClick={() => router.push(`/courses/${params.course_id}`)} className="rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-slate-800">
              Back to Course
            </button>
          </div>
        )}

        {/* Results */}
        {quizState === "results" && results && (
          <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-2xl text-blue-600 font-bold">R</div>
            <h2 className="mb-1 text-xl font-bold text-slate-900">Quiz Results</h2>
            <p className="mb-8 text-slate-500 text-sm">
              Total score: <span className="font-bold text-slate-900">{results.total_score ?? 0}</span>
            </p>
            <div className="mb-8 flex justify-center gap-10 rounded-2xl border border-slate-100 bg-slate-50 px-6 py-5">
              <div className="text-center">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Correct</p>
                <p className="text-2xl font-bold text-green-700">{results.correct_answers}</p>
              </div>
              <div className="w-px bg-slate-200" />
              <div className="text-center">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Incorrect</p>
                <p className="text-2xl font-bold text-red-600">{results.incorrect_answers}</p>
              </div>
            </div>
            <button onClick={() => router.push(`/courses/${params.course_id}`)} className="rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-slate-800">
              Back to Course
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
