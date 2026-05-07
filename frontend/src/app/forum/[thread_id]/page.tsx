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
      setReplyError("Sila masukkan balasan sebelum dihantar.");
      return;
    }

    try {
      setIsSubmittingReply(true);
      await forum.createPost(thread_id, { content: replyContent.trim() });
      setReplyContent("");
      await fetchThreadData();
    } catch (err: any) {
      setReplyError(err.message || "Gagal menghantar balasan.");
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
          [postId]: response.message || "Laporan dibatalkan.",
        }));
        return;
      }

      const reason = reportReasons[postId]?.trim();
      if (!reason) {
        setReportFeedback((current) => ({
          ...current,
          [postId]: "Sila masukkan sebab laporan.",
        }));
        return;
      }

      const response = await forum.reportPost(postId, { reason });
      setReportStatus((current) => ({ ...current, [postId]: true }));
      setReportFeedback((current) => ({
        ...current,
        [postId]: response.message || "Post berjaya dilaporkan.",
      }));
    } catch (err: any) {
      setReportFeedback((current) => ({
        ...current,
        [postId]: err.message || "Gagal mengemas kini laporan.",
      }));
    } finally {
      setReportingPostId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-stone-50">
        <div className="w-10 h-10 border-2 border-stone-200 border-t-stone-800 rounded-full animate-spin"></div>
        <p className="mt-4 text-stone-500 font-medium text-sm tracking-widest uppercase">
          Memuatkan Perbincangan...
        </p>
      </div>
    );
  }

  if (error || !thread) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-200 text-center max-w-xl w-full">
          <p className="text-red-600 mb-6">{error || "Perbincangan tidak dijumpai."}</p>
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
        <div className="max-w-3xl mx-auto">
          <Link
            href="/forum"
            className="text-stone-400 hover:text-stone-900 transition-colors text-sm font-medium mb-8 inline-flex items-center"
          >
            ← Kembali ke Forum
          </Link>
          <h1 className="text-4xl font-semibold tracking-tight text-stone-900 mb-3">
            {thread.title}
          </h1>
          <p className="text-stone-600 leading-relaxed whitespace-pre-wrap">
            {thread.content}
          </p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 mt-12 space-y-10">
        <section className="bg-white p-8 rounded-2xl shadow-sm border border-stone-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-medium text-stone-800">Balasan Perbincangan</h2>
            <span className="text-sm text-stone-400">{posts.length} Balasan</span>
          </div>

          {posts.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-stone-300 rounded-xl">
              <p className="text-stone-500">Belum ada balasan untuk perbincangan ini.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {posts.map((post) => (
                <article
                  key={post.id}
                  className="border border-stone-200 rounded-2xl p-6 bg-stone-50"
                >
                  <div className="text-sm text-stone-400 mb-4 flex items-center gap-2 flex-wrap">
                    <span className="bg-white px-2.5 py-0.5 rounded text-xs font-medium text-stone-600 border border-stone-200">
                      ID Pengguna: {post.user_id}
                    </span>
                    <span>•</span>
                    <time dateTime={post.created_at}>
                      {new Date(post.created_at).toLocaleDateString("ms-MY", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </time>
                  </div>

                  <p className="text-stone-700 leading-relaxed whitespace-pre-wrap mb-5">
                    {post.content}
                  </p>

                  <div className="space-y-3 border-t border-stone-200 pt-4">
                    <label className="block text-sm font-medium text-stone-600">
                      Sebab Laporan
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
                      placeholder="Nyatakan sebab laporan jika kandungan tidak sesuai."
                      className="w-full px-4 py-3 rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-stone-800 focus:border-transparent transition-colors text-stone-900 resize-y"
                    />
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleReportToggle(post.id)}
                        disabled={reportingPostId === post.id}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          reportStatus[post.id]
                            ? "bg-stone-200 text-stone-700 hover:bg-stone-300"
                            : "bg-stone-900 text-white hover:bg-stone-800"
                        } ${reportingPostId === post.id ? "opacity-60 cursor-not-allowed" : ""}`}
                      >
                        {reportingPostId === post.id
                          ? "Memproses..."
                          : reportStatus[post.id]
                            ? "Batalkan Laporan"
                            : "Laporkan Post"}
                      </button>

                      {reportFeedback[post.id] && (
                        <p className="text-sm text-stone-500">{reportFeedback[post.id]}</p>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white p-8 rounded-2xl shadow-sm border border-stone-200">
          <h2 className="text-xl font-medium mb-6 text-stone-800">Balas Perbincangan</h2>

          {replyError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm">
              {replyError}
            </div>
          )}

          <form onSubmit={handleCreateReply} className="space-y-5">
            <div>
              <label htmlFor="reply-content" className="block text-sm font-medium text-stone-600 mb-1.5">
                Kandungan Balasan
              </label>
              <textarea
                id="reply-content"
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Tulis balasan anda di sini..."
                rows={4}
                disabled={isSubmittingReply}
                className="w-full px-4 py-3 rounded-xl border border-stone-300 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-800 focus:border-transparent transition-colors text-stone-900 resize-y"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmittingReply}
                className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm ${
                  isSubmittingReply
                    ? "bg-stone-200 text-stone-500 cursor-not-allowed"
                    : "bg-stone-900 text-white hover:bg-stone-800 hover:shadow"
                }`}
              >
                {isSubmittingReply ? "Menghantar..." : "Hantar Balasan"}
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}
