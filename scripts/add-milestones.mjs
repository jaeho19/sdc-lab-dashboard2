import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://vkqeejqbyvcpxrqqshbu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrcWVlanFieXZjcHhycXFzaGJ1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjgxMzkyMSwiZXhwIjoyMDgyMzg5OTIxfQ.t3ks4W4XtlVzHfzPwN5rNixD3FaG8kwT-NP0x4-ESUM'
);

// 6단계 마일스톤 정의 (실제 DB 스키마에 맞춤: title, order_index)
const MILESTONE_STAGES = [
  {
    title: "문헌조사",
    weight: 15,
    checklist: [
      "주요 키워드 검색 (Google Scholar, DBpia)",
      "관련 핵심 논문 10편 선정",
      "기존 연구 한계점 도출",
      "연구 차별성 확보",
    ],
  },
  {
    title: "방법론 설계",
    weight: 15,
    checklist: [
      "연구 가설 설정",
      "변수 정의 및 측정 방법 결정",
      "분석 모형(알고리즘) 선정",
      "데이터 확보 계획 수립",
    ],
  },
  {
    title: "데이터 수집",
    weight: 15,
    checklist: [
      "공공데이터 포털 데이터 확보",
      "데이터 전처리 및 정제",
      "결측치 및 이상치 처리",
      "데이터 구조화 완료",
    ],
  },
  {
    title: "분석",
    weight: 25,
    checklist: [
      "기초 통계 분석",
      "시각화 수행",
      "가설 검증 / 모델 학습",
      "분석 결과 해석",
    ],
  },
  {
    title: "초고 작성",
    weight: 20,
    checklist: [
      "서론 및 이론적 배경 작성",
      "연구 방법 기술",
      "분석 결과 정리",
      "결론 및 시사점 도출",
    ],
  },
  {
    title: "투고",
    weight: 10,
    checklist: [
      "타겟 저널 포맷팅 (Author Guidelines)",
      "Cover Letter 작성",
      "Manuscript 제출",
      "심사료 납부",
    ],
  },
];

async function addMilestonesToProjects() {
  // 모든 프로젝트 조회
  const { data: projects, error: projectError } = await supabase
    .from('research_projects')
    .select('id, title');

  if (projectError) {
    console.error('프로젝트 조회 오류:', projectError);
    return;
  }

  console.log(`총 ${projects.length}개 프로젝트에 마일스톤 추가 시작...`);

  for (const project of projects) {
    console.log(`\n처리 중: ${project.title}`);

    // 기존 마일스톤 확인
    const { data: existingMilestones } = await supabase
      .from('milestones')
      .select('id')
      .eq('project_id', project.id);

    if (existingMilestones && existingMilestones.length > 0) {
      console.log(`  -> 이미 마일스톤 존재, 스킵`);
      continue;
    }

    // 6단계 마일스톤 생성
    for (let i = 0; i < MILESTONE_STAGES.length; i++) {
      const stage = MILESTONE_STAGES[i];

      // 실제 DB 스키마에 맞는 컬럼 사용: title, order_index, weight, progress
      const { data: milestone, error: milestoneError } = await supabase
        .from('milestones')
        .insert({
          project_id: project.id,
          title: stage.title,
          weight: stage.weight,
          order_index: i + 1,
          progress: 0,
        })
        .select()
        .single();

      if (milestoneError) {
        console.error(`  마일스톤 생성 오류 (${stage.title}):`, milestoneError);
        continue;
      }

      console.log(`  -> ${stage.title} 마일스톤 생성 완료`);

      // 체크리스트 항목 생성 (order_index 사용)
      const checklistItems = stage.checklist.map((content, index) => ({
        milestone_id: milestone.id,
        content,
        is_completed: false,
        order_index: index + 1,
      }));

      const { error: checklistError } = await supabase
        .from('checklist_items')
        .insert(checklistItems);

      if (checklistError) {
        console.error(`  체크리스트 생성 오류:`, checklistError);
      } else {
        console.log(`     -> ${stage.checklist.length}개 체크리스트 항목 추가`);
      }
    }
  }

  // 결과 확인
  const { data: finalMilestones } = await supabase.from('milestones').select('id');
  const { data: finalChecklist } = await supabase.from('checklist_items').select('id');

  console.log(`\n=== 완료 ===`);
  console.log(`총 마일스톤: ${finalMilestones?.length || 0}개`);
  console.log(`총 체크리스트 항목: ${finalChecklist?.length || 0}개`);
}

addMilestonesToProjects();
