import { Plus, Trash2, MessageSquare, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Project } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ProjectSidebarProps {
  projects: Project[];
  activeProjectId: string | null;
  onSelectProject: (id: string) => void;
  onCreateProject: () => void;
  onDeleteProject: (id: string) => void;
  onOpenSettings: () => void;
}

export function ProjectSidebar({
  projects,
  activeProjectId,
  onSelectProject,
  onCreateProject,
  onDeleteProject,
  onOpenSettings,
}: ProjectSidebarProps) {
  return (
    <div className="flex h-full w-64 flex-col border-r border-border bg-sidebar">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Sparkles className="h-4 w-4 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-foreground">RailLovable</h1>
          <p className="text-[10px] text-muted-foreground">AI Website Builder</p>
        </div>
      </div>

      {/* New Project */}
      <div className="p-3">
        <Button
          onClick={onCreateProject}
          className="w-full justify-start gap-2 glow-primary"
          size="sm"
        >
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* Project List */}
      <ScrollArea className="flex-1 px-2">
        <div className="space-y-0.5 py-1">
          {projects.map((project) => (
            <div
              key={project.id}
              className={cn(
                "group flex items-center gap-2 rounded-md px-3 py-2 text-sm cursor-pointer transition-colors",
                project.id === activeProjectId
                  ? "bg-accent text-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent"
              )}
              onClick={() => onSelectProject(project.id)}
            >
              <MessageSquare className="h-3.5 w-3.5 shrink-0" />
              <span className="flex-1 truncate">{project.name}</span>
              <button
                className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteProject(project.id);
                }}
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}

          {projects.length === 0 && (
            <div className="px-3 py-8 text-center text-xs text-muted-foreground">
              No projects yet.
              <br />
              Start by creating one!
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Settings */}
      <div className="border-t border-border p-3">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground hover:text-foreground"
          onClick={onOpenSettings}
        >
          ⚙️ Settings
        </Button>
      </div>
    </div>
  );
}
