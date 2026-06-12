/**
 * Sidecar bundle placeholder.
 * Phase 3: replace with @yao-pkg/pkg or bun build --compile output.
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const stub = `#!/bin/bash
set -euo pipefail
cd "${root}"
exec pnpm --filter @matter-mac-agent/sidecar exec tsx src/index.ts
`;

const targets = [
  "matter-sidecar-aarch64-apple-darwin",
  "matter-sidecar-x86_64-apple-darwin",
];

for (const name of targets) {
  const path = join(root, "src-tauri/binaries", name);
  writeFileSync(path, stub, { mode: 0o755 });
  console.log(`Wrote ${path}`);
}
