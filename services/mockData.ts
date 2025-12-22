import { Member, MemberRole, MemberStatus, ResearchRecord, ResearchType, ResearchStatus, MeetingLog, CalendarEvent, Category, LabProject, PaperStage } from '../types';

const today = new Date();

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'c1', name: '랩 미팅', color: 'bg-blue-100 text-blue-800' },
  { id: 'c2', name: '학회', color: 'bg-purple-100 text-purple-800' },
  { id: 'c3', name: '회식/행사', color: 'bg-green-100 text-green-800' },
  { id: 'c4', name: '마감일', color: 'bg-red-100 text-red-800' },
  { id: 'c5', name: '세미나', color: 'bg-yellow-100 text-yellow-800' },
  { id: 'c6', name: '스터디', color: 'bg-indigo-100 text-indigo-800' },
  { id: 'c7', name: '답사', color: 'bg-teal-100 text-teal-800' },
  { id: 'c8', name: '휴가', color: 'bg-gray-100 text-gray-800' },
];

export const INITIAL_MEMBERS: Member[] = [
  {
    id: 'm1',
    name: '강성익', 
    role: MemberRole.PostDoc,
    email: 'namugnel@naver.com',
    phoneNumber: '010-1234-5678',
    photoUrl: '/images/kang_sung_ik.png',
    admissionDate: '2023-03-01',
    expectedGraduation: '2025-02-28',
    status: MemberStatus.Active,
    researchInterests: '도시불평등, 사회적 혼합공동체, 공중보건',
    currentProjects: '비공원 녹지, Relative Deprivation'
  },
  {
    id: 'm2',
    name: '오재인',
    role: MemberRole.PostDoc,
    email: 'ojikch79@gmail.com',
    phoneNumber: '010-9876-5432',
    photoUrl: '/images/oh_jae_in.png',
    admissionDate: '2023-03-01',
    expectedGraduation: '2025-02-28',
    status: MemberStatus.Active,
    researchInterests: '그린 젠트리피케이션, 공원 이용 패턴 분석, 열 취약성 분석',
    currentProjects: '공원 대중교통 접근성, Heat Island'
  },
  {
    id: 'm5',
    name: '김은솔',
    role: MemberRole.PhD,
    email: 'rdt9690@uos.ac.kr',
    phoneNumber: '010-5555-4444',
    photoUrl: '/images/kim_eun_sol.png',
    admissionDate: '2021-03-01',
    expectedGraduation: '2025-08-31',
    status: MemberStatus.Active,
    researchInterests: '농촌공간계획, 주민수용성',
    currentProjects: '농촌 태양광 발전, 경기도 농촌공간 모델'
  },
  // ... other members exist in real app, keeping key ones for brevity in replacement
  {
    id: 'm3', name: '이지윤', role: MemberRole.PhD, email: 'jiyunlee41016@uos.ac.kr', photoUrl: '/images/lee_ji_yoon.png', admissionDate: '2024-03-01', expectedGraduation: '2026-02-28', status: MemberStatus.Active
  },
  { id: 'm4', name: '이다연', role: MemberRole.Researcher, email: 'dayeon34@uos.ac.kr', photoUrl: '/images/lee_da_yeon.png', admissionDate: '2022-03-01', expectedGraduation: '2026-02-28', status: MemberStatus.Active },
  // New Members (User Request)
  { id: 'm10', name: '최희진', role: MemberRole.MS, email: 'heejin02@uos.ac.kr', photoUrl: '/images/choi_hee_jin.png', admissionDate: '2025-03-01', expectedGraduation: '2027-02-28', status: MemberStatus.Active, researchInterests: '마을재생, 문화기반 활성화' },
  { id: 'm11', name: '이은진', role: MemberRole.MS, email: 'jinnieel@uos.ac.kr', photoUrl: '/images/lee_eun_jin.png', admissionDate: '2025-03-01', expectedGraduation: '2027-02-28', status: MemberStatus.Active, researchInterests: '스마트 마을재생, 지역 활성화' },
  { id: 'm12', name: '배성훈', role: MemberRole.MS, email: 'sungaeae@uos.ac.kr', photoUrl: '/images/bae_sung_hoon.png', admissionDate: '2025-03-01', expectedGraduation: '2027-02-28', status: MemberStatus.Active, researchInterests: '지방소멸, 농촌 재생', label: '학석사연계과정' },
];

// Template Generator
// Checklists Dictionary
export const STAGE_CHECKLISTS: Record<string, string[]> = {
    '문헌조사': ['주요 키워드 검색 (Google Scholar, DBpia)', '관련 핵심 논문 10편 선정', '기존 연구 한계점 도출', '연구 차별성 확보'],
    '방법론 설계': ['연구 가설 설정', '변수 정의 및 측정 방법 결정', '분석 모형(알고리즘) 선정', '데이터 확보 계획 수립'],
    '데이터 수집': ['공공데이터 포털 데이터 확보', '데이터 전처리 및 정제', '결측치 및 이상치 처리', '데이터 구조화 완료'],
    '분석': ['기초 통계 분석', '시각화 수행', '가설 검증 / 모델 학습', '분석 결과 해석'],
    '초고 작성': ['서론 및 이론적 배경 작성', '연구 방법 기술', '분석 결과 정리', '결론 및 시사점 도출'],
    // Removed Internal Review
    '투고': ['타겟 저널 포맷팅 (Author Guidelines)', 'Cover Letter 작성', 'Manuscript 제출', '심사료 납부'],
    '심사/수정': ['Reviewer 코멘트 분석', '수정본(Revised Manuscript) 작성', 'Response Letter 작성', '재투고'],
    '게재확정': ['최종 교정(Galley Proof)', '게재료 납부', '연구 실적 등록', '아카이빙']
};

export const generateStages = (completedCount: number): PaperStage[] => [
    { id: 's1', stageType: '문헌조사', weight: 12, order: 1 },
    { id: 's2', stageType: '방법론 설계', weight: 12, order: 2 },
    { id: 's3', stageType: '데이터 수집', weight: 15, order: 3 },
    { id: 's4', stageType: '분석', weight: 20, order: 4 },
    { id: 's5', stageType: '초고 작성', weight: 15, order: 5 },
    // Removed Internal Review
    { id: 's7', stageType: '투고', weight: 6, order: 7 },
    { id: 's8', stageType: '심사/수정', weight: 15, order: 8 },
    { id: 's9', stageType: '게재확정', weight: 5, order: 9 },
].map((s, i) => ({
    ...s,
    completed: completedCount >= (i + 1),
    completedDate: completedCount >= (i + 1) ? '2024-03-10' : undefined, // Sample date
    checklist: (STAGE_CHECKLISTS[s.stageType] || ['기본 항목 확인']).map((text, idx) => ({
        id: `${s.id}-c${idx}`,
        text,
        completed: completedCount >= (i + 1) // If stage is done, all tasks done
    }))
}));

export const INITIAL_RESEARCH: ResearchRecord[] = [
  // Kang Sung-ik
  { 
    id: 'r1', 
    assignedMemberId: 'm1', 
    studentId: 'm1',
    title: '비공원 녹지 포함 도시 재개발 사업에 의한 서울시 공원녹지 시계열 접근성 변화 분석', 
    type: ResearchType.NewResearch, 
    status: ResearchStatus.Preparing, 
    statusTag: 'On Track',
    progress: 35, 
    targetJournal: 'Landscape and Urban Planning',
    stages: generateStages(3), 
    authors: [
        { id: 'a1', name: '강성익', role: '1저자', responsibilities: ['데이터 수집', '분석', '초고 작성'], order: 1 },
        { id: 'a2', name: '이재호', role: '교신저자', responsibilities: ['연구 설계', '검토', '투고 관리'], order: 2 }
    ],
    deadline: '2025-06-30',
    activityLog: [
        { id: 'al1', date: '2024-03-20', content: '데이터 수집 시작 (서울시 공공데이터)', type: 'log' },
        { id: 'al2', date: '2024-02-15', content: '연구 방법론 설계 확정 (시계열 분석 모델)', type: 'milestone' },
        { id: 'al3', date: '2024-01-10', content: '선행 문헌 조사 완료 및 정리', type: 'log' }
    ],
    attachments: [
        { id: 'att1', name: '연구계획서_v2.pdf', url: '#', type: 'file', date: '2024-02-10' }
    ]
  },
  { 
    id: 'r2', 
    assignedMemberId: 'm1', 
    studentId: 'm1',
    title: 'Bidirectional Associations Between Relative Deprivation and Health Outcomes', 
    type: ResearchType.Individual, 
    status: ResearchStatus.Submitting, 
    statusTag: 'Under Review',
    progress: 85, 
    targetJournal: 'Health & Place',
    stages: generateStages(6), 
    authors: [
        { id: 'a1', name: '강성익', role: '1저자', responsibilities: ['분석', '글쓰기'], order: 1 },
        { id: 'a2', name: 'Dr. Smith', role: '공저자', responsibilities: ['데이터 제공'], order: 2 },
        { id: 'a3', name: '이재호', role: '교신저자', responsibilities: ['지도'], order: 3 }
    ],
    deadline: '2025-02-15'
  },
  
  
  // Oh Jae-in
  // Oh Jae-in
  { 
    id: 'r4', 
    assignedMemberId: 'm2', 
    studentId: 'm2',
    title: 'Heat Island Research: Urban Geometry Impacts', 
    type: ResearchType.Individual, 
    status: ResearchStatus.Accepted, 
    progress: 100,
    stages: generateStages(9),
    authors: [{ id: 'a1', name: '오재인', role: '1저자', responsibilities: [], order: 1 }],
    deadline: '2024-12-01'
  },
  
  // Kim Eun-sol
  { 
    id: 'r11', 
    assignedMemberId: 'm5', 
    studentId: 'm5',
    title: '농촌 태양광 발전 사업의 주민 수용성 결정 요인 연구', 
    progress: 80, 
    type: ResearchType.Submission,
    status: ResearchStatus.Submitting,
    targetJournal: 'Renewable Energy',
    stages: generateStages(6),
    authors: [{ id: 'a1', name: '김은솔', role: '1저자', responsibilities: [], order: 1 }],
    deadline: '2025-03-31'
  },
  
  // Da-yeon
  { 
    id: 'r6', 
    assignedMemberId: 'm4', 
    studentId: 'm4',
    title: 'CEUS Paper Revision: Spatial Optimization', 
    progress: 65, 
    type: ResearchType.Modification,
    status: ResearchStatus.Preparing,
    stages: generateStages(5),
    authors: [{ id: 'a1', name: '이다연', role: '1저자', responsibilities: [], order: 1 }],
    deadline: '2025-04-15' 
   },

   // Choi Hee-jin
   {
      id: 'r12',
      assignedMemberId: 'm10',
      studentId: 'm10',
      title: '경기도 농촌지역의 의료서비스 접근성 분석: 잠재적 접근성과 실제 이용 패턴의 비교',
      type: ResearchType.NewResearch,
      status: ResearchStatus.Preparing,
      progress: 10,
      stages: generateStages(1),
      authors: [{ id: 'a1', name: '최희진', role: '1저자', responsibilities: [], order: 1 }],
      deadline: '2025-12-31'
   },
   // Bae Sung-hoon
   {
      id: 'r13',
      assignedMemberId: 'm12',
      studentId: 'm12',
      title: '여주시 다른 방법론 적용 논문',
      type: ResearchType.NewResearch,
      status: ResearchStatus.Preparing,
      progress: 5,
      stages: generateStages(0),
      authors: [{ id: 'a1', name: '배성훈', role: '1저자', responsibilities: [], order: 1 }],
      deadline: '2025-12-31'
   },
   // Lee Eun-jin
   {
      id: 'r14',
      assignedMemberId: 'm11',
      studentId: 'm11',
      title: '학위논문',
      type: ResearchType.Thesis,
      status: ResearchStatus.Preparing,
      progress: 0,
      stages: generateStages(0),
      authors: [{ id: 'a1', name: '이은진', role: '1저자', responsibilities: [], order: 1 }],
      deadline: '2027-02-28'
   },

   // ------------------------------------------------------------------
   // DETAILED ADDITIONS (User Request 2024-12-23)
   // ------------------------------------------------------------------

   // Lee Da-yeon (m4) - Research 1
   {
      id: 'r30',
      assignedMemberId: 'm4',
      studentId: 'm4',
      title: '개인 추천 경로 분석 (SP 검증)',
      type: ResearchType.NewResearch,
      status: ResearchStatus.Preparing,
      progress: 20,
      stages: generateStages(2),
      authors: [{ id: 'a1', name: '이다연', role: '1저자', responsibilities: [], order: 1 }],
      deadline: '2025-08-31',
      activityLog: [
          { id: 'al1', date: '2024-12-20', content: '데이터: 스트리트런 (맨하탄, 피츠버그) 활용 결정', type: 'log' },
          { id: 'al2', date: '2024-12-22', content: '방법론: Stated Preferences(SP) 조사 검증 채택 (단순 설문조사 한계 극복, 교통 분야 투고 고려)', type: 'milestone' },
          { id: 'al3', date: '2024-12-22', content: 'Gap: GSV 대비 화질 우수성 강조 및 SP 검증 차별화 전략 수립', type: 'log' }
      ]
   },
   // Lee Da-yeon (m4) - Research 2
   {
      id: 'r31',
      assignedMemberId: 'm4',
      studentId: 'm4',
      title: '픽셀 기반 vs LLM 기반 분석',
      type: ResearchType.NewResearch,
      status: ResearchStatus.Preparing,
      progress: 15,
      stages: generateStages(1),
      authors: [{ id: 'a1', name: '이다연', role: '1저자', responsibilities: [], order: 1 }],
      deadline: '2025-10-15',
      activityLog: [
          { id: 'al1', date: '2024-12-20', content: '목적: 픽셀 기반(정량) vs LLM 기반(정성/맥락) 분석 비교', type: 'log' },
          { id: 'al2', date: '2024-12-22', content: '방법: VLM (GPT-4V, LLaVA) 활용하여 이미지 -> 텍스트 설명 생성', type: 'milestone' },
          { id: 'al3', date: '2024-12-22', content: '가설: 픽셀 비율은 "쾌적함의 이유"나 "맥락적 정보(관리상태, 그늘 등)"를 설명하지 못하는 한계 존재', type: 'log' }
      ]
   },

   // Lee Ji-yoon (m3)
   {
      id: 'r32',
      assignedMemberId: 'm3',
      studentId: 'm3',
      title: '매력도 기반 Multi-modal 3SFCA를 활용한 서울시 공원 접근성 형평성 평가',
      type: ResearchType.NewResearch,
      status: ResearchStatus.Preparing,
      progress: 10,
      stages: generateStages(1),
      authors: [{ id: 'a1', name: '이지윤', role: '1저자', responsibilities: [], order: 1 }],
      deadline: '2025-11-30'
   },

   // Kim Eun-sol (m5) - New Submitting Paper
   {
      id: 'r33',
      assignedMemberId: 'm5',
      studentId: 'm5',
      title: '광역-기초-생활권을 연계한 경기도 농촌공간 다층적 유형화 모델 개발',
      type: ResearchType.Submission,
      status: ResearchStatus.Submitting,
      statusTag: 'Under Review',
      progress: 90,
      targetJournal: 'Journal of Rural Studies',
      stages: generateStages(7),
      authors: [{ id: 'a1', name: '김은솔', role: '1저자', responsibilities: [], order: 1 }],
      deadline: '2025-02-28'
   }
];

export const INITIAL_PROJECTS: LabProject[] = [
  {
    id: 'p1',
    title: '제주 농촌공간 재구조화 및 재생 사업 추진체계 구축 및 성과지표 개발 연구용역',
    period: '2025.09 - 2025.12',
    fundingSource: '제주특별자치도',
    status: 'Active'
  },
  {
    id: 'p2',
    title: '공원-비공원 녹지의 통합 평가체계 구축과 형평성 기반 정책 지원 시스템 개발',
    period: '2025.03 - 2028.02',
    fundingSource: '한국연구재단(우수신진연구)',
    status: 'Active'
  }
];

export const INITIAL_EVENTS: CalendarEvent[] = [
  {
    id: 'e1',
    title: '전체 랩 미팅',
    startTime: new Date(today.getFullYear(), today.getMonth(), 20, 10, 0).toISOString(),
    endTime: new Date(today.getFullYear(), today.getMonth(), 20, 11, 30).toISOString(),
    categoryId: 'c1',
    description: '주간 진행상황 점검',
    participantIds: INITIAL_MEMBERS.map(m => m.id)
  }
];

export const INITIAL_MEETINGS: MeetingLog[] = [
  {
    id: 'mt1',
    date: '2024-12-18',
    attendeeIds: ['m5'],
    content: '모델 성능 개선 완료. Overfitting 해결.',
    actionItems: '1. 논문 수정\n2. 그래프 업데이트',
    relatedResearchId: 'r11',
    authorId: 'm5',
    likes: [],
    comments: []
  }
];

export const MOCK_USERS: any[] = [
  {
    id: 'admin_1',
    email: 'prof.lee@uos.ac.kr',
    password: 'justdoit',
    name: '이재호',
    role: 'admin',
    status: 'active',
    photoUrl: '/images/lee_jae_ho.png'
  }
];