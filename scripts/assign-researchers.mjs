import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  'https://vkqeejqbyvcpxrqqshbu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrcWVlanFieXZjcHhycXFzaGJ1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjgxMzkyMSwiZXhwIjoyMDgyMzg5OTIxfQ.t3ks4W4XtlVzHfzPwN5rNixD3FaG8kwT-NP0x4-ESUM'
);

// 프로젝트 제목 키워드 → 연구자 이름 매핑
const projectResearcherMap = [
  { titleKeyword: "비공원 녹지", researcher: "강성익" },
  { titleKeyword: "Bidirectional", researcher: "강성익" },
  { titleKeyword: "Heat Island", researcher: "오재인" },
  { titleKeyword: "농촌 태양광", researcher: "김은솔" },
  { titleKeyword: "CEUS", researcher: "이다연" },
  { titleKeyword: "경기도 농촌지역", researcher: "최희진" },
  { titleKeyword: "여주시", researcher: "배성훈" },
  { titleKeyword: "학위논문", researcher: "이은진" },
];

async function main() {
  console.log("🔍 프로젝트 및 멤버 조회 중...\n");

  // 모든 프로젝트 조회
  const { data: projects, error: projectError } = await supabase
    .from("research_projects")
    .select("id, title");

  if (projectError) {
    console.error("프로젝트 조회 실패:", projectError);
    return;
  }

  // 모든 멤버 조회
  const { data: members, error: memberError } = await supabase
    .from("members")
    .select("id, name");

  if (memberError) {
    console.error("멤버 조회 실패:", memberError);
    return;
  }

  console.log(`📁 프로젝트: ${projects.length}개`);
  console.log(`👥 멤버: ${members.length}명\n`);

  // 기존 project_members 조회
  const { data: existingMembers } = await supabase
    .from("project_members")
    .select("project_id, member_id, role");

  const existingSet = new Set(
    (existingMembers || []).map((m) => `${m.project_id}-${m.member_id}`)
  );

  let assignedCount = 0;
  let skippedCount = 0;

  for (const mapping of projectResearcherMap) {
    // 프로젝트 찾기
    const project = projects.find((p) =>
      p.title.includes(mapping.titleKeyword)
    );

    if (!project) {
      console.log(`⚠️  프로젝트를 찾을 수 없음: "${mapping.titleKeyword}"`);
      continue;
    }

    // 멤버 찾기
    const member = members.find((m) => m.name === mapping.researcher);

    if (!member) {
      console.log(`⚠️  멤버를 찾을 수 없음: "${mapping.researcher}"`);
      continue;
    }

    // 이미 할당되어 있는지 확인
    const key = `${project.id}-${member.id}`;
    if (existingSet.has(key)) {
      console.log(`⏭️  이미 할당됨: ${project.title.slice(0, 30)}... → ${member.name}`);
      skippedCount++;
      continue;
    }

    // project_members에 추가
    const { error: insertError } = await supabase
      .from("project_members")
      .insert({
        project_id: project.id,
        member_id: member.id,
        role: "first_author",
      });

    if (insertError) {
      console.error(`❌ 할당 실패: ${project.title} → ${member.name}`, insertError);
    } else {
      console.log(`✅ 할당 완료: ${project.title.slice(0, 30)}... → ${member.name}`);
      assignedCount++;
    }
  }

  console.log(`\n📊 결과: ${assignedCount}개 할당, ${skippedCount}개 건너뜀`);
}

main();
