#!/bin/bash
# MitgliederSimple v0.4 — Demo Video Recorder
#
# Startet Xvfb (virtuelles Display), Vite dev server, ffmpeg-Aufnahme
# und das Playwright-Skript. Ergebnis: demo/output/demo-v0.4.mp4
#
# Voraussetzungen:
#   apt install -y xvfb ffmpeg fonts-dejavu
#   pnpm install
#   pnpm add -D playwright sql.js
#   npx playwright install chromium --with-deps

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
OUTPUT_DIR="$SCRIPT_DIR/output"

cd "$PROJECT_DIR"

mkdir -p "$OUTPUT_DIR"

# Cleanup on exit
cleanup() {
  echo "Cleaning up..."
  [ -n "${VITE_PID:-}" ] && kill "$VITE_PID" 2>/dev/null || true
  [ -n "${FFMPEG_PID:-}" ] && kill "$FFMPEG_PID" 2>/dev/null && wait "$FFMPEG_PID" 2>/dev/null || true
  [ -n "${XVFB_PID:-}" ] && kill "$XVFB_PID" 2>/dev/null || true
}
trap cleanup EXIT

# 1. Start Xvfb (virtual framebuffer)
echo "Starting Xvfb..."
Xvfb :99 -screen 0 1280x720x24 &
XVFB_PID=$!
export DISPLAY=:99
sleep 1

# 2. Start Vite dev server with demo config
echo "Starting Vite dev server..."
npx vite --config demo/vite.config.demo.js &
VITE_PID=$!

# Wait for Vite to be ready
echo "Waiting for Vite (http://localhost:1420)..."
for i in $(seq 1 30); do
  if curl -s http://localhost:1420 > /dev/null 2>&1; then
    echo "Vite ready."
    break
  fi
  sleep 1
done

# 3. Start ffmpeg screen recording
echo "Starting ffmpeg recording..."
ffmpeg -y -f x11grab -video_size 1280x720 -framerate 25 -i :99 \
  -c:v libx264 -preset fast -crf 23 -pix_fmt yuv420p \
  "$OUTPUT_DIR/demo-v0.4.mp4" &
FFMPEG_PID=$!
sleep 1

# 4. Run Playwright demo script
echo "Running Playwright demo..."
node demo/record-demo.js

# 5. Stop ffmpeg gracefully (send SIGINT for clean MP4 finalization)
echo "Stopping recording..."
kill -INT "$FFMPEG_PID"
wait "$FFMPEG_PID" 2>/dev/null || true
unset FFMPEG_PID  # Prevent double-kill in cleanup

echo ""
echo "Demo fertig: $OUTPUT_DIR/demo-v0.4.mp4"
ls -lh "$OUTPUT_DIR/demo-v0.4.mp4"
