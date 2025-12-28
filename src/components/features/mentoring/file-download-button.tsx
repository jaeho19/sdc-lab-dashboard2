"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, File, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface FileDownloadButtonProps {
  file: {
    id: string;
    name: string;
    storage_path: string;
    mime_type: string;
    size: number;
  };
}

export function FileDownloadButton({ file }: FileDownloadButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDownload = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.storage
        .from("mentoring-files")
        .download(file.storage_path);

      if (error) {
        console.error("Download error:", error);
        alert("파일 다운로드에 실패했습니다.");
        return;
      }

      // Create a download link
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download error:", error);
      alert("파일 다운로드에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  return (
    <div className="flex items-center justify-between gap-2 bg-muted/50 px-3 py-2 rounded-md">
      <div className="flex items-center gap-2 min-w-0">
        <File className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <span className="text-sm truncate">{file.name}</span>
        <span className="text-xs text-muted-foreground flex-shrink-0">
          ({formatFileSize(file.size)})
        </span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleDownload}
        disabled={isLoading}
        className="flex-shrink-0"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
