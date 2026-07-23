#!/usr/bin/env python3
"""
ZES Memory API — Backend for /api/memory endpoint.
Supports stats, facts, entities, memories, banks queries.
"""

import json
import os
import sqlite3
import sys

DB = os.path.expanduser("~/.zes/memory_hub.sqlite")


def get_conn():
    conn = sqlite3.connect(DB)
    conn.row_factory = sqlite3.Row
    return conn


def cmd_stats():
    conn = get_conn()
    facts = conn.execute("SELECT COUNT(*) FROM facts").fetchone()[0]
    facts_hrr = conn.execute("SELECT COUNT(*) FROM facts WHERE hrr_vector IS NOT NULL").fetchone()[0]
    entities = conn.execute("SELECT COUNT(*) FROM entities").fetchone()[0]
    links = conn.execute("SELECT COUNT(*) FROM fact_entities").fetchone()[0]
    memories = conn.execute("SELECT COUNT(*) FROM memories").fetchone()[0]
    banks = conn.execute("SELECT COUNT(*) FROM memory_banks").fetchone()[0]
    
    # Trust score distribution
    trust_dist = {}
    for row in conn.execute("SELECT CAST(trust_score * 10 AS INTEGER) * 10 AS bucket, COUNT(*) as cnt FROM facts GROUP BY bucket ORDER BY bucket"):
        trust_dist[f"{row['bucket']}%"] = row["cnt"]
    
    # Category distribution
    cat_dist = {}
    for row in conn.execute("SELECT category, COUNT(*) as cnt FROM facts GROUP BY category ORDER BY cnt DESC"):
        cat_dist[row["category"]] = row["cnt"]
    
    conn.close()
    return {
        "facts": facts,
        "facts_with_hrr": facts_hrr,
        "entities": entities,
        "fact_entity_links": links,
        "memories": memories,
        "memory_banks": banks,
        "trust_distribution": trust_dist,
        "category_distribution": cat_dist,
        "db_size": os.path.getsize(DB),
    }


def cmd_facts(limit=50, offset=0, search="", sort="trust_desc"):
    conn = get_conn()
    params = []
    
    order_map = {
        "trust_desc": "trust_score DESC",
        "trust_asc": "trust_score ASC",
        "newest": "created_at DESC",
        "oldest": "created_at ASC",
    }
    order = order_map.get(sort, "trust_score DESC")
    
    if search:
        try:
            # FTS5 search (escape double quotes for safety)
            safe_q = search.replace('"', '""')
            rows = conn.execute(
                f"""SELECT f.fact_id, f.content, f.category, f.tags, f.trust_score,
                           f.retrieval_count, f.helpful_count, f.created_at,
                           f.hrr_vector IS NOT NULL as has_hrr
                    FROM facts f
                    JOIN facts_fts fts ON fts.rowid = f.fact_id
                    WHERE facts_fts MATCH ?
                    ORDER BY f.{order}
                    LIMIT ? OFFSET ?""",
                (safe_q, limit, offset),
            ).fetchall()
            total = conn.execute(
                "SELECT COUNT(*) FROM facts_fts WHERE facts_fts MATCH ?",
                (safe_q,),
            ).fetchone()[0]
        except sqlite3.OperationalError:
            # Fall back to LIKE search if FTS5 fails (e.g. hyphenated terms)
            rows = conn.execute(
                f"""SELECT fact_id, content, category, tags, trust_score,
                           retrieval_count, helpful_count, created_at,
                           hrr_vector IS NOT NULL as has_hrr
                    FROM facts
                    WHERE content LIKE ? OR tags LIKE ? OR category LIKE ?
                    ORDER BY {order}
                    LIMIT ? OFFSET ?""",
                (f"%{search}%", f"%{search}%", f"%{search}%", limit, offset),
            ).fetchall()
            total = conn.execute(
                """SELECT COUNT(*) FROM facts
                   WHERE content LIKE ? OR tags LIKE ? OR category LIKE ?""",
                (f"%{search}%", f"%{search}%", f"%{search}%"),
            ).fetchone()[0]
    else:
        rows = conn.execute(
            f"""SELECT fact_id, content, category, tags, trust_score,
                       retrieval_count, helpful_count, created_at,
                       hrr_vector IS NOT NULL as has_hrr
                FROM facts
                ORDER BY {order}
                LIMIT ? OFFSET ?""",
            (limit, offset),
        ).fetchall()
        total = conn.execute("SELECT COUNT(*) FROM facts").fetchone()[0]
    
    facts = []
    for r in rows:
        d = dict(r)
        d["tags"] = d["tags"].split(",") if d.get("tags") else []
        # Get linked entities
        ents = conn.execute(
            """SELECT e.name, e.entity_type FROM entities e
               JOIN fact_entities fe ON fe.entity_id = e.entity_id
               WHERE fe.fact_id = ?""",
            (r["fact_id"],),
        ).fetchall()
        d["entities"] = [dict(e) for e in ents]
        facts.append(d)
    
    conn.close()
    return {"facts": facts, "total": total, "limit": limit, "offset": offset}


def cmd_entities():
    conn = get_conn()
    rows = conn.execute(
        """SELECT e.entity_id, e.name, e.entity_type, e.created_at,
                  COUNT(fe.fact_id) as fact_count
           FROM entities e
           LEFT JOIN fact_entities fe ON fe.entity_id = e.entity_id
           GROUP BY e.entity_id
           ORDER BY fact_count DESC, e.name"""
    ).fetchall()
    
    entities = []
    for r in rows:
        d = dict(r)
        # Get linked facts for each entity
        facts = conn.execute(
            """SELECT f.fact_id, f.content, f.trust_score
               FROM facts f
               JOIN fact_entities fe ON fe.fact_id = f.fact_id
               WHERE fe.entity_id = ?
               ORDER BY f.trust_score DESC
               LIMIT 5""",
            (r["entity_id"],),
        ).fetchall()
        d["facts"] = [dict(f) for f in facts]
        entities.append(d)
    
    conn.close()
    return {"entities": entities, "total": len(entities)}


def cmd_memories(limit=50, offset=0, search=""):
    conn = get_conn()
    params = []
    
    if search:
        rows = conn.execute(
            """SELECT id, type, scope, priority, content, tags, source, created_at
               FROM memories
               WHERE content LIKE ? OR tags LIKE ? OR type LIKE ? OR source LIKE ?
               ORDER BY id DESC
               LIMIT ? OFFSET ?""",
            (f"%{search}%", f"%{search}%", f"%{search}%", f"%{search}%", limit, offset),
        ).fetchall()
        total = conn.execute(
            """SELECT COUNT(*) FROM memories
               WHERE content LIKE ? OR tags LIKE ? OR type LIKE ? OR source LIKE ?""",
            (f"%{search}%", f"%{search}%", f"%{search}%", f"%{search}%"),
        ).fetchone()[0]
    else:
        rows = conn.execute(
            "SELECT id, type, scope, priority, content, tags, source, created_at FROM memories ORDER BY id DESC LIMIT ? OFFSET ?",
            (limit, offset),
        ).fetchall()
        total = conn.execute("SELECT COUNT(*) FROM memories").fetchone()[0]
    
    memories = []
    for r in rows:
        d = dict(r)
        d["tags"] = d["tags"].split(",") if d.get("tags") else []
        memories.append(d)
    
    conn.close()
    return {"memories": memories, "total": total, "limit": limit, "offset": offset}


def cmd_banks():
    conn = get_conn()
    rows = conn.execute(
        "SELECT bank_id, bank_name, dim, fact_count, updated_at FROM memory_banks"
    ).fetchall()
    conn.close()
    return {"banks": [dict(r) for r in rows]}


CMDS = {
    "stats": cmd_stats,
    "facts": cmd_facts,
    "entities": cmd_entities,
    "memories": cmd_memories,
    "banks": cmd_banks,
}


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "no command"}))
        sys.exit(1)
    
    cmd = sys.argv[1]
    args = sys.argv[2:]
    
    if cmd in CMDS:
        try:
            result = CMDS[cmd](*args)
            print(json.dumps(result))
        except Exception as e:
            print(json.dumps({"error": str(e)}))
    else:
        print(json.dumps({"error": f"unknown command: {cmd}"}))
