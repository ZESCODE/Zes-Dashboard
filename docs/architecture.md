# ZES Dashboard — Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────┐
│                  ZES Dashboard                        │
│                Next.js 16 App Router                  │
│                  Port 7070                            │
├─────────────────────────────────────────────────────┤
│  UI Layer                                            │
│  ┌──────────┬─────────────────┬──────────────────┐   │
│  │ Sidebar  │  Main Content   │  Widgets Panel   │   │
│  │ (nav)    │  (57 pages)     │  (stats/notifs)  │   │
│  └──────────┴─────────────────┴──────────────────┘   │
├─────────────────────────────────────────────────────┤
│  API Layer  (/api/*)                                 │
│  ┌──────┬──────┬──────┬──────┬──────┬───────┐       │
│  │Tasks │Company│Cloud │Webhks│Memry │Tmplts │       │
│       │      │      │      │      │       │
│  └──────┴──────┴──────┴──────┴──────┴───────┘       │
├─────────────────────────────────────────────────────┤
│  Hermes Backend  (~/.hermes/*.py)                    │
│  ┌──────┬──────┬──────┬──────┬──────┬───────┐       │
│  │Tasks │Pipeline│Schedlr│Tmplts│Events│Sync   │     │
│  └──────┴──────┴──────┴──────┴──────┴───────┘       │
├─────────────────────────────────────────────────────┤
│  Storage Layer                                       │
│  ┌─────────────┐ ┌──────────────┐                   │
│  │ SQLite      │ │ Config JSON  │                   │
│  │ (memory_hub)│ │ (companies/  │                   │
│  │             │ │  tasks/etc)  │                   │
│  └─────────────┘ └──────────────┘                   │
└─────────────────────────────────────────────────────┘
```

## Data Flow

### Task Dispatch
```
User → Dashboard UI → API Route → tasks_manager.py → SQLite/JSON
                                     │
                                     ├── Event Bus → Activity UI
                                     ├── Webhook → External Services
                                     └── Scheduler (if cron)
```

### Pipeline HITL
```
User adds item → Backlog → Research → Coding → QC Review
                                                    │
                                          ┌─────────┴─────────┐
                                          ▼                   ▼
                                      CEO Approve        CEO Reject
                                          │                   │
                                          ▼                   ▼
                                        Done              Coding (rework)
                                                    (feedback recorded)
```

### Memory Storage
```
Facts ingested → HRR phase vector encoding → SQLite store
Entities extracted → fact-entity links → entity graph
Search → FTS5 + LIKE fallback → sorted results
Self-improvement cron (4AM) → epic completion → new facts
```

---

## Key Components

### Pages (57 total)
- All pages use `DashboardPageLayout` wrapper
- Client components with `"use client"` directive
- Server-side rendering (static) for key pages via Next.js SSG

### Components
- `components/dashboard/sidebar/` — Left nav with icon set
- `components/dashboard/layout/` — Shared page layout wrapper
- `components/dashboard/command-palette.tsx` — Global ⌘K search
- `components/dashboard/notification-bell.tsx` — Multi-source alerts
- `components/dashboard/brand-header.tsx` — Z + ZES branding
- `components/dashboard/skeleton.tsx` — Loading placeholders
- `components/dashboard/org-chart/` — DnD SVG org chart
- `components/dashboard/kanban-board/` — Task kanban
- `components/dashboard/activity-feed/` — Event stream
- `components/dashboard/service-card/` — External service cards

### Backend Scripts (~/.hermes/)
All Python 3.14 scripts use CLI interface for task dispatch, pipeline management, scheduling, and event publishing.

---

## Environment

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 7070 | Dashboard server port |
| `HERMES_HOME` | `~/.hermes/` | Backend scripts path |
| `ZES_MEMORY_DB` | `~/.zes/memory_hub.sqlite` | Memory store |

## Build & Deploy

```bash
# Development
npx next dev -p 7070

# Production build
npx next build

# Production server
npx next start -p 7070

# Static export
npx next build && npx next export
```
