> **【旧版】** この文書は要件定義書・仕様書・設計書への分割に伴い、2026-06-12 にアーカイブされました。最新ドキュメントは `specs/` 直下の各ファイルを参照してください。

---

## 1. プロジェクト概要

本プロジェクトは、ローカル通信規格「Matter」のオープンソース実装である `matter.js` を活用し、Mac（macOS）を仮想的な**Matter Bridgeデバイス**としてスマートホームシステム（Google Home, Apple Home, Amazon Alexa等）にネイティブ統合する常駐型アプリケーションを開発する。

Matterの「Bridge」デバイスタイプを採用することで、QRコード1枚のペアリングだけで、スマートホームアプリ上に10個の仮想スイッチが**それぞれ独立したデバイスとして**自動登録される。単純なマルチエンドポイントデバイスではなくBridgeパターンを選択する理由は、Google Home / Apple Home / Alexa のすべてで独立デバイスとしての動作が仕様として保証されているためである。

本アーキテクチャでは、Tauriフレームワーク（React + Rust + Node.js Sidecar）を最初から採用する。

## 2. システムアーキテクチャ

```
[音声 / スマートホームアプリ] (Google Home, Apple Home, Alexa等)
             │
             ▼ (Matter over Wi-Fi / IPv6ローカル通信)
[スマートホームコントローラー (ハブ)] (Nest Hub / Echo / HomePod等)
             │
             ▼
┌──────────────────────────────────────────────────────────────┐
│ Mac (ターゲットPC)                                             │
│                                                              │
│  ┌── Matter Mac Agent (Tauri アプリケーション) ────────────┐ │
│  │  [フロントエンド: Webview UI (React)]                    │ │
│  │         ↕ (Tauri IPC通信: セキュア・ポート開放なし)      │ │
│  │  [バックエンド: Rust (Tauri Core)]                       │ │
│  │         ↕ (標準入出力 / Tauri Sidecar API)               │ │
│  │  [サイドカー: Node.js (matter.js サーバー実行環境)]      │ │
│  │   ・Matter Bridgeノードのホスティング                     │ │
│  │     Endpoint 0: Root Node (管理用)                       │ │
│  │     Endpoint 1: Aggregator (Bridge Device Type)          │ │
│  │     Endpoint 2-11: BridgedDevice + OnOffPluginUnit ×10   │ │
│  │         ↓ (ON/OFFトリガー検知)                           │ │
│  │  [アクション・エグゼキュータ (Node.js)]                   │ │
│  │         ├─► ① shortcut (`shortcuts run`)                 │ │
│  │         ├─► ② open (`open "{target}"`)                   │ │
│  │         ├─► ③ shell (`child_process.exec`)  ※開発者モード│ │
│  │         └─► ④ applescript (`osascript`)     ※開発者モード│ │
│  └──────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

## 3. アクション設定方式（段階的権限モデル）

|アクション種別|JSON `"type"` 値|バックエンド実行方式|対象ユーザー|
|---|---|---|---|
|**macOSショートカット**|`"shortcut"`|`shortcuts run "{名前}" <<< "{引数}"`|一般|
|**URL/アプリを開く**|`"open"`|`open "{target}"`|一般|
|**シェルコマンド**|`"shell"`|`child_process.exec("{command}")`|上級者（開発者モード限定）|
|**AppleScript**|`"applescript"`|`osascript -e "{script}"`|上級者（開発者モード限定）|

## 4. データ構造設計 (JSON)

設定データは `~/Library/Application Support/com.matter-mac-agent/config.json` に保存される。

```json
{
  "system": { "developer_mode": false, "auto_start": true },
  "endpoints": [
    { "id": 1, "name": "仕事モード", "matter_type": "OnOffPluginUnitDevice", "assigned_macro_id": "macro_work_01" }
  ],
  "macros": [
    {
      "id": "macro_work_01",
      "name": "開発環境セットアップ",
      "on_actions": [
        { "type": "shortcut", "name": "LaunchDevApps", "input": "" },
        { "type": "open", "target": "https://github.com/my-repo" }
      ],
      "off_actions": [
        { "type": "shell", "command": "docker-compose down" },
        { "type": "applescript", "script": "set volume output volume 0" }
      ]
    }
  ]
}
```

**各アクション型のフィールド定義**:

| `type` 値 | 必須フィールド | 説明 |
|---|---|---|
| `"shortcut"` | `name` (string), `input` (string) | macOS ショートカット名と stdin 入力文字列 |
| `"open"` | `target` (string) | URLまたはアプリ名 |
| `"shell"` | `command` (string) | 実行するシェルコマンド文字列 |
| `"applescript"` | `script` (string) | `osascript -e` に渡すスクリプト文字列 |

**注記**: `"matter_type"` は現時点で `"OnOffPluginUnitDevice"` 固定だが、将来の Dimmer 等デバイスタイプ拡張に備えてフィールドを保持する。
