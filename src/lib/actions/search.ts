"use server";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

export interface SearchResult {
  type: "member" | "project" | "mentoring";
  id: string;
  title: string;
  subtitle?: string;
  href: string;
}

type Member = Database["public"]["Tables"]["members"]["Row"];
type Project = Database["public"]["Tables"]["research_projects"]["Row"];
type MentoringPost = Database["public"]["Tables"]["mentoring_posts"]["Row"];

export async function globalSearch(query: string): Promise<SearchResult[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const supabase = await createClient();
  const searchTerm = `%${query.trim()}%`;
  const results: SearchResult[] = [];

  // Search members
  const { data: members } = await supabase
    .from("members")
    .select("id, name, email, position")
    .eq("status", "active")
    .ilike("name", searchTerm)
    .limit(5);

  if (members) {
    for (const member of members as Pick<Member, "id" | "name" | "email" | "position">[]) {
      results.push({
        type: "member",
        id: member.id,
        title: member.name,
        subtitle: member.position || member.email,
        href: `/members/${member.id}`,
      });
    }
  }

  // Search projects
  const { data: projects } = await supabase
    .from("research_projects")
    .select("id, title, target_journal, status")
    .ilike("title", searchTerm)
    .limit(5);

  if (projects) {
    for (const project of projects as Pick<Project, "id" | "title" | "target_journal" | "status">[]) {
      results.push({
        type: "project",
        id: project.id,
        title: project.title,
        subtitle: project.target_journal || project.status,
        href: `/research/${project.id}`,
      });
    }
  }

  // Search mentoring posts
  const { data: posts } = await supabase
    .from("mentoring_posts")
    .select("id, content, meeting_date")
    .ilike("content", searchTerm)
    .limit(5);

  if (posts) {
    for (const post of posts as Pick<MentoringPost, "id" | "content" | "meeting_date">[]) {
      const contentPreview = post.content.length > 50
        ? post.content.substring(0, 50) + "..."
        : post.content;
      results.push({
        type: "mentoring",
        id: post.id,
        title: `멘토링 (${post.meeting_date})`,
        subtitle: contentPreview,
        href: `/mentoring/${post.id}`,
      });
    }
  }

  return results;
}
