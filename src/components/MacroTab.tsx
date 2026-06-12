import { useState } from "react";
import { useConfig } from "../context/ConfigContext";
import type { Macro } from "../types";
import { MacroEditor } from "./MacroEditor";

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
      ep.assigned_macro_id === id
        ? { ...ep, assigned_macro_id: null }
        : ep
    );
    await saveConfig({ ...config, macros, endpoints });
  };

  return (
    <div className="tab-panel">
      <div className="tab-toolbar">
        <button type="button" className="btn-primary" onClick={() => setEditing("new")}>
          新規マクロ
        </button>
      </div>

      {config.macros.length === 0 ? (
        <p className="muted">マクロがありません。新規作成してください。</p>
      ) : (
        <ul className="macro-list">
          {config.macros.map((macro) => (
            <li key={macro.id} className="card macro-item">
              <div>
                <strong>{macro.name}</strong>
                <p className="muted small">
                  ON: {macro.on_actions.length} / OFF: {macro.off_actions.length}{" "}
                  アクション
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
