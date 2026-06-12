import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { QRCodeSVG } from "qrcode.react";
import type { PairingInfo, PermissionStatus } from "../types";

export function HomeTab() {
  const [online, setOnline] = useState(false);
  const [pairing, setPairing] = useState<PairingInfo | null>(null);
  const [permissions, setPermissions] = useState<PermissionStatus | null>(null);

  const refresh = async () => {
    const [status, info, perms] = await Promise.all([
      invoke<boolean>("get_sidecar_status"),
      invoke<PairingInfo | null>("get_pairing_info"),
      invoke<PermissionStatus>("get_permissions"),
    ]);
    setOnline(status);
    setPairing(info);
    setPermissions(perms);
  };

  useEffect(() => {
    refresh().catch(console.error);
    const interval = setInterval(() => {
      refresh().catch(console.error);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const openAccessibilitySettings = async () => {
    await invoke("open_accessibility_settings");
  };

  return (
    <div className="tab-panel">
      <section className="card">
        <h2>Matter サーバー</h2>
        <span className={`badge ${online ? "badge-online" : "badge-offline"}`}>
          {online ? "Online" : "Offline"}
        </span>
      </section>

      <section className="card">
        <h2>ペアリング</h2>
        {pairing ? (
          <div className="pairing-info">
            <div className="qr-wrapper">
              <QRCodeSVG value={pairing.qr_payload} size={200} />
            </div>
            <dl className="pairing-details">
              <div>
                <dt>Manual Pairing Code</dt>
                <dd>{pairing.manual_code}</dd>
              </div>
              <div>
                <dt>Setup PIN</dt>
                <dd>{String(pairing.pin).padStart(8, "0")}</dd>
              </div>
              <div>
                <dt>Discriminator</dt>
                <dd>{pairing.discriminator}</dd>
              </div>
            </dl>
            <p className="hint">
              Google Home / Apple Home アプリで QR コードをスキャンしてください。
              10 個の仮想スイッチが自動登録されます。
            </p>
          </div>
        ) : (
          <p className="muted">ペアリング情報を取得中...</p>
        )}
      </section>

      <section className="card">
        <h2>macOS 権限</h2>
        <div className="permission-row">
          <span>アクセシビリティ</span>
          {permissions?.accessibility ? (
            <span className="badge badge-ok">付与済み</span>
          ) : (
            <>
              <span className="badge badge-warn">未付与</span>
              <button type="button" onClick={openAccessibilitySettings}>
                設定を開く
              </button>
            </>
          )}
        </div>
        <p className="hint">
          ショートカットや AppleScript の実行にはアクセシビリティ権限が必要な場合があります。
        </p>
      </section>
    </div>
  );
}
