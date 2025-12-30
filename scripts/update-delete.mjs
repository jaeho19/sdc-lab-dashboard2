import fs from 'fs';

const path = 'C:/dev/sdclab-dashboard/src/lib/actions/research.ts';
let content = fs.readFileSync(path, 'utf8');

const oldDeleteFunction = `// 프로젝트 삭제
export async function deleteProject(id: string): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  // 관리자 권한 확인
  const { data: member } = await supabase
    .from("members")
    .select("position")
    .eq("id", user.id)
    .single();

  const memberData = member as { position: string } | null;

  if (!memberData || memberData.position !== "professor") {
    return { error: "관리자 권한이 필요합니다." };
  }

  const { error } = await supabase
    .from("research_projects")
    .delete()
    .eq("id", id);

  if (error) {
    return { error: "프로젝트 삭제 중 오류가 발생했습니다." };
  }

  revalidatePath("/research");
  redirect("/research");
}`;

const newDeleteFunction = `// 프로젝트 삭제 (관리자 또는 프로젝트 생성자)
export async function deleteProject(id: string, redirectPath?: string): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  // 현재 사용자 정보 조회
  const { data: member } = await supabase
    .from("members")
    .select("position")
    .eq("id", user.id)
    .single();

  const memberData = member as { position: string } | null;

  if (!memberData) {
    return { error: "연구원 정보를 찾을 수 없습니다." };
  }

  const isAdmin = memberData.position === "professor";

  // 프로젝트 생성자 확인
  const { data: project } = await supabase
    .from("research_projects")
    .select("created_by")
    .eq("id", id)
    .single();

  const projectData = project as { created_by: string } | null;
  const isCreator = projectData?.created_by === user.id;

  // 관리자 또는 생성자만 삭제 가능
  if (!isAdmin && !isCreator) {
    return { error: "프로젝트를 삭제할 권한이 없습니다." };
  }

  const { error } = await supabase
    .from("research_projects")
    .delete()
    .eq("id", id);

  if (error) {
    return { error: "프로젝트 삭제 중 오류가 발생했습니다." };
  }

  revalidatePath("/research");
  if (redirectPath) {
    redirect(redirectPath);
  } else {
    redirect("/research");
  }
}`;

if (content.includes(oldDeleteFunction)) {
  content = content.replace(oldDeleteFunction, newDeleteFunction);
  fs.writeFileSync(path, content, 'utf8');
  console.log('Delete function updated successfully');
} else {
  console.log('Old delete function not found - may have been modified');
}
