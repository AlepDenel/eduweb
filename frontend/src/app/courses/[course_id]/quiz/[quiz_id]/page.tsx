"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, quizApi, Quiz, QuizAttempt, Question, QuizResult } from "@/lib/api";

type QuizState = 'intro' | 'attempting' | 'results';

export default function QuizPage({ params }: { params: { course_id: string; quiz_id: string } }) {
  const router = useRouter();
  const quiz_id = params.quiz_id;

  const [quizState, setQuizState] = useState<QuizState>('intro');
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [results, setResults] = useState<QuizResult | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingState, setProcessingState] = useState("");

  // Answers State: Record<question_id, value>
  const [mcqAnswers, setMcqAnswers] = useState<Record<number, number>>({});
  const [shortAnswers, setShortAnswers] = useState<Record<number, string>>({});

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const session = await auth.me();
        if (!session.authenticated) {
          router.push("/login");
          return;
        }

        const data = await quizApi.getQuiz(quiz_id);
        setQuiz(data.quiz);
      } catch (err: any) {
        setError(err.message || "Gagal memuatkan maklumat kuiz.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, [quiz_id, router]);

  const handleStartQuiz = async () => {
    try {
      setProcessingState("Memulakan kuiz...");
      const startData = await quizApi.startAttempt(quiz_id);
      const attempt_id = startData.attempt_id;

      const attemptData = await quizApi.getAttempt(attempt_id);
      setAttempt(attemptData.attempt);
      setQuestions(attemptData.questions || []);
      setQuizState('attempting');
    } catch (err: any) {
      alert(\`Ralat: \${err.message || "Gagal memulakan kuiz."}\`);
    } finally {
      setProcessingState("");
    }
  };

  const handleSaveAnswer = async (question: Question) => {
    if (!attempt) return;
    
    try {
      setProcessingState(\`Menyimpan jawapan soalan \${question.id}...\`);
      
      const payload: any = { question_id: question.id };
      
      if (question.question_type === 'multiple_choice') {
        const selectedId = mcqAnswers[question.id];
        if (!selectedId) throw new Error("Sila pilih jawapan terlebih dahulu.");
        payload.answer_option_id = selectedId;
      } else {
        const text = shortAnswers[question.id];
        if (!text || !text.trim()) throw new Error("Sila masukkan jawapan terlebih dahulu.");
        payload.short_answer_text = text.trim();
      }

      await quizApi.submitAnswer(attempt.id, payload);
      alert("Jawapan berjaya disimpan.");
    } catch (err: any) {
      alert(\`Ralat menyimpan: \${err.message}\`);
    } finally {
      setProcessingState("");
    }
  };

  const handleSubmitQuiz = async () => {
    if (!attempt) return;
    
    const confirmSubmit = window.confirm("Adakah anda pasti mahu menghantar kuiz ini? Pastikan semua soalan telah disimpan.");
    if (!confirmSubmit) return;

    try {
      setProcessingState("Menghantar kuiz...");
      await quizApi.submitAttempt(attempt.id);
      
      const resultData = await quizApi.getResults(attempt.id);
      setResults(resultData.result);
      setQuizState('results');
    } catch (err: any) {
      alert(\`Ralat menghantar kuiz: \${err.message}\`);
    } finally {
      setProcessingState("");
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <div className="w-10 h-10 border-2 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-500 text-sm tracking-widest uppercase">Memuatkan Sistem Kuiz...</p>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center max-w-lg w-full">
          <p className="text-red-500 mb-6">{error || "Kuiz tidak dijumpai"}</p>
          <button 
            onClick={() => router.back()}
            className="px-6 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
          >
            Kembali
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-24">
      {/* Processing Overlay */}
      {processingState && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-4">
            <div className="w-5 h-5 border-2 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="text-slate-700 font-medium">{processingState}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-slate-200 py-8 px-6 mb-12">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">{quiz.title}</h1>
            <p className="text-slate-500 mt-1">Ujian Pemahaman Modul</p>
          </div>
          <button 
            onClick={() => router.push(\`/courses/\${params.course_id}\`)}
            className="text-slate-400 hover:text-slate-900 transition-colors text-sm font-medium px-4 py-2 rounded-lg border border-transparent hover:border-slate-200"
          >
            Batal & Kembali
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6">
        {quizState === 'intro' && (
          <div className="bg-white p-10 rounded-3xl shadow-sm border border-slate-200 text-center max-w-2xl mx-auto">
            <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-6">
              📝
            </div>
            <h2 className="text-2xl font-bold mb-6 text-slate-800">Sedia untuk bermula?</h2>
            
            <div className="flex flex-col sm:flex-row justify-center gap-6 mb-10">
              <div className="bg-slate-50 px-6 py-4 rounded-xl border border-slate-100">
                <p className="text-sm text-slate-500 mb-1">Masa Diperuntukkan</p>
                <p className="text-xl font-semibold text-slate-800">{quiz.time_limit_minutes} Minit</p>
              </div>
              <div className="bg-slate-50 px-6 py-4 rounded-xl border border-slate-100">
                <p className="text-sm text-slate-500 mb-1">Markah Lulus</p>
                <p className="text-xl font-semibold text-slate-800">{quiz.passing_score}%</p>
              </div>
            </div>

            <button
              onClick={handleStartQuiz}
              className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 text-white rounded-xl font-bold text-lg hover:bg-indigo-700 hover:shadow-lg transition-all"
            >
              Mulakan Kuiz Sekarang
            </button>
          </div>
        )}

        {quizState === 'attempting' && attempt && (
          <div className="space-y-8">
            <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex justify-between items-center sticky top-4 z-10 shadow-sm">
              <span className="font-semibold text-indigo-900">ID Percubaan: #{attempt.id}</span>
              <button
                onClick={handleSubmitQuiz}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors shadow-sm"
              >
                Hantar Kuiz (Submit)
              </button>
            </div>

            {questions.map((q, index) => (
              <div key={q.id} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-start gap-4 mb-6">
                  <span className="flex-shrink-0 w-8 h-8 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center font-bold text-sm">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="text-lg font-medium text-slate-900 leading-snug">{q.question_text}</h3>
                    <span className="text-xs text-slate-400 font-medium uppercase tracking-wider mt-2 block">
                      {q.points} Markah • {q.question_type === 'multiple_choice' ? 'Objektif' : 'Subjektif'}
                    </span>
                  </div>
                </div>

                <div className="pl-12">
                  {q.question_type === 'multiple_choice' && q.options && (
                    <div className="space-y-3">
                      {q.options.map((opt) => (
                        <label 
                          key={opt.id} 
                          className={\`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all \${
                            mcqAnswers[q.id] === opt.id 
                              ? "border-indigo-500 bg-indigo-50 shadow-sm" 
                              : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                          }\`}
                        >
                          <input 
                            type="radio" 
                            name={\`question_\${q.id}\`}
                            value={opt.id}
                            checked={mcqAnswers[q.id] === opt.id}
                            onChange={() => setMcqAnswers({ ...mcqAnswers, [q.id]: opt.id })}
                            className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className={\`\${mcqAnswers[q.id] === opt.id ? "text-indigo-900 font-medium" : "text-slate-700"}\`}>
                            {opt.option_text}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}

                  {q.question_type === 'short_answer' && (
                    <textarea
                      rows={3}
                      placeholder="Taip jawapan anda di sini..."
                      value={shortAnswers[q.id] || ""}
                      onChange={(e) => setShortAnswers({ ...shortAnswers, [q.id]: e.target.value })}
                      className="w-full p-4 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-shadow text-slate-800"
                    />
                  )}

                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={() => handleSaveAnswer(q)}
                      className="px-5 py-2 rounded-lg text-sm font-semibold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm"
                    >
                      Simpan Jawapan Ini
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {quizState === 'results' && results && (
          <div className="bg-white p-12 rounded-3xl shadow-sm border border-slate-200 text-center max-w-2xl mx-auto">
            <div className="mb-6">
              {results.passed ? (
                <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-4xl mx-auto">
                  🏆
                </div>
              ) : (
                <div className="w-24 h-24 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-4xl mx-auto">
                  📚
                </div>
              )}
            </div>
            
            <h2 className="text-3xl font-extrabold mb-2 text-slate-900">
              {results.passed ? "Tahniah! Anda Lulus" : "Sila Cuba Lagi"}
            </h2>
            <p className="text-slate-500 mb-8 text-lg">
              Anda berjaya memperoleh {results.score}% markah keseluruhan.
            </p>

            <div className="bg-slate-50 rounded-2xl p-6 flex justify-center gap-12 mb-10 border border-slate-100">
              <div className="text-center">
                <p className="text-slate-500 text-sm mb-1 uppercase tracking-wider font-semibold">Markah Dikumpul</p>
                <p className="text-2xl font-bold text-slate-900">{results.earned_points}</p>
              </div>
              <div className="w-px bg-slate-200"></div>
              <div className="text-center">
                <p className="text-slate-500 text-sm mb-1 uppercase tracking-wider font-semibold">Markah Penuh</p>
                <p className="text-2xl font-bold text-slate-900">{results.total_points}</p>
              </div>
            </div>

            <button
              onClick={() => router.push(\`/courses/\${params.course_id}\`)}
              className="px-8 py-3.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-md hover:shadow-lg"
            >
              Kembali ke Modul Kursus
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
