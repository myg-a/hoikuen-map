# CLAUDE.local.md

This file provides guidance to Claude Code (claude.ai/code) when working with the Hoikuen Map project.

## プロジェクト概要

保育園空き状況マップアプリケーション - 保育園の空き状況をインタラクティブな地図上に表示するウェブアプリケーション

## アーキテクチャ

- **フロントエンド専用SPA**: Vanilla JavaScript + Leaflet.js
- **データソース**: CSVファイル（UTF-8形式）
- **機能**: 地図表示、クラスタリング、詳細ポップアップ、現在地表示
- **Dev Container**: Node.js 18開発環境

## 開発コマンド

```bash
npm install            # 依存関係インストール
npm start             # 開発サーバー起動（ポート3000、ブラウザ非起動）
npm run serve         # 開発サーバー起動（ブラウザ自動起動）
npm run serve-python  # Python HTTPサーバー起動（ポート8000）
npm run dev           # ファイル監視付き開発サーバー
npm test              # テスト実行（test-runner.htmlを開く）
npm test:open         # テスト実行（ブラウザ自動起動）
npm run format        # Prettierでコードフォーマット
npm run format-check  # フォーマットチェック
```

### Dev Container使用時
1. VS Codeで「Dev Containers: Reopen in Container」を実行
2. コンテナ内で上記コマンドを実行

## 技術スタック

- **地図ライブラリ**: Leaflet.js 1.9.4
- **地図タイル**: OpenStreetMap
- **開発サーバー**: Live Server (ホットリロード対応)
- **コードフォーマッター**: Prettier
- **テストランナー**: カスタムHTML基盤のテストスイート

## ファイル構成

- `index.html`: メインアプリケーションページ
- `script.js`: アプリケーションロジック
- `style.css`: スタイルシート
- `test-runner.html`: テスト実行用HTML
- `20250601_hoikuen_utf8.csv`: 保育園データ（UTF-8）

## データ形式

CSVファイルには以下のカラムが含まれます：
- 利用調整日
- 施設名
- 施設類型
- 年齢別空き状況（0歳～5歳）
- 位置情報（緯度・経度）
- 延長保育時間

## 開発上の注意事項

1. **エンコーディング**: CSVファイルは必ずUTF-8で保存
2. **位置情報**: 緯度・経度の精度に注意（小数点以下6桁推奨）
3. **ブラウザ互換性**: モダンブラウザ対応（IE非対応）
4. **LocalStorage**: お気に入り機能で使用（5-10MB制限）
5. **レスポンシブ対応**: モバイルファースト設計

## テスト

テストは`test-runner.html`で実行されます。主なテスト項目：
- 地図の初期化
- マーカーの表示
- フィルタリング機能
- お気に入り機能の永続化