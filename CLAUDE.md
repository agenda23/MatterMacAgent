# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Matter Mac Agent** は、macOS を仮想 Matter Bridge デバイスとして Google Home / Apple Home / Alexa に統合するメニューバー常駐アプリ。`matter.js` でハブからの ON/OFF を受信し、macOS ショートカット・シェルコマンド・AppleScript をローカルで即時実行する。クラウド不使用・完全ローカル動作。

## Tech Stack

| レイヤー | 技術 | 役割 |
|---|---|---|
| フロントエンド | React 19 + TypeScript + Vite | 設定UI・QRコード表示・マクロエディタ |
| デスクトップ | Tauri 2 (Rust) | メニューバー常駐・IPC・設定ファイル読み書き・権限管理・Sidecar管理 |
| Matterサーバー | Node.js 20 Sidecar + matter.js | Matterプロトコル処理・仮想Bridgeホスティング・アクション実行 |
| パッケージマネージャ | **pnpm**（npm / yarn は使わない） | |

## Development Commands

```bash
# 依存パッケージのインストール（フロントエンド + sidecar 一括）
pnpm install

# 開発モードで起動（ホットリロード）
pnpm tauri dev

# リリースビルド (.dmg 生成)
pnpm tauri build

# sidecar を単独で開発実行（matter.js のデバッグ用）
pnpm sidecar:dev

# TypeScript 型チェック（フロントエンド + sidecar）
pnpm typecheck
```

## Project Structure

```
/
├── src/               # React フロントエンド
├── src-tauri/         # Rust / Tauri バックエンド
│   ├── src/lib.rs     # Tauri コマンド定義
│   ├── src/main.rs
│   └── tauri.conf.json
├── sidecar/           # Node.js matter.js サーバー（pnpm workspace）
│   ├── src/index.ts   # エントリーポイント（通信プロトコル・アクション実行）
│   └── package.json
├── specs/             # 要件定義書・仕様書・設計書
├── pnpm-workspace.yaml
└── package.json
```

## Architecture

```
[Google Home / Apple Home / Alexa]
    ↓ Matter over Wi-Fi (IPv6 LAN)
[スマートホームハブ (Nest Hub / HomePod / Echo)]
    ↓
┌── Tauri アプリ (.app) ────────────────────────────────┐
│  React UI  ←──── Tauri IPC (ポート開放なし) ────→  Rust Core  │
│                                                       │
│  Node.js Sidecar (matter.js)                          │
│    ├── Endpoint 0: Root Node                          │
│    ├── Endpoint 1: Aggregator (Bridge Device Type)    │
│    ├── Endpoint 2-11: BridgedDevice + OnOffPluginUnit │
│    ├── ON/OFF受信 → アクション実行                     │
│    │     ├── type:"shortcut"    → shortcuts run       │
│    │     ├── type:"open"        → open "{target}"     │
│    │     ├── type:"shell"       → exec()  ※開発者モード│
│    │     └── type:"applescript" → osascript ※開発者モード│
│    └── Sidecar→Rust: qr_code / device_status / ready │
│        Rust→Sidecar: config_update / shutdown         │
└───────────────────────────────────────────────────────┘
```

## Key Design Decisions

**Matter Bridge パターン**: `matter.js` の `Aggregator` デバイスタイプで Bridge ノードを構成。Endpoint 0=Root Node、Endpoint 1=Aggregator、Endpoint 2〜11=`BridgedDevice + OnOffPluginUnitDevice`（仮想スイッチ×10）。QRコード1枚のペアリングで Google Home / Apple Home / Alexa に10個の独立したデバイスとして自動登録される。単純なマルチエンドポイントデバイスではなく Bridge を使う理由は、全主要プラットフォームで独立デバイス表示が仕様保証されているため。

**静的エンドポイント方式**: Bridge の子デバイス構成（Endpoint 数・順序）を変えると再ペアリングが発生するため、Endpoint 2〜11 の10スロットをアプリ起動時に常時固定保持し、マクロ割り当てのみを動的に変更する。

**IPC通信**: React ↔ Rust 間は Tauri IPC のみ。localhost ポートを開放しないため LAN 内他端末からの RCE リスクがない。Rust ↔ Sidecar 間は stdin/stdout JSON メッセージング (`{ "type": "...", "payload": {...} }`)。

**段階的権限モデル**: `shortcut`/`open` はデフォルト有効。`shell`/`applescript` は設定画面で「開発者モード」を明示的に ON にしないと登録 UI が非表示、かつ Sidecar 側でも実行拒否。

**設定ファイルパス**: `~/Library/Application Support/com.matter-mac-agent/config.json`

## Config JSON Schema

```typescript
type Config = {
  system: { developer_mode: boolean; auto_start: boolean };
  endpoints: Array<{
    id: number;                           // 1〜10 固定
    name: string;
    matter_type: "OnOffPluginUnitDevice"; // 将来拡張用・現在固定
    assigned_macro_id: string | null;
  }>;
  macros: Array<{
    id: string;          // UUID v4
    name: string;
    on_actions: Action[];
    off_actions: Action[];
  }>;
};

type Action =
  | { type: "shortcut";    name: string; input: string }
  | { type: "open";        target: string }
  | { type: "shell";       command: string }     // 開発者モード限定
  | { type: "applescript"; script: string };     // 開発者モード限定
```

## Sidecar Communication Protocol

`sidecar/src/index.ts` が実装の起点。stdin/stdout で Rust Core と通信する。

| 方向 | `type` | 用途 |
|---|---|---|
| Rust → Sidecar | `config_update` | マクロ割り当て変更の即時反映 |
| Rust → Sidecar | `shutdown` | 正常終了 |
| Sidecar → Rust | `ready` | Matter サーバー起動完了 |
| Sidecar → Rust | `qr_code` | ペアリング QRコード・PIN |
| Sidecar → Rust | `device_status` | ON/OFF 状態変化 |
| Sidecar → Rust | `action_result` | アクション実行結果・エラー |

## Implementation Notes

- **matter.js Bridge 実装は Phase 1 の作業**: `sidecar/src/index.ts` に `// TODO Phase 1:` コメントでスタブを残している。`ServerNode` + `AggregatorEndpoint` + `OnOffPluginUnitDevice.with(BridgedDeviceBasicInformationServer)` × 10 で実装する
- **Sidecar バイナリ化**: `pkg` は Node.js 18 以降で非推奨。`@yao-pkg/pkg` または `bun build --compile` を Phase 1 で検証する。`matter.js` の ESM 依存との互換性確認が必要

## Spec Documents

| ファイル | 内容 |
|---|---|
| `specs/Matter Mac Agent 🍏🔌.md` | プロダクト概要・README 相当 |
| `specs/要件定義書.md` | スコープ・ユースケース・機能要件・非機能要件・受け入れ基準 |
| `specs/仕様書.md` | Matter 通信仕様・アクション仕様・UI 仕様・IPC 仕様・config.json スキーマ・セキュリティ仕様 |
| `specs/設計書.md` | システムアーキテクチャ・各コンポーネント実装設計・技術スタック・開発ロードマップ |
| `specs/archive/` | 旧版・廃案ドキュメント |
