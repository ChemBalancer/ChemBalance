// lib/chem/parser.ts

export function normalizeArrow(s: string) {
  return s.replace(/⇌|<=>|⟷|⇒|→|<-+>|=+>|-+>/g, "->");
}

export function splitEquation(eqn: string): { left: string[]; right: string[] } | null {
  const arrow = normalizeArrow(eqn);
  const parts = arrow.split("->");
  if (parts.length !== 2) return null;
  const [lhs, rhs] = parts;
  const left = lhs.split("+").map((s) => s.trim()).filter(Boolean);
  const right = rhs.split("+").map((s) => s.trim()).filter(Boolean);
  return { left, right };
}

export function parseSpecies(raw: string) {
  const m = raw.match(/^\s*(\d+)\s*(.*)$/);
  if (m) return { coeff: parseInt(m[1], 10), formula: m[2].trim() };
  return { coeff: 1, formula: raw.trim() };
}

type Token =
  | { type: "dot" }
  | { type: "paren"; value: string }
  | { type: "elem"; symbol: string; count: number }
  | { type: "num"; value: number };

export function tokenizeFormula(formula: string): Token[] {
  const s = formula.replace(/\s+/g, "");
  const tokens: Token[] = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === "·" || c === ".") { tokens.push({ type: "dot" }); i++; continue; }
    if (/[()\[\]{}]/.test(c)) { tokens.push({ type: "paren", value: c }); i++; continue; }
    if (/[A-Z]/.test(c)) {
      let sym = c;
      if (i + 1 < s.length && /[a-z]/.test(s[i + 1])) { sym += s[i + 1]; i += 2; }
      else { i++; }
      let j = i;
      while (j < s.length && /\d/.test(s[j])) j++;
      const num = j > i ? parseInt(s.slice(i, j), 10) : 1;
      i = j;
      tokens.push({ type: "elem", symbol: sym, count: num });
      continue;
    }
    if (/\d/.test(c)) {
      let j = i; while (j < s.length && /\d/.test(s[j])) j++;
      const num = parseInt(s.slice(i, j), 10);
      tokens.push({ type: "num", value: num });
      i = j; continue;
    }
    i++;
  }
  return tokens;
}

export function tokensToCounts(tokens: Token[]): Map<string, number> {
  const stack: Array<Map<string, number>> = [new Map()];
  const openers = new Set(["(", "[", "{"]);
  const closers = new Set([")", "]", "}"]);
  const match: Record<string, string> = { ")": "(", "]": "[", "}": "{" };
  const parenStack: string[] = [];

  const pushCounts = (into: Map<string, number>, elem: string, n: number) => {
    into.set(elem, (into.get(elem) || 0) + n);
  };

  let i = 0;
  while (i < tokens.length) {
    const t = tokens[i];
    if (t.type === "elem") { pushCounts(stack.at(-1)!, t.symbol, t.count); i++; continue; }
    if (t.type === "paren") {
      const v = t.value;
      if (openers.has(v)) { parenStack.push(v); stack.push(new Map()); i++; }
      else if (closers.has(v)) {
        const opener = match[v];
        const lastOpener = parenStack.pop();
        if (lastOpener !== opener) { /* tolerate mismatch */ }
        const group = stack.pop()!;
        let mult = 1;
        const nxt = tokens[i + 1];
        if (nxt && nxt.type === "num") { mult = nxt.value; i += 2; }
        else { i++; }
        const top = stack.at(-1)!;
        for (const [k, val] of group.entries()) pushCounts(top, k, val * mult);
      } else { i++; }
      continue;
    }
    if (t.type === "dot") {
      const nxt = tokens[i + 1];
      if (nxt && nxt.type === "num") {
        const N = nxt.value;
        const sub = tokensToCounts(tokens.slice(i + 2));
        const top = stack.at(-1)!;
        for (const [k, val] of sub.entries()) pushCounts(top, k, val * N);
        break;
      }
      i++; continue;
    }
    if (t.type === "num") {
      const N = t.value;
      const nxt = tokens[i + 1];
      if (!nxt) { i++; continue; }
      if (nxt.type === "elem") { pushCounts(stack.at(-1)!, nxt.symbol, nxt.count * N); i += 2; continue; }
      if (nxt.type === "paren" && /[\(\[\{]/.test(nxt.value)) {
        let depth = 0, j = i + 1;
        for (; j < tokens.length; j++) {
          const u = tokens[j];
          if (u.type === "paren" && /[\(\[\{]/.test(u.value)) depth++;
          else if (u.type === "paren" && /[\)\]\}]/.test(u.value)) {
            depth--; if (depth === 0) { j++; break; }
          }
        }
        const sub = tokensToCounts(tokens.slice(i + 1, j));
        const top = stack.at(-1)!;
        for (const [k, val] of sub.entries()) pushCounts(top, k, val * N);
        i = j; continue;
      }
      i++; continue;
    }
    i++;
  }
  return stack[0];
}

export function countElementsInFormula(formula: string): Record<string, number> {
  const tokens = tokenizeFormula(formula);
  const counts = tokensToCounts(tokens);
  return Object.fromEntries([...counts.entries()].sort(([a],[b]) => a.localeCompare(b)));
}

export function multiplyCounts(counts: Record<string, number>, k: number) {
  const out: Record<string, number> = {};
  for (const [el, n] of Object.entries(counts)) out[el] = n * k;
  return out;
}

export function sumCounts(list: Array<Record<string, number>>) {
  const out = new Map<string, number>();
  for (const obj of list) for (const [el, n] of Object.entries(obj)) out.set(el, (out.get(el) || 0) + n);
  return Object.fromEntries([...out.entries()].sort(([a],[b]) => a.localeCompare(b)));
}

export function mergeElements(lhs: Record<string, number>, rhs: Record<string, number>) {
  return Array.from(new Set([...Object.keys(lhs), ...Object.keys(rhs)])).sort((a,b)=>a.localeCompare(b));
}
