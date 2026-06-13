import { useConfig } from "../context/ConfigContext";
import type { Config } from "../types";

export function SettingsTab() {
  const { config, saveConfig } = useConfig();
  if (!config) return null;

  const updateSystem = async (patch: Partial<Config["system"]>) => {
    if (
      patch.developer_mode === true &&
      !config.system.developer_mode &&
      !confirm(
        "開発者モードを有効にすると、シェルコマンドと AppleScript の実行が可能になります。有効にしますか？"
      )
    ) {
      return;
    }
    await saveConfig({ ...config, system: { ...config.system, ...patch } });
  };

  return (
    <div className="settings-section">
      <div>
        <p className="settings-group-label">一般</p>
        <div className="settings-card">
          <div className="setting-row">
            <div className="setting-info">
              <h3>ログイン時に自動起動</h3>
              <p>Mac ログイン時に Matter Mac Agent を自動的に起動します。</p>
            </div>
            <label className="toggle">
              <input
                type="checkbox"
                checked={config.system.auto_start}
                onChange={(e) => void updateSystem({ auto_start: e.target.checked })}
              />
              <span className="toggle-slider" />
            </label>
          </div>
          <div className="setting-row">
            <div className="setting-info">
              <h3>開発者モード</h3>
              <p>シェルコマンドと AppleScript アクションを有効にします。</p>
            </div>
            <label className="toggle">
              <input
                type="checkbox"
                checked={config.system.developer_mode}
                onChange={(e) => void updateSystem({ developer_mode: e.target.checked })}
              />
              <span className="toggle-slider" />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
