"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Check, X, GripVertical } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Habit } from "@/lib/types";

export function HabitManager({
  habits,
  onAdd,
  onRename,
  onReorder,
  onRemove,
}: {
  habits: Habit[];
  onAdd: (name: string) => void;
  onRename: (id: string, name: string) => void;
  onReorder: (habits: Habit[]) => void;
  onRemove: (id: string) => void;
}) {
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);

  function addHabit() {
    const name = newName.trim();
    if (!name) return;
    onAdd(name);
    setNewName("");
  }

  function startEdit(h: Habit) {
    setEditingId(h.id);
    setEditText(h.name);
  }

  function saveEdit() {
    const name = editText.trim();
    if (name && editingId) onRename(editingId, name);
    setEditingId(null);
  }

  function handleDrop(targetId: string) {
    if (!dragId || dragId === targetId) return;
    const fromIndex = habits.findIndex((h) => h.id === dragId);
    const toIndex = habits.findIndex((h) => h.id === targetId);
    if (fromIndex === -1 || toIndex === -1) return;
    const next = [...habits];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    onReorder(next);
    setDragId(null);
  }

  return (
    <div>
      <div className="mb-4 space-y-2">
        {habits.map((h) => (
          <div
            key={h.id}
            draggable={editingId !== h.id}
            onDragStart={() => setDragId(h.id)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(h.id)}
            className="flex items-center gap-2 rounded-md border border-hairline bg-panel-raised px-3 py-2.5"
          >
            <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-ledger-faint" />
            {editingId === h.id ? (
              <>
                <Input
                  autoFocus
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                  className="flex-1"
                />
                <button onClick={saveEdit} className="shrink-0 text-teal hover:text-teal/80">
                  <Check className="h-4 w-4" />
                </button>
                <button onClick={() => setEditingId(null)} className="shrink-0 text-ledger-faint hover:text-ledger-text">
                  <X className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm text-ledger-text">{h.name}</span>
                <button onClick={() => startEdit(h)} className="shrink-0 text-ledger-faint hover:text-brass">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => onRemove(h.id)} className="shrink-0 text-ledger-faint hover:text-clay">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addHabit()}
          placeholder="e.g. Cold plunge"
          className="flex-1"
        />
        <Button onClick={addHabit} disabled={!newName.trim()}>
          <Plus className="h-4 w-4" /> Add
        </Button>
      </div>
    </div>
  );
}
