import fs from 'fs';

const path = 'C:/dev/sdclab-dashboard/src/lib/actions/research.ts';
let content = fs.readFileSync(path, 'utf8');

const oldCode = `  // 관리자 또는 생성자만 삭제 가능
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

const newCode = `  // 관리자 또는 생성자만 삭제 가능
  if (!isAdmin && !isCreator) {
    return { error: "프로젝트를 삭제할 권한이 없습니다." };
  }

  // 1. 프로젝트 멤버 삭제
  await supabase
    .from("project_members")
    .delete()
    .eq("project_id", id);

  // 2. 마일스톤 조회 및 체크리스트 삭제
  const { data: milestones } = await supabase
    .from("milestones")
    .select("id")
    .eq("project_id", id);

  if (milestones && milestones.length > 0) {
    for (const milestone of milestones as { id: string }[]) {
      await supabase
        .from("checklist_items")
        .delete()
        .eq("milestone_id", milestone.id);
    }
  }

  // 3. 마일스톤 삭제
  await supabase
    .from("milestones")
    .delete()
    .eq("project_id", id);

  // 4. 주간 목표 삭제
  await supabase
    .from("weekly_goals")
    .delete()
    .eq("project_id", id);

  // 5. 저자 정보 삭제
  await supabase
    .from("project_authors")
    .delete()
    .eq("project_id", id);

  // 6. 프로젝트 삭제
  const { error } = await supabase
    .from("research_projects")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Project deletion error:", error);
    return { error: "프로젝트 삭제 중 오류가 발생했습니다." };
  }

  revalidatePath("/research");
  if (redirectPath) {
    redirect(redirectPath);
  } else {
    redirect("/research");
  }
}`;

if (content.includes(oldCode)) {
  content = content.replace(oldCode, newCode);
  fs.writeFileSync(path, content, 'utf8');
  console.log('Successfully updated deleteProject function');
} else {
  console.log('Could not find the code to replace. It may have already been updated.');
  // Show current deleteProject function
  const match = content.match(/\/\/ 프로젝트 삭제[\s\S]*?(?=\/\/ 체크리스트 항목 토글)/);
  if (match) {
    console.log('Current deleteProject function:');
    console.log(match[0].substring(0, 500) + '...');
  }
}
