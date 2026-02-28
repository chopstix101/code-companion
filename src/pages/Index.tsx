import { useRef, useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { ProjectSidebar } from "@/components/ProjectSidebar";
import { PreviewPane } from "@/components/PreviewPane";
import { SettingsModal } from "@/components/SettingsModal";
import { useChat } from "@/hooks/use-chat";
import { useSettings } from "@/hooks/use-settings";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Settings, PanelLeftClose, PanelLeft, AlertTriangle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  const { settings, updateSettings, hasApiKey } = useSettings();
  const {
    projects,
    activeProject,
    activeProjectId,
    setActiveProjectId,
    createProject,
    deleteProject,
    sendMessage,
    isGenerating,
    stopGeneration,
  } = useChat(settings);

  const [showSettings, setShowSettings] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeProject?.messages]);

  // Show settings on first visit if no key
  useEffect(() => {
    if (!hasApiKey) {
      const timer = setTimeout(() => setShowSettings(true), 500);
      return () => clearTimeout(timer);
    }
  }, [hasApiKey]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Sidebar */}
      {showSidebar && (
        <ProjectSidebar
          projects={projects}
          activeProjectId={activeProjectId}
          onSelectProject={setActiveProjectId}
          onCreateProject={() => createProject()}
          onDeleteProject={deleteProject}
          onOpenSettings={() => setShowSettings(true)}
        />
      )}

      {/* Main Area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top Bar */}
        <header className="flex h-11 items-center justify-between border-b border-border px-3">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setShowSidebar(!showSidebar)}
            >
              {showSidebar ? (
                <PanelLeftClose className="h-4 w-4" />
              ) : (
                <PanelLeft className="h-4 w-4" />
              )}
            </Button>
            <span className="text-sm font-medium truncate">
              {activeProject?.name || "RailLovable"}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setShowSettings(true)}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </header>

        {/* Content: Chat + Preview */}
        <ResizablePanelGroup direction="horizontal" className="flex-1">
          {/* Chat Panel */}
          <ResizablePanel defaultSize={40} minSize={25} maxSize={60}>
            <div className="flex h-full flex-col">
              {/* API Key Warning */}
              {!hasApiKey && (
                <div className="flex items-center gap-2 bg-warning/10 px-4 py-2 text-xs text-warning">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    Add your API key in{" "}
                    <button
                      onClick={() => setShowSettings(true)}
                      className="underline font-medium"
                    >
                      Settings
                    </button>{" "}
                    to start building.
                  </span>
                </div>
              )}

              {/* Messages */}
              <ScrollArea className="flex-1">
                <div ref={scrollRef}>
                  {(!activeProject || activeProject.messages.length === 0) && (
                    <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
                      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                        <Sparkles className="h-7 w-7 text-primary" />
                      </div>
                      <h2 className="mb-2 text-lg font-semibold">What do you want to build?</h2>
                      <p className="max-w-sm text-sm text-muted-foreground">
                        Describe your website, upload a screenshot to clone, or drop a design mockup.
                        I'll generate production-ready code instantly.
                      </p>
                      <div className="mt-6 grid gap-2 w-full max-w-xs">
                        {[
                          "Build a SaaS landing page",
                          "Create a portfolio website",
                          "Design a dashboard UI",
                        ].map((suggestion) => (
                          <button
                            key={suggestion}
                            onClick={() => sendMessage(suggestion)}
                            disabled={!hasApiKey || isGenerating}
                            className="rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors disabled:opacity-50"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeProject?.messages.map((msg) => (
                    <ChatMessage key={msg.id} message={msg} />
                  ))}
                </div>
              </ScrollArea>

              {/* Input */}
              <ChatInput
                onSend={sendMessage}
                isGenerating={isGenerating}
                onStop={stopGeneration}
                disabled={!hasApiKey}
              />
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Preview Panel */}
          <ResizablePanel defaultSize={60}>
            <div className="relative h-full">
              <PreviewPane
                generatedCode={activeProject?.generatedCode ?? {}}
                projectName={activeProject?.name ?? "project"}
              />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Settings Modal */}
      <SettingsModal
        open={showSettings}
        onOpenChange={setShowSettings}
        settings={settings}
        onUpdate={updateSettings}
      />
    </div>
  );
};

export default Index;
