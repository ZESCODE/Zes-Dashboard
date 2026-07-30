"use client";
import Image from "next/image";

const AGENTS = ["hermes", "codex", "claude"] as const;
const PROVIDERS = [
  { id: "openai", label: "OpenAI" },
  { id: "anthropic", label: "Anthropic" },
  { id: "deepseek", label: "DeepSeek" },
  { id: "openrouter", label: "OpenRouter" },
  { id: "gemini", label: "Gemini" },
  { id: "mistral", label: "Mistral" },
  { id: "huggingface", label: "HuggingFace" },
  { id: "langchain", label: "LangChain" },
  { id: "gradio", label: "Gradio" },
];
const INFRA = [
  { id: "aws", label: "AWS" },
  { id: "azure", label: "Azure" },
  { id: "kubernetes", label: "K8s" },
  { id: "docker", label: "Docker" },
  { id: "nginx", label: "Nginx" },
  { id: "postgresql", label: "PostgreSQL" },
  { id: "redis", label: "Redis" },
  { id: "github", label: "GitHub" },
  { id: "git", label: "Git" },
  { id: "tor", label: "Tor" },
  { id: "vercel", label: "Vercel" },
  { id: "nextjs", label: "Next.js" },
  { id: "react", label: "React" },
  { id: "tailwindcss", label: "Tailwind" },
  { id: "python", label: "Python" },
  { id: "rust", label: "Rust" },
  { id: "typescript", label: "TypeScript" },
  { id: "nodejs", label: "Node.js" },
  { id: "bun", label: "Bun" },
  { id: "svelte", label: "Svelte" },
  { id: "vue", label: "Vue" },
  { id: "angular", label: "Angular" },
  { id: "fastapi", label: "FastAPI" },
  { id: "flask", label: "Flask" },
  { id: "django", label: "Django" },
  { id: "ubuntu", label: "Ubuntu" },
  { id: "debian", label: "Debian" },
  { id: "linux", label: "Linux" },
  { id: "nginx", label: "Nginx" },
  { id: "apache", label: "Apache" },
  { id: "mongodb", label: "MongoDB" },
  { id: "bitcoin", label: "Bitcoin" },
  { id: "ethereum", label: "Ethereum" },
  { id: "github-copilot", label: "Copilot" },
  { id: "cursor", label: "Cursor" },
];

function IconGrid({ items, title }: { items: { id: string; label: string }[]; title: string }) {
  return (
    <div className="mb-6">
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">{title}</h3>
      <div className="grid grid-cols-6 md:grid-cols-8 gap-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex flex-col items-center gap-1.5 p-2 rounded-lg border border-border/40 bg-background/50 hover:bg-accent/50 transition-colors"
          >
            <Image
              src={`/icons/${item.id}.svg`}
              alt={item.label}
              width={24}
              height={24}
              className="size-6"
            />
            <span className="text-[10px] text-muted-foreground text-center leading-tight">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TechStack() {
  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-primary/10 rounded-lg p-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-5 text-primary"><path d="M4 20h16"/><path d="M4 20V4"/><path d="M20 20V8"/><path d="M12 20V12"/></svg>
        </div>
        <div>
          <h1 className="text-xl font-bold">Tech Stack</h1>
          <p className="text-sm text-muted-foreground">48 technologies powering the ZES system</p>
        </div>
      </div>

      <div className="max-w-4xl">
        <IconGrid items={AGENTS.map(a => ({ id: a, label: a.charAt(0).toUpperCase() + a.slice(1) }))} title="Agents" />
        <IconGrid items={PROVIDERS} title="API Providers" />
        <IconGrid items={INFRA} title="Infrastructure & Tools" />
      </div>
    </div>
  );
}
