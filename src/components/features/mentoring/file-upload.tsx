"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, X, FileIcon } from "lucide-react";
import { uploadMentoringFile } from "@/lib/actions/mentoring";

interface FileUploadProps {
  postId: string;
}

const ALLOWED_EXTENSIONS = ".pdf,.docx,.xlsx,.pptx,.png,.jpg,.jpeg";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export function FileUpload({ postId }: FileUploadProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setError(null);

    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      setError("파일 크기는 10MB를 초과할 수 없습니다.");
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", selectedFile);

    const result = await uploadMentoringFile(postId, formData);

    if (result.error) {
      setError(result.error);
    } else {
      setSelectedFile(null);
      setIsExpanded(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }

    setIsLoading(false);
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setError(null);
    setIsExpanded(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (!isExpanded) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsExpanded(true)}
        className="mb-4"
      >
        <Upload className="h-4 w-4 mr-2" />
        파일 추가
      </Button>
    );
  }

  return (
    <div className="rounded-lg border border-dashed border-muted-foreground/25 p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Upload className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium text-sm">파일 업로드</span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_EXTENSIONS}
        onChange={handleFileSelect}
        className="hidden"
        id="file-upload"
      />

      {!selectedFile ? (
        <label
          htmlFor="file-upload"
          className="flex flex-col items-center justify-center py-6 cursor-pointer hover:bg-muted/50 rounded-lg transition-colors"
        >
          <FileIcon className="h-8 w-8 text-muted-foreground mb-2" />
          <span className="text-sm text-muted-foreground">
            클릭하여 파일 선택
          </span>
          <span className="text-xs text-muted-foreground mt-1">
            PDF, DOCX, XLSX, PPTX, PNG, JPG (최대 10MB)
          </span>
        </label>
      ) : (
        <div className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2 min-w-0">
            <FileIcon className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm truncate">{selectedFile.name}</span>
            <span className="text-xs text-muted-foreground shrink-0">
              ({formatFileSize(selectedFile.size)})
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={() => {
              setSelectedFile(null);
              if (fileInputRef.current) {
                fileInputRef.current.value = "";
              }
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive mt-2">{error}</p>
      )}

      <div className="flex gap-2 justify-end mt-3">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCancel}
          disabled={isLoading}
        >
          취소
        </Button>
        <Button
          size="sm"
          onClick={handleUpload}
          disabled={isLoading || !selectedFile}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          업로드
        </Button>
      </div>
    </div>
  );
}
