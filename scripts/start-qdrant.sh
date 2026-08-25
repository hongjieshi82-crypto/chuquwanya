#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
TOOLS_DIR="$ROOT_DIR/.tools/qdrant"
BIN="$TOOLS_DIR/qdrant"
STORAGE_DIR="$TOOLS_DIR/storage"
VERSION="v1.13.5"

arch="$(uname -m)"
case "$arch" in
  arm64) ARCHIVE="qdrant-aarch64-apple-darwin" ;;
  x86_64) ARCHIVE="qdrant-x86_64-apple-darwin" ;;
  *)
    echo "不支持的 Mac 架构: $arch"
    exit 1
    ;;
esac

URL="https://github.com/qdrant/qdrant/releases/download/${VERSION}/${ARCHIVE}.tar.gz"

if [[ ! -x "$BIN" ]]; then
  echo "首次运行：下载 Qdrant ${VERSION} (${ARCHIVE})..."
  mkdir -p "$TOOLS_DIR"
  tmp="$(mktemp -d)"
  curl -fsSL "$URL" -o "$tmp/qdrant.tar.gz"
  tar -xzf "$tmp/qdrant.tar.gz" -C "$tmp"
  mv "$tmp/qdrant" "$BIN"
  rm -rf "$tmp"
  chmod +x "$BIN"
  echo "已安装到 $BIN"
fi

mkdir -p "$STORAGE_DIR" "$TOOLS_DIR/config"

CONFIG_FILE="$TOOLS_DIR/config/config.yaml"
if [[ ! -f "$CONFIG_FILE" ]]; then
  cat > "$CONFIG_FILE" <<'EOF'
storage:
  storage_path: ./storage

service:
  host: 127.0.0.1
  http_port: 6333
  grpc_port: 6334

log_level: INFO
EOF
fi

echo "启动 Qdrant：http://127.0.0.1:6333"
echo "数据目录：$STORAGE_DIR"
echo "按 Ctrl+C 停止"

cd "$TOOLS_DIR"
exec "$BIN" --config-path "$CONFIG_FILE"
