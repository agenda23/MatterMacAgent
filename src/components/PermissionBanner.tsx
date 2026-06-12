import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { PermissionStatus } from "../types";

export function PermissionBanner() {
  const [permissions, setPermissions] = useState<PermissionStatus | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    invoke<PermissionStatus>("get_permissions")
      .then(setPermissions)
      .catch(console.error);
  }, []);

  if (!permissions || permissions.accessibility || dismissed) {
    return null;
  }

  const openSettings = async () => {
    await invoke("open_accessibility_settings");
  };

  return (
    <div className="permission-banner">
      <div>
        <strong>アクセシビリティ権限が必要です</strong>
        <p>
          ショートカットや AppleScript を正しく実行するには、システム設定で
          Matter Mac Agent にアクセシビリティ権限を付与してください。
        </p>
      </div>
      <div className="permission-banner-actions">
        <button type="button" className="btn-primary" onClick={openSettings}>
          設定を開く
        </button>
        <button type="button" onClick={() => setDismissed(true)}>
          後で
        </button>
      </div>
    </div>
  );
}
