import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://vkqeejqbyvcpxrqqshbu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrcWVlanFieXZjcHhycXFzaGJ1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjgxMzkyMSwiZXhwIjoyMDgyMzg5OTIxfQ.t3ks4W4XtlVzHfzPwN5rNixD3FaG8kwT-NP0x4-ESUM'
);

async function main() {
  // Professor 멤버 찾기
  const { data: professors, error: profError } = await supabase
    .from('members')
    .select('id, name')
    .eq('position', 'professor')
    .limit(1);

  const professor = professors?.[0];

  if (profError || !professor) {
    console.error('Professor not found:', profError);
    return;
  }

  console.log('Found professor:', professor.name);

  const content = `## 2026년 이공분야 박사과정생연구장려금지원 신규과제 공모

교육부 공고 제2026-29호

### ① 신청 자격
- 연구개시일 기준 국내 대학원 **박사과정 재학생** 또는 **석·박사 통합과정 재학생**
- **전업(Full-time)** 학생
- 대한민국 국적, 국내 거주

### ② 지원 내용
- 이공분야 학술연구지원사업 (박사과정생연구장려금지원)

### ③ 신청 일정
- **신청 마감**: 2026. 4. 13.(월) 14:00
- 현재 접수 대기중

### ④ 필수 제출서류
- 신청요강 참고
- 신청 서식 (zip)
- 신청 별첨 매뉴얼 (zip)

### 문의
- 담당부서: 이공학술지원팀
- 담당자: 임보혜
- 연락처: 042-869-6068

원문 링크: https://www.nrf.re.kr/biz/notice/view?postNo=263494&menuNo=362&bizNo=416`;

  // 공지사항 추가
  const { data, error } = await supabase
    .from('announcements')
    .insert({
      title: '2026년 이공분야 박사과정생연구장려금지원 신규과제 공모',
      content: content,
      priority: 'important',
      is_pinned: true,
      author_id: professor.id,
      expires_at: '2026-04-13T14:00:00+09:00'
    })
    .select()
    .single();

  if (error) {
    console.error('Insert error:', error);
    return;
  }

  console.log('Announcement created successfully!');
  console.log('ID:', data.id);
  console.log('Title:', data.title);
}

main();
