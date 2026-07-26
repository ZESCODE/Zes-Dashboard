# ZES Dashboard — Frost Edition

**URL:** https://zes-dashboard.vercel.app (Production)  
**Local:** http://127.0.0.1:7070  
**Stack:** Next.js 16.2.11 · Turbopack · pnpm · Tailwind CSS  

ZES Dashboard is a glassmorphic monitoring dashboard for the ZES Orchestration System. Uses the **Frost Edition** 4-color design system (blue=default, green=running, orange=warning, red=error).

---

## Quick Start

### Option 1: Vercel (Production)
```bash
# Already deployed at:
open https://zes-dashboard.vercel.app
```

### Option 2: Local (Termux)
```bash
# One-command install:
curl -fsSL https://raw.githubusercontent.com/ZESCODE/Zes-Orchestration-System/main/scripts/setup-dashboard.sh | bash

# Or manual:
git clone https://github.com/ZESCODE/Zes-Dashboard.git ~/Zes-Dashboard
cd ~/Zes-Dashboard
npm install -g pnpm
pnpm install
pnpm build
sv start zes-dashboard-next
# → http://127.0.0.1:7070
```

### Option 3: Via ZES System Installer
```bash
curl -fsSL https://raw.githubusercontent.com/ZESCODE/Zes-Orchestration-System/main/install.sh | bash
# Then: bash ~/Zes-System/scripts/setup-dashboard.sh
```

---

## Features

- **Frost Edition** — 4-color glassmorphic cards (blue/green/orange/red)
- **63+ pages** — System, Laboratory, Showcase, Network, Memory Graph, etc.
- **Org Chart** — Company hierarchy visualization
- **Infrastructure** — Wiring diagrams and topology maps
- **CDP Diagnostics** — Browser debugging via Chrome DevTools Protocol
- **Accessibility** — ARIA labels, landmarks, alt text, color contrast

## Architecture

```
┌─────────────────────────────┐
│   Vercel (production)       │
│   zes-dashboard.vercel.app  │
│         ↕ git push           │
│   ZESCODE/Zes-Dashboard     │
│         ↕ git pull           │
│   Local Termux :7070         │
│   (sv: zes-dashboard-next)   │
└─────────────────────────────┘
```

## Related

- **ZES Orchestration System:** https://github.com/ZESCODE/Zes-Orchestration-System
- **Frost Design System:** `docs/agents/codex-soul.md` in system repo
- **Power Agent MCP:** 38 tools across 6 skills in `~/Zes-System/power-agent/`
