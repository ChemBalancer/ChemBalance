// lib/chem/solver.ts

// Build the element matrix A where rows = elements, cols = species.
// Convention: left species columns are +counts, right species columns are -counts.
// We want A x = 0 with x != 0. For a *usable* chemical balance, we also want:
//   x_left > 0 and x_right < 0 (so both sides get positive coefficients).
// We'll search the nullspace for a vector with that sign pattern (up to a global scale).

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
  const A: number[][] = Array.from({ length: rows }, () => Array(cols).fill(0));

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

// Gaussian elimination to RREF over rationals (represented as JS numbers).
// Returns a basis for the nullspace of A as an array of vectors.
export function nullspace(A: number[][]): number[][] {
  const m = A.length;
  const n = A[0]?.length ?? 0;
  const M = A.map((row) => row.slice());

  const EPS = 1e-12;
  let row = 0;
  const pivots: number[] = Array(n).fill(-1);

  for (let col = 0; col < n && row < m; col++) {
    // find pivot
    let best = row;
    for (let r = row; r < m; r++) if (Math.abs(M[r][col]) > Math.abs(M[best][col])) best = r;
    if (Math.abs(M[best][col]) < EPS) continue;

    // swap
    [M[row], M[best]] = [M[best], M[row]];

    // normalize
    const div = M[row][col];
    for (let c = col; c < n; c++) M[row][c] /= div;

    // eliminate others
    for (let r = 0; r < m; r++) {
      if (r === row) continue;
      const factor = M[r][col];
      if (Math.abs(factor) > EPS) {
        for (let c = col; c < n; c++) M[r][c] -= factor * M[row][c];
      }
    }

    pivots[col] = row;
    row++;
  }

  // free variables are columns with pivots[col] === -1
  const free: number[] = [];
  for (let c = 0; c < n; c++) if (pivots[c] === -1) free.push(c);

  if (free.length === 0) return []; // only trivial solution

  const basis: number[][] = [];
  for (const f of free) {
    const v = Array(n).fill(0);
    v[f] = 1;
    for (let c = 0; c < n; c++) {
      const r = pivots[c];
      if (r !== -1) v[c] = -M[r][f];
    }
    basis.push(v);
  }
  return basis;
}

// Try to find a combination of nullspace basis vectors that yields
// x_left > 0 and x_right < 0 (strict), i.e. all species present.
// We search small integer combinations (−3..3) for robustness.
export function findSignedFeasibleSolution(
  basis: number[][],
  leftLen: number,
  rightLen: number
): number[] | null {
  if (basis.length === 0) return null;

  // If 1D nullspace, just test +/- that vector
  if (basis.length === 1) {
  for (const s of [1, -1]) {
    const v = basis[0].map((x) => s * x);
    if (allPositiveUpToSign(v)) return v;
  }
  return null;
}

  // Otherwise brute-force small integer combos
  const K = [-3, -2, -1, 1, 2, 3];
  const B = basis.length;

  function* combos(idx = 0, acc: number[] = Array(B).fill(0)): Generator<number[]> {
    if (idx === B) { yield acc.slice(); return; }
    for (const k of K) { acc[idx] = k; yield* combos(idx + 1, acc); }
  }

  for (const coeffs of combos()) {
    const v = Array(basis[0].length).fill(0);
    for (let i = 0; i < B; i++) {
      for (let j = 0; j < v.length; j++) v[j] += coeffs[i] * basis[i][j];
    }
    if (allPositiveUpToSign(v)) return v;
  }
  return null;
}

function allPositiveUpToSign(v: number[]) {
  // Flip sign if most entries are negative
  const neg = v.filter((x) => x < 0).length;
  const pos = v.length - neg;
  const s = neg > pos ? -1 : 1;
  const EPS = 1e-12;
  return v.every((x) => s * x > EPS);
}

// Convert a rational vector to smallest integer coefficients with left/right positive.
export function toIntegerCoefficients(v: number[], leftLen: number, rightLen: number) {
  // Make all entries positive (up to sign)
  const neg = v.filter((x) => x < 0).length;
  const pos = v.length - neg;
  if (neg > pos) v = v.map((x) => -x);

  const all = v.map((x) => Math.abs(x));
  const scaled = all.map((x) => Math.round(x * 1e6));
  const g = gcdArray(scaled);
  const ints = scaled.map((x) => x / g);

  return {
    left: ints.slice(0, leftLen),
    right: ints.slice(leftLen),
  };
}


function gcdArray(arr: number[]) {
  const gcd2 = (a: number, b: number): number => (b ? gcd2(b, a % b) : Math.abs(a));
  return arr.reduce((a, b) => gcd2(a, b), 0) || 1;
}

// High-level helper: determine balanceability with all species present.
export function analyzeBalanceability(
  leftFormulas: string[],
  rightFormulas: string[],
  countFn: (f: string) => Record<string, number>
): { balanceableAllSpecies: boolean; nullity: number; suggestion?: { left: number[]; right: number[] } } {
  const { A } = buildElementMatrix(leftFormulas, rightFormulas, countFn);
  if (A.length === 0) return { balanceableAllSpecies: false, nullity: 0 };

  const basis = nullspace(A);
  const nullity = basis.length;
  if (nullity === 0) return { balanceableAllSpecies: false, nullity };

  const leftLen = leftFormulas.length;
  const rightLen = rightFormulas.length;

  const v = findSignedFeasibleSolution(basis, leftLen, rightLen);
  if (!v) return { balanceableAllSpecies: false, nullity };

  const suggestion = toIntegerCoefficients(v, leftLen, rightLen);
  return { balanceableAllSpecies: true, nullity, suggestion };
}

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
