import { useState } from "react";
import { useConfig } from "../context/ConfigContext";
import type { Macro } from "../types";
import { MacroEditor } from "./MacroEditor";

function IconMacroEmpty() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3 1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6Z" />
      <path d="M18.5 14.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8Z" />
    </svg>
  );
}

function IconPlus() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function MacroTab() {
  const { config, saveConfig } = useConfig();
  const [editing, setEditing] = useState<Macro | null | "new">(null);

  if (!config) return null;

  const handleSave = async (macro: Macro) => {
    const exists = config.macros.some((m) => m.id === macro.id);
    const macros = exists
      ? config.macros.map((m) => (m.id === macro.id ? macro : m))
      : [...config.macros, macro];
    await saveConfig({ ...config, macros });
    setEditing(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("このマクロを削除しますか？")) return;
    const macros = config.macros.filter((m) => m.id !== id);
    const endpoints = config.endpoints.map((ep) =>
      ep.assigned_macro_id === id ? { ...ep, assigned_macro_id: null } : ep
    );
    await saveConfig({ ...config, macros, endpoints });
  };

  return (
    <div className="tab-panel">
      <div className="tab-toolbar">
        <button type="button" className="btn-primary" onClick={() => setEditing("new")}>
          <IconPlus />
          新規マクロ
        </button>
      </div>

      {config.macros.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <IconMacroEmpty />
          </div>
          <h3>マクロがありません</h3>
          <p>マクロを作成すると、スイッチに割り当てて Mac の操作を自動化できます。</p>
        </div>
      ) : (
        <ul className="macro-list">
          {config.macros.map((macro) => (
            <li key={macro.id} className="card macro-item">
              <div>
                <strong>{macro.name}</strong>
                <p className="muted small">
                  ON: {macro.on_actions.length} / OFF: {macro.off_actions.length} アクション
                </p>
              </div>
              <div className="macro-actions">
                <button type="button" onClick={() => setEditing(macro)}>
                  編集
                </button>
                <button
                  type="button"
                  className="btn-danger"
                  onClick={() => void handleDelete(macro.id)}
                >
                  削除
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing !== null && (
        <MacroEditor
          macro={editing === "new" ? null : editing}
          developerMode={config.system.developer_mode}
          onSave={(m) => void handleSave(m)}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
