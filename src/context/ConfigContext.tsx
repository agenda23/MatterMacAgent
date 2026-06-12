import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { invoke } from "@tauri-apps/api/core";
import type { Config } from "../types";

type ConfigContextValue = {
  config: Config | null;
  loading: boolean;
  saveConfig: (config: Config) => Promise<void>;
  refreshConfig: () => Promise<void>;
};

const ConfigContext = createContext<ConfigContextValue | null>(null);

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshConfig = useCallback(async () => {
    const data = await invoke<Config>("get_config");
    setConfig(data);
  }, []);

  useEffect(() => {
    refreshConfig()
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [refreshConfig]);

  const saveConfig = useCallback(async (next: Config) => {
    await invoke("save_config", { config: next });
    setConfig(next);
  }, []);

  return (
    <ConfigContext.Provider value={{ config, loading, saveConfig, refreshConfig }}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  const ctx = useContext(ConfigContext);
  if (!ctx) {
    throw new Error("useConfig must be used within ConfigProvider");
  }
  return ctx;
}
