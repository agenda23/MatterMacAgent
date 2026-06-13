# 実装進捗ドキュメント

最終更新: 2026-06-13

---

## 全体フェーズ概要

| フェーズ | 内容 | 状態 |
|---|---|---|
| Phase 1 | Node.js Sidecar — matter.js Bridge 実装 | ✅ 完了 |
| Phase 2 | Rust/Tauri コア — IPC・設定・トレイ | ✅ 完了 |
| Phase 3 | React UI — 設定画面・マクロエディタ | ✅ 完了 |
| Phase 3.5 | UI デザインリファイン（サイドバーレイアウト 案B） | ✅ 完了 |
| Phase 4 | Sidecar バイナリ化・配布ビルド | ✅ 完了（ランタイム同梱方式） |
| Phase 5 | コード署名・公証・リリース | ❌ スコープ外 |

---

## Phase 1: Node.js Sidecar（matter.js Bridge）

**ファイル**: `sidecar/src/index.ts`

| 機能 | 状態 | 備考 |
|---|---|---|
| ServerNode + AggregatorEndpoint 起動 | ✅ | `ServerNode.create({ id: "matter-mac-agent" })` |
| OnOffPlugInUnitDevice × 10 Bridge 子デバイス | ✅ | BridgedDeviceBasicInformationServer 付き |
| ON/OFF イベント購読 (`onOff$Changed`) | ✅ | `server.start()` 後にバインド。null チェック付き |
| マクロアクション実行（shortcut / open） | ✅ | `execSync` 経由 |
| マクロアクション実行（shell / applescript） | ✅ | `developer_mode` ガード付き |
| config_update ホットリロード | ✅ | `updateSwitchLabels` でデバイス名を動的更新 |
| stdin/stdout IPC（Rust との双方向通信） | ✅ | 改行デリミタ JSON |
| `qr_code` メッセージ送信 | ✅ | qrPairingCode・manualPairingCode・discriminator・pin |
| `ready` メッセージ送信 | ✅ | `{ commissioned: server.lifecycle.isCommissioned }` を含む |
| `commissioning_status` イベント送信 | ✅ | `server.lifecycle.commissioned/decommissioned` フックで通知 |
| Matter 永続ストレージ | ✅ | `MATTER_PATH_ROOT` 環境変数経由 |

---

## Phase 2: Rust / Tauri コア

### `src-tauri/src/config.rs`

| 機能 | 状態 |
|---|---|
| Config・Action・Macro 型定義（serde） | ✅ |
| PairingInfo 型（qr_payload / manual_code / discriminator / pin） | ✅ |
| PermissionStatus 型 | ✅ |
| `Default::default()` — Endpoint 1〜10 の初期設定生成 | ✅ |
| `load_or_create` / `save` | ✅ |

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
| `ready` 受信 — `commissioned` 更新 + `commissioning-changed` emit + config_update 送信 | ✅ |
| `qr_code` 受信 — PairingInfo メモリ保存 | ✅ |
| `device_status` 受信 — `device-status-changed` emit | ✅ |
| `action_result` エラー受信 — `action-error` emit | ✅ |
| `commissioning_status` 受信 — `commissioned` 更新 + `commissioning-changed` emit | ✅ |
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

### `src-tauri/Cargo.toml`

| クレート | 備考 |
|---|---|
| `tauri` — `tray-icon` + `macos-private-api` | ✅ |
| `tauri-plugin-shell` / `tauri-plugin-autostart` / `tauri-plugin-positioner` | ✅ |
| `tauri-plugin-opener` | ✅ |
| `tokio` / `serde` / `serde_json` | ✅ |
| `accessibility-sys` | ✅ |
| `time = "=0.3.47"` | ✅ cookie 0.18 との E0119 競合を回避するバージョンピン |

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
| `Dashboard.tsx` | タブナビゲーション（SVG アイコン付き） | ✅ |
| `HomeTab.tsx` | Matter サーバー状態・QR+メタデータ・権限・commissioning-changed リッスン | ✅ |
| `SwitchTab.tsx` | 10スイッチグリッド・名前編集・マクロ割り当て・デバイス状態トグル | ✅ |
| `MacroTab.tsx` | マクロ一覧・CRUD・エンプティステート | ✅ |
| `MacroEditor.tsx` | ON/OFF アクションリスト・モーダルエディタ | ✅ |
| `ActionEditor.tsx` | 4種アクション切り替え・開発者モード非表示ガード | ✅ |
| `SettingsTab.tsx` | 1枚カード + ディバイダー形式のグループ設定 | ✅ |
| `Toast.tsx` | `action-error` / `sidecar-offline` の5秒トースト | ✅ |
| `PermissionBanner.tsx` | アクセシビリティ未付与時のバナー（後で閉じ可能） | ✅ |

---

## Phase 3.5: UI デザインリファイン

デザイン提案（`designsystem/Design System.zip`）をもとに実装。

### 変更内容

| 変更 | 詳細 |
|---|---|
| アクセントカラー | `#007aff`（青）→ `#0E9E73`（ティール） |
| CSS カスタムプロパティ化 | 全カラー・シャドウ・ボーダーを変数で管理 |
| ダークモード対応 | `@media (prefers-color-scheme: dark)` で全トークン再定義。アクセント `#30D69B` |
| カードスタイル | `border-radius: 13px`・`0.5px` ヘアラインボーダー・デュアルシャドウ |
| トグルサイズ | `48×28px` → `38×23px` |
| フォント | Hiragino Sans / Yu Gothic を日本語フォールバックに追加 |
| Dashboard レイアウト | トップタブ（案A）→ サイドバー（案B）に変更。196px固定サイドバー + コンテンツエリア |
| Dashboard ロゴ | サイドバー上部にボルトアイコン + "Matter / Mac Agent" テキスト |
| Dashboard サーバー状態 | サイドバー下部にステータスドット（緑/グレー） + テキスト |
| Dashboard ナビ | アクティブ項目はアクセントカラー背景 + 白テキスト |
| コンテンツヘッダー | 50px 固定高さ・ページタイトル表示・ハーレインボーダー |
| HomeTab | Matter サーバーカード水平レイアウト（アイコンボックス付き）・QR+メタデータ横並び・コピーボタン |
| SwitchTab | スイッチ番号バッジ（26×26、accentSoft 背景）・device-status-changed リアルタイムトグル表示 |
| MacroTab | エンプティステート（アイコン + タイトル + 説明 + ダッシュボーダー） |
| SettingsTab | 2項目を1枚カードにまとめ、ディバイダー区切りのグループ形式 |

---

## Phase 4: ビルド・配布

### Sidecar 配布方式（`@yao-pkg/pkg` は不採用）

`@yao-pkg/pkg` は matter.js の `#node` import maps と非互換のため、**ランタイム同梱ランチャー方式**を採用。

| 項目 | 状態 | 備考 |
|---|---|---|
| `sidecar/scripts/bundle.js` | ✅ | esbuild バンドル + pnpm deploy + Node.js バイナリ同梱 + tar.gz 生成 |
| `matter-sidecar-aarch64-apple-darwin` | ✅ | シェルランチャー（初回起動時に tar 展開してキャッシュ） |
| `matter-sidecar-x86_64-apple-darwin` | ✅ | 同上（aarch64 ホストからのクロスビルド時はシステム Node フォールバック） |
| `sidecar-runtime.tar.gz` | ✅ | Tauri `resources` に 1 ファイルとして同梱（20k ファイル glob 回避） |
| 開発用スタブ (`pnpm sidecar:build:stub`) | ✅ | pnpm + tsx ラッパー（`--stub` フラグ） |
| `tauri.conf.json` — `resources` に `sidecar-runtime.tar.gz` 登録 | ✅ | |
| `tauri.conf.json` — `beforeBuildCommand` に `sidecar:build` 組み込み | ✅ | |

### ビルドコマンド

```bash
pnpm sidecar:build:stub   # 開発用（tauri dev）
pnpm sidecar:build        # 配布用（esbuild + Node.js 同梱 tar.gz）
pnpm tauri build          # .dmg / .app 生成
```

---

## Phase 5: コード署名・公証

| 項目 | 状態 |
|---|---|
| Apple Developer 証明書取得 | ❌ スコープ外 |
| Tauri の `signingIdentity` 設定 | ❌ スコープ外 |
| `xcrun notarytool` による公証 | ❌ スコープ外 |

---

## 積み残し課題

### 動作確認

| 優先度 | 課題 | 詳細 |
|---|---|---|
| 高 | 実機ペアリング・ON/OFF 動作確認 | Google Home / Apple Home での E2E テスト未実施 |
| 低 | エラーログ収集 | Sidecar stderr を Rust 経由で保存・表示する仕組みが未実装 |
| 低 | Intel Mac クロスビルド | aarch64 ホストから x86_64 ランチャーを生成する際、Node バイナリが同梱されずシステム Node 依存になる |

### リリース向けアセット

#### アプリアイコン（必須）

現状は Tauri デフォルトのプレースホルダー（512×512）が入っているだけ。リリース前に専用アイコンを作成して差し替える必要がある。

| 作業 | 詳細 |
|---|---|
| ソース PNG を作成 | **1024×1024px**、PNG、透過背景。`src-tauri/icons/icon-source.png` として保存 |
| 派生ファイルを自動生成 | `pnpm tauri icon src-tauri/icons/icon-source.png` で `.icns` / `.ico` / 各サイズ PNG を一括生成 |

**生成されるファイル（自動）**: `icon.icns`、`icon.ico`、`32x32.png`、`128x128.png`、`128x128@2x.png` など

**nanobanana プロンプト（1024×1024 PNG）**:

```yaml
subject: macOS application icon for a smart home automation app "Matter Mac Agent"
symbol: lightning bolt, bold geometric shape, centered
style:
  shape: squircle (Apple app icon shape, rounded corners)
  surface: smooth gradient, subtle gloss
  icon_style: macOS Ventura era, flat with depth
colors:
  background_gradient:
    - from: "#0E9E73"
    - to: "#096B4E"
  symbol: white, slightly off-white inner glow
  shadow: deep teal, inset bottom
mood: professional, minimal, trustworthy, modern
size: 1024x1024
format: PNG
background: transparent
negative: text, wordmark, complex details, photorealistic elements, drop shadow outside icon shape, multiple symbols
```

#### メニューバーアイコン（推奨）

現状は `default_window_icon()`（アプリアイコン）をトレイに流用している。macOS メニューバーには専用のテンプレートアイコンが必要。

| 項目 | 仕様 |
|---|---|
| サイズ | 18×18px（@1x）/ 36×36px（@2x） |
| 形式 | PNG、モノクロ（純黒）、透過背景 |
| 理由 | `icon_as_template(true)` でシステムがライト/ダーク反転を自動処理するため、カラーなしで設計する |
| 配置先 | `src-tauri/icons/tray-icon.png`、`src-tauri/icons/tray-icon@2x.png` |
| 実装変更 | `tray.rs` の `default_window_icon()` をこのファイルを読み込む実装に変更する |

**nanobanana プロンプト（36×36 PNG、@2x 用）**:

```yaml
subject: macOS menu bar template icon, lightning bolt symbol
style:
  stroke: single weight, SF Symbol style geometry
  edges: pixel-perfect, crisp at small size
  form: solid fill, no outline stroke
colors:
  symbol: pure black "#000000"
  background: transparent
size: 36x36
format: PNG
background: transparent
note: used as macOS template icon (icon_as_template=true). Must be pure black on transparent — system handles light/dark inversion automatically.
negative: color, gradient, shadow, glow, anti-aliasing artifacts, border, rounded container shape
```

#### スクリーンショット（README / GitHub 用）

スクリーンショットはアプリを実機で起動して撮影する。AI 生成は不要。

| ファイル名 | 内容 |
|---|---|
| `docs/screenshots/home-pairing.png` | ホームタブ — QR コードとペアリング情報が表示されている状態 |
| `docs/screenshots/home-paired.png` | ホームタブ — ペアリング済みバッジが表示されている状態 |
| `docs/screenshots/switches.png` | スイッチタブ — 10 個のスイッチにマクロが割り当てられている状態 |
| `docs/screenshots/macros.png` | マクロタブ — マクロ一覧と編集画面 |
| `docs/screenshots/tray.png` | メニューバー — トレイアイコンとクリック時のダッシュボード |

推奨サイズ: **1280×800px**（Retina では @2x で撮影し 2倍サイズになる）

#### DMG 背景画像（任意）

| 項目 | 仕様 |
|---|---|
| サイズ | 660×400px |
| 形式 | PNG |
| 内容 | アプリアイコン → Applications フォルダへのドラッグ矢印 |
| 配置先 | `src-tauri/dmg-background.png` |
| 設定方法 | `tauri.conf.json` の `bundle.macOS.dmgBackground` に指定 |

**nanobanana プロンプト（660×400 PNG）**:

```yaml
subject: macOS DMG installer background for "Matter Mac Agent"
layout:
  left: app icon placeholder (squircle, teal gradient, lightning bolt)
  center: large arrow pointing right, medium gray
  right: macOS Applications folder icon (system style)
  spacing: balanced, generous whitespace
style:
  aesthetic: minimal, clean, macOS native
  surface: flat, no texture
colors:
  background: light warm gray "#F0F0F2"
  arrow: "#AAAAAF"
  accent_hint: very subtle teal tint on background, barely visible
mood: clean, uncluttered, professional installer
size: 660x400
format: PNG
background: opaque
negative: text, instructions, screenshots, gradients on background, dark mode, busy patterns, decorative elements
```

---

## 検証状況（2026-06-13）

| 確認項目 | 状態 |
|---|---|
| TypeScript 型チェック（フロントエンド + sidecar） | ✅ |
| Rust `cargo fetch` / `cargo check` | ✅ |
| Sidecar スタブ（tsx）起動・IPC | ✅ `ready` / `qr_code` 送信確認 |
| Sidecar ランタイムランチャー起動 | ✅ matter.js サーバー起動確認 |
| UI デザインリファイン（CSS 変数 + ダークモード） | ✅ 型チェック通過 |
| Google Home / Apple Home ペアリング | 未確認 |
| ON/OFF コマンドからのアクション実行 | 未確認 |
