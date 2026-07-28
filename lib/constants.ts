import type { Provider, ExampleTemplate } from "@/types/dashboard";

export const PROVIDERS: Provider[] = [
  { id: "openai", name: "OpenAI", baseUrl: "/v1/chat/completions", color: "#10a37f" },
  { id: "anthropic", name: "Anthropic", baseUrl: "/v1/messages", color: "#d4a843" },
  { id: "google", name: "Google", baseUrl: "/v1/models", color: "#4285f4" },
  { id: "opencode_zen", name: "OpenCode Zen", baseUrl: "/v1/chat/completions", color: "#8b5cf6" },
];

export const EXAMPLE_TEMPLATES: ExampleTemplate[] = [
  {
    name: "Chat Completion",
    description: "Standard chat request",
    method: "POST",
    endpoint: "/v1/chat/completions",
    body: JSON.stringify({ model: "{{MODEL}}", messages: [{ role: "user", content: "Hello!" }] }, null, 2),
  },
  {
    name: "Image Generation",
    description: "DALL-E / image generation",
    method: "POST",
    endpoint: "/v1/images/generations",
    body: JSON.stringify({ model: "dall-e-3", prompt: "A cat wearing a hat", n: 1 }, null, 2),
  },
  {
    name: "Embeddings",
    description: "Text embedding vectors",
    method: "POST",
    endpoint: "/v1/embeddings",
    body: JSON.stringify({ model: "text-embedding-3-small", input: "Hello world" }, null, 2),
  },
];

export const DEFAULT_AGENT_FLAGS = [
  { id: "bypass", label: "--dangerously-bypass-approvals-and-sandbox", default: true },
  { id: "watchdog", label: "Watchdog enabled (auto-restart)", default: true },
  { id: "auto-continue", label: "Auto-continue on rate-limit", default: false },
];

export const AMUX_API = "http://localhost:8822/api";
export const ROUTER_API = "http://localhost:20128/v1";
