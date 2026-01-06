import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import type { PeerReview, PeerReviewStatus } from "@/types/database";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const PEER_REVIEW_PROMPT = `당신은 다양한 학문 분야에서 풍부한 경험을 가진 학술 논문 심사위원입니다. 제출된 연구 내용에 대해 체계적이고 건설적인 동료 심사(Peer Review)를 제공해주세요.

# 심사 원칙

## 톤과 접근 방식
- **건설적으로**: 비판을 개선 기회로 프레이밍
- **구체적으로**: 실행 가능한 제안과 구체적 예시 제공
- **균형있게**: 강점과 약점 모두 인정
- **존중적으로**: 저자의 노력을 인정하면서 전문적으로 평가
- **객관적으로**: 연구자가 아닌 연구에 집중

## 평가 영역

### 방법론 평가
- 재현가능성: 다른 연구자가 연구를 재현할 수 있는가?
- 엄밀성: 연구 질문에 적합한 방법인가?
- 상세함: 프로토콜, 도구, 매개변수가 충분히 설명되었는가?
- 윤리: 윤리 승인, 동의, 데이터 처리가 적절히 문서화되었는가?
- 통계: 통계 방법이 적절하고 명확히 설명되었는가?
- 검증: 대조군, 반복 실험이 적절한가?

### 통계적 엄밀성 확인사항
- 통계적 가정 충족 여부 (정규성, 독립성, 등분산성)
- p-값과 함께 효과 크기 보고 여부
- 다중 검정 보정 적용 여부
- 신뢰구간 제공 여부
- 검정력 분석을 통한 표본 크기 정당화 여부
- 결측 데이터 처리 방법

### 흔한 문제점 확인
- P-해킹 (유의한 결과만 선택적 보고)
- 부적절한 통계 검정 선택
- 가유사복제 (기술적 복제를 생물학적 복제로 처리)
- 적절한 대조군 부재
- 교란변수 미통제
- 결과 과장 해석
- 선택적 보고 및 체리피킹

---

# 심사 결과 형식

다음 형식으로 심사 결과를 작성하세요:

## 1. 종합 평가 (Summary Statement)
연구의 전반적인 평가를 1-2 문단으로 제공하세요:
- 연구 개요 (2-3문장)
- 전체 권고사항 (수락/소수정/대수정/반려)
- 핵심 강점 (2-3개 bullet points)
- 핵심 약점 (2-3개 bullet points)
- 중요성과 타당성에 대한 최종 평가

## 2. 주요 코멘트 (Major Comments)
원고의 타당성, 해석 가능성, 중요성에 큰 영향을 미치는 핵심 문제점을 [M1], [M2], [M3]... 형식으로 나열하세요.

**주요 코멘트에 포함될 사항:**
- 근본적인 방법론적 결함
- 부적절한 통계 분석
- 지지되지 않거나 과장된 결론
- 누락된 핵심 대조군이나 실험
- 심각한 재현가능성 우려
- 문헌 검토의 주요 공백
- 윤리적 우려

각 주요 코멘트에는:
1. 문제점을 명확히 기술
2. 왜 문제인지 설명
3. 구체적 해결책이나 추가 실험 제안
4. 출판에 필수적인지 여부 표시

## 3. 부수적 코멘트 (Minor Comments)
명확성, 완전성, 표현을 개선할 수 있는 덜 중요한 문제점을 [m1], [m2], [m3]... 형식으로 나열하세요.

**부수적 코멘트에 포함될 사항:**
- 불명확한 그림 레이블이나 범례
- 누락된 방법론 세부사항
- 오탈자나 문법 오류
- 데이터 표현 개선 제안
- 사소한 통계 보고 문제
- 결론을 강화할 보충 분석

## 4. 저자에게 묻는 질문
명확히 해야 할 구체적 질문들:
- 불명확한 방법론 세부사항
- 모순되는 것처럼 보이는 결과
- 평가에 필요한 누락된 정보
- 추가 데이터나 분석 요청

## 5. 수정 우선순위 요약

| 우선순위 | 항목 번호 | 내용 요약 | 필수 여부 |
|---------|----------|----------|----------|
| 🔴 높음 | [M1] | ... | 필수 |
| 🟡 중간 | [M2] | ... | 권장 |
| 🟢 낮음 | [m1] | ... | 선택 |

## 6. 최종 의견 (Final Recommendation)
- 연구의 학술적 가치와 기여도
- 현재 상태에서의 출판/발표 가능성
- 수정 후 잠재적 영향력
- 저자에게 전하는 격려의 말

---
**참고**: 이 리뷰는 연구 개선을 위한 건설적 피드백 목적입니다. 전문적이고 존중하는 톤을 유지하면서 학술적 엄밀성을 추구합니다.`;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get member by email
    const { data: memberData } = await supabase
      .from("members")
      .select("id")
      .eq("email", user.email)
      .single();

    const member = memberData as { id: string } | null;

    if (!member) {
      return NextResponse.json(
        { error: "연구원 정보를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const { title, content, projectId } = await request.json();

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    // Create peer review record with pending status
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: review, error: insertError } = await (supabase as any)
      .from("peer_reviews")
      .insert({
        member_id: member.id,
        project_id: projectId || null,
        title,
        content,
        review_status: "processing",
      })
      .select()
      .single() as { data: PeerReview | null; error: Error | null };

    if (insertError) {
      console.error("Insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to create review record" },
        { status: 500 }
      );
    }

    // Call Claude API
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8192,
      messages: [
        {
          role: "user",
          content: `다음 연구 내용에 대한 동료 심사를 진행해주세요.

제목: ${title}

내용:
${content}`,
        },
      ],
      system: PEER_REVIEW_PROMPT,
    });

    // Extract text content from the response
    const reviewResult =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Update the review with the result
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase as any)
      .from("peer_reviews")
      .update({
        review_result: reviewResult,
        review_status: "completed",
      })
      .eq("id", review!.id);

    if (updateError) {
      console.error("Update error:", updateError);
      return NextResponse.json(
        { error: "Failed to save review result" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id: review!.id,
      reviewResult,
      status: "completed",
    });
  } catch (error) {
    console.error("Peer review error:", error);
    return NextResponse.json(
      { error: "Failed to generate peer review" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get member by email
    const { data: memberData } = await supabase
      .from("members")
      .select("id")
      .eq("email", user.email)
      .single();

    const member = memberData as { id: string } | null;

    if (!member) {
      return NextResponse.json(
        { error: "연구원 정보를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // Calculate current month's start and end dates
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Delete old reviews (from previous months) - cleanup on each request
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("peer_reviews")
      .delete()
      .eq("member_id", member.id)
      .lt("created_at", startOfMonth.toISOString());

    // Get user's peer reviews for current month only
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: reviews, error } = await (supabase as any)
      .from("peer_reviews")
      .select(
        `
        *,
        project:research_projects(id, title)
      `
      )
      .eq("member_id", member.id)
      .gte("created_at", startOfMonth.toISOString())
      .lte("created_at", endOfMonth.toISOString())
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch error:", error);
      return NextResponse.json(
        { error: "Failed to fetch reviews" },
        { status: 500 }
      );
    }

    return NextResponse.json(reviews);
  } catch (error) {
    console.error("Fetch reviews error:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}
