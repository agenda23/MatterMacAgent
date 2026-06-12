import { useConfig } from "../context/ConfigContext";
import type { Config } from "../types";

export function SwitchTab() {
  const { config, saveConfig } = useConfig();
  if (!config) return null;

  const updateEndpoint = async (
    id: number,
    patch: Partial<Config["endpoints"][number]>
  ) => {
    const endpoints = config.endpoints.map((ep) =>
      ep.id === id ? { ...ep, ...patch } : ep
    );
    await saveConfig({ ...config, endpoints });
  };

  return (
    <div className="tab-panel">
      <p className="hint">
        各スイッチに名前とマクロを割り当てます。変更はスマートホーム側の再ペアリングなしで反映されます。
      </p>
      <div className="switch-grid">
        {config.endpoints.map((endpoint) => {
          const macro = config.macros.find(
            (m) => m.id === endpoint.assigned_macro_id
          );
          return (
            <div key={endpoint.id} className="card switch-card">
              <div className="switch-header">
                <span className="switch-number">#{endpoint.id}</span>
                <input
                  className="switch-name-input"
                  value={endpoint.name}
                  onChange={(e) =>
                    void updateEndpoint(endpoint.id, { name: e.target.value })
                  }
                />
              </div>
              <label className="field-label">割り当てマクロ</label>
              <select
                value={endpoint.assigned_macro_id ?? ""}
                onChange={(e) =>
                  void updateEndpoint(endpoint.id, {
                    assigned_macro_id: e.target.value || null,
                  })
                }
              >
                <option value="">未割り当て</option>
                {config.macros.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
              {macro && (
                <p className="muted small">
                  ON: {macro.on_actions.length} / OFF: {macro.off_actions.length}{" "}
                  アクション
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
