"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import DashboardPageLayout from "@/components/dashboard/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Search, Database, Hash, Layers, Zap, Tag, Network,
  Sparkles, RefreshCw, ExternalLink,
} from "lucide-react";
import Link from "next/link";

/* ────────────── Types ────────────── */

interface FactNode {
  id: number;
  text: string;
  type: string;
  category: string;
  trust_score: number;
  timestamp: string;
  tags: string[];
  entities: string[];
  has_hrr: boolean;
}

interface Relation {
  from: number;
  to: number;
  type: "shared_entity" | "shared_tag" | "high_trust_similarity";
}

interface EntityNode {
  entity_id: number;
  name: string;
  fact_count: number;
}

/* ────────────── Color Map ────────────── */

const CAT_COLORS: Record<string, string> = {
  fact:        "oklch(0.7 0.15 200)",       // teal
  decision:    "oklch(0.7 0.2 280)",        // purple
  pattern:     "oklch(0.75 0.18 40)",       // amber
  preference:  "oklch(0.7 0.12 160)",       // green
  bugfix:      "oklch(0.7 0.2 20)",         // red
  insight:     "oklch(0.7 0.15 300)",       // pink
};

const CAT_BORDERS: Record<string, string> = {
  fact:        "oklch(0.5 0.15 200)",
  decision:    "oklch(0.5 0.2 280)",
  pattern:     "oklch(0.55 0.18 40)",
  preference:  "oklch(0.5 0.12 160)",
  bugfix:      "oklch(0.5 0.2 20)",
  insight:     "oklch(0.5 0.15 300)",
};

const EDGE_COLORS: Record<string, string> = {
  shared_entity: "oklch(0.6 0.12 250 / 0.4)",
  shared_tag: "oklch(0.6 0.1 150 / 0.3)",
  high_trust_similarity: "oklch(0.6 0.15 40 / 0.5)",
};

function formatTS(ts: string): string {
  if (!ts) return "";
  const d = new Date(ts);
  return isNaN(d.getTime()) ? ts : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/* ────────────── Main Page ────────────── */

export default function MemoryGraphPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<any>(null);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);

  const [nodes, setNodes] = useState<FactNode[]>([]);
  const [rels, setRels] = useState<Relation[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch facts and entities in parallel
      const [factsRes, entitiesRes] = await Promise.all([
        fetch("/api/memory?path=facts&limit=100&offset=0&sort=trust_desc"),
        fetch("/api/memory?path=entities"),
      ]);

      const factsData = factsRes.ok ? await factsRes.json() : { facts: [] };
      const entitiesData = entitiesRes.ok ? await entitiesRes.json() : { entities: [] };

      const facts: FactNode[] = (factsData.facts || []).map((f: any) => ({
        id: f.fact_id,
        text: f.content,
        type: f.category,
        category: f.category,
        trust_score: f.trust_score,
        timestamp: f.created_at,
        tags: f.tags || [],
        entities: (f.entities || []).map((e: any) => e.name),
        has_hrr: f.has_hrr,
      }));

      const entityMap = new Map<string, number[]>();
      facts.forEach(f => {
        f.entities.forEach(e => {
          if (!entityMap.has(e)) entityMap.set(e, []);
          entityMap.get(e)!.push(f.id);
        });
      });

      // Build relations from shared entities
      const relSet = new Set<string>();
      const relations: Relation[] = [];

      // Entity-based relations
      for (const [, ids] of entityMap.entries()) {
        if (ids.length >= 2) {
          for (let i = 0; i < ids.length && relations.length < 80; i++) {
            for (let j = i + 1; j < ids.length && relations.length < 80; j++) {
              const key = `${Math.min(ids[i], ids[j])}-${Math.max(ids[i], ids[j])}`;
              if (!relSet.has(key)) {
                relSet.add(key);
                relations.push({ from: ids[i], to: ids[j], type: "shared_entity" });
              }
            }
          }
        }
      }

      // Tag-based relations for facts without entities
      const tagMap = new Map<string, number[]>();
      facts.forEach(f => {
        if (f.entities.length === 0) {
          f.tags.forEach(t => {
            if (!tagMap.has(t)) tagMap.set(t, []);
            tagMap.get(t)!.push(f.id);
          });
        }
      });
      for (const [, ids] of tagMap.entries()) {
        if (ids.length >= 2) {
          for (let i = 0; i < ids.length && relations.length < 80; i++) {
            for (let j = i + 1; j < ids.length && relations.length < 80; j++) {
              const key = `t${Math.min(ids[i], ids[j])}-${Math.max(ids[i], ids[j])}`;
              if (!relSet.has(key)) {
                relSet.add(key);
                relations.push({ from: ids[i], to: ids[j], type: "shared_tag" });
              }
            }
          }
        }
      }

      setNodes(facts);
      setRels(relations);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Derived stats
  const stats = [
    { label: "Facts", value: nodes.length, icon: Database },
    { label: "Categories", value: new Set(nodes.map(n => n.category)).size, icon: Layers },
    { label: "Relations", value: rels.length, icon: Zap },
    { label: "Entities", value: [...new Set(nodes.flatMap(n => n.entities))].length, icon: Tag },
    { label: "HRR Encoded", value: nodes.filter(n => n.has_hrr).length, icon: Sparkles },
    { label: "Avg Trust", value: `${(nodes.reduce((a, n) => a + n.trust_score, 0) / (nodes.length || 1) * 100).toFixed(0)}%`, icon: Hash },
  ];

  const q = search.toLowerCase();
  const filtered = nodes.filter(n =>
    q === "" || n.text.toLowerCase().includes(q) || n.tags.some(t => t.includes(q)) || n.type.includes(q) || n.entities.some(e => e.toLowerCase().includes(q))
  );
  const filteredIds = new Set(filtered.map(n => n.id));

  // Init vis-network
  useEffect(() => {
    if (loading || !containerRef.current) return;

    const initNetwork = async () => {
      const { Network } = await import("vis-network");

      const visNodes = nodes.map(n => ({
        id: n.id,
        label: n.text.length > 55 ? n.text.slice(0, 55) + "…" : n.text,
        title: `${n.type.toUpperCase()}\n${n.text}\nTrust: ${(n.trust_score * 100).toFixed(0)}%`,
        group: n.category,
        value: n.trust_score * 15,
        color: {
          background: CAT_COLORS[n.category] || "oklch(0.5 0.1 0)",
          border: CAT_BORDERS[n.category] || "oklch(0.3 0.1 0)",
          highlight: {
            background: CAT_COLORS[n.category] || "oklch(0.5 0.1 0)",
            border: "oklch(0.8 0.2 0)",
          },
        },
        font: {
          size: 10,
          face: "monospace",
          color: "oklch(0.75 0.02 0)",
          strokeWidth: 0,
        },
        borderWidth: n.has_hrr ? 2 : 1,
        borderWidthSelected: 3,
        shape: n.has_hrr ? "dot" : "diamond",
        size: 15 + n.trust_score * 20,
      }));

      const visEdges = rels.map(r => ({
        from: r.from,
        to: r.to,
        title: r.type.replace(/_/g, " "),
        color: { color: EDGE_COLORS[r.type] || "oklch(0.5 0.02 0 / 0.3)" },
        font: {
          size: 7,
          face: "monospace",
          color: "oklch(0.6 0.05 0 / 0.5)",
          strokeWidth: 0,
        },
        smooth: { type: "continuous" },
        width: r.type === "shared_entity" ? 1.5 : 0.8,
        dashes: r.type === "high_trust_similarity",
      }));

      const network = new Network(containerRef.current!, { nodes: visNodes, edges: visEdges }, {
        nodes: { scaling: { min: 12, max: 45 } },
        edges: { arrows: { to: { enabled: false } } },
        physics: {
          solver: "forceAtlas2Based",
          forceAtlas2Based: {
            gravitationalConstant: -40,
            centralGravity: 0.003,
            springLength: 200,
            springConstant: 0.02,
            damping: 0.4,
          },
          stabilization: { iterations: 150 },
        },
        interaction: {
          hover: true,
          tooltipDelay: 100,
          navigationButtons: true,
          keyboard: true,
        },
        groups: Object.fromEntries(
          Object.keys(CAT_COLORS).map(cat => [
            cat,
            { color: { background: CAT_COLORS[cat], border: CAT_BORDERS[cat] } },
          ])
        ),
        layout: { improvedLayout: true },
      });

      networkRef.current = network;

      network.on("click", (params: any) => {
        if (params.nodes.length > 0) {
          setSelectedId(Number(params.nodes[0]));
          network.selectNodes(params.nodes);
        } else {
          setSelectedId(null);
          network.unselectAll();
        }
      });
      network.on("deselectNode", () => setSelectedId(null));

      setReady(true);
    };

    initNetwork();
    return () => {
      if (networkRef.current) { networkRef.current.destroy(); networkRef.current = null; }
    };
  }, [nodes, rels, loading]);

  // Highlight search
  useEffect(() => {
    if (!networkRef.current || !ready) return;
    if (search) networkRef.current.selectNodes(filtered.map(n => n.id));
    else networkRef.current.unselectAll();
  }, [search, ready, filtered]);

  const selected = selectedId ? nodes.find(n => n.id === selectedId) : null;
  const connectedIds = selected
    ? [...new Set([
        ...rels.filter(r => r.from === selected.id).map(r => r.to),
        ...rels.filter(r => r.to === selected.id).map(r => r.from),
      ])]
    : [];

  return (
    <DashboardPageLayout
      header={{
        title: "Memory Graph",
        description: `${nodes.length} facts · ${rels.length} relations · holographic knowledge graph`,
        icon: Network,
      }}
    >
      {/* Stats */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-4">
        {stats.map(s => (
          <div key={s.label} className="flex items-center gap-2 rounded-lg border border-border/30 bg-accent/5 px-3 py-2">
            <s.icon className="size-3.5 text-muted-foreground shrink-0" />
            <div>
              <div className="text-xs font-semibold">{String(s.value)}</div>
              <div className="text-[9px] text-muted-foreground font-mono uppercase tracking-wider">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Search + Controls */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search facts, entities, tags, types..."
            className="w-full rounded-lg border border-border bg-accent/20 pl-9 pr-3 py-2 text-sm outline-none focus:border-primary transition-colors"
          />
          {search && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-mono">
              {filtered.length}/{nodes.length}
            </span>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={fetchData}>
          <RefreshCw className={cn("size-4", loading && "animate-spin")} />
        </Button>
      </div>

      {/* Graph + Detail */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 min-h-[450px] rounded-xl border border-border/40 bg-accent/5 relative overflow-hidden">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-background/60">
              <div className="flex items-center gap-3">
                <div className="size-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                <span className="text-sm text-muted-foreground">Loading memory graph...</span>
              </div>
            </div>
          )}
          <div ref={containerRef} className="w-full h-full min-h-[450px]" />
        </div>

        {/* Side panel */}
        {selected ? (
          <div className="w-full lg:w-72 shrink-0 rounded-xl border border-border/40 bg-card p-4 max-h-[450px] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Selected</span>
              <button onClick={() => setSelectedId(null)} className="text-[10px] text-muted-foreground/50 hover:text-foreground">✕</button>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-block size-2.5 rounded-full shrink-0" style={{ background: CAT_COLORS[selected.category] || "oklch(0.5 0.1 0)" }} />
              <span className="text-[10px] font-semibold uppercase tracking-wider">{selected.type}</span>
              {selected.has_hrr && <Sparkles className="size-3 text-emerald-400 ml-auto" title="HRR encoded" />}
            </div>
            <p className="text-xs leading-relaxed mb-3">{selected.text}</p>

            {selected.entities.length > 0 && (
              <div className="mb-2">
                <div className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Entities</div>
                <div className="flex flex-wrap gap-1">
                  {selected.entities.map(e => (
                    <Badge key={e} variant="outline" className="text-[9px] text-purple-400 border-purple-500/30">{e}</Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-1 mb-3">
              {selected.tags.map(t => (
                <span key={t} className="text-[9px] px-1.5 py-0.5 rounded bg-accent/30 text-muted-foreground font-mono">#{t}</span>
              ))}
            </div>

            <div className="text-[10px] text-muted-foreground font-mono mb-3">
              Trust: {(selected.trust_score * 100).toFixed(0)}% · {formatTS(selected.timestamp)}
            </div>

            {connectedIds.length > 0 && (
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Connected ({connectedIds.length})</div>
                <div className="space-y-1">
                  {connectedIds.slice(0, 10).map(id => {
                    const node = nodes.find(n => n.id === id);
                    if (!node) return null;
                    return (
                      <button
                        key={id}
                        onClick={() => { setSelectedId(id); if (networkRef.current) networkRef.current.selectNodes([id]); }}
                        className="w-full text-left text-[10px] p-1.5 rounded bg-accent/10 hover:bg-accent/20 transition-colors line-clamp-2"
                      >
                        {node.text.slice(0, 80)}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full lg:w-72 shrink-0 rounded-xl border border-border/40 bg-card p-4 max-h-[450px]">
            <div className="flex items-center gap-2 mb-3">
              <Network className="size-4 text-muted-foreground" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Legend</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Categories</div>
              {Object.entries(CAT_COLORS).map(([type, color]) => (
                <div key={type} className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full shrink-0" style={{ background: color }} />
                  <span className="text-[10px] font-semibold uppercase tracking-wider">{type}</span>
                </div>
              ))}
              <div className="border-t border-border/30 pt-2 mt-2">
                <div className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Edges</div>
                {Object.entries(EDGE_COLORS).map(([type, color]) => (
                  <div key={type} className="flex items-center gap-2 text-[10px]">
                    <span className="w-4 h-0.5 shrink-0" style={{ background: color }} />
                    <span>{type.replace(/_/g, " ")}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-border/30 pt-2 mt-2">
                <div className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Shapes</div>
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="size-2.5 rounded-full bg-muted-foreground/50" />
                  <span>HRR encoded</span>
                </div>
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="size-2.5 rotate-45 bg-muted-foreground/30" style={{ clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" }} />
                  <span>No vector</span>
                </div>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground/50 mt-3 leading-relaxed">
              Click a node to see details. Drag to pan. Scroll to zoom. Search to highlight.
            </p>
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div className="flex items-center gap-4 mt-4 text-[10px] text-muted-foreground">
        <span className="font-semibold uppercase tracking-wider">Categories:</span>
        {Object.entries(CAT_COLORS).slice(0, 6).map(([type, color]) => (
          <span key={type} className="flex items-center gap-1.5">
            <span className="size-2 rounded-full" style={{ background: color }} />
            {type}
          </span>
        ))}
        <Button variant="ghost" size="sm" className="text-[10px] ml-auto h-6" asChild>
          <Link href="/memory">
            <Database className="size-3 mr-1" /> Browse Memory Hub
          </Link>
        </Button>
      </div>
    </DashboardPageLayout>
  );
}
