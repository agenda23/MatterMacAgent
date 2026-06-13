/**
 * Matter Mac Agent - Node.js Sidecar
 *
 * Hosts a Matter Bridge node (Aggregator + 10 BridgedDevice endpoints)
 * and executes macOS actions triggered by ON/OFF commands from smart home hubs.
 */

import "@matter/nodejs";
import { Endpoint, ServerNode } from "@matter/main";
import { BridgedDeviceBasicInformationServer } from "@matter/main/behaviors/bridged-device-basic-information";
import { OnOffPlugInUnitDevice } from "@matter/main/devices/on-off-plug-in-unit";
import { AggregatorEndpoint } from "@matter/main/endpoints/aggregator";
import { execFileSync } from "node:child_process";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ShortcutAction {
  type: "shortcut";
  name: string;
  input: string;
}
interface OpenAction {
  type: "open";
  target: string;
}
interface ShellAction {
  type: "shell";
  command: string;
}
interface AppleScriptAction {
  type: "applescript";
  script: string;
}
type Action = ShortcutAction | OpenAction | ShellAction | AppleScriptAction;

interface Macro {
  id: string;
  name: string;
  on_actions: Action[];
  off_actions: Action[];
}

interface EndpointConfig {
  id: number;
  name: string;
  matter_type: "OnOffPluginUnitDevice";
  assigned_macro_id: string | null;
}

interface Config {
  system: {
    developer_mode: boolean;
    auto_start: boolean;
  };
  endpoints: EndpointConfig[];
  macros: Macro[];
}

interface ConfigUpdatePayload {
  endpoints: EndpointConfig[];
  macros: Macro[];
  developer_mode: boolean;
}

interface RustMessage {
  type: "config_update" | "shutdown";
  payload: unknown;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MatterEndpoint = Endpoint<any>;

// ---------------------------------------------------------------------------
// IPC helpers
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
      execFileSync("/usr/bin/shortcuts", ["run", action.name], {
        ...(action.input ? { input: action.input } : {}),
      });
      break;
    case "open":
      execFileSync("/usr/bin/open", [action.target]);
      break;
    case "shell":
      if (!developerMode) {
        throw new Error("shell action requires developer_mode");
      }
      execFileSync("/bin/zsh", ["-c", action.command]);
      break;
    case "applescript":
      if (!developerMode) {
        throw new Error("applescript action requires developer_mode");
      }
      execFileSync("/usr/bin/osascript", ["-e", action.script]);
      break;
  }
}

async function handleSwitchEvent(
  config: Config,
  switchIndex: number,
  isOn: boolean
): Promise<void> {
  const endpointId = switchIndex + 1;
  const endpoint = config.endpoints.find((e) => e.id === switchIndex);
  if (!endpoint?.assigned_macro_id) return;

  const macro = config.macros.find((m) => m.id === endpoint.assigned_macro_id);
  if (!macro) return;

  sendToRust("device_status", { endpoint_id: endpointId, state: isOn });

  const actions = isOn ? macro.on_actions : macro.off_actions;
  for (let i = 0; i < actions.length; i++) {
    try {
      executeAction(actions[i], config.system.developer_mode);
      sendToRust("action_result", {
        endpoint_id: endpointId,
        action_index: i,
        success: true,
      });
    } catch (err) {
      sendToRust("action_result", {
        endpoint_id: endpointId,
        action_index: i,
        success: false,
        error: String(err),
      });
    }
  }
}

function defaultConfig(): Config {
  return {
    system: { developer_mode: false, auto_start: true },
    endpoints: Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      name: `仮想スイッチ ${i + 1}`,
      matter_type: "OnOffPluginUnitDevice" as const,
      assigned_macro_id: null,
    })),
    macros: [],
  };
}

function applyConfigUpdate(config: Config, payload: ConfigUpdatePayload): Config {
  return {
    ...config,
    system: { ...config.system, developer_mode: payload.developer_mode },
    endpoints: payload.endpoints,
    macros: payload.macros,
  };
}

async function updateSwitchLabels(
  devices: MatterEndpoint[],
  endpoints: EndpointConfig[]
): Promise<void> {
  for (let i = 0; i < devices.length; i++) {
    const name = endpoints[i]?.name ?? `仮想スイッチ ${i + 1}`;
    await devices[i].set({
      bridgedDeviceBasicInformation: { nodeLabel: name, reachable: true },
    } as Record<string, unknown>);
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
  let config = defaultConfig();
  const switchDevices: MatterEndpoint[] = [];

  const server = await ServerNode.create({ id: "matter-mac-agent" });

  const aggregator = new Endpoint(AggregatorEndpoint, { id: "aggregator" });
  await server.add(aggregator);

  for (let i = 1; i <= 10; i++) {
    const device = (await aggregator.add(
      OnOffPlugInUnitDevice.with(BridgedDeviceBasicInformationServer),
      {
        id: `switch-${i}`,
        bridgedDeviceBasicInformation: {
          nodeLabel: config.endpoints[i - 1]?.name ?? `仮想スイッチ ${i}`,
          reachable: true,
        },
      }
    )) as MatterEndpoint;
    switchDevices.push(device);
  }

  listenToRust((msg) => {
    switch (msg.type) {
      case "config_update": {
        config = applyConfigUpdate(
          config,
          msg.payload as ConfigUpdatePayload
        );
        void updateSwitchLabels(switchDevices, config.endpoints);
        break;
      }
      case "shutdown":
        void server.close().then(() => process.exit(0));
        break;
    }
  });

  await server.start();

  for (let i = 0; i < switchDevices.length; i++) {
    const switchIndex = i + 1;
    const onOffEvents = switchDevices[i].events.onOff;
    if (!onOffEvents) {
      process.stderr.write(
        `Failed to bind onOff events for switch ${switchIndex}\n`
      );
      continue;
    }
    const onOffChange = onOffEvents.onOff$Changed;
    if (!onOffChange) {
      process.stderr.write(
        `Failed to bind onOff$Changed for switch ${switchIndex}\n`
      );
      continue;
    }
    onOffChange.on((value: boolean) => {
      void handleSwitchEvent(config, switchIndex, value);
    });
  }

  const commissioning = server.state.commissioning;
  const { qrPairingCode, manualPairingCode } = commissioning.pairingCodes;
  const commissioned = server.lifecycle.isCommissioned;

  server.lifecycle.commissioned?.on(() => {
    sendToRust("commissioning_status", { commissioned: true });
  });
  server.lifecycle.decommissioned?.on(() => {
    sendToRust("commissioning_status", { commissioned: false });
  });

  sendToRust("qr_code", {
    qr_payload: qrPairingCode,
    manual_code: manualPairingCode,
    discriminator: commissioning.discriminator,
    pin: commissioning.passcode,
  });
  sendToRust("ready", { commissioned });
}

main().catch((err) => {
  process.stderr.write(String(err) + "\n");
  process.exit(1);
});
