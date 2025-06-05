# Node.js 18 LTSをベースイメージとして使用
FROM node:18-bullseye

# システムパッケージの更新とPythonのインストール
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# 作業ディレクトリの設定
WORKDIR /workspaces/hoikuen-map

# nodeユーザーに適切な権限を付与
RUN chown -R node:node /workspaces

# nodeユーザーに切り替え
USER node

# グローバルに必要なnpmパッケージをインストール
RUN npm install -g live-server http-server

# ポート3000と8000を公開
EXPOSE 3000 8000

# デフォルトコマンド
CMD ["bash"]