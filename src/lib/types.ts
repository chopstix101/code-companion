export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  files?: UploadedFile[];
  timestamp: Date;
  isStreaming?: boolean;
}

export interface UploadedFile {
  name: string;
  type: string;
  size: number;
  dataUrl: string;
}

export interface Project {
  id: string;
  name: string;
  messages: ChatMessage[];
  generatedCode: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

export interface LLMSettings {
  provider: "anthropic" | "openai";
  anthropicKey: string;
  openaiKey: string;
  model: string;
}

export interface GeneratedCode {
  files: Record<string, string>;
  explanation: string;
}
