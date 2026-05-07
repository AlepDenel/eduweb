"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, ModerationForumReport, moderationApi } from "@/lib/api";

type AllowedRole = "Moderator" | "Admin";
const REQUEST_TIMEOUT_MS = 8000;

function withTimeout<T>(promise: Promise<T>, message: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(message)), REQUEST_TIMEOUT_MS);
    }),
  ]);
}

export default function ModerationReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<ModerationForumReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [role, setRole] = useState<AllowedRole | null>(null);

  const fetchReports = async () => {
    setIsLoading(true);
    setError("");

    try {
      const session = await withTimeout(auth.me(), "Moderation request timed out.");
      if (!session.authenticated) {
        router.push("/login");
        return;
      }

      const currentRole = session.user?.role;
      if (currentRole !== "Moderator" && currentRole !== "Admin") {
        setHasAccess(false);
        setRole(null);
        setReports([]);
        return;
      }

      setHasAccess(true);
      setRole(currentRole);

      const data = await withTimeout(
        moderationApi.getReports(),
        "Moderation reports request timed out."
      );
      setReports(data.forum_reports || []);
    } catch (err: any) {
      if (err.message === "You must log in before using this route.") {
        router.push("/login");
      } else if (
        typeof err.message === "string" &&
        err.message.includes("This route requires one of these roles:")
      ) {
        setHasAccess(false);
        setRole(null);
        setReports([]);
      } else {
        setError(err.message || "Failed to load moderation reports.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [router]);

  const handleHide = async (postId: number) => {
    setFeedback("");
    try {
      setActiveAction(`hide-${postId}`);
      const response = await moderationApi.hidePost(postId);
      setFeedback(response.message || "Post berjaya disembunyikan.");
      await fetchReports();
    } catch (err: any) {
      setFeedback(err.message || "Gagal menyembunyikan post.");
    } finally {
      setActiveAction(null);
    }
  };

  const handleUnhide = async (postId: number) => {
    setFeedback("");
    try {
      setActiveAction(`unhide-${postId}`);
      const response = await moderationApi.unhidePost(postId);
      setFeedback(response.message || "Post berjaya dipaparkan semula.");
      await fetchReports();
    } catch (err: any) {
      setFeedback(err.message || "Gagal memaparkan semula post.");
    } finally {
      setActiveAction(null);
    }
  };

  const handleRemove = async (postId: number) => {
    setFeedback("");

    if (!window.confirm("Padam post ini melalui moderation? Tindakan ini tidak boleh dibatalkan.")) {
      return;
    }

    try {
      setActiveAction(`remove-${postId}`);
      const response = await moderationApi.removePost(postId);
      setFeedback(response.message || "Post berjaya dipadam.");
      await fetchReports();
    } catch (err: any) {
      setFeedback(err.message || "Gagal memadam post.");
    } finally {
      setActiveAction(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-stone-50">
        <div className="w-10 h-10 border-2 border-stone-200 border-t-stone-800 rounded-full animate-spin"></div>
        <p className="mt-4 text-stone-500 font-medium text-sm tracking-widest uppercase">
          Memuatkan Moderasi...
        </p>
      </div>
    );
  }

  if (hasAccess === false) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-200 text-center max-w-xl w-full">
          <p className="text-red-600 mb-3 font-medium">Akses ditolak.</p>
          <p className="text-stone-500 mb-6">
            Halaman ini hanya untuk Moderator atau Admin.
          </p>
          <button
            onClick={() => router.push("/forum")}
            className="px-6 py-2.5 bg-stone-900 text-white rounded-lg text-sm font-medium hover:bg-stone-800 transition-colors"
          >
            Kembali ke Forum
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 font-sans text-stone-900 pb-24">
      <header className="bg-white border-b border-stone-200 pt-16 pb-12 px-6">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl font-semibold tracking-tight text-stone-900 mb-3">
            Semakan Laporan Forum
          </h1>
          <p className="text-stone-500 leading-relaxed font-light text-lg">
            Halaman moderation minimum untuk menyemak laporan post dan menjalankan tindakan asas.
          </p>
          {role && (
            <p className="mt-4 text-sm text-stone-400">Peranan aktif: {role}</p>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 mt-12 space-y-8">
        {error && (
          <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl">
            {error}
          </div>
        )}

        {feedback && (
          <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl">
            {feedback}
          </div>
        )}

        {reports.length === 0 ? (
          <section className="bg-white p-8 rounded-2xl shadow-sm border border-stone-200 text-center">
            <h2 className="text-xl font-medium text-stone-800 mb-2">Tiada laporan aktif</h2>
            <p className="text-stone-500">
              Tiada laporan forum untuk disemak pada masa ini.
            </p>
          </section>
        ) : (
          <section className="space-y-5">
            {reports.map((report) => (
              <article
                key={report.id}
                className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap mb-5">
                  <div>
                    <h2 className="text-lg font-medium text-stone-900">
                      Laporan #{report.id}
                    </h2>
                    <p className="text-sm text-stone-400 mt-1">
                      Thread #{report.thread_id} • Post #{report.post_id}
                    </p>
                  </div>
                  <time
                    dateTime={report.created_at}
                    className="text-sm text-stone-400"
                  >
                    {new Date(report.created_at).toLocaleDateString("ms-MY", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </time>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="bg-stone-50 border border-stone-200 rounded-xl p-4">
                    <p className="text-xs uppercase tracking-widest text-stone-400 mb-2">
                      Kandungan Post
                    </p>
                    <p className="text-stone-700 whitespace-pre-wrap leading-relaxed">
                      {report.post_content}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-stone-50 border border-stone-200 rounded-xl p-4">
                      <p className="text-xs uppercase tracking-widest text-stone-400 mb-2">
                        Sebab Laporan
                      </p>
                      <p className="text-stone-700 whitespace-pre-wrap leading-relaxed">
                        {report.reason}
                      </p>
                    </div>

                    <div className="bg-stone-50 border border-stone-200 rounded-xl p-4">
                      <p className="text-xs uppercase tracking-widest text-stone-400 mb-2">
                        Metadata
                      </p>
                      <div className="space-y-1 text-sm text-stone-600">
                        <p>Report ID: {report.id}</p>
                        <p>Thread ID: {report.thread_id}</p>
                        <p>Post ID: {report.post_id}</p>
                        <p>Reporting User ID: {report.reporting_user_id}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-stone-100 flex gap-3 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleHide(report.post_id)}
                    disabled={activeAction === `hide-${report.post_id}`}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeAction === `hide-${report.post_id}`
                        ? "bg-stone-200 text-stone-500 cursor-not-allowed"
                        : "bg-stone-900 text-white hover:bg-stone-800"
                    }`}
                  >
                    {activeAction === `hide-${report.post_id}` ? "Memproses..." : "Hide Post"}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleUnhide(report.post_id)}
                    disabled={activeAction === `unhide-${report.post_id}`}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeAction === `unhide-${report.post_id}`
                        ? "bg-stone-200 text-stone-500 cursor-not-allowed"
                        : "bg-white text-stone-700 border border-stone-300 hover:bg-stone-50"
                    }`}
                  >
                    {activeAction === `unhide-${report.post_id}` ? "Memproses..." : "Unhide Post"}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRemove(report.post_id)}
                    disabled={activeAction === `remove-${report.post_id}`}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeAction === `remove-${report.post_id}`
                        ? "bg-red-100 text-red-400 cursor-not-allowed"
                        : "bg-red-600 text-white hover:bg-red-500"
                    }`}
                  >
                    {activeAction === `remove-${report.post_id}` ? "Memproses..." : "Remove Post"}
                  </button>
                </div>
              </article>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
