/**
 * Matter Mac Agent - Node.js Sidecar
 *
 * Hosts a Matter Bridge node (Aggregator + 10 BridgedDevice endpoints)
 * and executes macOS actions triggered by ON/OFF commands from smart home hubs.
 *
 * Communication with Rust Core:
 *   stdin  <- Rust: JSON messages (config_update, shutdown)
 *   stdout -> Rust: JSON messages (ready, qr_code, device_status, action_result)
 */

import { execSync } from "node:child_process";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ActionType = "shortcut" | "open" | "shell" | "applescript";

interface ShortcutAction { type: "shortcut"; name: string; input: string }
interface OpenAction     { type: "open";     target: string }
interface ShellAction    { type: "shell";    command: string }
interface AppleScriptAction { type: "applescript"; script: string }
type Action = ShortcutAction | OpenAction | ShellAction | AppleScriptAction;

interface Macro {
  id: string;
  name: string;
  on_actions: Action[];
  off_actions: Action[];
}

interface Endpoint {
  id: number;
  name: string;
  matter_type: "OnOffPluginUnitDevice";
  assigned_macro_id: string | null;
}

interface SystemConfig {
  developer_mode: boolean;
  auto_start: boolean;
}

interface Config {
  system: SystemConfig;
  endpoints: Endpoint[];
  macros: Macro[];
}

interface RustMessage {
  type: "config_update" | "shutdown";
  payload: unknown;
}

// ---------------------------------------------------------------------------
// IPC helpers (stdout -> Rust)
// ---------------------------------------------------------------------------

function sendToRust(type: string, payload: unknown = {}): void {
  process.stdout.write(JSON.stringify({ type, payload }) + "\n");
}

// ---------------------------------------------------------------------------
// Action execution
// ---------------------------------------------------------------------------

function executeAction(action: Action, developerMode: boolean): void {
  switch (action.type) {
    case "shortcut":
      execSync(`shortcuts run "${action.name}" <<< "${action.input}"`);
      break;
    case "open":
      execSync(`open "${action.target}"`);
      break;
    case "shell":
      if (!developerMode) throw new Error("shell action requires developer_mode");
      execSync(`bash -c "${action.command}"`);
      break;
    case "applescript":
      if (!developerMode) throw new Error("applescript action requires developer_mode");
      execSync(`osascript -e '${action.script}'`);
      break;
  }
}

async function handleSwitchEvent(
  config: Config,
  switchIndex: number,
  isOn: boolean
): Promise<void> {
  // Endpoint ID (2-11) maps to switch index (1-10); we receive switchIndex (1-10)
  const endpointId = switchIndex + 1;
  const endpoint = config.endpoints.find((e) => e.id === switchIndex);
  if (!endpoint?.assigned_macro_id) return;

  const macro = config.macros.find((m) => m.id === endpoint.assigned_macro_id);
  if (!macro) return;

  const actions = isOn ? macro.on_actions : macro.off_actions;
  for (let i = 0; i < actions.length; i++) {
    try {
      executeAction(actions[i], config.system.developer_mode);
      sendToRust("action_result", { endpoint_id: endpointId, action_index: i, success: true });
    } catch (err) {
      // Fail-open: continue executing remaining actions
      sendToRust("action_result", {
        endpoint_id: endpointId,
        action_index: i,
        success: false,
        error: String(err),
      });
    }
  }
}

// ---------------------------------------------------------------------------
// stdin <- Rust
// ---------------------------------------------------------------------------

function listenToRust(onMessage: (msg: RustMessage) => void): void {
  let buffer = "";
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (chunk: string) => {
    buffer += chunk;
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        onMessage(JSON.parse(trimmed) as RustMessage);
      } catch {
        // ignore malformed messages
      }
    }
  });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  // TODO Phase 1: Replace this stub with actual matter.js Bridge initialization.
  // The stub below demonstrates the communication protocol with Rust Core.

  let config: Config = {
    system: { developer_mode: false, auto_start: true },
    endpoints: Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      name: `仮想スイッチ ${i + 1}`,
      matter_type: "OnOffPluginUnitDevice",
      assigned_macro_id: null,
    })),
    macros: [],
  };

  // Listen for messages from Rust Core
  listenToRust((msg) => {
    switch (msg.type) {
      case "config_update":
        config = msg.payload as Config;
        break;
      case "shutdown":
        process.exit(0);
        break;
    }
  });

  // TODO: Initialize matter.js ServerNode with Aggregator + 10 BridgedDevices here.
  // On each device's onOff$Changed event, call handleSwitchEvent(config, switchIndex, value).

  // Notify Rust that the sidecar is ready
  // TODO: Replace stub QR payload with actual matter.js pairingCodes
  sendToRust("qr_code", {
    qr_payload: "MT:STUB-QR-NOT-IMPLEMENTED",
    manual_code: "000-00-000",
    discriminator: 3840,
    pin: 20202021,
  });
  sendToRust("ready");
}

main().catch((err) => {
  process.stderr.write(String(err) + "\n");
  process.exit(1);
});
