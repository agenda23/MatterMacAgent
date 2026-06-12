export type ActionType = "shortcut" | "open" | "shell" | "applescript";

export type Action =
  | { type: "shortcut"; name: string; input: string }
  | { type: "open"; target: string }
  | { type: "shell"; command: string }
  | { type: "applescript"; script: string };

export type Macro = {
  id: string;
  name: string;
  on_actions: Action[];
  off_actions: Action[];
};

export type EndpointConfig = {
  id: number;
  name: string;
  matter_type: "OnOffPluginUnitDevice";
  assigned_macro_id: string | null;
};

export type Config = {
  system: {
    developer_mode: boolean;
    auto_start: boolean;
  };
  endpoints: EndpointConfig[];
  macros: Macro[];
};

export type PairingInfo = {
  qr_payload: string;
  manual_code: string;
  discriminator: number;
  pin: number;
};

export type PermissionStatus = {
  accessibility: boolean;
};

export type ActionError = {
  endpoint_id: number;
  error: string;
};

export type CommissioningStatus = {
  commissioned: boolean;
};
