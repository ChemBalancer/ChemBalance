// lib/chem/solver.ts

// Build the element matrix A where rows = elements, cols = species.
// Convention: left species columns are +counts, right species columns are -counts.
// We want integer x with A x = 0, x ≠ 0, and positive coefficients on both sides.

export type Side = "left" | "right";

export function buildElementMatrix(
  leftFormulas: string[],
  rightFormulas: string[],
  countFn: (formula: string) => Record<string, number>
) {
  const elements = Array.from(
    new Set(
      leftFormulas
        .concat(rightFormulas)
        .flatMap((f) => Object.keys(countFn(f)))
    )
  ).sort((a, b) => a.localeCompare(b));

  const cols = leftFormulas.length + rightFormulas.length;
  const rows = elements.length;
  const A: number[][] = Array.from({ length: rows }, () =>
    Array(cols).fill(0)
  );

  // Fill columns
  leftFormulas.forEach((f, j) => {
    const counts = countFn(f);
    elements.forEach((el, i) => (A[i][j] = counts[el] || 0));
  });
  rightFormulas.forEach((f, k) => {
    const counts = countFn(f);
    const col = leftFormulas.length + k;
    elements.forEach((el, i) => (A[i][col] = -(counts[el] || 0)));
  });

  return { A, elements };
}

/* ---------- tiny rational-arithmetic helpers (exact) ---------- */

type Frac = { num: number; den: number }; // den > 0, always reduced

function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b !== 0) {
    const t = a % b;
    a = b;
    b = t;
  }
  return a || 1;
}

function lcm(a: number, b: number): number {
  return (a / gcd(a, b)) * b;
}

function makeFrac(num: number, den: number = 1): Frac {
  if (den === 0) throw new Error("Zero denominator");
  if (den < 0) {
    num = -num;
    den = -den;
  }
  if (num === 0) return { num: 0, den: 1 };
  const g = gcd(num, den);
  return { num: num / g, den: den / g };
}

function fAdd(a: Frac, b: Frac): Frac {
  return makeFrac(a.num * b.den + b.num * a.den, a.den * b.den);
}
function fSub(a: Frac, b: Frac): Frac {
  return makeFrac(a.num * b.den - b.num * a.den, a.den * b.den);
}
function fMul(a: Frac, b: Frac): Frac {
  return makeFrac(a.num * b.num, a.den * b.den);
}
function fDiv(a: Frac, b: Frac): Frac {
  return makeFrac(a.num * b.den, a.den * b.num);
}

/* ---------- solve A x = 0 by treating last variable as 1 ---------- */

function solveRationalForLastColumn(A: number[][]): Frac[] | null {
  const m = A.length;
  const n = A[0]?.length ?? 0;
  if (n <= 1) return null;

  const nvars = n - 1;

  // B x' = b  where B = first n-1 columns, b = -last column
  const B: Frac[][] = Array.from({ length: m }, (_, i) =>
    Array.from({ length: nvars }, (_, j) => makeFrac(A[i][j]))
  );
  const b: Frac[] = Array.from({ length: m }, (_, i) =>
    makeFrac(-A[i][n - 1])
  );

  let row = 0;
  const pivotRowForCol: number[] = Array(nvars).fill(-1);

  for (let col = 0; col < nvars && row < m; col++) {
    // find pivot
    let pivot = row;
    while (pivot < m && B[pivot][col].num === 0) pivot++;
    if (pivot === m) continue;

    // swap
    if (pivot !== row) {
      [B[pivot], B[row]] = [B[row], B[pivot]];
      [b[pivot], b[row]] = [b[row], b[pivot]];
    }

    // normalize pivot row so pivot == 1
    const piv = B[row][col];
    for (let j = col; j < nvars; j++) B[row][j] = fDiv(B[row][j], piv);
    b[row] = fDiv(b[row], piv);

    // eliminate in other rows
    for (let r = 0; r < m; r++) {
      if (r === row) continue;
      const factor = B[r][col];
      if (factor.num === 0) continue;
      for (let j = col; j < nvars; j++) {
        B[r][j] = fSub(B[r][j], fMul(factor, B[row][j]));
      }
      b[r] = fSub(b[r], fMul(factor, b[row]));
    }

    pivotRowForCol[col] = row;
    row++;
  }

  // Build one particular solution with free vars = 0
  const x: Frac[] = Array.from({ length: nvars }, () => makeFrac(0));
  for (let c = 0; c < nvars; c++) {
    const r = pivotRowForCol[c];
    if (r !== -1) x[c] = b[r];
  }

  // last variable set to 1
  x.push(makeFrac(1));
  return x;
}

function fracsToIntegerCoeffs(
  fv: Frac[],
  leftLen: number,
  rightLen: number,
  A: number[][]
): { left: number[]; right: number[] } | null {
  const n = fv.length;
  if (n === 0) return null;

  // common denominator (LCM of all dens)
  let commonDen = 1;
  for (const f of fv) commonDen = lcm(commonDen, f.den);

  // integer vector (might have negatives)
  let vec = fv.map((f) => (f.num * (commonDen / f.den)) | 0);

  // all zero? no good
  if (vec.every((v) => v === 0)) return null;

  // flip sign if most entries are negative
  const neg = vec.filter((v) => v < 0).length;
  const pos = vec.filter((v) => v > 0).length;
  if (neg > pos) vec = vec.map((v) => -v);

  const absVec = vec.map((v) => Math.abs(v));
  const g = absVec.reduce((acc, v) => (v ? gcd(acc, v) : acc), absVec[0] || 1);
  const final = absVec.map((v) => v / g);

  // sanity check: A * final == 0 exactly
  for (let i = 0; i < A.length; i++) {
    let s = 0;
    for (let j = 0; j < A[i].length; j++) {
      s += A[i][j] * final[j];
    }
    if (s !== 0) {
      return null;
    }
  }

  return {
    left: final.slice(0, leftLen),
    right: final.slice(leftLen),
  };
}

/* ---------- Public helpers used by the UI ---------- */

// Decide if an equation is balanceable with all species present.
// Also returns a suggested set of coefficients if possible.
export function analyzeBalanceability(
  leftFormulas: string[],
  rightFormulas: string[],
  countFn: (f: string) => Record<string, number>
): {
  balanceableAllSpecies: boolean;
  nullity: number;
  suggestion?: { left: number[]; right: number[] };
} {
  const { A } = buildElementMatrix(leftFormulas, rightFormulas, countFn);
  if (A.length === 0 || (A[0]?.length ?? 0) === 0) {
    return { balanceableAllSpecies: false, nullity: 0 };
  }

  const raw = solveRationalForLastColumn(A);
  if (!raw) return { balanceableAllSpecies: false, nullity: 0 };

  const leftLen = leftFormulas.length;
  const rightLen = rightFormulas.length;

  const suggestion = fracsToIntegerCoeffs(raw, leftLen, rightLen, A);
  if (!suggestion) return { balanceableAllSpecies: false, nullity: 0 };

  return { balanceableAllSpecies: true, nullity: 1, suggestion };
}

// High-level auto-solver used by the "Auto solve" button.
export function solveEquation(
  leftFormulas: string[],
  rightFormulas: string[],
  countFn: (f: string) => Record<string, number>
): { left: number[]; right: number[] } | null {
  const { balanceableAllSpecies, suggestion } = analyzeBalanceability(
    leftFormulas,
    rightFormulas,
    countFn
  );
  if (!balanceableAllSpecies || !suggestion) return null;
  return suggestion;
}
