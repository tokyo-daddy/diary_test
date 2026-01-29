# 交換日記アプリ

このプロジェクトは、ReactとCloudflare Workersを使用して構築された交換日記Webアプリケーションです。

## 概要

親しい人と交換日記を楽しむためのアプリケーションです。
ペアを作成し、招待コードで相手を招待して、日々の出来事を共有できます。

## 技術スタック

- **フロントエンド**: React, Vite, TailwindCSS (Cloudflare Pages)
- **バックエンド**: Cloudflare Workers (Hono)
- **データベース**: Cloudflare D1 (SQLite-based)

## セットアップ

### 必要要件

- Node.js 18以上
- npm

### 開発環境の起動

1. **バックエンド（Cloudflare Workers）のセットアップ**
   ```bash
   cd workers
   npm install
   # ローカルデータベースの初期化（初回のみ）
   npx wrangler d1 migrations apply diary-db --local
   # サーバー起動 (localhost:8787)
   npm run dev
   ```

2. **フロントエンド（Vite）のセットアップ**
   ```bash
   cd client
   npm install
   # サーバー起動 (localhost:5173)
   npm run dev
   ```

> [!NOTE]
> クライアントの `client/.env` ファイルには `VITE_API_URL=http://localhost:8787/api` が設定されている必要があります。

## ディレクトリ構成

- `client/`: フロントエンド (React + Vite)
- `workers/`: バックエンド (Cloudflare Workers + D1)
- `server/`: (レガシー) Express版バックエンド。現在は Workers 版が推奨されています。
