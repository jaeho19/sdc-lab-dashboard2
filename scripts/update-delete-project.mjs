import fs from 'fs';

const path = 'C:/dev/sdclab-dashboard/src/lib/actions/research.ts';
let content = fs.readFileSync(path, 'utf8');

// Update import to include createServiceRoleClient
const oldImport = `import { createClient } from "@/lib/supabase/server";`;
const newImport = `import { createClient, createServiceRoleClient } from "@/lib/supabase/server";`;

if (!content.includes('createServiceRoleClient')) {
  content = content.replace(oldImport, newImport);
  console.log('Updated import statement');
}

// Update the deleteProject function to use service role client for deletion
const oldDeleteCode = `  // 1. 프로젝트 멤버 삭제
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
    .eq("id", id);`;

const newDeleteCode = `  // Use service role client to bypass RLS for deletion
  const adminClient = createServiceRoleClient();

  // 1. 프로젝트 멤버 삭제
  await adminClient
    .from("project_members")
    .delete()
    .eq("project_id", id);

  // 2. 마일스톤 조회 및 체크리스트 삭제
  const { data: milestones } = await adminClient
    .from("milestones")
    .select("id")
    .eq("project_id", id);

  if (milestones && milestones.length > 0) {
    for (const milestone of milestones as { id: string }[]) {
      await adminClient
        .from("checklist_items")
        .delete()
        .eq("milestone_id", milestone.id);
    }
  }

  // 3. 마일스톤 삭제
  await adminClient
    .from("milestones")
    .delete()
    .eq("project_id", id);

  // 4. 주간 목표 삭제
  await adminClient
    .from("weekly_goals")
    .delete()
    .eq("project_id", id);

  // 5. 저자 정보 삭제
  await adminClient
    .from("project_authors")
    .delete()
    .eq("project_id", id);

  // 6. 프로젝트 삭제
  const { error } = await adminClient
    .from("research_projects")
    .delete()
    .eq("id", id);`;

if (content.includes(oldDeleteCode)) {
  content = content.replace(oldDeleteCode, newDeleteCode);
  fs.writeFileSync(path, content, 'utf8');
  console.log('Successfully updated deleteProject function to use service role client');
} else if (content.includes('adminClient')) {
  console.log('Already using adminClient');
} else {
  console.log('Could not find the delete code to replace');
}
