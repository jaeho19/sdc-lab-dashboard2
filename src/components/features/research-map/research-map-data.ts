/**
 * SDC Lab Research Map — Data File
 *
 * 이 파일만 수정하면 Research Map이 자동 업데이트됩니다.
 *
 * 수정 방법:
 * 1. 학생 추가: NODES의 students 섹션에 항목 추가
 * 2. 키워드 추가: NODES의 keywords 섹션에 항목 추가
 * 3. 연결 추가: LINKS 배열에 { source: 'id1', target: 'id2' } 추가
 * 4. 학회 업데이트: NODES의 conferences 섹션 수정
 *
 * 최종 업데이트: 2026-03-24
 */

// ─── 노드 타입 ───
export type NodeType = "student" | "theme" | "method" | "tech" | "project" | "conference" | "axis" | "paper";

export interface StudentProfile {
  /** 학위 과정 */
  degree: string;
  /** 연구 주제 한 줄 */
  topic: string;
  /** 현재 진행 상황 */
  status: string;
  /** 투고 현황 */
  publications?: { journal: string; impactFactor?: string; progress: string }[];
  /** 향후 일정 타임라인 */
  timeline?: { date: string; event: string; detail?: string }[];
  /** 사용 방법론/기술 */
  methods?: string[];
}

export interface MapNode {
  id: string;
  label: string;
  type: NodeType;
  size: number;
  /** 소속 연구축 (urban / rural) */
  axes?: ("urban" | "rural")[];
  /** 툴팁·목록에 표시되는 한 줄 설명 */
  desc: string;
  /** 상세 패널 HTML */
  body: string;
  /** 액션 아이템 */
  actions?: { title: string; desc: string }[];
  /** 학생 전용 프로필 */
  student?: StudentProfile;
}

export interface MapLink {
  source: string;
  target: string;
  /** link: 일반, collab: 페어링, kk: 키워드↔키워드 */
  type: "link" | "collab" | "kk";
}

// ─── 색상 ───
export const NODE_COLORS: Record<NodeType, string> = {
  student: "#5bc0eb",
  theme: "#7ec884",
  method: "#c084e0",
  tech: "#50d0d0",
  project: "#f0a050",
  conference: "#e05858",
  axis: "#e8e070",
  paper: "#f5a623",
};

export const NODE_LABELS: Record<NodeType, string> = {
  student: "학생",
  theme: "주제",
  method: "방법론",
  tech: "기술",
  project: "프로젝트",
  conference: "학회",
  axis: "연구축",
  paper: "논문",
};

// ═══════════════════════════════════════════════
//  NODES — 여기만 수정하면 됩니다
// ═══════════════════════════════════════════════

export const NODES: MapNode[] = [
  // ────────────── 연구축 ──────────────
  {
    id: "urban", label: "도시", type: "axis", size: 32, axes: ["urban"],
    desc: "공원·녹지·보행환경 연구축",
    body: "<p>공원 접근성, 녹지 형평성, 보행환경 쾌적성, GSV+AI 분석</p><p><strong>학생:</strong> 이지윤, 이다연, 김가인, 김주연</p>",
    actions: [{ title: "CELA/AAG 2027", desc: "도시 주제 발표 학회" }],
  },
  {
    id: "rural", label: "농촌", type: "axis", size: 32, axes: ["rural"],
    desc: "농촌 공간·사회·정책 연구축",
    body: "<p>농촌공간재구조화, 재생에너지, 주민참여, 갈등, 도농복합</p><p><strong>학생:</strong> 김은솔, 이은진, 배성훈, 최희진</p>",
    actions: [{ title: "ACSP 2026", desc: "농촌 주제 학회 (10/8-10 Pittsburgh)" }],
  },

  // ────────────── 학생 ──────────────
  {
    id: "이지윤", label: "이지윤", type: "student", size: 22, axes: ["urban"],
    desc: "박사 | MAH-2SFCA 녹지 접근성 형평성",
    body: `<p><strong>핵심:</strong> 8지표 매력도×허프×G2SFCA → 서울시 427동, 66,834녹지</p>
    <ul><li>Gini: 도보 0.302 / 버스 0.172 / 승용차 0.159</li><li>Theil GE(1): between 36.2% / within 63.8%</li><li>12시나리오 비교 완료</li></ul>
    <p>투고: SCS (IF~13) 원고 90%+</p>`,
    actions: [
      { title: "CELA 2027 (~9월)", desc: "녹지 형평성" },
      { title: "AAG 2027 (~10월)", desc: "공간분석 세션" },
    ],
    student: {
      degree: "박사과정",
      topic: "MAH-2SFCA 기반 녹지 접근성 형평성 분석",
      status: "서울시 427동, 66,834개 녹지 대상 12개 시나리오 비교 완료. SCS 논문 원고 90%+ 작성 중",
      publications: [
        { journal: "Sustainable Cities and Society (SCS)", impactFactor: "~13", progress: "원고 90%+ 작성 중" },
      ],
      timeline: [
        { date: "2026 상반기", event: "SCS 논문 투고", detail: "녹지 형평성 분석 결과" },
        { date: "2026.09", event: "CELA 2027 초록 제출", detail: "녹지 형평성 발표" },
        { date: "2026.10", event: "AAG 2027 초록 제출", detail: "공간분석 세션" },
      ],
      methods: ["G2SFCA", "Gini/Theil 불평등 지수", "LISA 공간자기상관", "다중교통수단 분석"],
    },
  },
  {
    id: "이다연", label: "이다연", type: "student", size: 22, axes: ["urban"],
    desc: "석사 | VLM-as-Diagnostician 보행환경 진단",
    body: `<p>서울 성수동 8,263 GSV | GPT-4o VLM + DeepLabV3+</p>
    <ul><li>기본 R²=0.566 → 토픽 추가 CV R²=0.683</li><li>LDA 7토픽: 동네쾌적성(+0.449) vs 차량침범(-0.423)</li><li>SHAP: 동네쾌적성(0.328) > 장애물(0.212)</li></ul>
    <p>투고: CEUS (IF~7)</p>`,
    actions: [
      { title: "AAG 2027", desc: "VLM+Spatial AI" },
      { title: "김가인 페어링", desc: "CV 확장" },
    ],
    student: {
      degree: "석사과정",
      topic: "VLM-as-Diagnostician: 비전언어모델 기반 보행환경 진단",
      status: "성수동 8,263 GSV 이미지 분석 완료. LDA 7토픽 추출, SHAP 해석까지 완료. CEUS 투고 준비 중",
      publications: [
        { journal: "Computers, Environment and Urban Systems (CEUS)", impactFactor: "~7", progress: "투고 준비 중" },
      ],
      timeline: [
        { date: "2026 상반기", event: "CEUS 논문 투고", detail: "VLM 보행환경 진단 결과" },
        { date: "2026.10", event: "AAG 2027 초록 제출", detail: "VLM+Spatial AI 세션" },
        { date: "2026 하반기", event: "김가인 페어링 연구", detail: "CV 기술 공유 확장" },
      ],
      methods: ["GPT-4o VLM", "DeepLabV3+", "LDA 토픽모델링", "SHAP 해석", "Google Street View"],
    },
  },
  {
    id: "김은솔", label: "김은솔", type: "student", size: 22, axes: ["rural"],
    desc: "박사 | 영농형 태양광 수용성 이중성 (3편)",
    body: `<ul><li><strong>P1:</strong> Sentinel-2 → 농업취약성 분류 → LUP (IF 7.1)</li>
    <li><strong>P2:</strong> LPA+SEM → 보완형 vs 대체형 → ERSS (IF 6.9)</li>
    <li><strong>P3:</strong> FLUS+EWI 조기경보 → AE (IF 10.1)</li></ul>`,
    actions: [
      { title: "ACSP 2026", desc: "Track 3/5: 수용성 이중성" },
      { title: "AAG 2027", desc: "위성+농업 취약성" },
    ],
    student: {
      degree: "박사과정",
      topic: "영농형 태양광 수용성의 이중성: 위성탐사·설문·시뮬레이션 3편 연구",
      status: "3편 논문 동시 진행 중. P1(위성+농업취약성), P2(수용성 이중구조), P3(조기경보 시스템)",
      publications: [
        { journal: "Land Use Policy (LUP)", impactFactor: "7.1", progress: "P1 진행 중" },
        { journal: "Energy Research & Social Science (ERSS)", impactFactor: "6.9", progress: "P2 진행 중" },
        { journal: "Applied Energy (AE)", impactFactor: "10.1", progress: "P3 진행 중" },
      ],
      timeline: [
        { date: "2026.10", event: "ACSP 2026 발표", detail: "Track 3/5: 수용성 이중성 (Pittsburgh)" },
        { date: "2026.10", event: "AAG 2027 초록 제출", detail: "위성+농업 취약성" },
        { date: "2026-2027", event: "3편 순차 투고", detail: "LUP → ERSS → AE" },
      ],
      methods: ["Sentinel-2 위성영상", "NDVI 시계열", "LPA+SEM", "FLUS 시뮬레이션", "EWI 조기경보", "설문조사 450명"],
    },
  },
  {
    id: "이은진", label: "이은진", type: "student", size: 22, axes: ["rural"],
    desc: "석사 | LLM 디지털 페르소나 정책수용성",
    body: `<p>이천시 사례 | 4종 페르소나 × 4종 시나리오 × 10회 = 160건</p>
    <ul><li>GPT-4o 정책 반응 생성 + 이중 검증</li><li>불일치 5유형 분류</li><li>비영어권·비도시 맥락 최초</li></ul>`,
    actions: [
      { title: "ACSP 2026", desc: "Track 1 AI in Planning — 최적합" },
      { title: "AAG 2027", desc: "Spatial AI" },
    ],
    student: {
      degree: "석사과정",
      topic: "LLM 디지털 페르소나를 활용한 농촌 정책수용성 사전탐색",
      status: "이천시 대상 160건 시뮬레이션 완료. 불일치 5유형 분류 및 비영어권·비도시 맥락 최초 적용",
      publications: [],
      timeline: [
        { date: "2026.10", event: "ACSP 2026 발표", detail: "Track 1 AI in Planning (Pittsburgh)" },
        { date: "2026.10", event: "AAG 2027 초록 제출", detail: "Spatial AI 세션" },
        { date: "2026 하반기", event: "학위논문 작성", detail: "LLM 페르소나 정책수용성" },
      ],
      methods: ["GPT-4o LLM", "디지털 페르소나", "시나리오 시뮬레이션", "이중 검증", "이천시 사례연구"],
    },
  },
  {
    id: "최희진", label: "최희진", type: "student", size: 22, axes: ["rural"],
    desc: "석사 | 공동체 갈등진단 지표 CCDI",
    body: `<p>Rodrik 모형 마을 적용:</p>
    <ul><li><strong>Risk(5):</strong> 신뢰결손, 공정성결핍, 감정긴장, 권력비대칭, 자원경쟁</li>
    <li><strong>Health(4):</strong> 소통투명, 참여포용, 갈등대응규범, 외부지원</li>
    <li>2×2 매트릭스, n≥200, DeVellis/COSMIN</li></ul>`,
    actions: [{ title: "ACSP 2026", desc: "Track 2 Community Dev" }],
    student: {
      degree: "석사과정",
      topic: "공동체 갈등진단 지표(CCDI) 개발: Rodrik 모형의 마을 적용",
      status: "Risk 5개·Health 4개 하위지표 설계 완료. 200명+ 설문 설계 중 (DeVellis/COSMIN 기준)",
      publications: [],
      timeline: [
        { date: "2026.10", event: "ACSP 2026 발표", detail: "Track 2 Community Dev (Pittsburgh)" },
        { date: "2026 하반기", event: "설문 시행", detail: "n≥200, EFA/CFA 타당도 검증" },
        { date: "2027 상반기", event: "학위논문 완성", detail: "CCDI 지표 최종 검증" },
      ],
      methods: ["Rodrik 갈등모형", "설문조사 설계", "EFA/CFA", "DeVellis 척도개발", "2×2 매트릭스"],
    },
  },
  {
    id: "배성훈", label: "배성훈", type: "student", size: 22, axes: ["rural"],
    desc: "석사 | 여주시 도농복합 공간유형·생활만족도",
    body: `<p>122법정리 × 43지표 → PCA → 군집 → HLM</p>
    <ul><li>2,645명 정주만족도 + 위계선형모형</li><li>러번(rurban) 국내 첫 적용</li><li>"복합 불이익" 가설 검증</li></ul>
    <p>목표: Applied Geography</p>`,
    actions: [
      { title: "ACSP 2026", desc: "Track 10 Quantitative Methods" },
      { title: "AAG 2027", desc: "도농복합 분석" },
    ],
    student: {
      degree: "석사과정",
      topic: "여주시 도농복합 공간유형 분류와 정주생활만족도 분석",
      status: "122 법정리 × 43지표 PCA·군집분석 완료. 2,645명 위계선형모형(HLM) 분석 중. 러번(rurban) 국내 첫 적용",
      publications: [
        { journal: "Applied Geography", progress: "목표 저널" },
      ],
      timeline: [
        { date: "2026.10", event: "ACSP 2026 발표", detail: "Track 10 Quantitative Methods (Pittsburgh)" },
        { date: "2026.10", event: "AAG 2027 초록 제출", detail: "도농복합 분석" },
        { date: "2027 상반기", event: "Applied Geography 투고", detail: "도농복합 유형+만족도" },
      ],
      methods: ["PCA", "군집분석", "HLM 위계선형모형", "2차 설문데이터 분석 (2,645명)"],
    },
  },
  {
    id: "김가인", label: "김가인", type: "student", size: 22, axes: ["urban"],
    desc: "석사 | DPT 3D 녹지 인식 거리 vs GVI",
    body: `<p>송파구(신도시) vs 종로구(구도심)</p>
    <ul><li>DPT 깊이추정 × MaskFormer/DETR 세그멘테이션</li><li>100명+ 설문 검증</li><li>GVI(평면) vs DPT(입체) R² 비교</li></ul>`,
    actions: [
      { title: "CELA 2027 (~9월)", desc: "녹지 쾌적성" },
      { title: "이다연 페어링", desc: "CV 공유" },
    ],
    student: {
      degree: "석사과정",
      topic: "DPT 3D 깊이추정 기반 녹지 인식 거리 vs 기존 GVI 비교",
      status: "송파구/종로구 GSV 수집 완료. DPT+MaskFormer+DETR 분석 진행 중. 100명+ 설문 설계 중",
      publications: [],
      timeline: [
        { date: "2026.09", event: "CELA 2027 초록 제출", detail: "녹지 쾌적성 발표" },
        { date: "2026 하반기", event: "설문 시행", detail: "100명+ 녹지 인식 검증" },
        { date: "2026 하반기", event: "이다연 페어링 연구", detail: "CV 기술 공유" },
      ],
      methods: ["DPT 깊이추정", "MaskFormer (150범주)", "DETR (90범주)", "GVI", "설문조사", "Google Street View"],
    },
  },
  {
    id: "김주연", label: "김주연", type: "student", size: 22, axes: ["urban"],
    desc: "석사 | 신진연구+산림청 메인보조 → 학위논문",
    body: `<p>과제 메인 보조 + 잠재 학위논문:</p>
    <ul><li>신진연구: Multi-modal G2SFCA + LISA</li><li>산림청: K-TES, 3-30-300 전국 지도화</li><li>학위: K-TES 국내 적용 or 비공원녹지 평가</li></ul>`,
    actions: [
      { title: "산림청 선정 대기", desc: "선정 시 학위논문 착수" },
      { title: "CELA 2027", desc: "K-TES 발표" },
    ],
    student: {
      degree: "석사과정",
      topic: "신진연구+산림청 과제 보조 → K-TES 또는 비공원녹지 학위논문",
      status: "신진연구(G2SFCA+LISA)·산림청(K-TES, 3-30-300) 과제 보조 수행 중. 산림청 과제 선정 결과 대기 중",
      publications: [],
      timeline: [
        { date: "2026 상반기", event: "산림청 과제 선정 대기", detail: "선정 시 K-TES 학위논문 착수" },
        { date: "2026.09", event: "CELA 2027 초록 제출", detail: "K-TES 발표" },
        { date: "2026-2027", event: "학위논문 주제 확정", detail: "K-TES 국내 적용 or 비공원녹지 평가" },
      ],
      methods: ["Multi-modal G2SFCA", "LISA", "K-TES 지표", "3-30-300 전국 지도화", "ArcGIS"],
    },
  },

  // ────────────── 프로젝트 ──────────────
  {
    id: "nrf", label: "신진연구 NRF", type: "project", size: 24,
    desc: "비공원 녹지 통합 평가 + 형평성 정책 (2025-2028)",
    body: "<p>3년 738M원: DB→평가체계→대시보드</p><p>서울 66,834녹지 × 427동 분석 완료</p>",
    actions: [{ title: "산림청 시너지", desc: "서울→전국 확장" }],
  },
  {
    id: "forest", label: "산림청", type: "project", size: 24,
    desc: "녹지형평성 도시숲: 양적확대→형평적배분",
    body: "<p>실태조사(해외4권역) + 지표개발(K-TES) + 전략마련(7단계)</p>",
    actions: [{ title: "과제 선정 대기", desc: "김주연 투입" }],
  },

  // ────────────── 학회 ──────────────
  {
    id: "cela", label: "CELA", type: "conference", size: 22,
    desc: "조경학 | 2027: ~3월, 초록 ~9/2026",
    body: "<p>2026 완료. 2027 초록 9월 예상.</p><p>적합: 녹지, 형평성, 쾌적성, 보행환경</p>",
    actions: [{ title: "2027 초록(~9월)", desc: "이지윤, 김가인, 김주연" }],
  },
  {
    id: "aag", label: "AAG", type: "conference", size: 22,
    desc: "공간/지리 다학제 | 2027: 2/8-12 뉴욕",
    body: "<p>2027 뉴욕, 초록 10-11월.</p><p>적합: AI, 공간분석, 원격탐사, 환경정의</p>",
    actions: [{ title: "2027 초록(~10월)", desc: "이다연, 이지윤, 김은솔, 배성훈" }],
  },
  {
    id: "acsp", label: "ACSP", type: "conference", size: 22,
    desc: "계획학 | 2026: 10/8-10 Pittsburgh",
    body: "<p>T1 AI, T2 Community, T3 Environmental, T5 International, T10 Quantitative</p>",
    actions: [{ title: "초록 제출 완료 확인", desc: "이은진(T1), 최희진(T2), 배성훈(T10), 김은솔(T3)" }],
  },

  // ────────────── 주제 키워드 (theme) ──────────────
  {
    id: "k_지표개발", label: "지표개발", type: "theme", size: 15,
    desc: "★ 핵심 브릿지: CCDI + K-TES + Gini/Theil + EWI",
    body: `<p><strong>도시↔농촌을 잇는 핵심 교차 키워드</strong></p>
    <ul><li><strong>최희진:</strong> CCDI 갈등진단 30문항</li><li><strong>산림청:</strong> K-TES, 3-30-300</li>
    <li><strong>이지윤:</strong> Gini, Theil GE(1)</li><li><strong>김은솔:</strong> EWI 조기경보</li>
    <li><strong>신진연구:</strong> 통합 평가 지표</li></ul>`,
  },
  {
    id: "k_형평성", label: "형평성", type: "theme", size: 14,
    desc: "Equity — 녹지·기후·에너지",
    body: "<ul><li>이지윤: Gini/Theil/LISA</li><li>산림청: 형평적 배분</li><li>신진연구: 형평성 정책</li><li>김은솔: 에너지 정의</li></ul>",
  },
  {
    id: "k_접근성", label: "접근성", type: "theme", size: 14,
    desc: "Accessibility — 녹지·인프라·서비스",
    body: "<ul><li>이지윤: G2SFCA</li><li>산림청: 300m 접근</li><li>배성훈: 인프라 접근시간</li><li>김주연: 전국 지도화</li></ul>",
  },
  {
    id: "k_취약성", label: "취약성", type: "theme", size: 13,
    desc: "Vulnerability — 농업·기후·사회경제",
    body: "<ul><li>김은솔: 농업기반 취약성</li><li>산림청: 기후·사회경제 6지표</li><li>이지윤: 사회경제적 취약계층</li><li>최희진: 공동체 위기</li></ul>",
  },
  {
    id: "k_녹지", label: "녹지/공원", type: "theme", size: 15,
    desc: "Green Space — 공원·비공원·도시숲",
    body: "<ul><li>이지윤: 66,834 녹지</li><li>김가인: DPT 녹지</li><li>김주연: K-TES</li><li>산림청: 도시숲</li><li>신진연구: 통합 평가</li></ul>",
  },
  {
    id: "k_보행", label: "보행환경", type: "theme", size: 13,
    desc: "Walkability",
    body: "<ul><li>이다연: VLM 보행환경</li><li>김가인: DPT 쾌적성</li></ul>",
  },
  {
    id: "k_수용성", label: "수용성/참여", type: "theme", size: 13,
    desc: "Acceptance / Participation",
    body: "<ul><li>이은진: LLM 정책수용성</li><li>김은솔: 보완형 vs 대체형</li><li>최희진: 참여·역량</li></ul>",
  },
  {
    id: "k_갈등", label: "갈등", type: "theme", size: 12,
    desc: "Conflict — 공동체·이해관계자",
    body: "<ul><li>최희진: 갈등 구조화·지표</li><li>이은진: 이해관계자 갈등 탐색</li></ul>",
  },
  {
    id: "k_공동체", label: "공동체", type: "theme", size: 13,
    desc: "Community — 마을, 주민관계",
    body: "<ul><li>최희진: 마을공동체 갈등</li><li>이은진: 농촌 이해관계자</li><li>배성훈: 이웃관계·결속</li></ul>",
  },
  {
    id: "k_유형", label: "공간유형분류", type: "theme", size: 13,
    desc: "Spatial Typology — 유형화→차별적 정책",
    body: "<ul><li>배성훈: 법정리 도농복합</li><li>김은솔: 농업기반 유형</li><li>산림청: 구도심 6유형</li></ul>",
  },
  {
    id: "k_정책", label: "정책지원", type: "theme", size: 13,
    desc: "Policy — 대시보드, 시뮬레이션",
    body: "<ul><li>신진연구: GIS 대시보드</li><li>산림청: 7단계 로드맵</li><li>이은진: 사전탐색 도구</li><li>김은솔: 허용조건</li></ul>",
  },
  {
    id: "k_기후", label: "기후정의", type: "theme", size: 12,
    desc: "Climate Justice",
    body: "<ul><li>이지윤: 확장 예정</li><li>산림청: 기후취약성</li></ul>",
  },
  {
    id: "k_웰빙", label: "웰빙/만족", type: "theme", size: 12,
    desc: "Well-being — 삶의 질, 쾌적성",
    body: "<ul><li>배성훈: 정주만족도</li><li>김가인: 보행 쾌적성</li></ul>",
  },
  {
    id: "k_에너지", label: "에너지전환", type: "theme", size: 11,
    desc: "Energy Transition",
    body: "<p>김은솔: 영농형 태양광 + 에너지 정의</p>",
  },

  // ────────────── 방법론 키워드 (method) ──────────────
  {
    id: "k_설문", label: "설문/조사", type: "method", size: 14,
    desc: "★ 도시↔농촌 방법론 브릿지",
    body: "<ul><li>최희진: CCDI+EFA</li><li>김은솔: 450명+LPA</li><li>이은진: LLM 설문대체</li><li>배성훈: 2,645명</li><li>김가인: 100명+ 쾌적성</li></ul>",
  },
  {
    id: "k_gis", label: "GIS/공간분석", type: "method", size: 14,
    desc: "ArcGIS, LISA, PCA, HLM",
    body: "<ul><li>이지윤: LISA</li><li>배성훈: PCA, HLM</li><li>김은솔: Moran, FLUS</li><li>김주연: ArcGIS</li></ul>",
  },
  {
    id: "k_rs", label: "원격탐사", type: "method", size: 13,
    desc: "Sentinel-2, GEE, NDVI",
    body: "<ul><li>김은솔: NDVI 시계열</li><li>산림청: 수관피복률</li><li>김주연: 위성 보조</li></ul>",
  },

  // ────────────── 기술 키워드 (tech) ──────────────
  {
    id: "k_ai", label: "AI/딥러닝", type: "tech", size: 14,
    desc: "VLM+LLM+DPT+Seg 상위 개념",
    body: `<p><strong>SDC Lab AI 기술 스펙트럼</strong></p>
    <ul><li>이다연: VLM+DeepLabV3+</li><li>김가인: DPT+MaskFormer</li><li>이은진: LLM 페르소나</li></ul>`,
  },
  {
    id: "k_gsv", label: "Street View", type: "tech", size: 12,
    desc: "Google/Naver SV 이미지",
    body: "<ul><li>이다연: 8,263 GSV</li><li>김가인: 송파/종로 GSV</li><li>산림청: 녹시율</li></ul>",
  },
  {
    id: "k_cv", label: "CV/Seg", type: "tech", size: 12,
    desc: "DeepLabV3+, MaskFormer, DETR",
    body: "<ul><li>이다연: DeepLabV3+ 19클래스</li><li>김가인: MaskFormer 150범주</li></ul>",
  },
  {
    id: "k_dpt", label: "DPT/3D", type: "tech", size: 11,
    desc: "Dense Prediction Transformer",
    body: "<p>2D→3D 깊이 추정 → 녹지 인식 거리</p><p>사용: 김가인</p>",
  },
  {
    id: "k_vlm", label: "VLM", type: "tech", size: 12,
    desc: "Vision-Language Model (GPT-4o)",
    body: "<p>이미지→텍스트 평가 + 설명 생성</p><p>사용: 이다연</p>",
  },
  {
    id: "k_llm", label: "LLM", type: "tech", size: 12,
    desc: "Large Language Model (GPT-4o)",
    body: "<p>디지털 페르소나 + 정책 반응 시뮬레이션</p><p>사용: 이은진</p>",
  },
];

// ═══════════════════════════════════════════════
//  LINKS — 연결 관계
// ═══════════════════════════════════════════════

export const LINKS: MapLink[] = [
  // ── 학생 → 연구축 ──
  { source: "이지윤", target: "urban", type: "link" },
  { source: "이다연", target: "urban", type: "link" },
  { source: "김가인", target: "urban", type: "link" },
  { source: "김주연", target: "urban", type: "link" },
  { source: "김은솔", target: "rural", type: "link" },
  { source: "이은진", target: "rural", type: "link" },
  { source: "최희진", target: "rural", type: "link" },
  { source: "배성훈", target: "rural", type: "link" },

  // ── 학생 → 주제 키워드 ──
  { source: "이지윤", target: "k_형평성", type: "link" },
  { source: "이지윤", target: "k_접근성", type: "link" },
  { source: "이지윤", target: "k_녹지", type: "link" },
  { source: "이지윤", target: "k_지표개발", type: "link" },
  { source: "이지윤", target: "k_취약성", type: "link" },
  { source: "이지윤", target: "k_기후", type: "link" },
  { source: "이다연", target: "k_보행", type: "link" },
  { source: "이다연", target: "k_녹지", type: "link" },
  { source: "김은솔", target: "k_수용성", type: "link" },
  { source: "김은솔", target: "k_유형", type: "link" },
  { source: "김은솔", target: "k_지표개발", type: "link" },
  { source: "김은솔", target: "k_취약성", type: "link" },
  { source: "김은솔", target: "k_에너지", type: "link" },
  { source: "김은솔", target: "k_정책", type: "link" },
  { source: "이은진", target: "k_수용성", type: "link" },
  { source: "이은진", target: "k_갈등", type: "link" },
  { source: "이은진", target: "k_공동체", type: "link" },
  { source: "이은진", target: "k_정책", type: "link" },
  { source: "최희진", target: "k_갈등", type: "link" },
  { source: "최희진", target: "k_공동체", type: "link" },
  { source: "최희진", target: "k_지표개발", type: "link" },
  { source: "최희진", target: "k_수용성", type: "link" },
  { source: "최희진", target: "k_취약성", type: "link" },
  { source: "배성훈", target: "k_유형", type: "link" },
  { source: "배성훈", target: "k_접근성", type: "link" },
  { source: "배성훈", target: "k_공동체", type: "link" },
  { source: "배성훈", target: "k_웰빙", type: "link" },
  { source: "김가인", target: "k_녹지", type: "link" },
  { source: "김가인", target: "k_보행", type: "link" },
  { source: "김가인", target: "k_웰빙", type: "link" },
  { source: "김주연", target: "k_녹지", type: "link" },
  { source: "김주연", target: "k_형평성", type: "link" },
  { source: "김주연", target: "k_접근성", type: "link" },
  { source: "김주연", target: "k_지표개발", type: "link" },
  { source: "김주연", target: "k_정책", type: "link" },

  // ── 학생 → 기술 키워드 ──
  { source: "이다연", target: "k_ai", type: "link" },
  { source: "이다연", target: "k_gsv", type: "link" },
  { source: "이다연", target: "k_cv", type: "link" },
  { source: "이다연", target: "k_vlm", type: "link" },
  { source: "김가인", target: "k_ai", type: "link" },
  { source: "김가인", target: "k_gsv", type: "link" },
  { source: "김가인", target: "k_cv", type: "link" },
  { source: "김가인", target: "k_dpt", type: "link" },
  { source: "이은진", target: "k_ai", type: "link" },
  { source: "이은진", target: "k_llm", type: "link" },

  // ── 학생 → 방법론 키워드 ──
  { source: "최희진", target: "k_설문", type: "link" },
  { source: "김은솔", target: "k_설문", type: "link" },
  { source: "이은진", target: "k_설문", type: "link" },
  { source: "배성훈", target: "k_설문", type: "link" },
  { source: "김가인", target: "k_설문", type: "link" },
  { source: "이지윤", target: "k_gis", type: "link" },
  { source: "배성훈", target: "k_gis", type: "link" },
  { source: "김은솔", target: "k_gis", type: "link" },
  { source: "김주연", target: "k_gis", type: "link" },
  { source: "김은솔", target: "k_rs", type: "link" },
  { source: "김주연", target: "k_rs", type: "link" },

  // ── 프로젝트 → 키워드 ──
  { source: "nrf", target: "k_녹지", type: "link" },
  { source: "nrf", target: "k_형평성", type: "link" },
  { source: "nrf", target: "k_접근성", type: "link" },
  { source: "nrf", target: "k_지표개발", type: "link" },
  { source: "nrf", target: "k_gis", type: "link" },
  { source: "nrf", target: "k_정책", type: "link" },
  { source: "forest", target: "k_녹지", type: "link" },
  { source: "forest", target: "k_형평성", type: "link" },
  { source: "forest", target: "k_접근성", type: "link" },
  { source: "forest", target: "k_지표개발", type: "link" },
  { source: "forest", target: "k_취약성", type: "link" },
  { source: "forest", target: "k_유형", type: "link" },
  { source: "forest", target: "k_rs", type: "link" },
  { source: "forest", target: "k_gsv", type: "link" },
  { source: "forest", target: "k_정책", type: "link" },
  { source: "forest", target: "k_기후", type: "link" },

  // ── 학생 → 프로젝트 ──
  { source: "김주연", target: "nrf", type: "link" },
  { source: "김주연", target: "forest", type: "link" },
  { source: "이지윤", target: "nrf", type: "link" },
  { source: "이지윤", target: "forest", type: "link" },

  // ── 키워드 → 학회 ──
  { source: "k_녹지", target: "cela", type: "link" },
  { source: "k_형평성", target: "cela", type: "link" },
  { source: "k_보행", target: "cela", type: "link" },
  { source: "k_웰빙", target: "cela", type: "link" },
  { source: "k_ai", target: "aag", type: "link" },
  { source: "k_gis", target: "aag", type: "link" },
  { source: "k_rs", target: "aag", type: "link" },
  { source: "k_형평성", target: "aag", type: "link" },
  { source: "k_gsv", target: "aag", type: "link" },
  { source: "k_기후", target: "aag", type: "link" },
  { source: "k_유형", target: "aag", type: "link" },
  { source: "k_접근성", target: "aag", type: "link" },
  { source: "k_ai", target: "acsp", type: "link" },
  { source: "k_수용성", target: "acsp", type: "link" },
  { source: "k_공동체", target: "acsp", type: "link" },
  { source: "k_갈등", target: "acsp", type: "link" },
  { source: "k_설문", target: "acsp", type: "link" },
  { source: "k_정책", target: "acsp", type: "link" },
  { source: "k_형평성", target: "acsp", type: "link" },
  { source: "k_유형", target: "acsp", type: "link" },
  { source: "k_gis", target: "acsp", type: "link" },

  // ── 페어링 ──
  { source: "이다연", target: "김가인", type: "collab" },

  // ── 키워드 ↔ 키워드 (관련 기술/개념) ──
  { source: "k_vlm", target: "k_llm", type: "kk" },   // Foundation Models
  { source: "k_vlm", target: "k_cv", type: "kk" },     // 이미지→분석
  { source: "k_vlm", target: "k_ai", type: "kk" },     // 상위개념
  { source: "k_llm", target: "k_ai", type: "kk" },     // 상위개념
  { source: "k_cv", target: "k_ai", type: "kk" },
  { source: "k_cv", target: "k_dpt", type: "kk" },     // 이미지 분석 기술
  { source: "k_cv", target: "k_gsv", type: "kk" },     // 데이터 소스
  { source: "k_dpt", target: "k_ai", type: "kk" },
  { source: "k_gsv", target: "k_보행", type: "kk" },
  { source: "k_gis", target: "k_rs", type: "kk" },     // 공간기술
  { source: "k_형평성", target: "k_접근성", type: "kk" },
  { source: "k_형평성", target: "k_취약성", type: "kk" },
  { source: "k_형평성", target: "k_기후", type: "kk" },
  { source: "k_형평성", target: "k_지표개발", type: "kk" },
  { source: "k_접근성", target: "k_녹지", type: "kk" },
  { source: "k_취약성", target: "k_지표개발", type: "kk" },
  { source: "k_갈등", target: "k_공동체", type: "kk" },
  { source: "k_갈등", target: "k_수용성", type: "kk" },
  { source: "k_공동체", target: "k_수용성", type: "kk" },
  { source: "k_유형", target: "k_정책", type: "kk" },
  { source: "k_지표개발", target: "k_설문", type: "kk" },
  { source: "k_지표개발", target: "k_정책", type: "kk" },
  { source: "k_보행", target: "k_녹지", type: "kk" },
  { source: "k_보행", target: "k_웰빙", type: "kk" },
  { source: "k_녹지", target: "k_기후", type: "kk" },
  { source: "k_에너지", target: "k_수용성", type: "kk" },
  { source: "k_에너지", target: "k_유형", type: "kk" },
  { source: "k_llm", target: "k_설문", type: "kk" },   // LLM↔설문 대체
];
