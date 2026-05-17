"use client";

import { motion } from "framer-motion";
import { useRef } from "react";

type Props = {
  value: string;
  label: string;
  index: number;
  booted: boolean;
};

export default function StatCard({ value, label, index, booted }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <motion.div
      ref={ref}
      className="stat-item stat-card-3d"
      initial={{ opacity: 0, y: 28 }}
      animate={booted ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: 1.4 + index * 0.15, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{
        rotateX: -6,
        rotateY: 8,
        scale: 1.03,
        transition: { duration: 0.25 },
      }}
      style={{ transformStyle: "preserve-3d" }}
    >
      <div className="stat-number">{value}</div>
      <div className="stat-label">{label}</div>
    </motion.div>
  );
}
