import { useState } from "react";
import type { Action, Macro } from "../types";
import { ActionEditor } from "./ActionEditor";

type Props = {
  macro: Macro | null;
  developerMode: boolean;
  onSave: (macro: Macro) => void;
  onClose: () => void;
};

function newAction(): Action {
  return { type: "shortcut", name: "", input: "" };
}

export function MacroEditor({ macro, developerMode, onSave, onClose }: Props) {
  const [name, setName] = useState(macro?.name ?? "");
  const [onActions, setOnActions] = useState<Action[]>(
    macro?.on_actions ?? []
  );
  const [offActions, setOffActions] = useState<Action[]>(
    macro?.off_actions ?? []
  );

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      id: macro?.id ?? crypto.randomUUID(),
      name: name.trim(),
      on_actions: onActions,
      off_actions: offActions,
    });
  };

  const renderActionList = (
    actions: Action[],
    setActions: (actions: Action[]) => void,
    label: string
  ) => (
    <div className="action-list">
      <div className="action-list-header">
        <h3>{label}</h3>
        <button
          type="button"
          onClick={() => setActions([...actions, newAction()])}
        >
          アクション追加
        </button>
      </div>
      {actions.length === 0 && (
        <p className="muted small">アクションがありません</p>
      )}
      {actions.map((action, index) => (
        <ActionEditor
          key={index}
          action={action}
          developerMode={developerMode}
          onChange={(updated) => {
            const next = [...actions];
            next[index] = updated;
            setActions(next);
          }}
          onRemove={() => setActions(actions.filter((_, i) => i !== index))}
        />
      ))}
    </div>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{macro ? "マクロを編集" : "マクロを作成"}</h2>
        <label className="field-label">マクロ名</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例: 開発モード起動"
        />

        {renderActionList(onActions, setOnActions, "ON 時アクション")}
        {renderActionList(offActions, setOffActions, "OFF 時アクション")}

        <div className="modal-actions">
          <button type="button" onClick={onClose}>
            キャンセル
          </button>
          <button type="button" className="btn-primary" onClick={handleSave}>
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
