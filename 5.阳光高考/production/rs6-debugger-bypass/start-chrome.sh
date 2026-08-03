#!/bin/bash
# 启动带调试端口的 Chrome（独立 profile，不影响日常浏览器）
# 用法: ./start-chrome.sh
PORT="${1:-9223}"
PROFILE_DIR="$HOME/.chrome-rs6-debug"

if lsof -nP -iTCP:$PORT -sTCP:LISTEN > /dev/null 2>&1; then
  echo "端口 $PORT 已被占用（Chrome 可能已在运行）"
  curl -s --max-time 2 "http://127.0.0.1:$PORT/json/version" | head -2
  exit 0
fi

nohup "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --remote-debugging-port=$PORT \
  --user-data-dir="$PROFILE_DIR" \
  --no-first-run --no-default-browser-check \
  > /tmp/chrome-rs6-debug.log 2>&1 &

sleep 3
echo "Chrome 已启动，调试端口: $PORT"
curl -s --max-time 3 "http://127.0.0.1:$PORT/json/version" | python3 -c "import json,sys; d=json.load(sys.stdin); print('Browser:', d['Browser'])"
