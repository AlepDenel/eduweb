"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, forum, ForumThread } from "@/lib/api";

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

  const fetchThreads = async () => {
    setIsLoading(true);
    try {
      const session = await auth.me();
      if (!session.authenticated) {
        router.push("/login");
        return;
      }
      const data = await forum.getThreads();
      // Sort threads by newest first (optional, but good for UX if backend doesn't sort)
      const sortedThreads = (data.threads || []).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setThreads(sortedThreads);
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
      setFormError("Sila masukkan tajuk dan kandungan untuk memulakan perbincangan.");
      return;
    }

    try {
      setIsCreating(true);
      await forum.createThread({
        title: newTitle.trim(),
        content: newContent.trim()
      });
      
      // Reset form and refresh list
      setNewTitle("");
      setNewContent("");
      await fetchThreads();
      alert("Perbincangan baharu berjaya dicipta!");
    } catch (err: any) {
      setFormError(err.message || "Gagal mencipta perbincangan baharu.");
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading && threads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-stone-50">
        <div className="w-10 h-10 border-2 border-stone-200 border-t-stone-800 rounded-full animate-spin"></div>
        <p className="mt-4 text-stone-500 font-medium text-sm tracking-widest uppercase">Memuatkan Forum...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 font-sans text-stone-900 pb-24">
      {/* Minimalist Header */}
      <header className="bg-white border-b border-stone-200 pt-16 pb-12 px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-semibold tracking-tight text-stone-900 mb-3">
            Forum Komuniti
          </h1>
          <p className="text-stone-500 leading-relaxed font-light text-lg">
            Ruang perbincangan eksklusif untuk para pelajar bertukar idea dan pendapat.
          </p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 mt-12 space-y-12">
        {/* Create Thread Form */}
        <section className="bg-white p-8 rounded-2xl shadow-sm border border-stone-200">
          <h2 className="text-xl font-medium mb-6 text-stone-800">Mulakan Perbincangan Baharu</h2>
          
          {formError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm">
              {formError}
            </div>
          )}

          <form onSubmit={handleCreateThread} className="space-y-5">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-stone-600 mb-1.5">Tajuk Perbincangan</label>
              <input
                id="title"
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="cth: Cara terbaik untuk ulang kaji sains?"
                disabled={isCreating}
                className="w-full px-4 py-3 rounded-xl border border-stone-300 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-800 focus:border-transparent transition-colors text-stone-900"
              />
            </div>
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-stone-600 mb-1.5">Kandungan</label>
              <textarea
                id="content"
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Kongsi pandangan atau soalan anda di sini..."
                rows={4}
                disabled={isCreating}
                className="w-full px-4 py-3 rounded-xl border border-stone-300 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-800 focus:border-transparent transition-colors text-stone-900 resize-y"
              ></textarea>
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isCreating}
                className={\`px-6 py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm \${
                  isCreating
                    ? "bg-stone-200 text-stone-500 cursor-not-allowed"
                    : "bg-stone-900 text-white hover:bg-stone-800 hover:shadow"
                }\`}
              >
                {isCreating ? "Menghantar..." : "Terbitkan Perbincangan"}
              </button>
            </div>
          </form>
        </section>

        {/* Thread List */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-medium text-stone-800">Senarai Perbincangan</h2>
            <span className="text-sm text-stone-400">{threads.length} Topik</span>
          </div>

          {error ? (
            <div className="p-6 bg-red-50 text-red-600 rounded-xl border border-red-100 text-center">
              <p>{error}</p>
            </div>
          ) : threads.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-stone-300">
              <p className="text-stone-500">Belum ada sebarang perbincangan. Jadilah yang pertama!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {threads.map((thread) => (
                <article 
                  key={thread.id} 
                  className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 hover:border-stone-300 transition-colors group"
                >
                  <h3 className="text-xl font-medium text-stone-900 mb-2 leading-tight">
                    {thread.title}
                  </h3>
                  <div className="text-sm text-stone-400 mb-4 flex items-center gap-2">
                    <span className="bg-stone-100 px-2.5 py-0.5 rounded text-xs font-medium text-stone-600">
                      ID Pengguna: {thread.user_id}
                    </span>
                    <span>•</span>
                    <time dateTime={thread.created_at}>
                      {new Date(thread.created_at).toLocaleDateString('ms-MY', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </time>
                  </div>
                  <p className="text-stone-600 leading-relaxed whitespace-pre-wrap">
                    {thread.content}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
