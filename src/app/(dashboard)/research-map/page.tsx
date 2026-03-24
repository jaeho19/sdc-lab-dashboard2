import { ResearchMapGraph } from "@/components/features/research-map/research-map-graph";

export default function ResearchMapPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          Research Map
        </h1>
        <p className="text-sm text-muted-foreground">
          연구 키워드 네트워크 — 학생, 방법론, 학회 간 연결을 탐색하세요
        </p>
      </div>
      <ResearchMapGraph />
    </div>
  );
}
