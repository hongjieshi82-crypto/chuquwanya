#!/usr/bin/env bash
set -euo pipefail
set +x

printf '请从高德控制台复制新建的“Web 服务”Key，粘贴到这里并按回车（输入不会显示）：'
IFS= read -r -s AMAP_KEY_INPUT
printf '\n'
if [[ -z "$AMAP_KEY_INPUT" ]]; then
  printf '没有输入 Key，服务器未修改。\n' >&2
  exit 1
fi
printf '%s\n' "$AMAP_KEY_INPUT" | ssh -o BatchMode=yes root@120.27.234.236 'python3 /opt/chuquwanya/deploy/install-amap-web-key.py'
unset AMAP_KEY_INPUT
