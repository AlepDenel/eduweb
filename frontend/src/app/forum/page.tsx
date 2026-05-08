"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { auth, forum, ForumThread } from "@/lib/api";
import Toast from "@/components/Toast";

export default function ForumPage() {
  const router = useRouter();
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // New Thread Form State
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [formError, setFormError] = useState("");

  // Toast
  const [toast, setToast] = useState({ visible: false, message: "", type: "success" as "success" | "error" | "info" });
  const showToast = (message: string, type: "success" | "error" | "info" = "success") =>
    setToast({ visible: true, message, type });
  const dismissToast = useCallback(() => setToast((t) => ({ ...t, visible: false })), []);

  const fetchThreads = async () => {
    setIsLoading(true);
    try {
      const session = await auth.me();
      if (!session.authenticated) {
        router.push("/login");
        return;
      }
      const data = await forum.getThreads();
      const sorted = (data.forum_threads || []).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setThreads(sorted);
    } catch (err: any) {
      if (err.message === "You must log in before using this route.") {
        router.push("/login");
      } else {
        setError(err.message || "Failed to load forum discussions.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchThreads();
  }, [router]);

  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!newTitle.trim() || !newContent.trim()) {
      setFormError("Please enter both a title and content to start a discussion.");
      return;
    }

    try {
      setIsCreating(true);
      await forum.createThread({ title: newTitle.trim(), content: newContent.trim() });
      setNewTitle("");
      setNewContent("");
      await fetchThreads();
      showToast("Discussion posted successfully!", "success");
    } catch (err: any) {
      setFormError(err.message || "Failed to create new discussion.");
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading && threads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <div className="w-10 h-10 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
        <p className="mt-4 text-slate-500 text-sm font-medium">Loading forum…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <Toast message={toast.message} type={toast.type} visible={toast.visible} onDismiss={dismissToast} />

      {/* Page Header */}
      <header className="bg-white border-b border-slate-200 px-6 pt-10 pb-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-1.5">Community Forum</h1>
          <p className="text-slate-500 text-sm leading-relaxed">
            Share ideas, ask questions, and discuss academic topics with other students.
          </p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 mt-8 space-y-8">

        {/* Create Thread Form */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900 mb-5">Start a New Discussion</h2>

          {formError && (
            <div role="alert" className="mb-5 flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
              <span className="mt-0.5 flex-shrink-0">⚠</span>
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleCreateThread} className="space-y-4">
            <div>
              <label htmlFor="forum-title" className="block text-sm font-medium text-slate-700 mb-1.5">Discussion Title</label>
              <input
                id="forum-title"
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Best revision strategies for science?"
                disabled={isCreating}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-400 transition-shadow"
              />
            </div>
            <div>
              <label htmlFor="forum-content" className="block text-sm font-medium text-slate-700 mb-1.5">Content</label>
              <textarea
                id="forum-content"
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Share your thoughts or question here…"
                rows={4}
                disabled={isCreating}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-400 transition-shadow resize-y"
              />
            </div>
            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={isCreating}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors duration-150 ${
                  isCreating ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {isCreating ? "Posting…" : "Post Discussion"}
              </button>
            </div>
          </form>
        </section>

        {/* Thread List */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-900">Discussions</h2>
            <span className="text-xs text-slate-400 font-medium">{threads.length} topic{threads.length !== 1 ? "s" : ""}</span>
          </div>

          {error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-2xl text-sm text-center">{error}</div>
          ) : threads.length === 0 ? (
            <div className="text-center py-16 bg-white border border-dashed border-slate-300 rounded-2xl">
              <p className="text-slate-500 text-sm">No discussions yet. Be the first to start one!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {threads.map((thread) => (
                <article
                  key={thread.id}
                  className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:border-blue-200 hover:shadow-md transition-all duration-200"
                >
                  <h3 className="text-base font-semibold text-slate-900 mb-1.5 leading-snug">
                    <Link href={`/forum/${thread.id}`} className="hover:text-blue-700 transition-colors duration-150">
                      {thread.title}
                    </Link>
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
                    <span className="bg-slate-100 px-2 py-0.5 rounded font-medium text-slate-600">User #{thread.user_id}</span>
                    <span>·</span>
                    <time dateTime={thread.created_at}>
                      {new Date(thread.created_at).toLocaleDateString("ms-MY", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </time>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed line-clamp-3 whitespace-pre-wrap">{thread.content}</p>
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <Link href={`/forum/${thread.id}`} className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors duration-150">
                      View Discussion →
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
