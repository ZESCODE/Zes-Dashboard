import React from "react";

/**
 * ZES Icon — bold Z matching Claude Teams dashboard branding.
 * Only viewBox is set; width/height come from className for responsive sizing.
 */
export default function ZesIcon({ className = "", size }: { className?: string; size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="ZES"
    >
      <path
        d="M3 4h18L5 20h16"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
