// pages/index.tsx
import AppLayout from "../components/AppLayout";
import HeroMiniEquation from "../components/HeroMiniEquation";
import Head from "next/head";

export default function HomePage() {
  return (
    <AppLayout>
      <Head>
        <title>Chemometry — Interactive Chemical Equation Balancer</title>
        <meta
          name="description"
          content="Chemometry.io is a fast, visual chemical equation balancer. Type any reaction, adjust coefficients as chips, and see atom counts update instantly."
        />
        <meta name="keywords" content="chemical equation balancer, chemometry, chemistry tool, stoichiometry, balance equations online" />
        <meta name="author" content="Chemometry" />

        {/* Canonical URL */}
        <link rel="canonical" href="https://chemometry.io/" />

        {/* Open Graph */}
        <meta property="og:title" content="Chemometry — Interactive Chemical Equation Balancer" />
        <meta
          property="og:description"
          content="Balance chemical equations with interactive chips and live atom counts. Built for chemistry students and lab reports."
        />
        <meta property="og:url" content="https://chemometry.io/" />
        <meta property="og:type" content="website" />
        {/* When you have a share image/logo ready, update this path */}
        {/* <meta property="og:image" content="https://chemometry.io/og-image.png" /> */}
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Chemometry — Interactive Chemical Equation Balancer" />
        <meta
          name="twitter:description"
          content="Balance chemical equations visually with Chemometry: chips, live atom counts, and hints."
        />
        {/* <meta name="twitter:image" content="https://chemometry.io/og-image.png" /> */}

        <link rel="icon" href="/text-logow.png" />
        <script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "Chemometry",
      url: "https://chemometry.io",
      applicationCategory: "EducationalApplication",
      operatingSystem: "All",
      description: "Interactive chemical equation balancer with real-time feedback.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
    }),
  }}
/>

      </Head>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-16 lg:py-20 grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] items-center">
        {/* Left column: copy */}
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-surface/80 px-3 py-1 text-xs text-ink/70 dark:bg-ink/80 dark:text-surface/80">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Built for chemistry students & lab reports
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-ink dark:text-surface">
              Balance chemical equations
              <span className="block text-brand">
                with visual, interactive feedback.
              </span>
            </h1>
            <p className="text-sm sm:text-base text-ink/70 dark:text-surface/70 max-w-xl">
              Type any equation, tweak coefficients, and watch atom counts
              update instantly. Designed for students who actually want to
              understand, not just copy answers.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href="/playground"
              className="inline-flex items-center justify-center rounded-2xl px-5 py-2.5 text-sm font-medium
                bg-accent text-ink shadow-sm hover:bg-accent/90
                focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-accent/70"
            >
              Start balancing
              <span className="ml-2 text-lg">→</span>
            </a>

            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-medium
                border border-brand/40 bg-surface/80 text-ink/80 hover:bg-brand/10
                dark:bg-ink/90 dark:text-surface/90 dark:hover:bg-brand/20"
            >
              How it works
            </a>
          </div>

          <div className="flex flex-wrap gap-4 text-xs text-ink/60 dark:text-surface/60">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Instant “balanced / unbalanced” feedback.
            </div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" />
              Atom counts for each side at a glance.
            </div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              Hints first, optional auto-solve later.
            </div>
          </div>
        </div>

        {/* Right column: mini preview card */}
        <div className="relative">
          <div className="absolute -inset-4 rounded-3xl bg-brand/10 blur-2xl opacity-70 dark:bg-brand/20" />

          <div className="relative rounded-3xl border border-brand/30 bg-surface/95/90 dark:bg-ink/95 dark:border-brand/50 shadow-lg backdrop-blur-sm p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-medium text-ink/70 dark:text-surface/70">
                Live preview
              </div>
              <div className="text-[11px] px-2 py-0.5 rounded-full bg-accent/20 text-ink/80 dark:text-ink/90">
                Student mode
              </div>
            </div>

            <HeroMiniEquation />

            <p className="mt-4 text-xs text-ink/60 dark:text-surface/60">
              Coefficients become draggable chips. Atom counts update in real
              time so you can see exactly what each change does.
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="mx-auto max-w-6xl px-4 sm:px-6 pb-14 space-y-6"
      >
        <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-ink dark:text-surface">
          How it works
        </h2>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-brand/20 bg-surface/80 p-4 dark:bg-ink/90 dark:border-brand/40">
            <h3 className="text-sm font-semibold text-ink dark:text-surface mb-1.5">
              1. Type your equation
            </h3>
            <p className="text-xs text-ink/70 dark:text-surface/70">
              Use a simple format like{" "}
              <span className="font-mono">C3H8 + O2 -&gt; CO2 + H2O</span>.
              Supports parentheses and hydrates (e.g.{" "}
              <span className="font-mono">CuSO4·5H2O</span>).
            </p>
          </div>

          <div className="rounded-2xl border border-brand/20 bg-surface/80 p-4 dark:bg-ink/90 dark:border-brand/40">
            <h3 className="text-sm font-semibold text-ink dark:text-surface mb-1.5">
              2. Tweak the chips
            </h3>
            <p className="text-xs text-ink/70 dark:text-surface/70">
              Each species becomes a chip with a coefficient. Adjust with
              hover-controls or keyboard arrows and watch atom counts update
              live.
            </p>
          </div>

          <div className="rounded-2xl border border-brand/20 bg-surface/80 p-4 dark:bg-ink/90 dark:border-brand/40">
            <h3 className="text-sm font-semibold text-ink dark:text-surface mb-1.5">
              3. Learn, then check
            </h3>
            <p className="text-xs text-ink/70 dark:text-surface/70">
              Use hints to decide what to balance next. When you’re stuck, let
              the solver show one valid balanced set of coefficients.
            </p>
          </div>
        </div>
      </section>
    </AppLayout>
  );
}