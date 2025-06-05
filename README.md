# 保育園空き状況マップアプリケーション

## 概要
目黒区の保育園の空き状況をマップ上で可視化し、保護者が効率的に保育園を検索・比較できるウェブアプリケーションです。

## 機能
- **マップ表示**: OpenStreetMap + Leaflet.jsを使用した保育園位置の表示
- **空き状況の可視化**: 色分けされたマーカーで空き状況を表現
  - 緑: 空きあり（5人以上）
  - 黄: 一部空きあり（1-4人）
  - 赤: 満員（0人）
- **フィルタリング機能**:
  - 年齢別（0-5歳）
  - 施設類型別
  - 空きありのみ表示
- **お気に入り機能**: ローカルストレージを使用した保育園の保存
- **詳細情報表示**: 各保育園の年齢別空き状況の詳細表示
- **レスポンシブデザイン**: モバイル・タブレット対応

## 技術構成
- **フロントエンド**: HTML5, CSS3, Vanilla JavaScript
- **マップライブラリ**: Leaflet.js 1.9.4
- **データソース**: CSV形式（UTF-8）
- **データ保存**: localStorage（お気に入り機能）

## ファイル構成
```
hoikuen-map/
├── .devcontainer/          # Dev Container設定
│   ├── devcontainer.json  # Dev Container設定ファイル
│   └── Dockerfile         # Docker設定
├── .vscode/               # VS Code設定
│   ├── settings.json      # エディタ設定
│   ├── launch.json        # デバッグ設定
│   └── extensions.json    # 推奨拡張機能
├── doc/                   # ドキュメント
│   ├── images/            # スクリーンショット画像
│   ├── 要件定義.md        # プロジェクト要件定義
│   ├── テスト内容.md      # テスト仕様・結果
│   ├── 利用者ガイド.md    # エンドユーザー向け使い方ガイド
│   ├── スクリーンショット撮影手順.md # 画像撮影の手順書
│   └── log.md             # 開発ログ
├── index.html              # メインHTMLファイル
├── style.css               # スタイルシート
├── script.js               # メインJavaScriptファイル
├── test-runner.html        # テストランナー
├── package.json            # Node.js設定とスクリプト
├── .prettierrc             # コードフォーマット設定
├── .gitignore              # Git除外設定
├── 20250601_hoikuen_utf8.csv # 保育園データ（UTF-8変換済み）
└── README.md               # このファイル
```

## セットアップ・実行方法

### 1. Dev Container での実行（推奨）
Dev Containerを使用することで、環境構築不要で即座に開発を開始できます。

#### 前提条件:
- Docker Desktop がインストールされていること
- VS Code の Dev Containers 拡張機能がインストールされていること

#### 手順:
1. VS Code でプロジェクトフォルダを開く
2. コマンドパレット（Ctrl/Cmd + Shift + P）を開く
3. "Dev Containers: Reopen in Container" を選択
4. コンテナが起動するまで待機
5. ターミナルで以下を実行:
   ```bash
   npm start
   ```
6. ブラウザで `http://localhost:3000` にアクセス

#### 利用可能なnpmスクリプト:
```bash
npm start        # Live Serverで開発サーバー起動（ポート3000）
npm run serve    # Live Serverで開発サーバー起動（ブラウザ自動起動）
npm run serve-python # Python HTTPサーバー起動（ポート8000）
npm run dev      # ファイル監視付き開発サーバー
npm run format   # コードフォーマット実行
npm run format-check # コードフォーマットチェック
```

### 2. ローカル環境での実行
Dev Containerを使用しない場合は、以下の方法でローカルサーバーを起動してください。

#### Node.js + npm を使用:
```bash
cd hoikuen-map
npm install
npm start
```

#### Python 3を使用:
```bash
cd hoikuen-map
python3 -m http.server 8000
```

#### VS Code Live Serverを使用:
1. VS Codeでプロジェクトフォルダを開く
2. Live Server拡張機能をインストール
3. index.htmlを右クリック → "Open with Live Server"

### 3. ブラウザでアクセス
ローカルサーバー起動後、ブラウザで以下にアクセス:
- `http://localhost:3000` (npm start の場合)
- `http://localhost:8000` (Pythonの場合)
- 指定されたポート番号 (その他の場合)

## データについて
- **データ日付**: 2025年6月1日時点
- **対象地域**: 目黒区
- **データ項目**:
  - 保育園名
  - 施設類型（公立認可保育園、認可外保育施設、地域型保育事業）
  - 年齢別空き状況（0-5歳）
  - 位置情報（緯度・経度）
  - 延長保育時間

## データ更新方法
1. 新しいCSVファイルを取得
2. Shift_JISからUTF-8に変換（必要に応じて）
3. `20250601_hoikuen_utf8.csv`を新しいファイルで置き換え
4. ファイル名が異なる場合は`script.js`の`loadNurseryData()`メソッドのファイルパスを更新

## ブラウザ対応
- Chrome (推奨)
- Firefox
- Safari
- Edge

## 今後の拡張予定
- 距離・所要時間表示機能
- 通知機能
- 複数保育園の比較機能
- 申し込み情報へのリンク

## Dev Container の特徴
- **Node.js 18 LTS**: 最新の安定版Node.js環境
- **Python 3**: CSVデータ処理やHTTPサーバー用
- **Live Server**: リアルタイムリロード機能付き開発サーバー
- **Prettier**: コードフォーマッター自動設定
- **VS Code拡張機能**: 開発に必要な拡張機能が自動インストール
- **ポートフォワーディング**: 3000番と8000番ポートが自動で転送

## トラブルシューティング

### Dev Container関連
- **コンテナが起動しない**: Docker Desktop が起動していることを確認
- **ポートにアクセスできない**: VS Code の「ポート」タブでポートフォワーディングを確認
- **拡張機能が動作しない**: Dev Containers拡張機能がインストールされていることを確認

### アプリケーション関連
- **データが表示されない**: ローカルサーバーが起動していることを確認
- **文字化け**: CSVファイルがUTF-8でエンコードされていることを確認
- **マーカーが表示されない**: 緯度・経度データが正しく設定されていることを確認
- **npm コマンドが動作しない**: `npm install` が正常に実行されていることを確認