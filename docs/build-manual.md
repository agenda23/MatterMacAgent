# ビルドマニュアル

---

## 概要

| 作業 | 実施場所 |
|---|---|
| 開発・動作確認 | ローカル Mac |
| リリースビルド | ローカル Mac（`pnpm tauri build`） |
| リリース公開 | GitHub（`gh` CLI でアップロード） |

---

## 必要な環境

| ツール | 最低バージョン | 確認コマンド |
|---|---|---|
| macOS | Ventura 13.0 以降 | `sw_vers` |
| Xcode Command Line Tools | 15.0 以降 | `xcode-select -p` |
| Rust (rustup) | 1.80 以降 | `rustc --version` |
| Node.js | 20 LTS 以降 | `node --version` |
| pnpm | 9 以降 | `pnpm --version` |

> **注意**: `npm` / `yarn` は使用しない。プロジェクト全体で `pnpm` に統一している。

---

## 初期セットアップ

### 1. Xcode Command Line Tools

```bash
xcode-select --install
```

### 2. Rust のインストール

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
```

macOS 向け Tauri は `aarch64-apple-darwin` / `x86_64-apple-darwin` の両ターゲットを使用する。通常は `rustup` のデフォルト設定で問題ない。

### 3. Node.js のインストール

[公式サイト](https://nodejs.org/) または `nvm` / `mise` でインストール。

```bash
# mise を使う場合
mise install node@20
```

### 4. pnpm のインストール

```bash
npm install -g pnpm
```

### 5. 依存パッケージのインストール

```bash
pnpm install
```

フロントエンド（`src/`）・sidecar（`sidecar/`）の両ワークスペースを一括インストールする。

---

## 開発ビルド（ホットリロード）

### Sidecar スタブを生成してから起動

```bash
# Sidecar の開発用スタブ（tsx ラッパー）を生成
pnpm sidecar:build:stub

# Tauri 開発モードで起動（フロントエンドはホットリロード）
pnpm tauri dev
```

開発モードでは `pnpm sidecar:build:stub` で生成した **シェルラッパー**（`src-tauri/binaries/matter-sidecar-*`）が Sidecar として使われる。このラッパーはリポジトリの `pnpm + tsx` で `sidecar/src/index.ts` を直接実行するため、Sidecar のコードを変更しても再ビルドなしで反映される（ただし Tauri の再起動は必要）。

### Sidecar のみ単独実行（matter.js デバッグ用）

```bash
pnpm sidecar:dev
```

Tauri を起動せずに Sidecar だけを実行する。stdout/stderr に IPC メッセージが出力される。

### 型チェック

```bash
pnpm typecheck
```

フロントエンドと sidecar の両方を一括チェックする。

---

## ローカル配布ビルド（動作確認用）

```bash
pnpm tauri build
```

このコマンドは内部的に以下を順番に実行する（`tauri.conf.json` の `beforeBuildCommand` による）。

```
① pnpm build               → Vite で React をビルド（dist/ 生成）
② pnpm sidecar:build       → Sidecar の本番ビルド（下記参照）
③ cargo build --release    → Rust バイナリをコンパイル
④ .app / .dmg をアセンブル → src-tauri/target/release/bundle/
```

成果物:

| ファイル | パス |
|---|---|
| .app | `src-tauri/target/release/bundle/macos/Matter Mac Agent.app` |
| .dmg | `src-tauri/target/release/bundle/dmg/Matter Mac Agent_*.dmg` |

---

## Sidecar ビルドの詳細

### なぜ通常のバイナリ化ができないか

matter.js が `#node` import maps を使用しており、`@yao-pkg/pkg` / `bun build --compile` と非互換。そのため**ランタイム同梱ランチャー方式**を採用している。

### 開発用スタブ（`pnpm sidecar:build:stub`）

```
src-tauri/binaries/matter-sidecar-{arch}  ← bash ラッパー（pnpm + tsx を起動）
```

Node.js をシステムにインストール済みであることが前提。ダウンロード不要・即時生成。

### 本番ビルド（`pnpm sidecar:build`）

```
sidecar/scripts/bundle.js が以下を実行:

1. esbuild で sidecar/src/index.ts を bundle.cjs にバンドル
   └─ 外部 node_modules は external にして別途同梱
2. pnpm deploy で本番用 node_modules を生成
3. Node.js v20.18.0 のバイナリをダウンロード（初回のみ）
   └─ aarch64: node-v20.18.0-darwin-arm64.tar.gz
   └─ x64:     node-v20.18.0-darwin-x64.tar.gz（クロスビルド時はスキップ）
4. 上記をまとめて sidecar-runtime.tar.gz に圧縮
   └─ 配置先: src-tauri/binaries/sidecar-runtime.tar.gz
5. 各アーキテクチャ向けシェルランチャーを生成
   └─ src-tauri/binaries/matter-sidecar-aarch64-apple-darwin
   └─ src-tauri/binaries/matter-sidecar-x86_64-apple-darwin
```

ランチャーはアプリ初回起動時に `sidecar-runtime.tar.gz` を `~/Library/Application Support/com.matter-mac-agent/sidecar-runtime/` に展開してキャッシュする。

#### ダウンロードキャッシュ

Node.js バイナリは `sidecar/.cache/` にキャッシュされる。2 回目以降は再ダウンロードしない。このディレクトリは `.gitignore` で管理対象外。

#### クロスアーキテクチャビルド（aarch64 ホストで x64 向けを生成）

x86_64 向けランチャーは生成されるが、Node.js バイナリは同梱されず **システム Node.js にフォールバック**する。配布用の完全ビルドには x86_64 ホスト（または Universal Binary 対応のビルドパイプライン）が必要。

---

## 既知の Cargo 依存関係の制約

`Cargo.toml` に以下のバージョンピンが必要:

```toml
time = "=0.3.47"
```

**理由**: `cookie 0.18` が依存する `time 0.3.47+` の `HourBase` トレイト実装が Rust 1.95+ の孤立ルール（E0119）と競合するため。`=0.3.47` に固定することで解消される。将来 `cookie` または `time` がアップデートされた場合は解除できる可能性がある。

---

## GitHub Release（本番リリース）

ビルドはローカルで行い、生成した .dmg を `gh` CLI で GitHub Releases にアップロードする。

### 前提: gh CLI のインストール

```bash
brew install gh
gh auth login
```

### リリースの流れ

```
① バージョンを更新してコミット
        ↓
② ローカルでビルド（pnpm tauri build）
        ↓
③ git tag を push
        ↓
④ gh release create で .dmg をアップロード
        ↓
⑤ GitHub の Draft Release を確認して公開
```

### 1. バージョンを更新する

`src-tauri/tauri.conf.json` と `src-tauri/Cargo.toml` のバージョンを揃えて更新する。

```json
// tauri.conf.json
{ "version": "0.2.0" }
```

```toml
# Cargo.toml
[package]
version = "0.2.0"
```

### 2. ローカルでビルドする

```bash
pnpm tauri build
```

成果物の場所:

```
src-tauri/target/release/bundle/dmg/Matter Mac Agent_0.2.0_aarch64.dmg
```

### 3. タグを作って push する

```bash
git add src-tauri/tauri.conf.json src-tauri/Cargo.toml
git commit -m "release v0.2.0"
git tag v0.2.0
git push origin main --tags
```

### 4. GitHub Release を作成して .dmg をアップロードする

```bash
DMG=$(find src-tauri/target/release/bundle/dmg -name "*.dmg" | head -1)

gh release create v0.2.0 "$DMG" \
  --title "Matter Mac Agent v0.2.0" \
  --draft \
  --generate-notes
```

`--draft` でドラフトとして作成される。GitHub の Releases ページで内容を確認してから「Publish release」で公開する。

### 注意事項

- **コード署名・公証は未設定**。受け取った側は Gatekeeper の警告が表示される（右クリック → 開く で回避可能）。
- Intel Mac 向け（x86_64）の .dmg を配布するには、Intel Mac でビルドするか、ランナーとして x86_64 環境が必要。arm64 ホストからビルドした x86_64 ランチャーは Node.js バイナリが同梱されないためシステム Node.js が必要になる。

---

## ビルドコマンド早見表

| コマンド | 用途 |
|---|---|
| `pnpm install` | 依存パッケージ一括インストール |
| `pnpm sidecar:build:stub` | 開発用 Sidecar スタブ生成 |
| `pnpm tauri dev` | 開発モード起動（ホットリロード） |
| `pnpm sidecar:dev` | Sidecar 単独起動（matter.js デバッグ） |
| `pnpm typecheck` | TypeScript 型チェック（全ワークスペース） |
| `pnpm sidecar:build` | 本番用 Sidecar ビルド（tar.gz 生成） |
| `pnpm tauri build` | 配布用ビルド（.app / .dmg 生成） |

---

## トラブルシューティング

### `cargo build` が E0119 で失敗する

`Cargo.toml` に `time = "=0.3.47"` が設定されているか確認する。

```toml
[dependencies]
time = "=0.3.47"
```

### `pnpm tauri dev` で Sidecar が起動しない

Sidecar スタブが生成されているか確認する。

```bash
ls src-tauri/binaries/
# matter-sidecar-aarch64-apple-darwin が存在すること

# なければ生成する
pnpm sidecar:build:stub
```

### `pnpm sidecar:build` で Node.js ダウンロードが失敗する

ネットワーク接続を確認する。プロキシ環境では `HTTPS_PROXY` / `NO_PROXY` 環境変数を設定してから再実行する。

`sidecar/.cache/` に途中までダウンロードされたファイルが残っている場合は削除してから再実行する。

```bash
rm -rf sidecar/.cache/
pnpm sidecar:build
```

### `pnpm tauri build` でアイコンエラーが出る

`src-tauri/icons/` に以下のファイルが揃っているか確認する。

```
icons/32x32.png
icons/128x128.png
icons/128x128@2x.png
icons/icon.icns
icons/icon.ico
```

不足している場合は `tauri icon` コマンドで生成できる（1024×1024 の PNG を用意）。

```bash
pnpm tauri icon path/to/icon-1024.png
```
