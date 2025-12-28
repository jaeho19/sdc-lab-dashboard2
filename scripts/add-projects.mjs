// SDC Lab - 연구 프로젝트 초기 데이터 삽입 스크립트
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// .env.local 파일에서 환경 변수 로드
function loadEnv() {
  try {
    const envPath = resolve(__dirname, "../.env.local");
    const envContent = readFileSync(envPath, "utf-8");
    const lines = envContent.split("\n");

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const [key, ...valueParts] = trimmed.split("=");
        const value = valueParts.join("=").replace(/^["']|["']$/g, "");
        process.env[key] = value;
      }
    }
  } catch (error) {
    console.error(".env.local 파일을 찾을 수 없습니다.");
  }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("환경 변수가 설정되지 않았습니다.");
  console.error("NEXT_PUBLIC_SUPABASE_URL과 SUPABASE_SERVICE_ROLE_KEY를 확인하세요.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 연구원 이름으로 ID 찾기
async function getMemberId(name) {
  const { data, error } = await supabase
    .from("members")
    .select("id")
    .eq("name", name)
    .single();

  if (error) {
    console.warn(`연구원 "${name}"을(를) 찾을 수 없습니다.`);
    return null;
  }
  return data.id;
}

// 카테고리 매핑 (DB에 맞게)
// DB 카테고리: thesis, submission, revision, individual, grant, other
const categoryMap = {
  grant: "grant",
  individual: "individual",
  revision: "revision",
  thesis: "thesis",
  submission: "submission",
};

// 프로젝트 데이터 정의
const projectsData = [
  // 강성익 프로젝트
  {
    title: "비공원 녹지 포함 도시 재개발 사업에 의한 서울시 공원녹지 시계열 접근성 변화 분석",
    description: "#신진연구",
    category: "grant",
    status: "preparing",
    overall_progress: 35,
    members: [{ name: "강성익", role: "first_author" }],
  },
  {
    title: "Bidirectional Associations Between Relative Deprivation and Health Outcomes: The Mediating Role of Self-Efficacy in a Korean Longitudinal Study",
    description: "#개별연구",
    category: "individual",
    status: "submitting",
    overall_progress: 85,
    members: [{ name: "강성익", role: "first_author" }],
  },

  // 오재인 프로젝트
  {
    title: "고령층의 주요 공원 대중교통 접근성 다차원 분석_물리적·경제적·편의적 접근성 반영 통합 접근성 평가 및 버스 무료 정책 시행 시 통합 접근성 개선지역 분석",
    description: "#신진연구",
    category: "grant",
    status: "preparing",
    overall_progress: 40,
    members: [{ name: "오재인", role: "first_author" }],
  },
  {
    title: "Heat Island Research: Urban Geometry Impacts",
    description: "#개별연구",
    category: "individual",
    status: "accepted",
    overall_progress: 100,
    members: [{ name: "오재인", role: "first_author" }],
  },

  // 이지윤 프로젝트
  {
    title: "매력도 기반 Multi-modal 3SFCA를 활용한 서울시 공원 접근성 형평성 평가",
    description: "#신진연구",
    category: "grant",
    status: "preparing",
    overall_progress: 60,
    members: [{ name: "이지윤", role: "first_author" }],
  },

  // 이다연 프로젝트
  {
    title: "CEUS Paper Revision: Spatial Optimization",
    description: "#논문수정",
    category: "revision",
    status: "preparing",
    overall_progress: 65,
    members: [{ name: "이다연", role: "first_author" }],
  },
  {
    title: "여주시 논문",
    description: "#개별연구",
    category: "individual",
    status: "preparing",
    overall_progress: 20,
    members: [{ name: "이다연", role: "first_author" }],
  },
  {
    title: "추천 경로 분석 (SP 검증)",
    description: "#개별연구",
    category: "individual",
    status: "preparing",
    overall_progress: 15,
    members: [{ name: "이다연", role: "first_author" }],
  },
  {
    title: "기반 vs LLM 기반 분석",
    description: "#개별연구",
    category: "individual",
    status: "preparing",
    overall_progress: 10,
    members: [{ name: "이다연", role: "first_author" }],
  },

  // 김은솔 프로젝트
  {
    title: "박사학위논문 literature review",
    description: "#학위논문",
    category: "thesis",
    status: "preparing",
    overall_progress: 30,
    members: [{ name: "김은솔", role: "first_author" }],
  },
  {
    title: "농촌 태양광 발전 사업의 주민 수용성 결정 요인 연구",
    description: "#논문투고",
    category: "submission",
    status: "submitting",
    overall_progress: 80,
    members: [{ name: "김은솔", role: "first_author" }],
  },
  {
    title: "광역-기초-생활권을 연계한 경기도 농촌공간 다층적 유형화 모델 개발",
    description: "#논문투고",
    category: "submission",
    status: "submitting",
    overall_progress: 75,
    members: [{ name: "김은솔", role: "first_author" }],
  },

  // 최희진 프로젝트
  {
    title: "경기도 농촌지역의 의료서비스 접근성 분석: 잠재적 접근성과 실제 이용 패턴의 비교",
    description: "#학위논문",
    category: "thesis",
    status: "preparing",
    overall_progress: 10,
    members: [{ name: "최희진", role: "first_author" }],
  },

  // 배성훈 프로젝트
  {
    title: "여주시 다른 방법론 적용 논문",
    description: "#개별연구",
    category: "individual",
    status: "preparing",
    overall_progress: 5,
    members: [{ name: "배성훈", role: "first_author" }],
  },

  // 이은진 프로젝트
  {
    title: "학위논문",
    description: "#학위논문",
    category: "thesis",
    status: "preparing",
    overall_progress: 0,
    members: [{ name: "이은진", role: "first_author" }],
  },
];

async function main() {
  console.log("연구 프로젝트 초기 데이터 삽입을 시작합니다...\n");

  let successCount = 0;
  let errorCount = 0;
  let skipCount = 0;

  for (const project of projectsData) {
    const { members, ...projectData } = project;

    // 중복 체크
    const { data: existing } = await supabase
      .from("research_projects")
      .select("id")
      .eq("title", project.title)
      .single();

    if (existing) {
      console.log(`⏭️  이미 존재: ${project.title.substring(0, 50)}...`);
      skipCount++;

      // 멤버 연결만 시도
      for (const member of members) {
        const memberId = await getMemberId(member.name);
        if (memberId) {
          const { error: memberError } = await supabase
            .from("project_members")
            .upsert({
              project_id: existing.id,
              member_id: memberId,
              role: member.role,
            }, { onConflict: "project_id,member_id" });

          if (!memberError) {
            console.log(`   👤 멤버 연결: ${member.name}`);
          }
        }
      }
      continue;
    }

    // 프로젝트 삽입
    const { data: insertedProject, error: projectError } = await supabase
      .from("research_projects")
      .insert(projectData)
      .select()
      .single();

    if (projectError) {
      console.error(`❌ 프로젝트 삽입 실패: ${project.title}`);
      console.error(`   오류: ${projectError.message}`);
      errorCount++;
      continue;
    }

    console.log(`✅ 프로젝트 추가: ${project.title.substring(0, 50)}...`);

    // 프로젝트 멤버 연결
    for (const member of members) {
      const memberId = await getMemberId(member.name);
      if (memberId) {
        const { error: memberError } = await supabase
          .from("project_members")
          .insert({
            project_id: insertedProject.id,
            member_id: memberId,
            role: member.role,
          });

        if (memberError) {
          console.warn(`   ⚠️ 멤버 연결 실패: ${member.name} - ${memberError.message}`);
        } else {
          console.log(`   👤 멤버 연결: ${member.name} (${member.role})`);
        }
      }
    }

    successCount++;
  }

  console.log("\n========================================");
  console.log(`완료: ${successCount}개 추가, ${skipCount}개 건너뜀, ${errorCount}개 실패`);
  console.log("========================================");
}

main().catch(console.error);
