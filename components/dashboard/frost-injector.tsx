"use client";

import { useEffect } from "react";

const FROST_CSS = `
html, body, .dark, .dark body, html.dark {
  background-color: #000000 !important;
}
.glass-frost-blue {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.35) 0%, rgba(37, 99, 235, 0.20) 100%) !important;
  border: 1px solid rgba(59, 130, 246, 0.5) !important;
  backdrop-filter: blur(24px) !important;
  -webkit-backdrop-filter: blur(24px) !important;
}
.glass-frost-green {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.35) 0%, rgba(5, 150, 105, 0.20) 100%) !important;
  border: 1px solid rgba(16, 185, 129, 0.5) !important;
  backdrop-filter: blur(24px) !important;
  -webkit-backdrop-filter: blur(24px) !important;
}
.glass-frost-orange {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.35) 0%, rgba(217, 119, 6, 0.20) 100%) !important;
  border: 1px solid rgba(245, 158, 11, 0.5) !important;
  backdrop-filter: blur(24px) !important;
  -webkit-backdrop-filter: blur(24px) !important;
}
.glass-frost-red {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.35) 0%, rgba(220, 38, 38, 0.20) 100%) !important;
  border: 1px solid rgba(239, 68, 68, 0.5) !important;
  backdrop-filter: blur(24px) !important;
  -webkit-backdrop-filter: blur(24px) !important;
}
`;

export default function FrostInjector() {
  useEffect(() => {
    const style = document.createElement("style");
    style.id = "frost-override";
    style.textContent = FROST_CSS;
    document.head.appendChild(style);
    return () => { const s = document.getElementById("frost-override"); if (s) s.remove(); };
  }, []);
  return null;
}
