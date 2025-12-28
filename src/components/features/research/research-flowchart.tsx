"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { updateFlowchart } from "@/lib/actions/research";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import {
  FileText,
  Edit2,
  Save,
  X,
  Upload,
  Eye,
  Code,
  Loader2,
} from "lucide-react";

interface ResearchFlowchartProps {
  projectId: string;
  flowchartMd: string | null;
  onRefresh: () => void;
}

export function ResearchFlowchart({
  projectId,
  flowchartMd,
  onRefresh,
}: ResearchFlowchartProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(flowchartMd || "");
  const [previewMode, setPreviewMode] = useState<"edit" | "preview" | "split">("split");
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    setSaving(true);
    await updateFlowchart(projectId, content);
    setIsEditing(false);
    setSaving(false);
    onRefresh();
  };

  const handleCancel = () => {
    setContent(flowchartMd || "");
    setIsEditing(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.name.endsWith(".md")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setContent(text);
      };
      reader.readAsText(file);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5" />
            연구 흐름도
          </CardTitle>
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Edit2 className="h-4 w-4 mr-1" />
                편집
              </Button>
            ) : (
              <>
                <div className="flex border rounded-md overflow-hidden mr-2">
                  <Button
                    variant={previewMode === "edit" ? "secondary" : "ghost"}
                    size="sm"
                    className="rounded-none h-8"
                    onClick={() => setPreviewMode("edit")}
                  >
                    <Code className="h-3 w-3" />
                  </Button>
                  <Button
                    variant={previewMode === "split" ? "secondary" : "ghost"}
                    size="sm"
                    className="rounded-none h-8 border-x"
                    onClick={() => setPreviewMode("split")}
                  >
                    Split
                  </Button>
                  <Button
                    variant={previewMode === "preview" ? "secondary" : "ghost"}
                    size="sm"
                    className="rounded-none h-8"
                    onClick={() => setPreviewMode("preview")}
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                </div>
                <input
                  type="file"
                  accept=".md"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-1" />
                  MD 파일
                </Button>
                <Button size="sm" onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <Save className="h-4 w-4 mr-1" />
                  )}
                  저장
                </Button>
                <Button variant="ghost" size="sm" onClick={handleCancel}>
                  <X className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!isEditing ? (
          flowchartMd ? (
            <div className="flowchart-content prose prose-sm max-w-none dark:prose-invert prose-p:text-muted-foreground prose-strong:text-foreground prose-code:text-primary prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-muted prose-pre:border">
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
              >
                {flowchartMd}
              </ReactMarkdown>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>등록된 연구 흐름도가 없습니다.</p>
              <p className="text-sm">편집 버튼을 클릭하여 마크다운 형식으로 흐름도를 작성하세요.</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setIsEditing(true)}
              >
                <Edit2 className="h-4 w-4 mr-2" />
                흐름도 작성하기
              </Button>
            </div>
          )
        ) : (
          <div
            className={`grid gap-4 ${
              previewMode === "split" ? "grid-cols-2" : "grid-cols-1"
            }`}
          >
            {(previewMode === "edit" || previewMode === "split") && (
              <div className="space-y-2">
                {previewMode === "split" && (
                  <p className="text-xs text-muted-foreground font-medium">
                    마크다운 편집
                  </p>
                )}
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={`# 연구 흐름도

## 1단계: 문헌조사
- 핵심 논문 선정
- 연구 동향 파악

## 2단계: 방법론 설계
- 연구 가설 수립
- 분석 방법 결정

## 3단계: 데이터 수집
...`}
                  className="min-h-[400px] font-mono text-sm"
                />
              </div>
            )}
            {(previewMode === "preview" || previewMode === "split") && (
              <div className="space-y-2">
                {previewMode === "split" && (
                  <p className="text-xs text-muted-foreground font-medium">
                    미리보기
                  </p>
                )}
                <div className="border rounded-md p-4 min-h-[400px] overflow-auto bg-muted/30">
                  {content ? (
                    <div className="flowchart-content prose prose-sm max-w-none dark:prose-invert prose-p:text-muted-foreground prose-strong:text-foreground prose-code:text-primary prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-muted prose-pre:border">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm, remarkMath]}
                        rehypePlugins={[rehypeKatex]}
                      >
                        {content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      마크다운을 입력하면 미리보기가 표시됩니다.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
