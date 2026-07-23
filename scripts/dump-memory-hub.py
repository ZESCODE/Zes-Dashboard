import sqlite3, json, sys, os

db_path = os.path.expanduser("~/.zes/memory_hub.sqlite")
if not os.path.isfile(db_path):
    print(json.dumps({"memories": [], "facts": [], "memory_count": 0, "fact_count": 0, "error": "db not found"}))
    sys.exit(0)

conn = sqlite3.connect(db_path)
conn.row_factory = sqlite3.Row

memories = []
for r in conn.execute('SELECT id, type, scope, priority, content, tags, source, created_at FROM memories ORDER BY id'):
    d = dict(r)
    d["tags"] = d["tags"].split(",") if d.get("tags") else []
    memories.append(d)

facts = []
for r in conn.execute('SELECT fact_id, category, content, tags, trust_score, retrieval_count, helpful_count, created_at FROM facts ORDER BY fact_id'):
    d = dict(r)
    d["tags"] = d["tags"].split(",") if d.get("tags") else []
    facts.append(d)

print(json.dumps({
    "memories": memories,
    "facts": facts,
    "memory_count": len(memories),
    "fact_count": len(facts),
}))
conn.close()
