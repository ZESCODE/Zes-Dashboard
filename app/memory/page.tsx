"use client";

import React, { useState, useEffect, useCallback } from "react";
import DashboardPageLayout from "@/components/dashboard/layout";
import DashboardCard from "@/components/dashboard/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search, Database, Hash, Layers, Zap, Tag, Clock, Info,
  Network, AlertCircle, CheckCircle2, Sparkles, ArrowUpDown,
  Eye, EyeOff, RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

/* ────────────── Types ────────────── */

interface Fact {
  fact_id: number;
  content: string;
  category: string;
  tags: string[];
  trust_score: number;
  retrieval_count: number;
  helpful_count: number;
  created_at: string;
  has_hrr: boolean;
  entities: { name: string; entity_type: string }[];
}

interface Memory {
  id: number;
  type: string;
  scope: string;
  priority: string;
  content: string;
  tags: string[];
  source: string;
  created_at: string;
}

interface Entity {
  entity_id: number;
  name: string;
  entity_type: string;
  fact_count: number;
  facts: { fact_id: number; content: string; trust_score: number }[];
}

interface Stats {
  facts: number;
  facts_with_hrr: number;
  entities: number;
  fact_entity_links: number;
  memories: number;
  memory_banks: number;
  trust_distribution: Record<string, number>;
  category_distribution: Record<string, number>;
  db_size: number;
}

/* ────────────── Component ────────────── */

const CATEGORY_COLORS: Record<string, string> = {
  fact: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  decision: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  pattern: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  preference: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  bugfix: "bg-rose-500/20 text-rose-400 border-rose-500/30",
  insight: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
};

export default function MemoryHubPage() {
  const [activeTab, setActiveTab] = useState<"facts" | "memories" | "entities">("facts");
  const [stats, setStats] = useState<Stats | null>(null);
  const [facts, setFacts] = useState<Fact[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("trust_desc");
  const [selectedFact, setSelectedFact] = useState<Fact | null>(null);

  const fetchStats = useCallback(async () => {
    const res = await fetch("/api/memory?path=stats");
    if (res.ok) setStats(await res.json());
  }, []);

  const fetchFacts = useCallback(async (q = "", s = "trust_desc") => {
    const res = await fetch(`/api/memory?path=facts&limit=50&offset=0&q=${encodeURIComponent(q)}&sort=${s}`);
    if (res.ok) {
      const d = await res.json();
      setFacts(d.facts || []);
    }
  }, []);

  const fetchMemories = useCallback(async (q = "") => {
    const res = await fetch(`/api/memory?path=memories&limit=50&offset=0&q=${encodeURIComponent(q)}`);
    if (res.ok) {
      const d = await res.json();
      setMemories(d.memories || []);
    }
  }, []);

  const fetchEntities = useCallback(async () => {
    const res = await fetch("/api/memory?path=entities");
    if (res.ok) {
      const d = await res.json();
      setEntities(d.entities || []);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchStats(),
      fetchFacts(),
      fetchMemories(),
      fetchEntities(),
    ]).finally(() => setLoading(false));
  }, [fetchStats, fetchFacts, fetchMemories, fetchEntities]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === "facts") fetchFacts(query, sort);
    else if (activeTab === "memories") fetchMemories(query);
  };

  return (
    <DashboardPageLayout
      header={{
        title: "Memory Hub",
        description: "Holographic fact store × entity graph × cross-session recall",
        icon: Database,
      }}
    >
      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
          <StatCard icon={Database} label="Facts" value={String(stats.facts)} sub={`${stats.facts_with_hrr} with HRR`} color="text-emerald-400" />
          <StatCard icon={Hash} label="Entities" value={String(stats.entities)} sub={`${stats.fact_entity_links} links`} color="text-purple-400" />
          <StatCard icon={Layers} label="Memories" value={String(stats.memories)} sub="cross-session" color="text-blue-400" />
          <StatCard icon={Zap} label="Banks" value={String(stats.memory_banks)} sub="bundled" color="text-amber-400" />
          <StatCard icon={Database} label="DB Size" value={`${(stats.db_size / 1024).toFixed(0)}KB`} sub="~/.zes/memory_hub.sqlite" color="text-cyan-400" />
        </div>
      )}

      {/* Tabs + Search */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {(["facts", "memories", "entities"] as const).map(tab => (
          <Button
            key={tab}
            variant={activeTab === tab ? "default" : "outline"}
            size="sm"
            onClick={() => { setActiveTab(tab); setSelectedFact(null); }}
            className="text-xs capitalize"
          >
            {tab}
          </Button>
        ))}
        <div className="flex-1" />
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder={`Search ${activeTab}...`}
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="pl-9 text-sm w-48 md:w-64"
            />
          </div>
          <Button type="submit" variant="default" size="sm" className="text-xs">
            Search
          </Button>
        </form>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setQuery("");
            if (activeTab === "facts") fetchFacts("", sort);
            else if (activeTab === "memories") fetchMemories("");
            setLoading(true);
            Promise.all([fetchStats(), fetchFacts(), fetchMemories(), fetchEntities()])
              .finally(() => setLoading(false));
          }}
        >
          <RefreshCw className={cn("size-4", loading && "animate-spin")} />
        </Button>
      </div>

      {/* Sort for facts */}
      {activeTab === "facts" && (
        <div className="flex gap-2 mb-3">
          <span className="text-xs text-muted-foreground self-center">Sort:</span>
          {[
            { key: "trust_desc", label: "Trust ↓" },
            { key: "trust_asc", label: "Trust ↑" },
            { key: "newest", label: "Newest" },
            { key: "oldest", label: "Oldest" },
          ].map(s => (
            <Button
              key={s.key}
              variant={sort === s.key ? "secondary" : "ghost"}
              size="sm"
              className="text-[10px] h-6 px-2"
              onClick={() => { setSort(s.key); fetchFacts(query, s.key); }}
            >
              {s.label}
            </Button>
          ))}
          <div className="flex-1" />
          <Badge variant="outline" className="text-[10px]">
            {facts.length} facts
          </Badge>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">
          <RefreshCw className="size-6 mx-auto mb-2 animate-spin opacity-50" />
          Loading memory hub...
        </div>
      ) : activeTab === "facts" ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {facts.map(f => (
            <FactCard
              key={f.fact_id}
              fact={f}
              selected={selectedFact?.fact_id === f.fact_id}
              onSelect={setSelectedFact}
            />
          ))}
          {facts.length === 0 && (
            <div className="col-span-2 text-center py-12 text-muted-foreground">
              No facts found{query ? ` for "${query}"` : ""}
            </div>
          )}
        </div>
      ) : activeTab === "entities" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {entities.map(e => (
            <EntityCard key={e.entity_id} entity={e} />
          ))}
          {entities.length === 0 && (
            <div className="col-span-3 text-center py-12 text-muted-foreground">
              No entities found
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {memories.map(m => (
            <MemoryCard key={m.id} memory={m} />
          ))}
          {memories.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No memories found{query ? ` for "${query}"` : ""}
            </div>
          )}
        </div>
      )}

      {/* Links */}
      <div className="mt-6 flex gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link href="/memory-graph">
            <Network className="size-4 mr-1" /> View Memory Graph
          </Link>
        </Button>
        <span className="text-[10px] text-muted-foreground self-center">
          HRR holographic vectors: {stats?.facts_with_hrr}/{stats?.facts} facts encoded
        </span>
      </div>
    </DashboardPageLayout>
  );
}

/* ────────────── Sub-components ────────────── */

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: any; label: string; value: string; sub: string; color: string;
}) {
  return (
    <div className="bg-accent/20 rounded-lg p-3 flex items-center gap-2">
      <Icon className={cn("size-5 shrink-0", color)} />
      <div>
        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</div>
        <div className="text-sm font-mono font-bold">{value}</div>
        <div className="text-[9px] text-muted-foreground">{sub}</div>
      </div>
    </div>
  );
}

function FactCard({ fact, selected, onSelect }: {
  fact: Fact; selected: boolean; onSelect: (f: Fact | null) => void;
}) {
  return (
    <div
      className={cn(
        "bg-accent/10 rounded-lg p-3 border transition-all cursor-pointer",
        selected
          ? "border-primary/60 ring-1 ring-primary/30"
          : "border-border/40 hover:border-primary/30"
      )}
      onClick={() => onSelect(selected ? null : fact)}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge
            variant="outline"
            className={cn("text-[10px] font-mono border", CATEGORY_COLORS[fact.category] || "bg-gray-500/20 text-gray-400")}
          >
            {fact.category}
          </Badge>
          {fact.has_hrr ? (
            <Sparkles className="size-3 text-emerald-400" title="HRR vector encoded" />
          ) : (
            <AlertCircle className="size-3 text-amber-400" title="No HRR vector" />
          )}
          <span className="text-[10px] font-mono text-muted-foreground">
            {(fact.trust_score * 100).toFixed(0)}%
          </span>
          {fact.tags.slice(0, 3).map(t => (
            <Badge key={t} variant="secondary" className="text-[9px]">#{t}</Badge>
          ))}
        </div>
        <span className="text-[9px] text-muted-foreground font-mono shrink-0">
          #{fact.fact_id}
        </span>
      </div>
      <p className="text-sm leading-relaxed">{fact.content}</p>
      {fact.entities.length > 0 && (
        <div className="flex items-center gap-1.5 mt-2">
          <Tag className="size-3 text-muted-foreground" />
          {fact.entities.map(e => (
            <Badge key={e.name} variant="outline" className="text-[9px] text-purple-400 border-purple-500/30">
              {e.name}
            </Badge>
          ))}
        </div>
      )}
      {selected && (
        <div className="mt-2 pt-2 border-t border-border/30 text-[10px] text-muted-foreground font-mono">
          Retrievals: {fact.retrieval_count} · Helpful: {fact.helpful_count} · Created: {new Date(fact.created_at).toLocaleString()}
        </div>
      )}
    </div>
  );
}

function EntityCard({ entity }: { entity: Entity }) {
  return (
    <div className="bg-accent/10 rounded-lg p-3 border border-border/40">
      <div className="flex items-center gap-2 mb-1">
        <Network className="size-4 text-purple-400" />
        <span className="text-sm font-semibold">{entity.name}</span>
        <Badge variant="outline" className="text-[9px]">{entity.entity_type}</Badge>
        <Badge variant="secondary" className="text-[9px] ml-auto">{entity.fact_count} facts</Badge>
      </div>
      {entity.facts.length > 0 && (
        <div className="mt-2 space-y-1">
          {entity.facts.map(f => (
            <div key={f.fact_id} className="text-[11px] text-muted-foreground pl-3 border-l border-border/40">
              <span className="text-[9px] opacity-50">#{f.fact_id}</span> {f.content.slice(0, 80)}…
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MemoryCard({ memory }: { memory: Memory }) {
  const typeColors: Record<string, string> = {
    preference: "bg-blue-500/20 text-blue-400",
    decision: "bg-amber-500/20 text-amber-400",
    pattern: "bg-purple-500/20 text-purple-400",
    fact: "bg-emerald-500/20 text-emerald-400",
    feedback: "bg-rose-500/20 text-rose-400",
  };
  return (
    <div className="bg-accent/10 rounded-lg p-3 border border-border/40">
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge variant="outline" className={cn("text-[10px] font-mono", typeColors[memory.type] || "")}>
            {memory.type}
          </Badge>
          {memory.priority && (
            <Badge variant="secondary" className="text-[9px]">{memory.priority}</Badge>
          )}
          {memory.tags.slice(0, 3).map(t => (
            <Badge key={t} variant="secondary" className="text-[9px]">#{t}</Badge>
          ))}
        </div>
        <span className="text-[9px] text-muted-foreground font-mono shrink-0">
          {memory.source} · {memory.created_at ? new Date(memory.created_at).toLocaleDateString() : ""}
        </span>
      </div>
      <p className="text-sm leading-relaxed">{memory.content}</p>
    </div>
  );
}
