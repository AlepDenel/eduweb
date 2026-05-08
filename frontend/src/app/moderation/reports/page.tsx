"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { auth, ModerationForumReport, moderationApi } from "@/lib/api";
import AppModal from "@/components/AppModal";

type AllowedRole = "Moderator" | "Admin";
const REQUEST_TIMEOUT_MS = 8000;

function withTimeout<T>(promise: Promise<T>, message: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => { setTimeout(() => reject(new Error(message)), REQUEST_TIMEOUT_MS); }),
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

  // Confirm modal state for destructive remove action
  const [removeModal, setRemoveModal] = useState<{ isOpen: boolean; postId: number | null }>({ isOpen: false, postId: null });
  const [isRemoving, setIsRemoving] = useState(false);

  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const session = await withTimeout(auth.me(), "Moderation request timed out.");
      if (!session.authenticated) { router.push("/login"); return; }

      const currentRole = session.user?.role;
      if (currentRole !== "Moderator" && currentRole !== "Admin") {
        setHasAccess(false);
        setRole(null);
        setReports([]);
        return;
      }
      setHasAccess(true);
      setRole(currentRole);

      const data = await withTimeout(moderationApi.getReports(), "Moderation reports request timed out.");
      setReports(data.forum_reports || []);
    } catch (err: any) {
      if (err.message === "You must log in before using this route.") {
        router.push("/login");
      } else if (typeof err.message === "string" && err.message.includes("This route requires one of these roles:")) {
        setHasAccess(false);
        setRole(null);
        setReports([]);
      } else {
        setError(err.message || "Failed to load moderation reports.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const handleHide = async (postId: number) => {
    setFeedback("");
    try {
      setActiveAction(`hide-${postId}`);
      const response = await moderationApi.hidePost(postId);
      setFeedback(response.message || "Post hidden successfully.");
      await fetchReports();
    } catch (err: any) {
      setFeedback(err.message || "Failed to hide post.");
    } finally {
      setActiveAction(null);
    }
  };

  const handleUnhide = async (postId: number) => {
    setFeedback("");
    try {
      setActiveAction(`unhide-${postId}`);
      const response = await moderationApi.unhidePost(postId);
      setFeedback(response.message || "Post restored successfully.");
      await fetchReports();
    } catch (err: any) {
      setFeedback(err.message || "Failed to restore post.");
    } finally {
      setActiveAction(null);
    }
  };

  // Opens the confirmation modal
  const handleRemoveClick = (postId: number) => setRemoveModal({ isOpen: true, postId });

  // Executes removal after modal confirmation
  const handleRemoveConfirm = async () => {
    if (!removeModal.postId) return;
    const postId = removeModal.postId;
    setFeedback("");
    try {
      setIsRemoving(true);
      const response = await moderationApi.removePost(postId);
      setRemoveModal({ isOpen: false, postId: null });
      setFeedback(response.message || "Post removed successfully.");
      await fetchReports();
    } catch (err: any) {
      setRemoveModal({ isOpen: false, postId: null });
      setFeedback(err.message || "Failed to remove post.");
    } finally {
      setIsRemoving(false);
      setActiveAction(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <div className="w-10 h-10 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
        <p className="mt-4 text-slate-500 text-sm font-medium">Loading moderation panel…</p>
      </div>
    );
  }

  if (hasAccess === false) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center max-w-xl w-full">
          <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-xl">🔒</span>
          </div>
          <h2 className="text-base font-bold text-slate-900 mb-2">Access Denied</h2>
          <p className="text-sm text-slate-500 mb-6">This page is restricted to Moderators and Admins only.</p>
          <button onClick={() => router.push("/forum")} className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-colors">
            Back to Forum
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">

      {/* Destructive Remove Confirmation Modal */}
      <AppModal
        isOpen={removeModal.isOpen}
        variant="danger"
        title="Remove Post Permanently?"
        message="This will permanently remove the post via moderation. This action cannot be undone."
        confirmLabel="Remove Post"
        cancelLabel="Cancel"
        isProcessing={isRemoving}
        onConfirm={handleRemoveConfirm}
        onClose={() => setRemoveModal({ isOpen: false, postId: null })}
      />

      {/* Page Header */}
      <header className="bg-white border-b border-slate-200 px-6 pt-10 pb-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-1.5">Forum Report Review</h1>
          <p className="text-slate-500 text-sm leading-relaxed">Review reported posts and take appropriate moderation actions.</p>
          {role && (
            <span className="inline-block mt-3 px-2.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-xs font-semibold uppercase tracking-wide">{role}</span>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 mt-8 space-y-6">
        {error && (
          <div role="alert" className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-2xl text-sm">{error}</div>
        )}

        {feedback && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-5 py-4 rounded-2xl text-sm">{feedback}</div>
        )}

        {reports.length === 0 && !error ? (
          <section className="bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-sm">
            <p className="text-2xl mb-3">✅</p>
            <h2 className="text-base font-semibold text-slate-900 mb-1">No Active Reports</h2>
            <p className="text-sm text-slate-500">No forum reports to review at this time.</p>
          </section>
        ) : (
          <section className="space-y-5">
            {reports.map((report) => (
              <article key={report.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4 flex-wrap mb-5">
                  <div>
                    <h2 className="text-base font-semibold text-slate-900">Report #{report.id}</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Thread #{report.thread_id} · Post #{report.post_id}</p>
                  </div>
                  <time dateTime={report.created_at} className="text-xs text-slate-400">
                    {new Date(report.created_at).toLocaleDateString("ms-MY", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </time>
                </div>

                <div className="grid gap-4 md:grid-cols-2 mb-5">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Post Content</p>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{report.post_content}</p>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Report Reason</p>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{report.reason}</p>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Metadata</p>
                      <div className="space-y-1 text-xs text-slate-600">
                        <p>Report ID: {report.id}</p>
                        <p>Thread ID: {report.thread_id}</p>
                        <p>Post ID: {report.post_id}</p>
                        <p>Reported by User: {report.reporting_user_id}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex gap-3 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleHide(report.post_id)}
                    disabled={activeAction === `hide-${report.post_id}`}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-150 ${
                      activeAction === `hide-${report.post_id}` ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-slate-900 text-white hover:bg-slate-800"
                    }`}
                  >
                    {activeAction === `hide-${report.post_id}` ? "Processing…" : "Hide Post"}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleUnhide(report.post_id)}
                    disabled={activeAction === `unhide-${report.post_id}`}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-150 border ${
                      activeAction === `unhide-${report.post_id}` ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed" : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:border-slate-400"
                    }`}
                  >
                    {activeAction === `unhide-${report.post_id}` ? "Processing…" : "Unhide Post"}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRemoveClick(report.post_id)}
                    disabled={isRemoving}
                    className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-150 bg-red-600 text-white hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    Remove Post
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
