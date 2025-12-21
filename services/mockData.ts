import { Member, MemberRole, MemberStatus, ResearchRecord, ResearchType, ResearchStatus, MeetingLog, CalendarEvent, Category, LabProject } from '../types';

const today = new Date();

// Initial Categories (Korean)
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

// Initial Members - Matching the Image
export const INITIAL_MEMBERS: Member[] = [
  // Post-Doc
  {
    id: 'm1',
    name: '강성익', // Corrected Name
    role: MemberRole.PostDoc,
    email: 'namugnel@naver.com',
    photoUrl: '/images/강성익.png',
    admissionDate: '2023-03-01',
    expectedGraduation: '2025-02-28',
    status: MemberStatus.Active,
    researchInterests: '도시불평등, 사회적 혼합공동체, 공중보건'
  },
  {
    id: 'm2',
    name: '오재인',
    role: MemberRole.PostDoc,
    email: 'ojikch79@gmail.com',
    photoUrl: '/images/오재인.png',
    admissionDate: '2023-03-01',
    expectedGraduation: '2025-02-28',
    status: MemberStatus.Active,
    researchInterests: '그린 젠트리피케이션, 공원 이용 패턴 분석, 열 취약성 분석'
  },

  // PhD
  {
    id: 'm5',
    name: '김은솔',
    role: MemberRole.PhD,
    email: 'rdt9690@uos.ac.kr',
    photoUrl: '/images/김은솔.png',
    admissionDate: '2021-03-01',
    expectedGraduation: '2025-08-31',
    status: MemberStatus.Active,
    researchInterests: '농촌공간계획, 주민수용성'
  },
  {
    id: 'm3',
    name: '이지윤',
    role: MemberRole.PhD,
    email: 'jiyunlee41016@uos.ac.kr',
    photoUrl: '/images/이지윤.png',
    admissionDate: '2024-03-01',
    expectedGraduation: '2026-02-28',
    status: MemberStatus.Active,
    researchInterests: '공원 접근성, 형평성'
  },
  {
    id: 'm9',
    name: '권기덕',
    role: MemberRole.PhD,
    email: '-',
    photoUrl: '/images/권기덕.png',
    admissionDate: '2024-03-01',
    expectedGraduation: '2026-02-28',
    status: MemberStatus.Active,
    label: '시간제',
    researchInterests: '지역활성화, 농촌재구조화'
  },

  // MS Researcher (Seoksa-hoo)
  {
    id: 'm4',
    name: '이다연',
    role: MemberRole.Researcher,
    email: 'dayeon34@uos.ac.kr',
    photoUrl: '/images/이다연.png',
    admissionDate: '2022-03-01',
    expectedGraduation: '2026-02-28',
    status: MemberStatus.Active,
    researchInterests: '데이터 기반 조경계획, 딥러닝'
  },

  // MS
  {
    id: 'm6',
    name: '최희진',
    role: MemberRole.MS,
    email: 'heejin02@uos.ac.kr',
    photoUrl: '/images/최희진.png',
    admissionDate: '2024-03-01',
    expectedGraduation: '2026-02-28',
    status: MemberStatus.Active,
    researchInterests: '마을재생, 문화기반 활성화'
  },
  {
    id: 'm8',
    name: '이은진',
    role: MemberRole.MS,
    email: 'jinnieel@uos.ac.kr',
    photoUrl: '/images/이은진.png',
    admissionDate: '2024-03-01',
    expectedGraduation: '2026-02-28',
    status: MemberStatus.Active,
    researchInterests: '스마트 마을재생, 지역 활성화'
  },
  {
    id: 'm11',
    name: '지인섭',
    role: MemberRole.MS,
    email: '-',
    photoUrl: '/images/지인섭.png',
    admissionDate: '2024-03-01',
    expectedGraduation: '2026-02-28',
    status: MemberStatus.Active,
    label: '시간제',
    researchInterests: '농촌공간 재구조화'
  },
  {
    id: 'm7',
    name: '배성훈',
    role: MemberRole.MS,
    email: 'sungaeae@uos.ac.kr',
    photoUrl: '/images/배성훈.png',
    admissionDate: '2023-09-01',
    expectedGraduation: '2025-08-31',
    status: MemberStatus.Active,
    label: '학석사연계',
    researchInterests: '지방소멸, 농촌 재생'
  }
];

// Initial Research Records
export const INITIAL_RESEARCH: ResearchRecord[] = [
  // Kang Sung-ik
  { id: 'r1', assignedMemberId: 'm1', title: '비공원 녹지 포함 도시 재개발 사업에 의한 서울시 공원녹지 시계열 접근성 변화 분석', type: ResearchType.NewResearch, status: ResearchStatus.Preparing, progress: 20, description: 'Analysis of time-series accessibility changes in Seoul park greenery due to urban redevelopment projects.' },
  { id: 'r2', assignedMemberId: 'm1', title: 'Bidirectional Associations Between Relative Deprivation and Health Outcomes', type: ResearchType.Individual, status: ResearchStatus.Submitting, progress: 80, targetJournal: 'Health & Place' },

  // Oh Jae-in
  { id: 'r3', assignedMemberId: 'm2', title: '고령층의 주요 공원 대중교통 접근성 다차원 분석', type: ResearchType.NewResearch, status: ResearchStatus.Preparing, progress: 15, description: 'Multi-dimensional analysis of public transport accessibility to major parks for the elderly.' },
  { id: 'r3', assignedMemberId: 'm2', title: '고령층의 주요 공원 대중교통 접근성 다차원 분석', type: ResearchType.NewResearch, status: ResearchStatus.Preparing, progress: 15, description: 'Multi-dimensional analysis of public transport accessibility to major parks for the elderly.', checklist: [], reviewChecklist: [] },
  { id: 'r4', assignedMemberId: 'm2', title: 'Heat Island Research', type: ResearchType.Individual, status: ResearchStatus.UnderReview, progress: 90, checklist: [], reviewChecklist: [] },

  // Lee Ji-yoon
  { id: 'r5', assignedMemberId: 'm3', title: '매력도 기반 Multi-modal 3SFCA를 활용한 서울시 공원 접근성 형평성 평가', type: ResearchType.NewResearch, status: ResearchStatus.Preparing, progress: 10, description: 'Equity evaluation of park accessibility in Seoul using Attractiveness-based Multi-modal 3SFCA.', checklist: [], reviewChecklist: [] },

  // Lee Da-yeon
  { id: 'r6', assignedMemberId: 'm4', title: 'CEUS Paper Revision', type: ResearchType.Modification, status: ResearchStatus.Submitting, progress: 95, checklist: [], reviewChecklist: [] },
  { id: 'r7', assignedMemberId: 'm4', title: 'Yeoju Paper', type: ResearchType.Individual, status: ResearchStatus.Preparing, progress: 40, checklist: [], reviewChecklist: [] },
  { id: 'r8', assignedMemberId: 'm4', title: 'Route Analysis (SP)', type: ResearchType.Individual, status: ResearchStatus.UnderReview, progress: 85, checklist: [], reviewChecklist: [] },
  { id: 'r9', assignedMemberId: 'm4', title: 'LLM Analysis', type: ResearchType.Individual, status: ResearchStatus.Preparing, progress: 5, description: 'LLM-based analysis vs Traditional methods', checklist: [], reviewChecklist: [] },

  // Kim Eun-sol
  { id: 'r10', assignedMemberId: 'm5', title: 'PhD Lit Review', type: ResearchType.Thesis, status: ResearchStatus.Preparing, progress: 30, checklist: [], reviewChecklist: [] },
  { id: 'r11', assignedMemberId: 'm5', title: '농촌 태양광 발전 사업의 주민 수용성 결정 요인 연구', type: ResearchType.Submission, status: ResearchStatus.Submitting, progress: 88, deadline: '2024-06-30', checklist: [], reviewChecklist: [] },
  { id: 'r12', assignedMemberId: 'm5', title: '광역-기초-생활권을 연계한 경기도 농촌공간 다층적 유형화 모델 개발', type: ResearchType.Submission, status: ResearchStatus.Submitting, progress: 90, checklist: [], reviewChecklist: [] },

  // Choi Hee-jin
  { id: 'r13', assignedMemberId: 'm6', title: '경기도 농촌지역의 의료서비스 접근성 분석', type: ResearchType.Thesis, status: ResearchStatus.Preparing, progress: 25, description: 'Comparing potential accessibility and actual usage patterns.', checklist: [], reviewChecklist: [] },

  // Bae Sung-hoon
  { id: 'r14', assignedMemberId: 'm7', title: 'Yeoju Data Paper', type: ResearchType.Individual, status: ResearchStatus.Preparing, progress: 45, checklist: [], reviewChecklist: [] },

  // Lee Eun-jin
  { id: 'r15', assignedMemberId: 'm8', title: 'Topic Selection', type: ResearchType.Thesis, status: ResearchStatus.Preparing, progress: 5 },
];

export const INITIAL_PROJECTS: LabProject[] = [
  {
    id: 'p1',
    title: '제주 농촌공간 재구조화 및 재생 사업 추진체계 구축 및 성과지표 개발 연구용역',
    period: '2025.09 - 2025.12',
    fundingSource: '제주특별자치도',
    description: 'Establishment of implementation system and development of performance indicators for Jeju rural space restructuring and regeneration project.',
    status: 'Active'
  },
  {
    id: 'p2',
    title: '공원-비공원 녹지의 통합 평가체계 구축과 형평성 기반 정책 지원 시스템 개발',
    period: '2025.03 - 2028.02',
    fundingSource: '한국연구재단(우수신진연구)',
    description: 'Development of integrated evaluation system for park/non-park greenery and equity-based policy support system.',
    status: 'Active'
  }
];

export const INITIAL_EVENTS: CalendarEvent[] = [
  {
    id: 'e1',
    title: '전체 랩 미팅',
    // Set to the 20th of the current month as requested
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
    content: '모델 성능이 많이 개선되었습니다. 다만 오버피팅 이슈가 있으니 regularization 기법을 추가로 적용해보세요. 논문 관련 도표도 수정이 필요합니다.',
    actionItems: '1. Dropout 비율 조정 실험\n2. 논문 Figure 3 수정\n3. Related Work 섹션 보완',
    relatedResearchId: 'r11',
    authorId: 'm5',
    likes: [],
    comments: []
  },
  {
    id: 'mt2',
    date: '2024-12-17',
    attendeeIds: ['m2'],
    content: '데이터셋 구축 방향성이 좋습니다. 라벨링 가이드라인을 문서화해서 공유해주세요.',
    actionItems: '1. 라벨링 가이드라인 문서 작성\n2. Inter-annotator agreement 계산',
    relatedResearchId: 'r3',
    authorId: 'm2',
    likes: ['m1'],
    comments: [
      {
        id: 'cm1',
        authorId: 'm1',
        content: '가이드라인 공유해주시면 저도 참고하겠습니다!',
        date: '2024-12-17 18:30'
      }
    ]
  }
];

// Mock Users for Auth
export const MOCK_USERS: any[] = [
  {
    id: 'admin_1',
    email: 'prof.lee@uos.ac.kr',
    name: '이재호',
    role: 'admin',
    status: 'active',
    photoUrl: '/images/이재호.png'
  },
  // All members as users for demo purposes
  ...INITIAL_MEMBERS.map(m => ({
    id: m.id,
    email: m.email,
    name: m.name,
    photoUrl: m.photoUrl,
    role: 'user',
    status: 'active'
  }))
];