# 実装進捗ドキュメント

最終更新: 2026-06-13

---

## 全体フェーズ概要

| フェーズ | 内容 | 状態 |
|---|---|---|
| Phase 1 | Node.js Sidecar — matter.js Bridge 実装 | ✅ 完了 |
| Phase 2 | Rust/Tauri コア — IPC・設定・トレイ | ✅ 完了 |
| Phase 3 | React UI — 設定画面・マクロエディタ | ✅ 完了 |
| Phase 4 | Sidecar バイナリ化・配布ビルド | 🔶 一部対応 |
| Phase 5 | コード署名・公証・リリース | ❌ 未着手 |

---

## Phase 1: Node.js Sidecar（matter.js Bridge）

**ファイル**: `sidecar/src/index.ts`

| 機能 | 状態 | 備考 |
|---|---|---|
| ServerNode + AggregatorEndpoint 起動 | ✅ | `ServerNode.create({ id: "matter-mac-agent" })` |
| OnOffPlugInUnitDevice × 10 Bridge 子デバイス | ✅ | BridgedDeviceBasicInformationServer 付き |
| ON/OFF イベント購読 (`onOff$Change`) | ✅ | `server.start()` 後にバインド |
| マクロアクション実行（shortcut / open） | ✅ | `execSync` 経由 |
| マクロアクション実行（shell / applescript） | ✅ | `developer_mode` ガード付き |
| config_update ホットリロード | ✅ | `updateSwitchLabels` でデバイス名を動的更新 |
| stdin/stdout IPC（Rust との双方向通信） | ✅ | 改行デリミタ JSON |
| `qr_code` メッセージ送信 | ✅ | qrPairingCode・manualPairingCode・discriminator・pin |
| `ready` メッセージ送信 | ✅ | `commissioned` フラグは **未送信**（→ 既知の課題） |
| Matter 永続ストレージ | ✅ | `MATTER_PATH_ROOT` 環境変数経由 |

**既知の課題**: `ready` ペイロードに `commissioned: boolean` が含まれていないため、再起動後も Rust 側の `commissioned` 状態が `false` のまま。`server.lifecycle.isCommissioned` 相当の値を確認してから送信する必要がある。

---

## Phase 2: Rust / Tauri コア

### `src-tauri/src/config.rs`

| 機能 | 状態 |
|---|---|
| Config・Action・Macro 型定義（serde） | ✅ |
| PairingInfo 型（qr_payload / manual_code / discriminator / pin） | ✅ |
| PermissionStatus 型 | ✅ |
| `Default::default()` — Endpoint 1〜10 の初期設定生成 | ✅ |
| `load_or_create` — config.json 読込・初回生成 | ✅ |
| `save` — 親ディレクトリ自動作成込みで書き込み | ✅ |

### `src-tauri/src/state.rs`

| フィールド | 型 | 内容 |
|---|---|---|
| `config` | `Mutex<Config>` | 現在設定 |
| `pairing_info` | `Mutex<Option<PairingInfo>>` | QRコード情報 |
| `commissioned` | `Mutex<bool>` | ペアリング済みフラグ |
| `sidecar_online` | `Mutex<bool>` | Sidecar 起動状態 |
| `sidecar_child` | `Mutex<Option<CommandChild>>` | Sidecar プロセスハンドル |

### `src-tauri/src/sidecar.rs`

| 機能 | 状態 |
|---|---|
| `spawn_sidecar` — MATTER_PATH_ROOT 設定・起動・受信ループ | ✅ |
| `dispatch_sidecar_message` — ready / qr_code / device_status / action_result 処理 | ✅ |
| `ready` 受信時に config_update を即時送信 | ✅ |
| `action_result` エラー時に `action-error` イベント emit | ✅ |
| `send_config_update` / `send_shutdown` | ✅ |

### `src-tauri/src/tray.rs`

| 機能 | 状態 |
|---|---|
| メニューバーアイコン（テンプレートアイコン） | ✅ |
| 左クリックでダッシュボードトグル | ✅ |
| TrayCenter ポジショニング（`tauri-plugin-positioner`） | ✅ |
| 右クリックメニュー（ダッシュボードを開く / 終了） | ✅ |

### `src-tauri/src/lib.rs`

| Tauri コマンド | 状態 |
|---|---|
| `get_config` | ✅ |
| `save_config`（config.json 書込 + sidecar 通知 + autostart 同期） | ✅ |
| `get_pairing_info` | ✅ |
| `get_commissioning_status` | ✅ |
| `get_sidecar_status` | ✅ |
| `get_permissions`（`AXIsProcessTrusted()`） | ✅ |
| `open_accessibility_settings` | ✅ |
| `show_dashboard` | ✅ |

| アプリ挙動 | 状態 |
|---|---|
| `ActivationPolicy::Accessory`（Dock 非表示） | ✅ |
| ウィンドウ × ボタン → 閉じずに非表示 | ✅ |
| `--minimized` 起動引数でウィンドウ非表示起動 | ✅ |
| アプリ終了時に Sidecar `shutdown` 送信 | ✅ |

---

## Phase 3: React UI

### 共有基盤

| ファイル | 内容 | 状態 |
|---|---|---|
| `src/types.ts` | ActionType / Action / Macro / Config / PairingInfo / PermissionStatus / ActionError | ✅ |
| `src/context/ConfigContext.tsx` | Tauri IPC を介した Config グローバル状態管理 | ✅ |

### コンポーネント

| コンポーネント | 機能 | 状態 |
|---|---|---|
| `App.tsx` | ConfigProvider + ToastContainer のルート | ✅ |
| `Dashboard.tsx` | ホーム / スイッチ / マクロ / 設定 タブナビゲーション | ✅ |
| `HomeTab.tsx` | Matter サーバー状態・ペアリング済み表示・QRコード・権限確認 | ✅ |
| `SwitchTab.tsx` | 10スイッチグリッド・名前編集・マクロ割り当てセレクト | ✅ |
| `MacroTab.tsx` | マクロ一覧・新規作成・編集・削除（割り当て自動解除） | ✅ |
| `MacroEditor.tsx` | ON/OFF アクションリスト・モーダルエディタ | ✅ |
| `ActionEditor.tsx` | 4種アクション切り替え・開発者モード非表示ガード | ✅ |
| `SettingsTab.tsx` | 自動起動トグル・開発者モードトグル（有効化確認ダイアログ） | ✅ |
| `Toast.tsx` | `action-error` / `sidecar-offline` の5秒トースト | ✅ |
| `PermissionBanner.tsx` | アクセシビリティ未付与時のバナー（後で閉じ可能） | ✅ |

---

## Phase 4: ビルド・配布

| 項目 | 状態 | 備考 |
|---|---|---|
| `sidecar/scripts/bundle.js` | ✅ | dev 用シェルスクリプトスタブを生成 |
| `src-tauri/binaries/matter-sidecar-aarch64-apple-darwin` | ✅ | dev 用スタブ（pnpm + tsx 経由） |
| `src-tauri/binaries/matter-sidecar-x86_64-apple-darwin` | ❌ | Intel Mac 対応スタブ未生成 |
| `tauri.conf.json` — `beforeBuildCommand` に `sidecar:build` 組み込み | ✅ | |
| Sidecar 本番バイナリ化（`@yao-pkg/pkg` or `bun build --compile`） | ❌ | matter.js ESM 依存との互換性検証が必要 |

---

## Phase 5: コード署名・公証

| 項目 | 状態 |
|---|---|
| Apple Developer 証明書取得 | ❌ |
| Tauri の `signingIdentity` 設定 | ❌ |
| `xcrun notarytool` による公証 | ❌ |
| Gatekeeper 通過確認 | ❌ |

---

## 積み残し課題

| 優先度 | 課題 | 詳細 |
|---|---|---|
| 高 | `commissioned` フラグ未送信 | Sidecar 起動時に matter.js のコミッショニング済み状態を確認し、`ready` ペイロードに含める |
| 高 | Intel Mac スタブ未生成 | `bundle.js` に x86_64 ターゲットを追加するだけ（スタブは aarch64 と同内容でよい） |
| 中 | Sidecar 本番バイナリ化 | `bun build --compile` の matter.js ESM 互換性検証。`@matter/nodejs` の動的 import が問題になる可能性あり |
| 中 | アプリアイコン未設定 | Tauri デフォルトアイコンのまま。.icns/.ico 作成が必要 |
| 低 | エラーログ収集 | Sidecar の stderr を Rust 経由で保存/表示する仕組みが未実装 |
| 低 | ライトモード/ダークモード対応 | CSS が固定ライトテーマのみ |

---

## `pnpm tauri dev` での動作確認状況

| 確認項目 | 状態 |
|---|---|
| TypeScript 型チェック全通過 | ✅ |
| Rust クレート解決（`cargo fetch`） | ✅ |
| Sidecar スタブ（tsx）でのローカル起動 | 未確認（Tauri dev 起動テスト未実施） |
| Google Home / Apple Home でのペアリング | 未確認 |
| ON/OFF コマンドからのアクション実行 | 未確認 |
