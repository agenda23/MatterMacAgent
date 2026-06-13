import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { QRCodeSVG } from "qrcode.react";
import type { PairingInfo, PermissionStatus } from "../types";

function IconServer() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="7" rx="2" />
      <rect x="3" y="13" width="18" height="7" rx="2" />
      <path d="M7 7.5h.01M7 16.5h.01" />
    </svg>
  );
}

function IconShield() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3 5 6v5.5c0 4.2 2.9 7.6 7 8.5 4.1-.9 7-4.3 7-8.5V6Z" />
      <path d="m9.2 11.8 2 2 3.6-4" />
    </svg>
  );
}

function IconCopy() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h8" />
    </svg>
  );
}

function copyText(text: string) {
  void navigator.clipboard.writeText(text);
}

export function HomeTab() {
  const [online, setOnline] = useState(false);
  const [pairing, setPairing] = useState<PairingInfo | null>(null);
  const [commissioned, setCommissioned] = useState(false);
  const [permissions, setPermissions] = useState<PermissionStatus | null>(null);

  const refresh = async () => {
    const [status, info, comm, perms] = await Promise.all([
      invoke<boolean>("get_sidecar_status"),
      invoke<PairingInfo | null>("get_pairing_info"),
      invoke<boolean>("get_commissioning_status"),
      invoke<PermissionStatus>("get_permissions"),
    ]);
    setOnline(status);
    setPairing(info);
    setCommissioned(comm);
    setPermissions(perms);
  };

  useEffect(() => {
    refresh().catch(console.error);
    const interval = setInterval(() => refresh().catch(console.error), 3000);

    const unlistenOffline = listen("sidecar-offline", () => setOnline(false));
    const unlistenComm = listen<{ commissioned: boolean }>("commissioning-changed", (e) =>
      setCommissioned(e.payload.commissioned)
    );

    return () => {
      clearInterval(interval);
      void unlistenOffline.then((fn) => fn());
      void unlistenComm.then((fn) => fn());
    };
  }, []);

  return (
    <div className="tab-panel">
      {/* Matter server */}
      <div className="card">
        <div className="server-row">
          <div className="server-icon">
            <IconServer />
          </div>
          <div className="server-label">
            <strong>Matter サーバー</strong>
            <span>ローカルネットワークで待機中</span>
          </div>
          <span className={`badge ${online ? "badge-online" : "badge-offline"}`}>
            {online && <span className="badge-dot" />}
            {online ? "Online" : "Offline"}
          </span>
        </div>
      </div>

      {/* Pairing */}
      <div className="card">
        <h2>ペアリング</h2>
        {commissioned ? (
          <div className="paired-status">
            <span className="badge badge-ok">
              <span className="badge-dot" />
              ペアリング済み
            </span>
            <p className="hint">
              スマートホームハブとの接続が確立されています。再起動後も自動的に再接続されます。
            </p>
          </div>
        ) : pairing ? (
          <>
            <div className="pairing-layout">
              <div className="qr-wrapper">
                <QRCodeSVG value={pairing.qr_payload} size={150} />
              </div>
              <div className="pairing-meta">
                <div className="meta-item">
                  <div className="meta-label">Manual Pairing Code</div>
                  <div className="meta-value">
                    <span>{pairing.manual_code}</span>
                    <button className="copy-btn" type="button" onClick={() => copyText(pairing.manual_code)}>
                      <IconCopy />
                    </button>
                  </div>
                </div>
                <div className="meta-item">
                  <div className="meta-label">Setup PIN</div>
                  <div className="meta-value">
                    <span>{String(pairing.pin).padStart(8, "0")}</span>
                    <button className="copy-btn" type="button" onClick={() => copyText(String(pairing.pin).padStart(8, "0"))}>
                      <IconCopy />
                    </button>
                  </div>
                </div>
                <div className="meta-item">
                  <div className="meta-label">Discriminator</div>
                  <div className="meta-value">
                    <span>{pairing.discriminator}</span>
                  </div>
                </div>
              </div>
            </div>
            <p className="pairing-hint">
              Google Home / Apple Home アプリで QR コードをスキャンしてください。10 個の仮想スイッチが自動登録されます。
            </p>
          </>
        ) : (
          <p className="muted">ペアリング情報を取得中...</p>
        )}
      </div>

      {/* Permissions */}
      <div className="card">
        <h2>macOS 権限</h2>
        <div className="permission-row">
          <span className="perm-icon"><IconShield /></span>
          <div className="perm-label">
            <strong>アクセシビリティ</strong>
            <small>ショートカットや AppleScript の実行に必要です。</small>
          </div>
          {permissions?.accessibility ? (
            <span className="badge badge-ok">
              <span className="badge-dot" />
              付与済み
            </span>
          ) : (
            <>
              <span className="badge badge-warn">未付与</span>
              <button type="button" onClick={() => void invoke("open_accessibility_settings")}>
                設定を開く
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
