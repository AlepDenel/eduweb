"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth, forum, ForumPost, ForumThread } from "@/lib/api";

type ReportFormState = Record<number, string>;
type ReportStatusState = Record<number, boolean>;

export default function ForumThreadDetailPage({
  params,
}: {
  params: { thread_id: string };
}) {
  const router = useRouter();
  const thread_id = params.thread_id;

  const [thread, setThread] = useState<ForumThread | null>(null);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [replyContent, setReplyContent] = useState("");
  const [replyError, setReplyError] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  const [reportReasons, setReportReasons] = useState<ReportFormState>({});
  const [reportStatus, setReportStatus] = useState<ReportStatusState>({});
  const [reportFeedback, setReportFeedback] = useState<Record<number, string>>({});
  const [reportingPostId, setReportingPostId] = useState<number | null>(null);

  const fetchThreadData = async () => {
    setIsLoading(true);
    setError("");

    try {
      const session = await auth.me();
      if (!session.authenticated) {
        router.push("/login");
        return;
      }

      const [threadData, postsData] = await Promise.all([
        forum.getThread(thread_id),
        forum.getPosts(thread_id),
      ]);

      const fetchedPosts = postsData.forum_posts || [];

      setThread(threadData.forum_thread);
      setPosts(fetchedPosts);

      const reportEntries = await Promise.all(
        fetchedPosts.map(async (post) => {
          try {
            const status = await forum.getReportStatus(post.id);
            return [post.id, status.reported] as const;
          } catch (err) {
            console.error(`Failed to fetch report status for post ${post.id}`, err);
            return [post.id, false] as const;
          }
        })
      );

      setReportStatus(Object.fromEntries(reportEntries));
    } catch (err: any) {
      if (err.message === "You must log in before using this route.") {
        router.push("/login");
      } else {
        setError(err.message || "Failed to load discussion.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchThreadData();
  }, [thread_id, router]);

  const handleCreateReply = async (e: React.FormEvent) => {
    e.preventDefault();
    setReplyError("");

    if (!replyContent.trim()) {
      setReplyError("Please enter a reply before submitting.");
      return;
    }

    try {
      setIsSubmittingReply(true);
      await forum.createPost(thread_id, { content: replyContent.trim() });
      setReplyContent("");
      await fetchThreadData();
    } catch (err: any) {
      setReplyError(err.message || "Failed to submit reply.");
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleReportToggle = async (postId: number) => {
    setReportFeedback((current) => ({ ...current, [postId]: "" }));

    try {
      setReportingPostId(postId);

      if (reportStatus[postId]) {
        const response = await forum.unreportPost(postId);
        setReportStatus((current) => ({ ...current, [postId]: false }));
        setReportReasons((current) => ({ ...current, [postId]: "" }));
        setReportFeedback((current) => ({
          ...current,
          [postId]: response.message || "Report cancelled.",
        }));
        return;
      }

      const reason = reportReasons[postId]?.trim();
      if (!reason) {
        setReportFeedback((current) => ({
          ...current,
          [postId]: "Please enter a reason for the report.",
        }));
        return;
      }

      const response = await forum.reportPost(postId, { reason });
      setReportStatus((current) => ({ ...current, [postId]: true }));
      setReportFeedback((current) => ({
        ...current,
        [postId]: response.message || "Post reported successfully.",
      }));
    } catch (err: any) {
      setReportFeedback((current) => ({
        ...current,
        [postId]: err.message || "Failed to update report.",
      }));
    } finally {
      setReportingPostId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <div className="w-10 h-10 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
        <p className="mt-4 text-slate-500 text-sm font-medium">Loading discussion…</p>
      </div>
    );
  }

  if (error || !thread) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center max-w-xl w-full">
          <p className="text-red-600 mb-5 text-sm">{error || "Discussion not found."}</p>
          <button
            onClick={() => router.push("/forum")}
            className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-colors"
          >
            Back to Forum
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">

      {/* Thread Header */}
      <header className="bg-white border-b border-slate-200 px-6 pt-10 pb-8">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/forum"
            className="text-sm text-slate-400 hover:text-slate-700 font-medium transition-colors mb-6 inline-flex items-center gap-1"
          >
            ← Back to Forum
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-3">
            {thread.title}
          </h1>
          <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
            {thread.content}
          </p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 mt-8 space-y-8">

        {/* Replies Section */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-slate-900">Replies</h2>
            <span className="text-xs text-slate-400 font-medium">
              {posts.length} repl{posts.length !== 1 ? "ies" : "y"}
            </span>
          </div>

          {posts.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-slate-300 rounded-xl">
              <p className="text-sm text-slate-500">No replies yet. Be the first to respond!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <article
                  key={post.id}
                  className="border border-slate-200 rounded-2xl p-5 bg-slate-50"
                >
                  <div className="flex items-center gap-2 text-xs text-slate-400 mb-3 flex-wrap">
                    <span className="bg-white border border-slate-200 px-2 py-0.5 rounded font-medium text-slate-600">
                      User #{post.user_id}
                    </span>
                    <span>·</span>
                    <time dateTime={post.created_at}>
                      {new Date(post.created_at).toLocaleDateString("ms-MY", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </time>
                  </div>

                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap mb-5">
                    {post.content}
                  </p>

                  {/* Report Controls */}
                  <div className="border-t border-slate-200 pt-4 space-y-3">
                    <label className="block text-xs font-medium text-slate-600">
                      Report Reason
                    </label>
                    <textarea
                      value={reportReasons[post.id] || ""}
                      onChange={(e) =>
                        setReportReasons((current) => ({
                          ...current,
                          [post.id]: e.target.value,
                        }))
                      }
                      rows={2}
                      placeholder="State the reason if content is inappropriate."
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow resize-y"
                    />
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleReportToggle(post.id)}
                        disabled={reportingPostId === post.id}
                        className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors duration-150 ${
                          reportStatus[post.id]
                            ? "bg-slate-200 text-slate-700 hover:bg-slate-300"
                            : "bg-slate-900 text-white hover:bg-slate-800"
                        } ${reportingPostId === post.id ? "opacity-60 cursor-not-allowed" : ""}`}
                      >
                        {reportingPostId === post.id
                          ? "Processing…"
                          : reportStatus[post.id]
                          ? "Cancel Report"
                          : "Report Post"}
                      </button>

                      {reportFeedback[post.id] && (
                        <p className="text-xs text-slate-500">{reportFeedback[post.id]}</p>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Reply Form */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900 mb-5">Add a Reply</h2>

          {replyError && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm"
            >
              <span className="mt-0.5 text-red-500 flex-shrink-0">⚠</span>
              <span>{replyError}</span>
            </div>
          )}

          <form onSubmit={handleCreateReply} className="space-y-4">
            <div>
              <label htmlFor="reply-content" className="block text-sm font-medium text-slate-700 mb-1.5">
                Your Reply
              </label>
              <textarea
                id="reply-content"
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write your reply here…"
                rows={4}
                disabled={isSubmittingReply}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-400 transition-shadow resize-y"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmittingReply}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors duration-150 ${
                  isSubmittingReply
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {isSubmittingReply ? "Submitting…" : "Submit Reply"}
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}
