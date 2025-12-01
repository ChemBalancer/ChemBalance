// components/AppLayout.tsx
import Link from "next/link";
import { useEffect, useState } from "react";

function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const saved = localStorage.getItem("theme");
    const isDark = saved ? saved === "dark" : root.classList.contains("dark");
    setDark(isDark);
    root.classList.toggle("dark", isDark);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  return (
    <button
      onClick={toggle}
      className="
        rounded-xl border border-brand/40
        px-3 py-1.5 text-sm
        bg-surface/70 hover:bg-brand/10
        text-ink
        dark:bg-ink dark:hover:bg-brand/20 dark:text-surface
        transition-colors
      "
      aria-label="Toggle theme"
    >
      {dark ? "☀️ Light" : "🌙 Dark"}
    </button>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen relative text-ink dark:text-surface">
      {/* Background image */}
      <div
        className="
          fixed inset-0 -z-10
          bg-[url('/bg-molecules-desktop.webp')]
          bg-cover bg-center bg-no-repeat
          dark:bg-[url('/bg-molecules-dark.webp')]
        "
      />

      {/* Soft overlay so content stays readable */}
      <div className="min-h-screen bg-surface/85 dark:bg-ink/90">
        <header className="sticky top-0 z-20 backdrop-blur bg-surface/70 dark:bg-ink/80 border-b border-brand/20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-3 flex items-center gap-4">
            <Link
              href="/"
              className="font-semibold tracking-tight text-lg text-ink dark:text-surface"
            >
              🧪 ChemBalance
            </Link>
            <nav className="ml-auto flex items-center gap-4">
              <Link
                href="/playground"
                className="text-sm text-ink/80 dark:text-surface/80 hover:text-brand dark:hover:text-brand"
              >
                Playground
              </Link>
              <a
                href="#how-it-works"
                className="text-sm text-ink/80 dark:text-surface/80 hover:text-brand dark:hover:text-brand hidden sm:inline"
              >
                How it works
              </a>
              <ThemeToggle />
            </nav>
          </div>
        </header>

        <main>{children}</main>

        <footer className="border-t border-brand/20 mt-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 text-sm flex items-center justify-between text-ink/70 dark:text-surface/70">
            <span>© {new Date().getFullYear()} ChemBalance</span>
            <span className="text-ink/60 dark:text-surface/60">
              Built for learning
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
