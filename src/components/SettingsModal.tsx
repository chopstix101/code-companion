import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { LLMSettings } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Eye, EyeOff, Check } from "lucide-react";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: LLMSettings;
  onUpdate: (updates: Partial<LLMSettings>) => void;
}

const MODELS = {
  openai: [
    { value: "gpt-4o", label: "GPT-4o (Recommended)" },
    { value: "gpt-4o-mini", label: "GPT-4o Mini (Faster)" },
    { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
  ],
  anthropic: [
    { value: "claude-sonnet-4-20250514", label: "Claude Sonnet 4 (Recommended)" },
    { value: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet" },
    { value: "claude-3-haiku-20240307", label: "Claude 3 Haiku (Faster)" },
  ],
};

export function SettingsModal({ open, onOpenChange, settings, onUpdate }: SettingsModalProps) {
  const [showKey, setShowKey] = useState(false);

  const currentKey =
    settings.provider === "openai" ? settings.openaiKey : settings.anthropicKey;
  const keyField =
    settings.provider === "openai" ? "openaiKey" : "anthropicKey";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>Configure your LLM provider and API keys.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Provider Toggle */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Provider</Label>
            <div className="grid grid-cols-2 gap-2">
              {(["openai", "anthropic"] as const).map((provider) => (
                <button
                  key={provider}
                  onClick={() => {
                    const model = provider === "openai" ? "gpt-4o" : "claude-sonnet-4-20250514";
                    onUpdate({ provider, model });
                  }}
                  className={cn(
                    "rounded-lg border px-3 py-2.5 text-sm font-medium transition-all",
                    settings.provider === provider
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/50"
                  )}
                >
                  <div className="flex items-center gap-2">
                    {settings.provider === provider && <Check className="h-3.5 w-3.5" />}
                    {provider === "openai" ? "OpenAI" : "Anthropic"}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Model Select */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Model</Label>
            <div className="space-y-1">
              {MODELS[settings.provider].map((m) => (
                <button
                  key={m.value}
                  onClick={() => onUpdate({ model: m.value })}
                  className={cn(
                    "w-full rounded-md px-3 py-2 text-left text-sm transition-colors",
                    settings.model === m.value
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-secondary"
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* API Key */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              {settings.provider === "openai" ? "OpenAI" : "Anthropic"} API Key
            </Label>
            <div className="relative">
              <Input
                type={showKey ? "text" : "password"}
                value={currentKey}
                onChange={(e) => onUpdate({ [keyField]: e.target.value })}
                placeholder={
                  settings.provider === "openai"
                    ? "sk-..."
                    : "sk-ant-..."
                }
                className="pr-10 font-mono text-xs"
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Keys are stored locally in your browser. Never shared.
              {settings.provider === "anthropic" && (
                <span className="block mt-1 text-warning">
                  ⚠️ Anthropic may block direct browser requests (CORS). OpenAI is recommended for client-side use.
                </span>
              )}
            </p>
          </div>

          <Button onClick={() => onOpenChange(false)} className="w-full">
            Save & Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
