/**
 * Papirus icon stubs — ZES service icons.
 * TODO: Replace with proper SVG icons matching papirus-icon-theme style.
 */

import React from "react";

type IconProps = { className?: string; size?: number };

function createIcon(displayName: string) {
  const Icon = ({ className = "", size = 24 }: IconProps) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-label={displayName}
    >
      <rect x="2" y="2" width="20" height="20" rx="4" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
  Icon.displayName = displayName;
  return Icon;
}

export const ServerIcon = createIcon("ServerIcon");
export const TerminalIcon = createIcon("TerminalIcon");
export const AgentIcon = createIcon("AgentIcon");
export const NetworkIcon = createIcon("NetworkIcon");
export const DatabaseIcon = createIcon("DatabaseIcon");
export const ChatIcon = createIcon("ChatIcon");
