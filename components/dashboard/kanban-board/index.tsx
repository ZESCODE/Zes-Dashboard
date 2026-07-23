"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  closestCorners,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  GripVertical,
  Plus,
  MoreHorizontal,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Play,
  XCircle,
  RotateCw,
} from "lucide-react";

/* ────────────── Types ────────────── */

interface KanbanTask {
  id: string;
  title: string;
  body: string;
  status: string;
  priority: number;
  created_by: string;
  created_at: number;
  assignee?: string;
}

const COLUMNS = [
  { id: "triage",   label: "Triage",   color: "text-muted-foreground" },
  { id: "todo",     label: "To Do",    color: "text-muted-foreground" },
  { id: "scheduled",label: "Scheduled",color: "text-info" },
  { id: "ready",    label: "Ready",    color: "text-info" },
  { id: "running",  label: "Running",  color: "text-warning" },
  { id: "blocked",  label: "Blocked",  color: "text-destructive" },
  { id: "review",   label: "Review",   color: "text-warning" },
  { id: "done",     label: "Done",     color: "text-success" },
];

/* ────────────── Task Card ────────────── */

function TaskCard({ task }: { task: KanbanTask }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    touchAction: "none" as const,
  };

  const priorityLabel = task.priority >= 3 ? "HIGH" : task.priority >= 1 ? "MED" : "LOW";
  const priorityColor = task.priority >= 3 ? "text-destructive border-destructive/30" :
    task.priority >= 1 ? "text-warning border-warning/30" : "text-muted-foreground border-border/30";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-lg border bg-card p-3 cursor-grab active:cursor-grabbing transition-shadow",
        isDragging ? "shadow-lg opacity-50 z-50" : "shadow-sm hover:border-primary/30"
      )}
      {...attributes}
      {...listeners}
      aria-label={`Task: ${task.title}, Priority: ${priorityLabel}, Status: ${task.status}`}
      role="button"
      tabIndex={0}
    >
      <div className="flex items-start gap-2">
        <GripVertical className="size-3.5 text-muted-foreground/40 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium leading-snug mb-1">{task.title}</div>
          {task.body && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{task.body}</p>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn("text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border", priorityColor)}>
              {priorityLabel}
            </span>
            {task.assignee && (
              <Badge variant="outline" className="text-[9px]">{task.assignee}</Badge>
            )}
            {task.created_by && task.created_by !== "dashboard" && (
              <span className="text-[9px] text-muted-foreground font-mono">{task.created_by}</span>
            )}
            {task.created_at > 0 && (
              <span className="text-[9px] text-muted-foreground font-mono ml-auto">
                {Math.floor((Date.now() / 1000 - task.created_at) / 3600)}h
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ────────────── Column ────────────── */

function Column({
  column,
  tasks,
  onAddTask,
}: {
  column: typeof COLUMNS[0];
  tasks: KanbanTask[];
  onAddTask: (status: string) => void;
}) {
  const taskIds = tasks.map((t) => t.id);

  return (
    <div className="flex flex-col min-w-[260px] w-[260px] shrink-0">
      <div className="flex items-center justify-between px-1 mb-3">
        <div className="flex items-center gap-2">
          <div className={cn("size-2 rounded-full", column.color.replace("text-", "bg-"))} />
          <span className="text-sm font-semibold uppercase tracking-wider">{column.label}</span>
          <span className="text-xs text-muted-foreground font-mono">{tasks.length}</span>
        </div>
        <button
          onClick={() => onAddTask(column.id)}
          className="size-5 rounded hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <Plus className="size-3.5" />
        </button>
      </div>

      <div className="flex-1 space-y-2 min-h-[60px] rounded-lg bg-accent/10 p-2">
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </SortableContext>
        {tasks.length === 0 && (
          <div className="flex items-center justify-center h-16 text-xs text-muted-foreground/50">
            <span>Drop tasks here</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ────────────── Main ────────────── */

export function KanbanBoard() {
  const [columns, setColumns] = useState<{ [key: string]: KanbanTask[] }>({});
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editingStatus, setEditingStatus] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const fetchBoard = useCallback(async () => {
    try {
      const res = await fetch("http://127.0.0.1:5002/api/kanban/board");
      const data = await res.json();
      if (data.columns) {
        const grouped: { [key: string]: KanbanTask[] } = {};
        data.columns.forEach((col: any) => {
          grouped[col.name] = col.tasks || [];
        });
        setColumns(grouped);
      }
    } catch {
      // Fallback to empty
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBoard();
    const iv = setInterval(fetchBoard, 15000);
    return () => clearInterval(iv);
  }, [fetchBoard]);

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      await fetch(`http://127.0.0.1:5002/api/kanban/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch {}
  };

  const createTask = async (status: string) => {
    if (!newTitle.trim()) return;
    try {
      await fetch("http://127.0.0.1:5002/api/kanban/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          status,
          body: "",
          created_by: "dashboard",
          priority: 1,
        }),
      });
      setNewTitle("");
      setEditingStatus(null);
      await fetchBoard();
    } catch {}
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeTaskId = active.id as string;
    const overContainer = over.data.current?.sortable?.containerId || over.id;

    // Find which column the task belongs to now
    let fromStatus = "";
    let task: KanbanTask | undefined;
    for (const [status, tasks] of Object.entries(columns)) {
      const found = tasks.find((t) => t.id === activeTaskId);
      if (found) {
        fromStatus = status;
        task = found;
        break;
      }
    }

    if (!task) return;

    // Find target column
    let toStatus = "";
    for (const [status, tasks] of Object.entries(columns)) {
      if (status === overContainer || tasks.some((t) => t.id === overContainer)) {
        toStatus = status;
        break;
      }
    }

    if (!toStatus || fromStatus === toStatus) return;

    // Optimistic update
    setColumns((prev) => {
      const updated = { ...prev };
      updated[fromStatus] = updated[fromStatus].filter((t) => t.id !== activeTaskId);
      updated[toStatus] = [{ ...task!, status: toStatus }, ...(updated[toStatus] || [])];
      return updated;
    });

    // API call
    updateTaskStatus(activeTaskId, toStatus);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RotateCw className="size-6 animate-spin text-muted-foreground" />
        <span className="ml-3 text-sm text-muted-foreground">Loading kanban board...</span>
      </div>
    );
  }

  const activeTask = activeId
    ? Object.values(columns).flat().find((t) => t.id === activeId)
    : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scroll-smooth touch:overflow-x-auto">
        {COLUMNS.map((col) => (
          <div key={col.id} className="snap-start shrink-0">
            <Column
              column={col}
              tasks={columns[col.id] || []}
              onAddTask={(status) => setEditingStatus(status)}
            />
          </div>
        ))}
      </div>

      {/* New task dialog */}
      {editingStatus && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center" onClick={() => { setEditingStatus(null); setNewTitle(""); }}>
          <div className="bg-card rounded-xl border shadow-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-lg mb-1">Add Task</h3>
            <p className="text-xs text-muted-foreground mb-4">to <strong>{COLUMNS.find(c => c.id === editingStatus)?.label}</strong></p>
            <input
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createTask(editingStatus)}
              placeholder="Task title..."
              className="w-full rounded-lg border border-border bg-accent/30 px-3 py-2 text-sm outline-none focus:border-primary mb-4"
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => { setEditingStatus(null); setNewTitle(""); }}>Cancel</Button>
              <Button size="sm" onClick={() => createTask(editingStatus)}>Create</Button>
            </div>
          </div>
        </div>
      )}

      <DragOverlay>
        {activeTask ? (
          <div className="rounded-lg border bg-card p-3 shadow-xl">
            <div className="text-sm font-medium">{activeTask.title}</div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
