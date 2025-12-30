import fs from 'fs';

const path = 'C:/dev/sdclab-dashboard/src/app/(dashboard)/members/[id]/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Update the canEdit section to track isAdmin and currentUserId
const oldAuth = `  // 현재 로그인한 사용자 확인
  const { data: { user } } = await supabase.auth.getUser();
  let canEdit = false;

  if (user) {
    const { data: currentMember } = await supabase
      .from("members")
      .select("id, position")
      .eq("id", user.id)
      .single() as { data: { id: string; position: string } | null };

    if (currentMember) {
      const isAdmin = currentMember.position === "professor";
      const isOwner = currentMember.id === id;
      canEdit = isAdmin || isOwner;
    }
  }`;

const newAuth = `  // 현재 로그인한 사용자 확인
  const { data: { user } } = await supabase.auth.getUser();
  let canEdit = false;
  let isAdmin = false;
  let currentUserId: string | null = null;

  if (user) {
    currentUserId = user.id;
    const { data: currentMember } = await supabase
      .from("members")
      .select("id, position")
      .eq("id", user.id)
      .single() as { data: { id: string; position: string } | null };

    if (currentMember) {
      isAdmin = currentMember.position === "professor";
      const isOwner = currentMember.id === id;
      canEdit = isAdmin || isOwner;
    }
  }`;

content = content.replace(oldAuth, newAuth);

// 2. Update project query to include created_by
const oldProjectQuery = `  // 참여 프로젝트 조회
  const { data: projectMembers } = await supabase
    .from("project_members")
    .select(
      \`
      role,
      research_projects (
        id,
        title,
        status,
        overall_progress
      )
    \`
    )
    .eq("member_id", id);`;

const newProjectQuery = `  // 참여 프로젝트 조회
  const { data: projectMembers } = await supabase
    .from("project_members")
    .select(
      \`
      role,
      research_projects (
        id,
        title,
        status,
        overall_progress,
        created_by
      )
    \`
    )
    .eq("member_id", id);`;

content = content.replace(oldProjectQuery, newProjectQuery);

// 3. Update project type
const oldType = `  const projectList = (projectMembers || []) as Array<{
    role: string;
    research_projects: {
      id: string;
      title: string;
      status: string;
      overall_progress: number;
    } | null;
  }>;`;

const newType = `  const projectList = (projectMembers || []) as Array<{
    role: string;
    research_projects: {
      id: string;
      title: string;
      status: string;
      overall_progress: number;
      created_by: string;
    } | null;
  }>;`;

content = content.replace(oldType, newType);

// 4. Update Research Articles card header
const oldResearchHeader = `        {/* Research Articles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Research Articles
            </CardTitle>
          </CardHeader>`;

const newResearchHeader = `        {/* Research Articles */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Research Articles
            </CardTitle>
            {canEdit && (
              <Link href="/research/new">
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  새 프로젝트
                </Button>
              </Link>
            )}
          </CardHeader>`;

content = content.replace(oldResearchHeader, newResearchHeader);

// 5. Update project item to include delete button
const oldProjectItem = `                  <Link
                    key={index}
                    href={\`/research/\${project.id}\`}
                    className="block"
                  >
                    <div className="p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium truncate flex-1">
                          {project.title}
                        </h4>
                        <Badge variant="outline" className="ml-2 shrink-0">
                          {getRoleLabel(pm.role)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {getProjectStatusLabel(project.status)}
                        </Badge>
                        <div className="flex-1">
                          <Progress
                            value={project.overall_progress}
                            className="h-2"
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {project.overall_progress}%
                        </span>
                      </div>
                    </div>
                  </Link>`;

const newProjectItem = `                  <div
                    key={index}
                    className="p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Link href={\`/research/\${project.id}\`} className="flex-1 min-w-0">
                        <h4 className="font-medium truncate hover:text-primary transition-colors">
                          {project.title}
                        </h4>
                      </Link>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="outline">
                          {getRoleLabel(pm.role)}
                        </Badge>
                        {(isAdmin || project.created_by === currentUserId) && (
                          <DeleteProjectButton
                            projectId={project.id}
                            projectTitle={project.title}
                            redirectPath={\`/members/\${id}\`}
                          />
                        )}
                      </div>
                    </div>
                    <Link href={\`/research/\${project.id}\`}>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {getProjectStatusLabel(project.status)}
                        </Badge>
                        <div className="flex-1">
                          <Progress
                            value={project.overall_progress}
                            className="h-2"
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {project.overall_progress}%
                        </span>
                      </div>
                    </Link>
                  </div>`;

content = content.replace(oldProjectItem, newProjectItem);

fs.writeFileSync(path, content, 'utf8');
console.log('Member page updated successfully');
