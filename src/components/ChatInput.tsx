import { useState, useRef, useCallback, type DragEvent, type ChangeEvent } from "react";
import { Send, Paperclip, Square, ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { UploadedFile } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (message: string, files?: UploadedFile[]) => void;
  isGenerating: boolean;
  onStop: () => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, isGenerating, onStop, disabled }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleFileRead = useCallback((fileList: FileList) => {
    Array.from(fileList).forEach((file) => {
      if (file.size > 20 * 1024 * 1024) return;
      const reader = new FileReader();
      reader.onload = () => {
        setFiles((prev) => [
          ...prev,
          {
            name: file.name,
            type: file.type,
            size: file.size,
            dataUrl: reader.result as string,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length) handleFileRead(e.dataTransfer.files);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) handleFileRead(e.target.files);
    e.target.value = "";
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = () => {
    if ((!message.trim() && files.length === 0) || disabled) return;
    onSend(message.trim(), files.length > 0 ? files : undefined);
    setMessage("");
    setFiles([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className={cn(
        "border-t border-border bg-card p-3",
        isDragging && "drop-zone-active"
      )}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      {files.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {files.map((file, i) => (
            <div
              key={i}
              className="flex items-center gap-1.5 rounded-md bg-secondary px-2 py-1 text-xs"
            >
              {file.type.startsWith("image/") ? (
                <img
                  src={file.dataUrl}
                  alt={file.name}
                  className="h-8 w-8 rounded object-cover"
                />
              ) : (
                <Paperclip className="h-3 w-3" />
              )}
              <span className="max-w-[100px] truncate">{file.name}</span>
              <button onClick={() => removeFile(i)} className="text-muted-foreground hover:text-foreground">
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          multiple
          accept="image/*,.pdf,.doc,.docx"
          onChange={handleFileChange}
        />

        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground"
          onClick={() => fileInputRef.current?.click()}
          disabled={isGenerating}
        >
          <ImagePlus className="h-4 w-4" />
        </Button>

        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isDragging
              ? "Drop files here..."
              : "Describe what you want to build..."
          }
          className="min-h-[40px] max-h-[160px] resize-none border-0 bg-transparent p-2 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
          rows={1}
          disabled={isGenerating}
        />

        {isGenerating ? (
          <Button
            variant="destructive"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={onStop}
          >
            <Square className="h-3.5 w-3.5" />
          </Button>
        ) : (
          <Button
            size="icon"
            className="h-9 w-9 shrink-0 glow-primary"
            onClick={handleSend}
            disabled={!message.trim() && files.length === 0}
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
