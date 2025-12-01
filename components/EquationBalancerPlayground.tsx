// components/EquationBalancerPlayground.tsx
// @ts-nocheck
import React, { useMemo, useState, useEffect, useRef } from "react";
import {
  splitEquation,
  parseSpecies,
  countElementsInFormula,
  multiplyCounts,
  sumCounts,
  mergeElements,
} from "../lib/chem/parser";

import { AnimatePresence } from "framer-motion";
import { Motion, springy, fadeUp } from "./ui/Motion";
import { analyzeBalanceability, solveEquation } from "../lib/chem/solver";

// ---- Minimal types for state ----
type SplitEq = { left: string[]; right: string[] } | null;
type Coeffs = { left: number[]; right: number[] };

// ---- Small helpers / UI bits ----
function parseIntOr(v: string, fallback = 1) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
}

function prettyFormula(formula: string) {
  // Render digits as subscripts visually
  return (
    <span className="inline-flex flex-wrap items-end">
      {formula
        .replace(/\s+/g, "")
        .split("")
        .map((ch, i) =>
          /\d/.test(ch) ? <sub key={i}>{ch}</sub> : <span key={i}>{ch}</span>
        )}
    </span>
  );
}

function Badge({
  children,
  variant = "neutral",
}: {
  children: React.ReactNode;
  variant?: "neutral" | "good" | "warn" | "bad";
}) {
  const styles: Record<string, string> = {
    neutral:
      "bg-zinc-100 text-zinc-800 border-zinc-200 " +
      "dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700",
    good:
      "bg-emerald-100 text-emerald-800 border-emerald-200 " +
      "dark:bg-emerald-900 dark:text-emerald-50 dark:border-emerald-800",
    warn:
      "bg-amber-100 text-amber-800 border-amber-200 " +
      "dark:bg-amber-900 dark:text-amber-50 dark:border-amber-800",
    bad:
      "bg-rose-100 text-rose-800 border-rose-200 " +
      "dark:bg-rose-900 dark:text-rose-50 dark:border-rose-800",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs border ${styles[variant]}`}>
      {children}
    </span>
  );
}

const totalAtoms = (sum: Record<string, number>) =>
  Object.values(sum || {}).reduce((a, b) => a + b, 0);

function ElementSummary({ sum }: { sum: Record<string, number> }) {
  const entries = Object.entries(sum || {}).sort(([a], [b]) => a.localeCompare(b));
  if (!entries.length) return null;
  return (
    <div className="mt-3 flex flex-col gap-1 text-sm">
      {entries.map(([el, n]) => (
        <div
          key={el}
          className="
  px-2 py-1 rounded-lg text-xs font-semibold
  bg-white text-zinc-900
  dark:bg-zinc-700 dark:text-white    <— ADD THIS
  border select-none
"
        >
          {el}: {n}
        </div>
      ))}
    </div>
  );
}

function CoeffPill({
  value,
  onDec,
  onInc,
}: {
  value: number;
  onDec: () => void;
  onInc: () => void;
}) {
  return (
    <div className="relative flex items-center">
      {/* Vertical controls appear on hover/focus of the chip (parent .group) */}
      <div className="absolute -left-5 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
        <button
          aria-label="Increase"
          onClick={onInc}
          className="h-5 w-5 grid place-items-center rounded-full bg-sky-600 text-white text-[11px] leading-none dark:bg-sky-400 dark:text-zinc-900 hover:scale-105 active:scale-95 transition-transform"
        >
          +
        </button>
        <button
          aria-label="Decrease"
          onClick={onDec}
          className="h-5 w-5 grid place-items-center rounded-full bg-sky-600 text-white text-[11px] leading-none dark:bg-sky-400 dark:text-zinc-900 hover:scale-105 active:scale-95 transition-transform"
        >
          −
        </button>
      </div>

      {/* The number itself (no visible input) */}
      <Motion.span
        layout
        transition={springy}
        className="
    text-xs font-bold select-none
    text-[#3F88C5]
    dark:text-[#E0E0E0]
  "
        title="Coefficient"
      >
        {value}
      </Motion.span>
    </div>
  );
}

function SpeciesChip({
  side, // "left" | "right"
  name,
  coeff,
  onChange,
}: {
  side: "left" | "right";
  name: string;
  coeff: number;
  onChange: (n: number) => void;
}) {
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      onChange(coeff + 1);
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      onChange(Math.max(0, coeff - 1));
    }
  };

  return (
    <Motion.div
      layout
      {...fadeUp}
      role="button"
      tabIndex={0}
      onKeyDown={onKey}
      className="
  group flex items-center gap-3 px-3 py-2 rounded-2xl border
  bg-white text-zinc-900
  dark:bg-zinc-800 dark:text-zinc-100   <— ADD THIS LINE
  shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-400/50
"
      whileHover={{
        y: -1.5,
        rotate: side === "left" ? -0.8 : 0.8,
        boxShadow: "0 6px 18px rgba(15,23,42,0.18)",
      }}
      whileTap={{ scale: 0.98 }}
      transition={springy}
    >
      <CoeffPill
        value={coeff}
        onDec={() => onChange(Math.max(0, coeff - 1))}
        onInc={() => onChange(coeff + 1)}
      />
      <div className="font-mono text-sm">{name}</div>
    </Motion.div>
  );
}

// ---- Main component ----
export default function EquationBalancerPlayground() {
  const examples = [
    "C3H8 + O2 -> CO2 + H2O",
    "Fe + O2 -> Fe2O3",
    "Na3PO4 + CaCl2 -> Ca3(PO4)2 + NaCl",
    "KMnO4 + HCl -> KCl + MnCl2 + H2O + Cl2",
    "CuSO4·5H2O -> CuSO4 + H2O",
  ];

  const [eqn, setEqn] = useState<string>(examples[0]);
  const [parsed, setParsed] = useState<SplitEq>(splitEquation(eqn));
  const [hintUsed, setHintUsed] = useState(false);
  const [hintText, setHintText] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function insertAtCursor(text: string) {
    const el = inputRef.current;
    if (!el) {
      setEqn((s) => s + text);
      return;
    }
    const start = el.selectionStart ?? eqn.length;
    const end = el.selectionEnd ?? eqn.length;
    const next = eqn.slice(0, start) + text + eqn.slice(end);
    setEqn(next);
    requestAnimationFrame(() => {
      const pos = start + text.length;
      el.setSelectionRange(pos, pos);
      el.focus();
    });
  }

  function normalizeSpaces(s: string) {
    return s
      .replace(/\s+/g, " ")
      .replace(/\s*\+\s*/g, " + ")
      .replace(/\s*-\s*>\s*/g, " -> ")
      .trim();
  }

  function insertPlusSmart() {
    const el = inputRef.current;
    const caret = el?.selectionStart ?? eqn.length;
    const left = eqn.slice(0, caret);
    const right = eqn.slice(caret);
    const next = normalizeSpaces(left + " + " + right);
    setEqn(next);
  }

  function insertArrow() {
    if (eqn.includes("->")) {
      const el = inputRef.current;
      if (!el) return;
      const idx = eqn.indexOf("->") + 2;
      requestAnimationFrame(() => {
        el.setSelectionRange(idx + 1, idx + 1);
        el.focus();
      });
      return;
    }
    insertAtCursor(" -> ");
  }

  function onEqnKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === " ") {
      e.preventDefault();
      insertPlusSmart();
    }
  }

  // Initialize coefficients from inline coefficients (e.g., "2H2O")
  const [coeffs, setCoeffs] = useState<Coeffs>(() => {
    if (!parsed) return { left: [], right: [] };
    return {
      left: parsed.left.map((s) => parseSpecies(s).coeff),
      right: parsed.right.map((s) => parseSpecies(s).coeff),
    };
  });

  const initCoeffs = useMemo<Coeffs>(() => {
    if (!parsed) return { left: [], right: [] };
    return {
      left: parsed.left.map((s) => parseSpecies(s).coeff),
      right: parsed.right.map((s) => parseSpecies(s).coeff),
    };
  }, [parsed]);

  // Re-parse when equation changes
  useEffect(() => setParsed(splitEquation(eqn)), [eqn]);

  // Reset coeff arrays if species count changes
  useEffect(() => {
    setCoeffs(initCoeffs);
  }, [initCoeffs.left.length, initCoeffs.right.length]);

  // Species list with inline coeff/formula
  const species = useMemo(() => {
    if (!parsed) return null;
    return {
      left: parsed.left.map(parseSpecies),
      right: parsed.right.map(parseSpecies),
    };
  }, [parsed]);

  const balanceability = useMemo(() => {
    if (!species) return null;
    const left = species.left.map((s) => s.formula);
    const right = species.right.map((s) => s.formula);
    return analyzeBalanceability(left, right, countElementsInFormula);
  }, [species]);

  // Compute counts, sums, diffs, balanced flag
  const counts = useMemo(() => {
    if (!species) return null;
    const leftCounts = species.left.map((sp, idx) =>
      multiplyCounts(
        countElementsInFormula(sp.formula),
        coeffs.left[idx] ?? sp.coeff
      )
    );
    const rightCounts = species.right.map((sp, idx) =>
      multiplyCounts(
        countElementsInFormula(sp.formula),
        coeffs.right[idx] ?? sp.coeff
      )
    );
    const leftSum = sumCounts(leftCounts);
    const rightSum = sumCounts(rightCounts);
    const elements = mergeElements(leftSum, rightSum);
    const diff = Object.fromEntries(
      elements.map((el) => [
        el,
        (leftSum[el] || 0) - (rightSum[el] || 0),
      ])
    );
    const balanced =
      Object.values(diff).every((d) => d === 0) && elements.length > 0;
    return { leftCounts, rightCounts, leftSum, rightSum, diff, elements, balanced };
  }, [species, coeffs]);

  function generateHint() {
    if (!counts) return "Enter an equation first.";
    const unbalanced = counts.elements.filter((el) => counts.diff[el] !== 0);
    if (unbalanced.length === 0) return "Already balanced ✔";

    const el = unbalanced[0];
    return `Focus on balancing ${el} first.`;
  }

  // Handlers
  const setLeftCoeff = (i: number, v: number) =>
    setCoeffs((c) => ({
      ...c,
      left: c.left.map((x, j) => (j === i ? v : x)),
    }));
  const setRightCoeff = (i: number, v: number) =>
    setCoeffs((c) => ({
      ...c,
      right: c.right.map((x, j) => (j === i ? v : x)),
    }));

  const resetCoeffs = () => setCoeffs(initCoeffs);
  const randomExample = () => {
    const idx = Math.floor(Math.random() * examples.length);
    setEqn(examples[idx]);
  };

  const qualityTag = counts?.balanced ? (
    <Badge variant="good">Balanced ✔</Badge>
  ) : balanceability?.balanceableAllSpecies === false ? (
    <Badge variant="bad">Not balanceable with all species present</Badge>
  ) : counts ? (
    <Badge variant="warn">Unbalanced</Badge>
  ) : (
    <Badge>Enter an equation</Badge>
  );

  return (
    <div className="w-full p-4 sm:p-6 lg:p-8">
      {/* Equation bar (full width) */}
      <section className="grid gap-3 mb-6">
        <label className="text-sm font-medium">Equation</label>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            ref={inputRef}
            value={eqn}
            onChange={(e) => setEqn(normalizeSpaces(e.target.value))}
            onKeyDown={onEqnKeyDown}
            placeholder="e.g., C3H8 + O2 -> CO2 + H2O"
            className="flex-1 rounded-2xl px-4 py-3 text-base font-mono
              border border-zinc-200 bg-white text-zinc-900 placeholder-zinc-400
              dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder-zinc-500"
          />
          <div className="flex gap-2">
            <button
              onClick={resetCoeffs}
              className="border rounded-2xl px-4 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900"
            >
              Reset coeffs
            </button>
            <button
              onClick={randomExample}
              className="border rounded-2xl px-4 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900"
            >
              Random example
            </button>
            <button
              onClick={insertArrow}
              className="border rounded-2xl px-4 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900"
              title="Insert Arrow"
            >
              →
            </button>
          </div>
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Tip: You can include coefficients directly (e.g., "2H2 + O2 -&gt; 2H2O").
          Use parentheses and hydrates like "Ca3(PO4)2" or "CuSO4·5H2O". Press
          <span className="mx-1 rounded border px-1 py-0.5 bg-zinc-100 dark:bg-zinc-900">
            Space
          </span>
          to insert a <code className="px-1">+</code> between species.
        </p>

        {/* Status + Hint / Auto-solve row */}
        <div className="mt-1 flex flex-wrap items-center gap-3">
          {qualityTag}

          <button
            onClick={() => {
              setHintUsed(true);
              setHintText(generateHint());
            }}
            className="px-3 py-1.5 rounded-xl border text-xs hover:bg-zinc-50 dark:hover:bg-zinc-900"
          >
            Get hint
          </button>

          {hintUsed && (
            <button
              onClick={() => {
                if (parsed) {
                  const solution = solveEquation(
                    parsed.left.map((s) => parseSpecies(s).formula),
                    parsed.right.map((s) => parseSpecies(s).formula),
                    countElementsInFormula
                  );
                  if (solution) setCoeffs(solution);
                }
              }}
              className="px-3 py-1.5 rounded-xl border text-xs bg-emerald-600 text-white hover:bg-emerald-700"
            >
              Auto solve
            </button>
          )}
        </div>

        {hintText && (
          <div className="mt-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 dark:text-amber-100 dark:bg-amber-900/60 dark:border-amber-800">
            💡 {hintText}
          </div>
        )}
      </section>

      {/* Arrow missing message */}
      {!parsed && (
        <div className="p-3 border rounded-xl bg-rose-50 text-rose-800 dark:bg-rose-900/60 dark:text-rose-100 mb-4">
          Could not find an arrow (-&gt;). Use the form: Reactants -&gt; Products
        </div>
      )}

      {/* Main editor */}
      {parsed && species && (
        <section className="grid grid-cols-1 gap-6">
          {/* Chip equation view (always on now) */}
          <div className="mt-2 rounded-2xl border border-zinc-200 bg-gradient-to-br from-white to-zinc-50 dark:from-zinc-950 dark:to-zinc-900 p-3 flex flex-col items-center">
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">
              Equation
            </div>

            <Motion.div
              layout
              transition={springy}
              className="flex flex-wrap items-center justify-center gap-2"
            >
              <AnimatePresence initial={false}>
                {species.left.map((sp, idx) => (
                  <SpeciesChip
                    key={`L-${sp.formula}-${idx}`}
                    side="left"
                    name={sp.formula}
                    coeff={coeffs.left[idx] ?? sp.coeff}
                    onChange={(n) => setLeftCoeff(idx, n)}
                  />
                ))}
              </AnimatePresence>

              <Motion.span
                layout
                className="mx-2 text-zinc-500 select-none"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={springy}
              >
                →
              </Motion.span>

              <AnimatePresence initial={false}>
                {species.right.map((sp, idx) => (
                  <SpeciesChip
                    key={`R-${sp.formula}-${idx}`}
                    side="right"
                    name={sp.formula}
                    coeff={coeffs.right[idx] ?? sp.coeff}
                    onChange={(n) => setRightCoeff(idx, n)}
                  />
                ))}
              </AnimatePresence>
            </Motion.div>
          </div>

          {/* Reactants / Products cards — sums only */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Reactants (Left) */}
            <div className="p-5 rounded-2xl border border-zinc-200 bg-zinc-50/70 dark:border-zinc-800 dark:bg-zinc-900/80">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-medium">Reactants</h2>
                <Badge variant="neutral">Left</Badge>
              </div>

              {counts ? (
                <>
                  <ElementSummary sum={counts.leftSum} />
                  <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                    Total atoms on left:{" "}
                    <span className="font-medium">
                      {totalAtoms(counts.leftSum)}
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-sm text-zinc-500 dark:text-zinc-400">
                  Start typing an equation above.
                </div>
              )}
            </div>

            {/* Products (Right) */}
            <div className="p-5 rounded-2xl border border-zinc-200 bg-zinc-50/70 dark:border-zinc-800 dark:bg-zinc-900/80">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-medium">Products</h2>
                <Badge variant="neutral">Right</Badge>
              </div>

              {counts ? (
                <>
                  <ElementSummary sum={counts.rightSum} />
                  <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                    Total atoms on right:{" "}
                    <span className="font-medium">
                      {totalAtoms(counts.rightSum)}
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-sm text-zinc-500 dark:text-zinc-400">
                  Start typing an equation above.
                </div>
              )}
            </div>
          </div>

          {/* Element balance table */}
          {counts && (
            <div className="p-4 border rounded-2xl overflow-x-auto border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/60">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium">Element balance</h3>
                {counts.balanced ? (
                  <Badge variant="good">All elements balanced</Badge>
                ) : (
                  <Badge variant="warn">
                    Adjust coefficients until all diffs are 0
                  </Badge>
                )}
              </div>
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-zinc-500 dark:text-zinc-400">
                    <th className="py-2 pr-4">Element</th>
                    <th className="py-2 pr-4">Left</th>
                    <th className="py-2 pr-4">Right</th>
                    <th className="py-2 pr-4">Diff (L − R)</th>
                  </tr>
                </thead>
                <tbody>
                  {counts.elements.map((el) => {
                    const L = counts.leftSum[el] || 0;
                    const R = counts.rightSum[el] || 0;
                    const D = counts.diff[el] || 0;
                    const rowClass =
                      D === 0
                        ? "bg-emerald-50 dark:bg-emerald-900/60"
                        : Math.sign(D) > 0
                        ? "bg-amber-50 dark:bg-amber-900/60"
                        : "bg-rose-50 dark:bg-rose-900/60";
                    return (
                      <tr key={el} className={`${rowClass} border-b last:border-0`}>
                        <td className="py-1.5 pr-4 font-medium">{el}</td>
                        <td className="py-1.5 pr-4">{L}</td>
                        <td className="py-1.5 pr-4">{R}</td>
                        <td className="py-1.5 pr-4 font-mono">{D}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Coaching block */}
          {counts && !counts.balanced && (
            <div className="p-4 border rounded-2xl bg-zinc-50 dark:bg-zinc-900/70 dark:border-zinc-800">
              <h3 className="font-medium mb-2">Try this:</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
                <li>
                  Pick an element that appears in the fewest species and balance it
                  first.
                </li>
                <li>
                  Leave H and O for last if they appear in many places (common in
                  combustion and redox).
                </li>
                <li>
                  Use even/odd patterns: if O is odd on one side and even on the
                  other, double a coefficient to make it even.
                </li>
              </ul>
            </div>
          )}

          <footer className="border-t mt-16">
  <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 text-sm 
                  text-zinc-500 dark:text-zinc-400 
                  flex flex-col sm:flex-row items-center justify-between gap-2">

    <span>© {new Date().getFullYear()} ChemBalance</span>

    <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-center sm:text-right">

      <a 
        href="mailto:chembalancer@gmail.com" 
        className="hover:underline"
      >
        Feedback
      </a>

      <a 
        href="mailto:chembalancer@gmail.com" 
        className="hover:underline"
      >
        Business enquiries
      </a>
    </div>
  </div>
</footer>

        </section>
      )}
    </div>
  );
}
