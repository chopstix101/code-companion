import { useMemo } from "react";
import {
  SandpackProvider,
  SandpackPreview,
  SandpackCodeEditor,
} from "@codesandbox/sandpack-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Download, Code2, Eye, Sparkles } from "lucide-react";
import { exportAsZip } from "@/lib/export-service";

interface PreviewPaneProps {
  generatedCode: Record<string, string>;
  projectName: string;
}

export function PreviewPane({ generatedCode, projectName }: PreviewPaneProps) {
  const hasCode = Object.keys(generatedCode).length > 0;

  const sandpackFiles = useMemo(() => {
    const files: Record<string, string> = {};
    for (const [name, code] of Object.entries(generatedCode)) {
      const key = name.startsWith("/") ? name : `/${name}`;
      files[key] = code;
    }
    // Ensure App.tsx exists
    if (!files["/App.tsx"] && !files["/App.jsx"]) {
      files["/App.tsx"] = `export default function App() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-gray-900 to-black text-white">
      <div className="text-center space-y-4">
        <div className="text-6xl">🚀</div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          RailLovable
        </h1>
        <p className="text-gray-400 max-w-md">
          Start a conversation to generate your website. Upload screenshots, describe your vision, and watch it come to life.
        </p>
      </div>
    </div>
  )
}`;
    }
    return files;
  }, [generatedCode]);

  const handleExport = () => {
    exportAsZip(projectName, generatedCode);
  };

  return (
    <div className="flex h-full flex-col bg-background">
      <Tabs defaultValue="preview" className="flex h-full flex-col">
        {/* Toolbar */}
        <div className="flex items-center justify-between border-b border-border px-3 py-1.5">
          <TabsList className="h-8 bg-secondary">
            <TabsTrigger value="preview" className="h-7 gap-1.5 text-xs px-3">
              <Eye className="h-3 w-3" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="code" className="h-7 gap-1.5 text-xs px-3">
              <Code2 className="h-3 w-3" />
              Code
            </TabsTrigger>
          </TabsList>

          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1.5 text-xs"
            onClick={handleExport}
            disabled={!hasCode}
          >
            <Download className="h-3 w-3" />
            Download ZIP
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <SandpackProvider
            template="react-ts"
            files={sandpackFiles}
            theme="dark"
            options={{
              externalResources: [
                "https://cdn.tailwindcss.com",
              ],
            }}
          >
            <TabsContent value="preview" className="h-full m-0 data-[state=inactive]:hidden">
              <SandpackPreview
                showNavigator={false}
                showRefreshButton
                style={{ height: "100%" }}
              />
            </TabsContent>
            <TabsContent value="code" className="h-full m-0 data-[state=inactive]:hidden">
              <SandpackCodeEditor
                showTabs
                showLineNumbers
                showInlineErrors
                style={{ height: "100%" }}
              />
            </TabsContent>
          </SandpackProvider>
        </div>
      </Tabs>

      {!hasCode && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center space-y-3 animate-fade-up">
            <Sparkles className="h-10 w-10 text-primary mx-auto opacity-50" />
            <p className="text-sm text-muted-foreground">
              Your generated site will appear here
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
