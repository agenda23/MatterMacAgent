# Matter Mac Agent

**MacをMatter対応のスマートホームデバイスに。**

クラウドやIFTTTを経由せず、Google HomeやApple Homeから直接、極めて低遅延でMacを操作できる常駐型アプリケーションです。

## 概要

Matter Mac Agentは、**Tauri**・**React**・**matter.js** で構築された軽量なメニューバー常駐アプリです。Mac上で仮想的な**Matter Bridge**として動作し、QRコード1枚のスキャンだけでGoogle Home / Apple Home / Alexa に10個の仮想スイッチが独立したデバイスとして登録されます。

各スイッチにmacOSショートカット・AppleScript・シェルコマンドを自由に割り当てて、「Hey Siri, 開発モードをオンにして」の一言でIDEの起動・Dockerの立ち上げ・ウィンドウ配置を一気に自動化できます。

## 主な機能

- **完全ローカル・超低遅延** — Wi-Fi/IPv6ネットワーク上でMatterプロトコルを直接使用。外部サーバー不使用、API制限なし
- **macOS「ショートカット」連携** — Mac標準のショートカットアプリをネイティブにトリガー
- **セキュアな設計** — localhostポート開放なし。Tauri IPCによるプロセス間通信のみ
- **かんたんセットアップ** — QRコードをスキャンするだけでペアリング完了

## ユースケース

| シーン | 操作 | 実行されること |
|---|---|---|
| 開発モード | 「Hey Siri, 開発モードをオンにして」 | VS Code起動・Docker起動・GitHubを開く |
| 映画タイム | スマートホームのシーンをタップ | 輝度を下げ・通知ミュート・Netflixを開く |
| インスタント・スリープ | 「Macを消して」 | 画面ロック＋スリープ |
| ブラウザリロード | 物理スマートボタンを押す | アクティブなブラウザに Cmd+R を送信 |

## 技術スタック

| レイヤー | 技術 |
|---|---|
| フロントエンド | React 18 + TypeScript + Vite |
| デスクトップ | Tauri 2 (Rust) |
| Matter サーバー | Node.js 20 + matter.js (Sidecar) |
| パッケージマネージャ | pnpm |

## 必要な環境

- macOS Ventura (13.0) 以降
- [Node.js](https://nodejs.org/) 20 LTS 以降
- [pnpm](https://pnpm.io/) 9 以降
- [Rust](https://www.rust-lang.org/tools/install) (rustup 経由で最新安定版)
- Xcode Command Line Tools (`xcode-select --install`)

## 開発環境のセットアップ

```bash
# リポジトリをクローン
git clone https://github.com/your-username/matter-mac-agent.git
cd matter-mac-agent

# 依存パッケージのインストール（フロントエンド + Sidecar）
pnpm install

# 開発モードで起動（ホットリロード有効）
pnpm tauri dev

# リリースビルド（.dmg 生成）
pnpm tauri build
```

## プロジェクト構成

```
matter-mac-agent/
├── src/               # React フロントエンド
├── src-tauri/         # Rust / Tauri バックエンド
│   ├── src/
│   └── tauri.conf.json
├── sidecar/           # Node.js matter.js サーバー
│   ├── src/
│   └── package.json
├── specs/             # 要件定義書・仕様書・設計書
└── package.json
```

## セキュリティと権限

本アプリはmacOSの**アクセシビリティ**および**オートメーション**権限を必要とします。

- 操作ログや個人情報をローカルネットワーク外部へ送信することは**一切ありません**
- シェルコマンド・AppleScriptの実行機能はデフォルトで無効です。設定から「開発者モード」を明示的に有効にした場合のみ利用できます
- 本プロジェクトは100%オープンソースです

## ドキュメント

- [要件定義書](specs/要件定義書.md)
- [仕様書](specs/仕様書.md)
- [設計書](specs/設計書.md)

## ライセンス

[MIT License](LICENSE)
