"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Check, X, GripVertical } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Rule } from "@/lib/types";

export function RulesManager({
  rules,
  onChange,
}: {
  rules: Rule[];
  onChange: (rules: Rule[]) => void;
}) {
  const [newRuleText, setNewRuleText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);

  function addRule() {
    const text = newRuleText.trim();
    if (!text) return;
    onChange([...rules, { id: crypto.randomUUID(), text }]);
    setNewRuleText("");
  }

  function startEdit(rule: Rule) {
    setEditingId(rule.id);
    setEditText(rule.text);
  }

  function saveEdit() {
    const text = editText.trim();
    if (!text || !editingId) {
      setEditingId(null);
      return;
    }
    onChange(rules.map((r) => (r.id === editingId ? { ...r, text } : r)));
    setEditingId(null);
  }

  function deleteRule(id: string) {
    onChange(rules.filter((r) => r.id !== id));
  }

  function handleDrop(targetId: string) {
    if (!dragId || dragId === targetId) return;
    const fromIndex = rules.findIndex((r) => r.id === dragId);
    const toIndex = rules.findIndex((r) => r.id === targetId);
    if (fromIndex === -1 || toIndex === -1) return;
    const next = [...rules];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    onChange(next);
    setDragId(null);
  }

  return (
    <div>
      {rules.length === 0 ? (
        <p className="mb-4 text-sm italic text-ledger-muted">
          No rules defined yet. Write down what &ldquo;the plan&rdquo; actually is — this is what
          every trade gets checked against.
        </p>
      ) : (
        <div className="mb-4 space-y-2">
          {rules.map((rule) => (
            <div
              key={rule.id}
              draggable={editingId !== rule.id}
              onDragStart={() => setDragId(rule.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(rule.id)}
              className="flex items-center gap-2 rounded-md border border-hairline bg-panel-raised px-3 py-2.5"
            >
              <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-ledger-faint" />
              {editingId === rule.id ? (
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
                  <span className="flex-1 text-sm text-ledger-text">{rule.text}</span>
                  <button onClick={() => startEdit(rule)} className="shrink-0 text-ledger-faint hover:text-brass">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => deleteRule(rule.id)} className="shrink-0 text-ledger-faint hover:text-clay">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Input
          value={newRuleText}
          onChange={(e) => setNewRuleText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addRule()}
          placeholder="e.g. Never risk more than 1% per trade"
          className="flex-1"
        />
        <Button onClick={addRule} disabled={!newRuleText.trim()}>
          <Plus className="h-4 w-4" /> Add
        </Button>
      </div>
    </div>
  );
}
