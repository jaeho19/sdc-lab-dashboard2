import fs from 'fs';

const path = 'C:/dev/sdclab-dashboard/src/lib/actions/research.ts';
let content = fs.readFileSync(path, 'utf8');

// Find and replace the simple delete with cascading delete
const simpleDelete = `  const { error } = await supabase
    .from("research_projects")
    .delete()
    .eq("id", id);

  if (error) {
    return { error: "프로젝트 삭제 중 오류가 발생했습니다." };
  }

  revalidatePath("/research");`;

const cascadingDelete = `  // 1. 프로젝트 멤버 삭제
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

  revalidatePath("/research");`;

if (content.includes(simpleDelete)) {
  content = content.replace(simpleDelete, cascadingDelete);
  fs.writeFileSync(path, content, 'utf8');
  console.log('Successfully updated deleteProject function with cascading delete');
} else if (content.includes('// 1. 프로젝트 멤버 삭제')) {
  console.log('Delete function already updated with cascading delete');
} else {
  console.log('Could not find the exact code to replace.');
  console.log('Attempting line-by-line search...');

  // Check if the simple version exists at all
  if (content.includes('.from("research_projects")') &&
      content.includes('.delete()') &&
      !content.includes('// 1. 프로젝트 멤버 삭제')) {
    console.log('Found research_projects delete but not cascading. Manual edit may be needed.');
  }
}
