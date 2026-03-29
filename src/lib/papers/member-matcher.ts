// =============================================
// Lab Member ↔ Paper Author Matching
// =============================================

import type { PaperAuthor } from "./types";

export interface LabMember {
  id: string;
  name: string;
  name_en: string | null;
}

interface MatchResult {
  memberId: string | null;
  matched: boolean;
}

/**
 * Check if any paper author matches a lab member.
 * Matching strategies:
 * 1. Exact name_en match (case-insensitive)
 * 2. Last name + first initial match (e.g., "J. Lee" matches "Jiyun Lee")
 * 3. Korean name match (한글 이름)
 */
export function matchLabMember(
  authors: PaperAuthor[],
  labMembers: LabMember[]
): MatchResult {
  for (const author of authors) {
    const authorNameLower = author.name.toLowerCase().trim();

    for (const member of labMembers) {
      // Strategy 1: Exact English name match
      if (member.name_en) {
        const memberNameLower = member.name_en.toLowerCase().trim();
        if (authorNameLower === memberNameLower) {
          return { memberId: member.id, matched: true };
        }

        // Strategy 2: Last-name + first-initial match
        if (matchByInitial(authorNameLower, memberNameLower)) {
          return { memberId: member.id, matched: true };
        }
      }

      // Strategy 3: Korean name match
      if (author.name.includes(member.name)) {
        return { memberId: member.id, matched: true };
      }
    }
  }

  return { memberId: null, matched: false };
}

/**
 * Match "J. Lee" / "Lee, J." patterns against full name "Jiyun Lee"
 */
function matchByInitial(
  authorName: string,
  memberFullName: string
): boolean {
  const memberParts = memberFullName.split(/\s+/);
  if (memberParts.length < 2) return false;

  const memberFirst = memberParts[0];
  const memberLast = memberParts[memberParts.length - 1];
  const firstInitial = memberFirst[0];

  // "J. Lee" format
  const initialsFirst = new RegExp(
    `^${firstInitial}\\.?\\s+${memberLast}$`,
    "i"
  );
  if (initialsFirst.test(authorName)) return true;

  // "Lee, J." format
  const initialsLast = new RegExp(
    `^${memberLast},?\\s+${firstInitial}\\.?$`,
    "i"
  );
  if (initialsLast.test(authorName)) return true;

  // "Lee J" format (no punctuation)
  const noPunct = new RegExp(
    `^${memberLast}\\s+${firstInitial}$`,
    "i"
  );
  if (noPunct.test(authorName)) return true;

  return false;
}
