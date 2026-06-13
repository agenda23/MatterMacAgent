import { useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import { useConfig } from "../context/ConfigContext";
import type { Config } from "../types";

export function SwitchTab() {
  const { config, saveConfig } = useConfig();
  const [deviceStates, setDeviceStates] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const unlisten = listen<{ endpoint_id: number; state: boolean }>(
      "device-status-changed",
      (event) => {
        setDeviceStates((prev) => ({
          ...prev,
          [event.payload.endpoint_id]: event.payload.state,
        }));
      }
    );
    return () => { void unlisten.then((fn) => fn()); };
  }, []);

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
          // matter endpoint_id = endpoint.id + 1 (endpoints 2-11 map to switches 1-10)
          const isOn = deviceStates[endpoint.id + 1] ?? false;

          return (
            <div key={endpoint.id} className="card switch-card">
              <div className="switch-header">
                <span className="switch-badge">#{endpoint.id}</span>
                <input
                  className="switch-name-input"
                  value={endpoint.name}
                  onChange={(e) =>
                    void updateEndpoint(endpoint.id, { name: e.target.value })
                  }
                />
                <div className={`device-toggle ${isOn ? "on" : "off"}`} title={isOn ? "ON" : "OFF"} />
              </div>
              <div className="field-label">割り当てマクロ</div>
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
                  ON: {macro.on_actions.length} / OFF: {macro.off_actions.length} アクション
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
