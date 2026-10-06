#!/usr/bin/env bash

set -Eeuo pipefail
IFS=$'\n\t'

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
PROJECT_ROOT="$(cd -- "$SCRIPT_DIR/.." && pwd -P)"
STANDALONE_DIR="$PROJECT_ROOT/.next/standalone"
OUT_DIR="$PROJECT_ROOT/out"
ZIP_PATH="$OUT_DIR/kelaibao-fc.zip"
FILES_PATH="$OUT_DIR/kelaibao-fc.files.txt"
CHECKSUM_PATH="$OUT_DIR/kelaibao-fc.zip.sha256"
ARTIFACT_CHECK_DIR=""
OUTPUTS_CLEANED=0
PACKAGE_COMPLETE=0

log() {
  printf '[package-fc] %s\n' "$*"
}

die() {
  printf '[package-fc] ERROR: %s\n' "$*" >&2
  exit 1
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || die "Required command not found: $1"
}

cleanup() {
  if [[ -n "$ARTIFACT_CHECK_DIR" && -d "$ARTIFACT_CHECK_DIR" ]]; then
    case "$(basename -- "$ARTIFACT_CHECK_DIR")" in
      kelaibao-fc-zip.*)
        rm -rf -- "$ARTIFACT_CHECK_DIR"
        ;;
      *)
        printf '[package-fc] WARNING: refused to remove unexpected temporary directory: %s\n' \
          "$ARTIFACT_CHECK_DIR" >&2
        ;;
      esac
  fi

  if [[ "$OUTPUTS_CLEANED" == "1" && "$PACKAGE_COMPLETE" != "1" ]]; then
    rm -f -- "$ZIP_PATH" "$FILES_PATH" "$CHECKSUM_PATH"
  fi
}

trap cleanup EXIT

log 'Checking Linux packaging environment.'

[[ "$(uname -s)" == "Linux" ]] || die 'Run this script on Linux or WSL2, not Windows or macOS.'
[[ "$(uname -m)" == "x86_64" ]] || die "Expected x86_64, found $(uname -m)."

for command_name in node pnpm zip unzip zipinfo sha256sum find grep mktemp du; do
  require_command "$command_name"
done

NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
[[ "$NODE_MAJOR" == "20" ]] || die "Expected Node.js 20.x, found $(node --version)."

PNPM_VERSION="$(pnpm --version)"
[[ "$PNPM_VERSION" == "10.34.5" ]] || die "Expected pnpm 10.34.5, found $PNPM_VERSION."

PROJECT_PACKAGE_MANAGER="$(node -p "require('$PROJECT_ROOT/package.json').packageManager")"
[[ "$PROJECT_PACKAGE_MANAGER" == "pnpm@10.34.5" ]] || \
  die "Expected packageManager=pnpm@10.34.5, found $PROJECT_PACKAGE_MANAGER."

if find "$PROJECT_ROOT" -maxdepth 1 -type f -name '.env*' ! -name '.env.example' -print -quit | grep -q .; then
  find "$PROJECT_ROOT" -maxdepth 1 -type f -name '.env*' ! -name '.env.example' -print >&2
  die 'Move local .env* files out of the project before packaging a production artifact.'
fi

[[ -d "$STANDALONE_DIR" ]] || die 'Missing .next/standalone. Run pnpm build first.'
[[ -f "$STANDALONE_DIR/server.js" ]] || die 'Missing .next/standalone/server.js. Run pnpm build first.'
[[ -f "$STANDALONE_DIR/package.json" ]] || die 'Missing .next/standalone/package.json.'
[[ -d "$STANDALONE_DIR/node_modules" ]] || die 'Missing traced node_modules directory.'
[[ -d "$STANDALONE_DIR/.next/server" ]] || die 'Missing .next/standalone/.next/server.'
[[ -d "$STANDALONE_DIR/.next/static" ]] || die 'Missing .next/standalone/.next/static.'
[[ -d "$STANDALONE_DIR/public" ]] || die 'Missing .next/standalone/public.'
[[ -L "$STANDALONE_DIR/node_modules/next" ]] || \
  die 'node_modules/next is not a symbolic link; rebuild with pnpm on Linux x86_64.'

NATIVE_MODULES="$(find "$STANDALONE_DIR" -type f -name '*.node' -print)"
if [[ -n "$NATIVE_MODULES" ]]; then
  printf '%s\n' "$NATIVE_MODULES"
  if printf '%s\n' "$NATIVE_MODULES" | grep -Eiq '(^|/)(win32|darwin)(/|$)'; then
    die 'Standalone artifact contains a Windows or macOS native module.'
  fi
fi

log 'Cleaning known generated leftovers and previous FC package outputs.'
rm -rf -- "$STANDALONE_DIR/.next/cache" "$STANDALONE_DIR/.local-data"
mkdir -p -- "$OUT_DIR"
rm -f -- "$ZIP_PATH" "$FILES_PATH" "$CHECKSUM_PATH"
OUTPUTS_CLEANED=1

if find "$STANDALONE_DIR" -type f \
  \( -name '.env' -o -name '.env.*' -o -name '*.sqlite' -o -name '*.sqlite-wal' \
     -o -name '*.sqlite-shm' -o -name '*.sqlite-journal' \) -print -quit | grep -q .; then
  find "$STANDALONE_DIR" -type f \
    \( -name '.env' -o -name '.env.*' -o -name '*.sqlite' -o -name '*.sqlite-wal' \
       -o -name '*.sqlite-shm' -o -name '*.sqlite-journal' \) -print >&2
  die 'Standalone artifact contains a forbidden environment or SQLite file.'
fi

log 'Creating symlink-preserving FC ZIP.'
(
  cd -- "$STANDALONE_DIR"
  zip -qry "$ZIP_PATH" .
)

unzip -Z1 "$ZIP_PATH" > "$FILES_PATH"

grep -qx 'server.js' "$FILES_PATH" || die 'ZIP root is missing server.js.'
grep -qx 'package.json' "$FILES_PATH" || die 'ZIP root is missing package.json.'
grep -q '^node_modules/' "$FILES_PATH" || die 'ZIP is missing node_modules/.'
grep -q '^\.next/server/' "$FILES_PATH" || die 'ZIP is missing .next/server/.'
grep -q '^\.next/static/' "$FILES_PATH" || die 'ZIP is missing .next/static/.'
grep -q '^public/' "$FILES_PATH" || die 'ZIP is missing public/.'

if grep -Eq '(^|/)\.env([^/]*)(/|$)|(^|/)\.local-data(/|$)|(^|/)\.next/cache(/|$)|\.sqlite(-(wal|shm|journal))?$' \
  "$FILES_PATH"; then
  die 'ZIP contains a forbidden environment, cache, local-data, or SQLite entry.'
fi

zipinfo -l "$ZIP_PATH" node_modules/next | grep -q '^l' || \
  die 'ZIP did not preserve node_modules/next as a Unix symbolic link.'

log 'Extracting ZIP into an isolated temporary directory for dependency verification.'
ARTIFACT_CHECK_DIR="$(mktemp -d -t kelaibao-fc-zip.XXXXXX)"
unzip -q "$ZIP_PATH" -d "$ARTIFACT_CHECK_DIR"
[[ -L "$ARTIFACT_CHECK_DIR/node_modules/next" ]] || \
  die 'Extracted node_modules/next is not a symbolic link.'
(
  cd -- "$ARTIFACT_CHECK_DIR"
  node -e 'require("./node_modules/next/dist/server/require-hook.js")'
)

sha256sum "$ZIP_PATH" > "$CHECKSUM_PATH"
PACKAGE_COMPLETE=1

log "ZIP ready: $ZIP_PATH"
log "File manifest: $FILES_PATH"
log "SHA-256: $CHECKSUM_PATH"
du -h "$ZIP_PATH"
