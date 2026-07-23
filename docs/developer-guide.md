# ZES Dashboard — Developer Guide

## Getting Started

```bash
# Clone
git clone https://github.com/ZESCODE/zes-os-v2.git
cd zes-os-v2

# Install
npm install

# Dev Server
npx next dev -p 7070

# Navigate to http://localhost:7070
```

## Project Structure

```
zes-os-v2/
├── app/                    # Next.js App Router pages
│   ├── api/                # API routes (tasks, company, cloud, etc.)
│   ├── company/            # Company pages (list, detail, pipeline, compare)
│   ├── memory/             # Memory Hub page
│   ├── memory-graph/       # Knowledge graph page
│   ├── activity/           # Event bus page
│   ├── scheduler/          # Agent scheduler page
│   ├── templates/          # Task templates page
│   ├── webhooks/           # Webhooks page
│   ├── cloud/              # Cloud sync page
│   ├── tasks/              # Task kanban page
│   ├── orchestrator/       # Agent orchestration page
│   └── ...                 # 46 more pages
├── components/
│   ├── dashboard/          # Shared dashboard components
│   │   ├── sidebar/        # Navigation sidebar
│   │   ├── layout/         # Page layout wrapper
│   │   ├── org-chart/      # DnD SVG org chart
│   │   ├── kanban-board/   # Task kanban
│   │   ├── activity-feed/  # Event stream
│   │   ├── command-palette.tsx
│   │   ├── notification-bell.tsx
│   │   ├── brand-header.tsx
│   │   ├── skeleton.tsx
│   │   └── back-to-top.tsx
│   ├── ui/                 # shadcn/ui primitives
│   └── icons/              # Custom SVG icons
├── lib/                    # Shared utilities
├── public/                 # Static assets
├── hooks/                  # Custom React hooks
├── docs/                   # Documentation
├── scripts/                # Utility scripts
└── README.md
```

## Adding a New Page

1. Create `app/[page-name]/page.tsx` with `"use client"` directive
2. Wrap with `<DashboardPageLayout header={{title, description, icon}}>`
3. Add sidebar nav item in `components/dashboard/sidebar/index.tsx`
4. Add to Command Palette in `components/dashboard/command-palette.tsx`
5. Build to verify static generation

```tsx
"use client";
import DashboardPageLayout from "@/components/dashboard/layout";
import { Globe } from "lucide-react";

export default function NewPage() {
  return (
    <DashboardPageLayout
      header={{
        title: "My New Page",
        description: "Description of the page",
        icon: Globe,
      }}
    >
      {/* Page content */}
    </DashboardPageLayout>
  );
}
```

## Adding a Backend Script

1. Create `~/.hermes/[script_name].py` with CLI interface
2. Add API route in `app/api/[route-name]/route.ts`
3. Create UI page to consume the API
4. Register any cron jobs in `~/.hermes/cron/`

## Styling Conventions

- Use Tailwind utility classes
- Use `cn()` from `@/lib/utils` for conditional classes
- Prefer `bg-accent/20`, `text-muted-foreground` for terminal-native feel
- Keep sizes small: `text-xs`, `h-7` buttons, `size-4` icons
- Use `text-[10px]` only for metadata/timestamps

## API Patterns

```typescript
// GET with loading state
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
  fetch("/api/endpoint")
    .then(r => r.json())
    .then(d => { setData(d); setLoading(false); })
    .catch(() => setLoading(false));
}, []);

// POST
const createItem = async () => {
  const res = await fetch("/api/endpoint", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key: "value" }),
  });
  const data = await res.json();
  // Handle response
};
```

## Performance Notes

- Static Generation: 57 pages pre-rendered at build time
- Dynamic data fetched client-side via useEffect
- No ISR — content updates on page refresh
- Webpack bundle optimized via Next.js auto-code-splitting
- Memory hub SQLite queries <50ms for typical searches
- Pipeline operations write-through to JSON + event bus
