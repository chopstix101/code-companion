import type { ChatMessage, LLMSettings } from "@/lib/types";

const SYSTEM_PROMPT = `You are RailLovable, an expert AI web developer. You build beautiful, modern, fully functional websites and web applications.

RULES:
1. Generate clean, production-ready React + Tailwind CSS code
2. Use modern best practices: TypeScript, functional components, hooks
3. Make designs visually stunning with proper spacing, typography, colors, shadows, and gradients
4. Include responsive design (mobile-first)
5. Use semantic HTML elements
6. Handle all states: loading, empty, error, success
7. Add subtle animations and transitions for polish
8. When the user uploads an image/screenshot, recreate it pixel-perfectly

OUTPUT FORMAT:
- Wrap each file in a code block with the filename: \`\`\`tsx:App.tsx
- The main component MUST be in App.tsx and export default
- You can create additional files like components, but keep it simple
- Use inline Tailwind classes, no separate CSS files needed
- If you need icons, use simple SVG or emoji
- Do NOT import external packages unless explicitly available in sandpack

AVAILABLE IN SANDPACK:
- React, ReactDOM
- Tailwind CSS (via CDN in template)

STYLE GUIDELINES:
- Use a cohesive color palette (don't default to plain white/black)
- Add depth with shadows, gradients, and layered elements
- Use generous padding and whitespace
- Typography: use different font weights and sizes for hierarchy
- Add hover/focus states to interactive elements
- Include smooth transitions (transition-all duration-200)

When the user asks to modify something, output the COMPLETE updated code, not just the diff.
Always explain briefly what you built/changed before the code.`;

export async function callLLM(
  settings: LLMSettings,
  messages: ChatMessage[],
  signal?: AbortSignal
): Promise<string> {
  if (settings.provider === "openai") {
    return callOpenAI(settings, messages, signal);
  } else {
    return callAnthropic(settings, messages, signal);
  }
}

async function callOpenAI(
  settings: LLMSettings,
  messages: ChatMessage[],
  signal?: AbortSignal
): Promise<string> {
  if (!settings.openaiKey) throw new Error("OpenAI API key not configured. Go to Settings to add it.");

  const formattedMessages = [
    { role: "system" as const, content: SYSTEM_PROMPT },
    ...messages.map((m) => {
      if (m.role === "user" && m.files?.length) {
        const content: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
          { type: "text", text: m.content || "Analyze this image and build a website based on it." },
        ];
        for (const file of m.files) {
          if (file.type.startsWith("image/")) {
            content.push({
              type: "image_url",
              image_url: { url: file.dataUrl },
            });
          }
        }
        return { role: m.role as "user" | "assistant", content };
      }
      return { role: m.role as "user" | "assistant", content: m.content };
    }),
  ];

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${settings.openaiKey}`,
    },
    body: JSON.stringify({
      model: settings.model || "gpt-4o",
      messages: formattedMessages,
      max_tokens: 4096,
      temperature: 0.7,
    }),
    signal,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `OpenAI API error: ${res.status}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "No response generated.";
}

async function callAnthropic(
  settings: LLMSettings,
  messages: ChatMessage[],
  signal?: AbortSignal
): Promise<string> {
  if (!settings.anthropicKey) throw new Error("Anthropic API key not configured. Go to Settings to add it.");

  const formattedMessages = messages.map((m) => {
    if (m.role === "user" && m.files?.length) {
      const content: Array<{
        type: string;
        text?: string;
        source?: { type: string; media_type: string; data: string };
      }> = [];
      for (const file of m.files) {
        if (file.type.startsWith("image/")) {
          const base64Data = file.dataUrl.split(",")[1];
          content.push({
            type: "image",
            source: {
              type: "base64",
              media_type: file.type,
              data: base64Data,
            },
          });
        }
      }
      content.push({
        type: "text",
        text: m.content || "Analyze this image and build a website based on it.",
      });
      return { role: m.role, content };
    }
    return { role: m.role, content: m.content };
  });

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": settings.anthropicKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: settings.model || "claude-sonnet-4-20250514",
      system: SYSTEM_PROMPT,
      messages: formattedMessages,
      max_tokens: 4096,
      temperature: 0.7,
    }),
    signal,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err?.error?.message || `Anthropic API error: ${res.status}. Note: Anthropic may block browser requests due to CORS. Try OpenAI instead.`
    );
  }

  const data = await res.json();
  return data.content?.[0]?.text || "No response generated.";
}
