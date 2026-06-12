import { useState } from "react";
import { HomeTab } from "./HomeTab";
import { SwitchTab } from "./SwitchTab";
import { MacroTab } from "./MacroTab";
import { SettingsTab } from "./SettingsTab";

const TABS = [
  { id: "home", label: "ホーム" },
  { id: "switches", label: "スイッチ" },
  { id: "macros", label: "マクロ" },
  { id: "settings", label: "設定" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabId>("home");

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Matter Mac Agent</h1>
        <p className="subtitle">Mac をスマートホームから操作</p>
      </header>

      <nav className="tab-nav">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={activeTab === tab.id ? "tab active" : "tab"}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <main className="dashboard-content">
        {activeTab === "home" && <HomeTab />}
        {activeTab === "switches" && <SwitchTab />}
        {activeTab === "macros" && <MacroTab />}
        {activeTab === "settings" && <SettingsTab />}
      </main>
    </div>
  );
}
