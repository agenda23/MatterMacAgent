import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { HomeTab } from "./HomeTab";
import { SwitchTab } from "./SwitchTab";
import { MacroTab } from "./MacroTab";
import { SettingsTab } from "./SettingsTab";

function IconBolt() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M13 2 4 14h6l-1 8 9-12h-6Z" />
    </svg>
  );
}

function IconHome() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10.2 12 3l9 7.2" />
      <path d="M5 9.4V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.4" />
    </svg>
  );
}

function IconSwitch() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2.5" y="7" width="19" height="10" rx="5" />
      <circle cx="16.5" cy="12" r="2.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconMacro() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3 1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6Z" />
      <path d="M18.5 14.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8Z" />
    </svg>
  );
}

function IconSettings() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 13.5a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V20a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1.05-1.5 1.6 1.6 0 0 0-1.77.32l-.1.1a2 2 0 1 1-2.83-2.83l.1-.1a1.6 1.6 0 0 0 .32-1.77 1.6 1.6 0 0 0-1.5-1.02H4a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1.06 1.6 1.6 0 0 0-.32-1.77l-.1-.1A2 2 0 1 1 8 2.4l.1.1a1.6 1.6 0 0 0 1.77.32H10a1.6 1.6 0 0 0 1-1.5V1a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.77-.32l.1-.1a2 2 0 1 1 2.83 2.83l-.1.1a1.6 1.6 0 0 0-.32 1.77V8a1.6 1.6 0 0 0 1.5 1H23a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z" />
    </svg>
  );
}

const TABS = [
  { id: "home",     label: "ホーム",   Icon: IconHome },
  { id: "switches", label: "スイッチ", Icon: IconSwitch },
  { id: "macros",   label: "マクロ",   Icon: IconMacro },
  { id: "settings", label: "設定",     Icon: IconSettings },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [sidecarOnline, setSidecarOnline] = useState(false);

  useEffect(() => {
    const fetchStatus = () =>
      invoke<boolean>("get_sidecar_status")
        .then(setSidecarOnline)
        .catch(console.error);

    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    const unlistenOffline = listen("sidecar-offline", () => setSidecarOnline(false));

    return () => {
      clearInterval(interval);
      void unlistenOffline.then((fn) => fn());
    };
  }, []);

  const activeLabel = TABS.find((t) => t.id === activeTab)?.label ?? "";

  return (
    <div className="app-layout">
      {/* ---- sidebar ---- */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <IconBolt />
          </div>
          <div className="sidebar-logo-text">
            <div className="app-name">Matter</div>
            <div className="app-sub">Mac Agent</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              className={`sidebar-nav-item${activeTab === id ? " active" : ""}`}
              onClick={() => setActiveTab(id)}
            >
              <Icon />
              {label}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <span className={`sidebar-status-dot${sidecarOnline ? "" : " offline"}`} />
          <span className="sidebar-status-text">
            {sidecarOnline ? "サーバー稼働中" : "サーバー停止中"}
          </span>
        </div>
      </aside>

      {/* ---- content ---- */}
      <div className="content-area">
        <div className="content-header">
          <h1>{activeLabel}</h1>
        </div>
        <div className="content-body">
          {activeTab === "home"     && <HomeTab />}
          {activeTab === "switches" && <SwitchTab />}
          {activeTab === "macros"   && <MacroTab />}
          {activeTab === "settings" && <SettingsTab />}
        </div>
      </div>
    </div>
  );
}
