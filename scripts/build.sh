#!/usr/bin/env bash
# Packages scorm/ into a Canvas-importable SCORM 1.2 zip.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC_DIR="$REPO_ROOT/scorm"
OUT_DIR="$REPO_ROOT/dist"
OUT_FILE="$OUT_DIR/duke-info-literacy-authority-searching.zip"

mkdir -p "$OUT_DIR"
rm -f "$OUT_FILE"

cd "$SRC_DIR"
zip -r "$OUT_FILE" . -x ".*"

echo "Built: $OUT_FILE"
