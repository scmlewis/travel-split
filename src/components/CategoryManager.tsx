import { useState, useMemo } from "react";
import { BUILT_IN_CATEGORIES, getCategoryLabel } from "../types";
import type { BuiltInCategory } from "../types";
import { XIcon, PlusIcon } from "./Icons";

interface CategoryManagerProps {
  customCategories: string[];
  onUpdate: (categories: string[]) => void;
}

export default function CategoryManager({ customCategories, onUpdate }: CategoryManagerProps) {
  const [newCat, setNewCat] = useState("");

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

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {(Object.keys(BUILT_IN_CATEGORIES) as BuiltInCategory[]).map((cat) => (
          <span
            key={cat}
            className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-full"
            style={{ background: "var(--md-sys-color-surface-container-high)", color: "var(--md-sys-color-on-surface)" }}
          >
            {getCategoryLabel(cat)}
            <span className="text-[9px] px-1 py-0.5 rounded" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>built-in</span>
          </span>
        ))}
        {customCategories.map((cat) => (
          <span
            key={cat}
            className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-full animate-fadeIn"
            style={{ background: "var(--md-sys-color-primary-container)", color: "var(--md-sys-color-on-primary-container)" }}
          >
            {cat}
            <button
              onClick={() => handleDelete(cat)}
              className="hover:text-red-500 transition-colors min-w-[20px] min-h-[20px] flex items-center justify-center rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
              aria-label={`Remove category ${cat}`}
            >
              <XIcon className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          className="flex-1 rounded-lg px-3 py-2 text-sm min-h-[36px]"
          value={newCat}
          onChange={(e) => setNewCat(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Add category"
          aria-label="New category name"
        />
        <button
          onClick={handleAdd}
          className="text-sm px-3 py-2 rounded-lg transition-opacity btn-press min-h-[36px] min-w-[36px] flex items-center justify-center"
          style={{ background: "var(--md-sys-color-surface-container-high)", color: "var(--md-sys-color-on-surface-variant)" }}
          aria-label="Add category"
        >
          <PlusIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
