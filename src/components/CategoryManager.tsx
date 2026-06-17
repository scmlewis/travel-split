import { useState, useMemo } from "react";
import { BUILT_IN_CATEGORIES, getCategoryLabel } from "../types";
import type { BuiltInCategory } from "../types";
import { PencilIcon, XIcon, PlusIcon } from "./Icons";

interface CategoryManagerProps {
  customCategories: string[];
  onUpdate: (categories: string[]) => void;
}

export default function CategoryManager({ customCategories, onUpdate }: CategoryManagerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [newCat, setNewCat] = useState("");
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");

  const allCategories = useMemo(
    () => [...(Object.keys(BUILT_IN_CATEGORIES) as BuiltInCategory[]), ...customCategories],
    [customCategories],
  );

  const handleAdd = () => {
    const name = newCat.trim();
    if (!name) return;
    if (allCategories.some((c) => c.toLowerCase() === name.toLowerCase())) return;
    onUpdate([...customCategories, name]);
    setNewCat("");
  };

  const handleDelete = (cat: string) => {
    onUpdate(customCategories.filter((c) => c !== cat));
  };

  const handleRename = (oldName: string) => {
    const name = editValue.trim();
    if (!name) return;
    if (allCategories.some((c) => c.toLowerCase() === name.toLowerCase() && c !== oldName)) return;
    onUpdate(customCategories.map((c) => (c === oldName ? name : c)));
    setEditingIdx(null);
    setEditValue("");
  };

  return (
    <div>
      <div className="flex items-center justify-end mb-2">
        <button onClick={() => setIsEditing(!isEditing)} className="text-xs font-medium min-h-[32px] px-2 rounded-lg" style={{ color: "var(--accent)" }}>
          {isEditing ? "Done" : "Edit"}
        </button>
      </div>

      {isEditing && (
        <div className="card p-3 space-y-2 mb-3">
          <div className="flex gap-2">
            <input className="flex-1 rounded-lg px-3 py-2 text-sm min-h-[36px]" value={newCat} onChange={(e) => setNewCat(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAdd()} placeholder="New category name" />
            <button onClick={handleAdd} className="gradient-accent text-white px-3 py-2 rounded-lg text-sm font-semibold min-h-[36px] flex items-center gap-1">
              <PlusIcon className="w-3.5 h-3.5" /> Add
            </button>
          </div>

          <div className="space-y-1 max-h-[200px] overflow-y-auto">
            {(Object.keys(BUILT_IN_CATEGORIES) as BuiltInCategory[]).map((cat) => (
              <div key={cat} className="flex items-center justify-between px-3 py-2 rounded-lg text-sm" style={{ background: "var(--surface-elevated)" }}>
                <span style={{ color: "var(--text-primary)" }}>{getCategoryLabel(cat)}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "var(--border)", color: "var(--text-muted)" }}>built-in</span>
              </div>
            ))}
            {customCategories.map((cat, idx) => (
              <div key={cat} className="flex items-center justify-between px-3 py-2 rounded-lg text-sm" style={{ background: "var(--surface-elevated)" }}>
                {editingIdx === idx ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input className="flex-1 rounded-lg px-2 py-1 text-sm min-h-[32px]" value={editValue} onChange={(e) => setEditValue(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleRename(cat)} autoFocus />
                    <button onClick={() => handleRename(cat)} className="text-xs px-2 py-1 rounded-lg" style={{ color: "var(--accent)" }}>Save</button>
                    <button onClick={() => { setEditingIdx(null); setEditValue(""); }} className="text-xs px-2 py-1 rounded-lg" style={{ color: "var(--text-muted)" }}>Cancel</button>
                  </div>
                ) : (
                  <>
                    <span style={{ color: "var(--text-primary)" }}>{cat}</span>
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setEditingIdx(idx); setEditValue(cat); }} className="p-1.5 rounded-lg hover:opacity-70" style={{ color: "var(--text-muted)" }}>
                        <PencilIcon className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(cat)} className="p-1.5 rounded-lg hover:text-red-500" style={{ color: "var(--text-muted)" }}>
                        <XIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
