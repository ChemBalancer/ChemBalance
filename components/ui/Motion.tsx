// components/ui/Motion.tsx
import { motion, type Transition } from "framer-motion";

export const springy: Transition = {
  type: "spring",
  stiffness: 400,
  damping: 24,
  mass: 0.6,
};

export const fadeUp = {
  initial: { opacity: 0, y: 8, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -8, scale: 0.98 },
  transition: springy,
};

export const Motion = motion;
