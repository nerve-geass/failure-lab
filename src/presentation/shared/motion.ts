import type { Variants } from "framer-motion";

export const fadeUp: Variants = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.38, ease: "easeOut" } } };
export const stagger: Variants = { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } };
