import Link from "next/link";

const quickLinks = [
  { href: "/login", label: "Login" },
  { href: "/courses", label: "Courses" },
  { href: "/forum", label: "Forum" },
  { href: "/bookstore", label: "Bookstore" },
  { href: "/portal", label: "Portal" },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="max-w-5xl mx-auto px-6 py-24">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">
            EduTech
          </p>
          <h1 className="mt-4 text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
            Education website frontend integrated with the verified backend contract.
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-slate-600">
            Use the links below to access the current learning modules, discussion
            forum, bookstore, and student portal flows already wired into the
            frontend rescue branch.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-base font-semibold text-slate-800 shadow-sm transition-colors hover:border-indigo-300 hover:text-indigo-700"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
