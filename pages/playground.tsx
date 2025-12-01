import dynamic from "next/dynamic";
import AppLayout from "../components/AppLayout";

const EquationBalancerPlayground = dynamic(
  () => import("../components/EquationBalancerPlayground"),
  { ssr: false }
);

export default function PlaygroundPage() {
  return (
    <AppLayout>
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
        <header className="mb-4">
          <h1 className="text-2xl font-semibold tracking-tight">Playground</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Type an equation, adjust coefficients, and watch atom counts update live.
          </p>
        </header>
        <div className="rounded-3xl border p-4 sm:p-6">
          <EquationBalancerPlayground />
        </div>
      </section>
    </AppLayout>
  );
}
