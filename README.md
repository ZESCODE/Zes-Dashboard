# ZES Dashboard — Zero Entropy System

**Version:** 2.0.0
**57 Static Pages | Full AI Agent Automation | Holographic Memory Hub**

ZES Dashboard is a Next.js (App Router) terminal-native control plane for managing multi-agent AI systems. It provides a unified operational dashboard for agent task dispatch, company orchestration, memory management, webhook handling, cloud sync, and human-in-the-loop pipeline workflows.

---

## Features

### Core Dashboard
- **Start Page** — Central dashboard overview with agent status, token usage, and quick stats
- **Mobile-Responsive** — Touch-friendly sidebar + bottom nav + Command Palette (⌘K)
- **Brand Header** — ZES branding with Z icon and "Orchestration System" on every page
- **Notification Bell** — Unified alerts: pipeline reviews, failed tasks, upcoming schedules

### AI Agent Automation
- **Agent Task Dispatch** — Full CRUD for tasks, status tracking (pending/running/completed/failed)
- **Agent Scheduler** — Cron-based scheduling for automated agent tasks with 5 quick templates (Daily Review, Memory Sync, Weekly Cleanup, Budget Check, Security Audit)
- **Task Templates** — 8 reusable blueprints with `{{variable}}` substitution (Code Review, Security Audit, System Health, Bug Investigation, DB Migration, Weekly Report, API Endpoint, Memory Note)
- **Pipeline Manager (HITL)** — 6-stage kanban (Backlog → Research → Coding → QC Review → CEO Review → Done) with human approval/rejection feedback loop, recorded to memory hub + activity bus
- **Activity Event Bus** — Cross-agent webhook + event system with source filters, severity colors, and stats breakdown
- **Agent Detail Pages** — Agent profiles with task history and company context

### Companies & Org
- **Company Board** — Multi-company management with agent rosters
- **DnD Org Chart** — SVG drag-and-drop agent → company reassignment with circular reference detection
- **Company Comparison** — Side-by-side company metric comparison
- **Company Pipeline** — Per-company HITL pipeline with CEO review panel + feedback history + team setup

### Data & Memory
- **Holographic Memory Hub** — 94 facts with HRR (Holographic Reduced Representation) vectors, full-text search (FTS5 + LIKE fallback), sortable columns
- **Memory Graph** — Live vis-network knowledge graph with entity relations, entity-connected sidebar, HRR status icons
- **Self-Improvement Cron** — Automatic fact extraction from completed epics/tasks (daily 4AM)

### Infrastructure
- **Webhooks** — Event-driven webhook system with event history, test button, and status monitoring
- **Cloud Sync** — Local filesystem backup/restore for 6 config files (companies, tasks, roster, roadmap, strategy, review), auto-prune to 20
- **Background Review** — Daemon (6-hour cycle) for system health tracking
- **Back-to-Top** — Floating scroll-to-top button on mobile

### UX Enhancements
- **Command Palette** — Global Cmd+K / Ctrl+K with fuzzy matching, 17 built-in commands, dynamic company navigation
- **Loading Skeletons** — Polished skeleton placeholders for all loading states
- **Responsive Layout** — 3-column grid (sidebar | content | widgets) with mobile-first collapse
- **Dark Theme** — Consistent dark terminal-inspired color scheme

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + `cn()` utility |
| Components | shadcn/ui (Sidebar, Sheet, Badge, Button, Input, etc.) |
| Icons | Lucide React + Custom SVG icons |
| Backend | Python 3.14 scripts in `~/.hermes/` |
| Memory | SQLite + numpy HRR phase vectors |
| Build | Webpack (Next.js) |

## Page Index (57 Static Pages)

| Page | Route | Description |
|------|-------|-------------|
| Overview | `/` | Dashboard home |
| Tasks | `/tasks` | Agent task kanban |
| Kanban | `/kanban` | Alternative task board |
| Orchestrator | `/orchestrator` | Agent orchestration |
| Memory Hub | `/memory` | Holographic fact store |
| Memory Graph | `/memory-graph` | Knowledge graph |
| Activity | `/activity` | Event bus feed |
| Scheduler | `/scheduler` | Cron-based scheduling |
| Templates | `/templates` | Reusable task blueprints |
| Companies | `/company` | Company management |
| Company Detail | `/company/[id]` | Company profile |
| Pipeline | `/company/[id]/pipeline` | HITL workflow |
| Company Compare | `/company/compare` | Side-by-side metrics |
| Org Chart | `/org-chart` | DnD agent assignment |
| Agents | `/agents/hermes` | Agent profiles |
| Webhooks | `/webhooks` | Event webhooks |
| Cloud Sync | `/cloud` | Backup/restore |
| Reports | `/reports` | Review reports |
| Teams | `/teams` | Agent control plane |
| Laboratory | `/laboratory` | Agent experiments |
| Terminal | `/terminal` | In-browser terminal |
| Processes | `/processes` | Process manager |
| Network | `/network` | Network interfaces |
| Workflows | `/workflows` | Workflow engine |
| Codex Web | `/codex-web` | Codex CLI interface |
| Claude Chat | `/claude-chat` | Claude Code bridge |
| Skills | `/skills` | Agent skills |
| Showcase | `/showcase` | Feature showcase |
| Dashboard Config | `/dashboard-config` | Configuration |
| ...plus 28 more pages | | |

---

## Getting Started

```bash
# Install dependencies
npm install

# Development server (default port 7070)
npx next dev -p 7070

# Production build
npx next build

# Start production server
npx next start -p 7070
```

## Backend Configuration

Dashboard relies on Hermes backend scripts in `~/.hermes/`:

| Script | Purpose |
|--------|---------|
| `tasks_manager.py` | Task dispatch CLI |
| `pipeline_manager.py` | HITL pipeline orchestration |
| `agent_scheduler.py` | Cron scheduling |
| `task_templates.py` | Template CRUD |
| `events_bus.py` | Activity event pub/sub |
| `webhook_manager.py` | Webhook processing |
| `sync_manager.py` | Cloud backup/restore |
| `background_review.py` | Health review daemon |
| `bin/fix_memory.py` | HRR vector computation |
| `bin/self_improve.py` | Self-improvement cron |

## License

MIT — built for the ZES ecosystem.
