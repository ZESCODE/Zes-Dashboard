# ZES Dashboard — Features Reference

## Overview

This document lists every feature in the ZES Dashboard with its status and API endpoints.

## Core Features

| Feature | Status | Page Route | API Endpoint |
|---------|--------|------------|--------------|
| Dashboard Overview | ✅ Stable | `/` | — |
| Task Kanban | ✅ Stable | `/tasks` | `POST /api/tasks` |
| Orchestrator | ✅ Stable | `/orchestrator` | `POST /api/tasks` |
| Kanban Board | ✅ Stable | `/kanban` | `POST /api/tasks` |
| Memory Hub | ✅ Stable | `/memory` | `GET /api/memory` |
| Memory Graph | ✅ Stable | `/memory-graph` | `GET /api/memory` |
| Activity Feed | ✅ Stable | `/activity` | `GET|POST /api/activity` |
| Agent Scheduler | ✅ Stable | `/scheduler` | `GET|POST /api/scheduler` |
| Task Templates | ✅ Stable | `/templates` | `GET|POST /api/task-templates` |
| Companies | ✅ Stable | `/company` | `GET /api/company/*` |
| Company Pipeline | ✅ Stable | `/company/[id]/pipeline` | `GET|POST /api/company/pipeline` |
| Company Compare | ✅ Stable | `/company/compare` | — |
| Org Chart (DnD) | ✅ Stable | `/org-chart` | `POST /api/company/roster/reassign` |
| Agent Detail | ✅ Stable | `/agents/[id]` | `GET /api/agent/*` |
| Webhooks | ✅ Stable | `/webhooks` | `GET|POST /api/webhooks` |
| Cloud Sync | ✅ Stable | `/cloud` | `GET|POST /api/cloud` |
| Reports | ✅ Stable | `/reports` | — |
| Teams | ✅ Stable | `/teams` | — |
| Laboratory | ✅ Stable | `/laboratory` | — |
| Terminal | ✅ Stable | `/terminal` | — |
| Processes | ✅ Stable | `/processes` | — |
| Network | ✅ Stable | `/network` | — |
| Workflows | ✅ Stable | `/workflows` | — |
| Codex Web | ✅ Stable | `/codex-web` | — |
| Claude Chat | ✅ Stable | `/claude-chat` | — |

## UX Features

| Feature | Status | Location |
|---------|--------|----------|
| Sidebar Navigation | ✅ Stable | `components/dashboard/sidebar/` |
| Brand Header (Z+ZES) | ✅ Stable | `components/dashboard/brand-header.tsx` |
| Command Palette (⌘K) | ✅ Stable | `components/dashboard/command-palette.tsx` |
| Notification Bell | ✅ Stable | `components/dashboard/notification-bell.tsx` |
| Loading Skeletons | ✅ Stable | `components/dashboard/skeleton.tsx` |
| Back-to-Top Button | ✅ Stable | `components/dashboard/back-to-top.tsx` |
| Mobile Header | ✅ Stable | `components/dashboard/mobile-header/` |
| Bottom Nav (Mobile) | ✅ Stable | `components/dashboard/bottom-nav/` |
| Empty States | ✅ Stable | Inline per-page |
| Page Header Icons | ✅ Stable | Inline per-page (57 pages consistent) |

## Backend Scripts

| Script | Description | Location |
|--------|-------------|----------|
| Task Manager | Task create/list/update/delete | `~/.hermes/tasks_manager.py` |
| Pipeline Manager | 6-stage HITL with feedback | `~/.hermes/pipeline_manager.py` |
| Agent Scheduler | Cron-based task dispatch | `~/.hermes/agent_scheduler.py` |
| Task Templates | Template CRUD + instantiation | `~/.hermes/task_templates.py` |
| Event Bus | Cross-agent pub/sub | `~/.hermes/events_bus.py` |
| Webhook Manager | Event-driven webhooks | `~/.hermes/webhook_manager.py` |
| Sync Manager | Backup/restore configs | `~/.hermes/sync_manager.py` |
| Memory Fix | HRR vector computation | `~/.hermes/bin/fix_memory.py` |
| Self-Improve | Daily fact extraction | `~/.hermes/bin/self_improve.py` |
| Background Review | System health daemon | `~/.hermes/background_review.py` |

## Memory Hub Schema

### Facts Table
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| fact | TEXT | Fact content |
| domain | TEXT | Domain category |
| trust_score | REAL | 0.0–1.0 trust rating |
| created_at | TEXT | ISO 8601 timestamp |
| hrr_vector | BLOB | 8192-byte HRR phase vector (nullable if not encoded) |
| importance | INTEGER | 0–5 importance scale |
| source | TEXT | Origin source |
| fact_metadata | TEXT | JSON metadata |

### Entities Table
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| name | TEXT | Entity name |
| entity_type | TEXT | Category (agent, tool, concept, etc.) |

### Fact Entities (Links)
| Column | Type | Description |
|--------|------|-------------|
| fact_id | INTEGER | FK → facts.id |
| entity_id | INTEGER | FK → entities.id |

## Build Stats

- Total static pages: **57**
- Build time: ~75-105s (Webpack)
- Compiled output size: ~4.2MB
- Node: 22.x
- Python: 3.14
- React: 19.x
- Next.js: 16.2.11
