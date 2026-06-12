import type { Action, ActionType } from "../types";

type Props = {
  action: Action;
  developerMode: boolean;
  onChange: (action: Action) => void;
  onRemove: () => void;
};

const ACTION_TYPES: { value: ActionType; label: string; devOnly?: boolean }[] = [
  { value: "shortcut", label: "ショートカット" },
  { value: "open", label: "アプリ / URL を開く" },
  { value: "shell", label: "シェルコマンド", devOnly: true },
  { value: "applescript", label: "AppleScript", devOnly: true },
];

export function ActionEditor({
  action,
  developerMode,
  onChange,
  onRemove,
}: Props) {
  const availableTypes = ACTION_TYPES.filter(
    (t) => !t.devOnly || developerMode
  );

  const setType = (type: ActionType) => {
    switch (type) {
      case "shortcut":
        onChange({ type: "shortcut", name: "", input: "" });
        break;
      case "open":
        onChange({ type: "open", target: "" });
        break;
      case "shell":
        onChange({ type: "shell", command: "" });
        break;
      case "applescript":
        onChange({ type: "applescript", script: "" });
        break;
    }
  };

  return (
    <div className="action-editor">
      <div className="action-editor-header">
        <select
          value={action.type}
          onChange={(e) => setType(e.target.value as ActionType)}
        >
          {availableTypes.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <button type="button" className="btn-danger" onClick={onRemove}>
          削除
        </button>
      </div>

      {action.type === "shortcut" && (
        <>
          <input
            placeholder="ショートカット名"
            value={action.name}
            onChange={(e) =>
              onChange({ ...action, name: e.target.value })
            }
          />
          <input
            placeholder="入力（任意）"
            value={action.input}
            onChange={(e) =>
              onChange({ ...action, input: e.target.value })
            }
          />
        </>
      )}

      {action.type === "open" && (
        <input
          placeholder="URL または .app パス"
          value={action.target}
          onChange={(e) =>
            onChange({ ...action, target: e.target.value })
          }
        />
      )}

      {action.type === "shell" && (
        <input
          placeholder="bash コマンド"
          value={action.command}
          onChange={(e) =>
            onChange({ ...action, command: e.target.value })
          }
        />
      )}

      {action.type === "applescript" && (
        <textarea
          placeholder="AppleScript"
          rows={3}
          value={action.script}
          onChange={(e) =>
            onChange({ ...action, script: e.target.value })
          }
        />
      )}
    </div>
  );
}
