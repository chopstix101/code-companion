import { useState, useCallback, useRef } from "react";
import type { ChatMessage, Project, UploadedFile } from "@/lib/types";
import type { LLMSettings } from "@/lib/types";
import { callLLM } from "@/lib/llm-service";

const PROJECTS_KEY = "raillovable_projects";

function loadProjects(): Project[] {
  try {
    const stored = localStorage.getItem(PROJECTS_KEY);
    if (!stored) return [];
    return JSON.parse(stored).map((p: Project) => ({
      ...p,
      createdAt: new Date(p.createdAt),
      updatedAt: new Date(p.updatedAt),
      messages: p.messages.map((m: ChatMessage) => ({
        ...m,
        timestamp: new Date(m.timestamp),
      })),
    }));
  } catch {
    return [];
  }
}

function saveProjects(projects: Project[]) {
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}

function createId() {
  return Math.random().toString(36).slice(2, 10);
}

export function useChat(settings: LLMSettings) {
  const [projects, setProjects] = useState<Project[]>(loadProjects);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(
    () => projects[0]?.id ?? null
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const activeProject = projects.find((p) => p.id === activeProjectId) ?? null;

  const persist = useCallback((updated: Project[]) => {
    setProjects(updated);
    saveProjects(updated);
  }, []);

  const createProject = useCallback(
    (name = "New Project") => {
      const project: Project = {
        id: createId(),
        name,
        messages: [],
        generatedCode: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const updated = [project, ...projects];
      persist(updated);
      setActiveProjectId(project.id);
      return project.id;
    },
    [projects, persist]
  );

  const deleteProject = useCallback(
    (id: string) => {
      const updated = projects.filter((p) => p.id !== id);
      persist(updated);
      if (activeProjectId === id) {
        setActiveProjectId(updated[0]?.id ?? null);
      }
    },
    [projects, activeProjectId, persist]
  );

  const sendMessage = useCallback(
    async (content: string, files?: UploadedFile[]) => {
      let projectId = activeProjectId;
      let currentProjects = [...projects];

      if (!projectId) {
        const project: Project = {
          id: createId(),
          name: content.slice(0, 40) || "New Project",
          messages: [],
          generatedCode: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        currentProjects = [project, ...currentProjects];
        projectId = project.id;
        setActiveProjectId(projectId);
      }

      const userMsg: ChatMessage = {
        id: createId(),
        role: "user",
        content,
        files,
        timestamp: new Date(),
      };

      const assistantMsg: ChatMessage = {
        id: createId(),
        role: "assistant",
        content: "",
        timestamp: new Date(),
        isStreaming: true,
      };

      currentProjects = currentProjects.map((p) =>
        p.id === projectId
          ? {
              ...p,
              messages: [...p.messages, userMsg, assistantMsg],
              updatedAt: new Date(),
            }
          : p
      );
      persist(currentProjects);
      setIsGenerating(true);

      try {
        abortRef.current = new AbortController();
        const project = currentProjects.find((p) => p.id === projectId)!;
        const allMessages = project.messages.filter(
          (m) => m.id !== assistantMsg.id
        );

        const response = await callLLM(settings, allMessages, abortRef.current.signal);

        // Parse code blocks from response
        const codeBlocks = parseCodeBlocks(response);
        const existingCode = project.generatedCode;
        const mergedCode = { ...existingCode, ...codeBlocks };

        currentProjects = currentProjects.map((p) =>
          p.id === projectId
            ? {
                ...p,
                messages: p.messages.map((m) =>
                  m.id === assistantMsg.id
                    ? { ...m, content: response, isStreaming: false }
                    : m
                ),
                generatedCode: mergedCode,
                updatedAt: new Date(),
              }
            : p
        );
        persist(currentProjects);
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : "An error occurred";
        currentProjects = currentProjects.map((p) =>
          p.id === projectId
            ? {
                ...p,
                messages: p.messages.map((m) =>
                  m.id === assistantMsg.id
                    ? {
                        ...m,
                        content: `❌ Error: ${errorMessage}`,
                        isStreaming: false,
                      }
                    : m
                ),
              }
            : p
        );
        persist(currentProjects);
      } finally {
        setIsGenerating(false);
        abortRef.current = null;
      }
    },
    [activeProjectId, projects, settings, persist]
  );

  const stopGeneration = useCallback(() => {
    abortRef.current?.abort();
    setIsGenerating(false);
  }, []);

  return {
    projects,
    activeProject,
    activeProjectId,
    setActiveProjectId,
    createProject,
    deleteProject,
    sendMessage,
    isGenerating,
    stopGeneration,
  };
}

function parseCodeBlocks(text: string): Record<string, string> {
  const files: Record<string, string> = {};
  // Match ```filename or ```language:filename patterns
  const regex = /```(?:(\w+):)?([^\n`]*)\n([\s\S]*?)```/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const filename = (match[2] || "").trim();
    const code = match[3] || "";

    if (filename && (filename.includes(".") || filename.includes("/"))) {
      files[filename] = code.trim();
    }
  }

  // If no named files found, try to find a single large code block and use as App.tsx
  if (Object.keys(files).length === 0) {
    const singleBlock = /```(?:tsx?|jsx?|html)?\n([\s\S]*?)```/g;
    let singleMatch;
    while ((singleMatch = singleBlock.exec(text)) !== null) {
      const code = singleMatch[1]?.trim();
      if (code && code.length > 50) {
        files["/App.tsx"] = code;
        break;
      }
    }
  }

  return files;
}
