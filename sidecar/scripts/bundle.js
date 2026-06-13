/**
 * Sidecar bundle script.
 *
 * --stub   : 開発用ラッパー（pnpm + tsx）
 * (default): 配布用ランタイム同梱（esbuild + node_modules + Node.js バイナリ）
 */
import { execSync } from "node:child_process";
import {
  chmodSync,
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const __dirname = dirname(fileURLToPath(import.meta.url));
const sidecarRoot = join(__dirname, "..");
const repoRoot = join(sidecarRoot, "..");
const rootPackage = JSON.parse(
  readFileSync(join(repoRoot, "package.json"), "utf8")
);
const RUNTIME_VERSION = rootPackage.version;
const binariesDir = join(repoRoot, "src-tauri", "binaries");
const runtimeDir = join(binariesDir, "sidecar-runtime");
const cacheDir = join(sidecarRoot, ".cache");
const useStub = process.argv.includes("--stub");

const NODE_VERSION = "20.18.0";

const TARGETS = [
  {
    arch: "arm64",
    nodeArch: "arm64",
    name: "matter-sidecar-aarch64-apple-darwin",
  },
  {
    arch: "x86_64",
    nodeArch: "x64",
    name: "matter-sidecar-x86_64-apple-darwin",
  },
];

function writeDevStub(name) {
  const path = join(binariesDir, name);
  const stub = `#!/bin/bash
set -euo pipefail
cd "${repoRoot}"
exec pnpm --filter @matter-mac-agent/sidecar exec tsx src/index.ts
`;
  writeFileSync(path, stub, { mode: 0o755 });
  console.log(`Wrote dev stub: ${path}`);
}

function writeLauncher(name, nodeRelativePath) {
  const path = join(binariesDir, name);
  const launcher = `#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CACHE_DIR="\${MATTER_SIDECAR_RUNTIME:-$HOME/Library/Application Support/com.matter-mac-agent/sidecar-runtime}"
NODE_REL="${nodeRelativePath}"

resolve_runtime_dir() {
  if [ -f "$SCRIPT_DIR/sidecar-runtime/bundle.cjs" ]; then
    echo "$SCRIPT_DIR/sidecar-runtime"
    return
  fi

  local tarball=""
  for candidate in \\
    "$SCRIPT_DIR/../Resources/binaries/sidecar-runtime.tar.gz" \\
    "$SCRIPT_DIR/../Resources/sidecar-runtime.tar.gz" \\
    "$SCRIPT_DIR/sidecar-runtime.tar.gz"; do
    if [ -f "$candidate" ]; then
      tarball="$candidate"
      break
    fi
  done

  if [ -n "$tarball" ]; then
    mkdir -p "$CACHE_DIR"
    local needs_extract=0
    if [ ! -f "$CACHE_DIR/bundle.cjs" ]; then
      needs_extract=1
    elif [ ! -f "$CACHE_DIR/.runtime-version" ]; then
      needs_extract=1
    elif [ "$(cat "$CACHE_DIR/.runtime-version")" != "${RUNTIME_VERSION}" ]; then
      needs_extract=1
    elif [ "$tarball" -nt "$CACHE_DIR/bundle.cjs" ]; then
      needs_extract=1
    fi

    if [ "$needs_extract" = "1" ]; then
      rm -rf "$CACHE_DIR"
      mkdir -p "$CACHE_DIR"
      tar -xzf "$tarball" -C "$CACHE_DIR"
    fi
    echo "$CACHE_DIR"
    return
  fi

  if [ -f "$CACHE_DIR/bundle.cjs" ]; then
    echo "$CACHE_DIR"
    return
  fi

  echo "sidecar runtime archive not found" >&2
  exit 1
}

RUNTIME_DIR="$(resolve_runtime_dir)"
ENTRY="$RUNTIME_DIR/bundle.cjs"
NODE_BIN="$RUNTIME_DIR/$NODE_REL"

if [ ! -f "$ENTRY" ]; then
  echo "sidecar entry not found: $ENTRY" >&2
  exit 1
fi

if [ -x "$NODE_BIN" ]; then
  exec "$NODE_BIN" "$ENTRY"
fi

if command -v node >/dev/null 2>&1; then
  exec node "$ENTRY"
fi

echo "Node.js runtime not found. Install Node.js 20+ or rebuild sidecar." >&2
exit 1
`;
  writeFileSync(path, launcher, { mode: 0o755 });
  console.log(`Wrote launcher: ${path}`);
}

async function bundleEntry() {
  mkdirSync(runtimeDir, { recursive: true });
  const outfile = join(runtimeDir, "bundle.cjs");

  await esbuild.build({
    entryPoints: [join(sidecarRoot, "src/index.ts")],
    bundle: true,
    platform: "node",
    target: "node20",
    format: "cjs",
    outfile,
    logLevel: "info",
    packages: "external",
  });

  return outfile;
}

function deployDependencies() {
  const deployDir = join(cacheDir, "deploy");
  rmSync(deployDir, { recursive: true, force: true });
  mkdirSync(deployDir, { recursive: true });

  execSync(`pnpm deploy --filter @matter-mac-agent/sidecar --prod "${deployDir}"`, {
    cwd: repoRoot,
    stdio: "inherit",
  });

  rmSync(join(runtimeDir, "node_modules"), { recursive: true, force: true });
  cpSync(join(deployDir, "node_modules"), join(runtimeDir, "node_modules"), {
    recursive: true,
  });
  cpSync(join(deployDir, "package.json"), join(runtimeDir, "package.json"));
  writeFileSync(
    join(runtimeDir, ".runtime-version"),
    `${RUNTIME_VERSION}\n`
  );
}

function ensureNodeBinary(nodeArch) {
  const nodeDir = join(runtimeDir, `node-${nodeArch}`);
  const nodeBin = join(nodeDir, "bin", "node");

  if (existsSync(nodeBin)) {
    return `node-${nodeArch}/bin/node`;
  }

  mkdirSync(cacheDir, { recursive: true });
  const tarball = `node-v${NODE_VERSION}-darwin-${nodeArch}.tar.gz`;
  const url = `https://nodejs.org/dist/v${NODE_VERSION}/${tarball}`;
  const archivePath = join(cacheDir, tarball);

  if (!existsSync(archivePath)) {
    console.log(`Downloading ${url}`);
    execSync(`curl -fsSL "${url}" -o "${archivePath}"`, { stdio: "inherit" });
  }

  rmSync(nodeDir, { recursive: true, force: true });
  execSync(`tar -xzf "${archivePath}" -C "${cacheDir}"`, { stdio: "inherit" });
  cpSync(join(cacheDir, `node-v${NODE_VERSION}-darwin-${nodeArch}`), nodeDir, {
    recursive: true,
  });
  chmodSync(nodeBin, 0o755);

  return `node-${nodeArch}/bin/node`;
}

function createRuntimeArchive() {
  const archivePath = join(binariesDir, "sidecar-runtime.tar.gz");
  execSync(`tar -czf "${archivePath}" -C "${runtimeDir}" .`, {
    stdio: "inherit",
  });
  console.log(`Wrote runtime archive: ${archivePath}`);
  return archivePath;
}

async function buildProduction() {
  mkdirSync(binariesDir, { recursive: true });
  mkdirSync(runtimeDir, { recursive: true });

  await bundleEntry();
  deployDependencies();

  const hostArch = process.arch === "arm64" ? "arm64" : "x86_64";

  for (const target of TARGETS) {
    let nodeRelative;
    if (target.arch === hostArch) {
      nodeRelative = ensureNodeBinary(target.nodeArch);
    } else {
      // クロスアーキテクチャはシステム node にフォールバック
      nodeRelative = `node-${target.nodeArch}/bin/node`;
      console.log(
        `Note: ${target.name} uses system Node.js fallback (cross-arch build).`
      );
    }
    writeLauncher(target.name, nodeRelative);
  }

  createRuntimeArchive();
  rmSync(runtimeDir, { recursive: true, force: true });
}

async function main() {
  mkdirSync(binariesDir, { recursive: true });

  if (useStub) {
    for (const { name } of TARGETS) {
      writeDevStub(name);
    }
    return;
  }

  await buildProduction();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
