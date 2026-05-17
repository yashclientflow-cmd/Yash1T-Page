"use client";

import { motion } from "framer-motion";

type Props = { booted: boolean };

const LINKS = [
  { href: "#proof", label: "Proof" },
  { href: "#goals", label: "Goals" },
  { href: "#products", label: "Products" },
  { href: "#edge", label: "Edge" },
  { href: "#trajectory", label: "Trajectory" },
  { href: "#signal", label: "Signal" },
];

export default function Nav({ booted }: Props) {
  return (
    <motion.nav
      initial={{ y: -24, opacity: 0 }}
      animate={booted ? { y: 0, opacity: 1 } : {}}
      transition={{ delay: 2, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      <a className="nav-logo" href="#">
        Yash<span>.</span>
      </a>
      <ul className="nav-links">
        {LINKS.map((link) => (
          <li key={link.href}>
            <a href={link.href}>{link.label}</a>
          </li>
        ))}
      </ul>
    </motion.nav>
  );
}
