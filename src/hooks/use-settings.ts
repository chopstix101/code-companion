import { useState, useCallback } from "react";
import type { LLMSettings } from "@/lib/types";

const SETTINGS_KEY = "raillovable_settings";

const defaultSettings: LLMSettings = {
  provider: "openai",
  anthropicKey: "",
  openaiKey: "",
  model: "gpt-4o",
};

export function useSettings() {
  const [settings, setSettingsState] = useState<LLMSettings>(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      return stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings;
    } catch {
      return defaultSettings;
    }
  });

  const updateSettings = useCallback((updates: Partial<LLMSettings>) => {
    setSettingsState((prev) => {
      const next = { ...prev, ...updates };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const hasApiKey = Boolean(
    (settings.provider === "anthropic" && settings.anthropicKey) ||
    (settings.provider === "openai" && settings.openaiKey)
  );

  return { settings, updateSettings, hasApiKey };
}
