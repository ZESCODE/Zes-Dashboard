#!/data/data/com.termux/files/usr/bin/bash
# Warm up cold compilation pages for ZES Dashboard
# Called after zes-dashboard-next service starts
# Targets heavy bundles: vis-network, dnd-kit, recharts

HOST="http://127.0.0.1:7070"
PAGES=(
  "/memory-graph"
  "/kanban"
  "/orchestrator"
  "/skills"
  "/memory"
  "/tasks"
  "/topology"
  "/processes"
  "/laboratory"
  "/service"
  "/system"
)

echo "[warmup] Warming ${#PAGES[@]} pages..."
for page in "${PAGES[@]}"; do
  echo -n "  GET $page ... "
  CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 300 "$HOST$page" 2>/dev/null)
  echo "$CODE"
done
echo "[warmup] Done."
