#!/bin/bash
set -euo pipefail

# DMG ビルド前に残留マウントや一時ファイルを掃除する。
# bundle_dmg.sh 失敗の多くは、前回ビルドのマウント残留が原因。

PRODUCT_NAME="Matter Mac Agent"
VOLUME="/Volumes/${PRODUCT_NAME}"

if mount | grep -Fq "$VOLUME"; then
  echo "Unmounting stale DMG volume: $VOLUME"
  hdiutil detach "$VOLUME" -force || true
fi

DMG_DIR="src-tauri/target/release/bundle/dmg"
if [ -d "$DMG_DIR" ]; then
  rm -f "$DMG_DIR"/rw.*.dmg 2>/dev/null || true
fi

echo "DMG build cleanup done."
