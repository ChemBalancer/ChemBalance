// components/HeroMiniEquation.tsx
import { Motion, springy } from "./ui/Motion";

export default function HeroMiniEquation() {
  const chipBase =
    "px-2.5 py-1.5 rounded-xl text-xs font-semibold shadow-sm " +
    "border border-brand/40 bg-white text-ink " +
    "dark:bg-ink/90 dark:text-surface dark:border-brand/60";

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm justify-center">

      {/* 1C */}
      <Motion.div
        layout
        transition={springy}
        className={`${chipBase}`}
        whileHover={{ y: -2, rotate: -1.2 }}
      >
        <span className="mr-1 text-brand">1</span>C
      </Motion.div>

      {/* + */}
      <span className="opacity-50">+</span>

      {/* 1O₂ */}
      <Motion.div
        layout
        transition={springy}
        className={`${chipBase}`}
        whileHover={{ y: -2, rotate: 1.2 }}
      >
        <span className="mr-1 text-brand">1</span>O₂
      </Motion.div>

      {/* → */}
      <span className="mx-2 opacity-50">→</span>

      {/* 1CO₂ */}
      <Motion.div
        layout
        transition={springy}
        className={`${chipBase}`}
        whileHover={{ y: -2, rotate: -1.2 }}
      >
        <span className="mr-1 text-brand">1</span>CO₂
      </Motion.div>

    </div>
  );
}
