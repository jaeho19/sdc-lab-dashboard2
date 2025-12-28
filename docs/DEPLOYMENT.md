# SDC Lab Dashboard - 배포 가이드

## 1. 사전 요구사항

### Supabase 프로젝트 설정
1. [Supabase](https://supabase.com)에서 새 프로젝트 생성
2. Project Settings > API에서 다음 값 확인:
   - Project URL
   - anon public key
3. SQL Editor에서 `supabase/schema.sql` 실행

### Vercel 계정
1. [Vercel](https://vercel.com)에서 계정 생성
2. GitHub 저장소 연결

---

## 2. 환경 변수 설정

### 로컬 개발
1. `.env.example`을 `.env.local`로 복사
2. Supabase 프로젝트 정보 입력:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Vercel 배포
Vercel 프로젝트 Settings > Environment Variables에서 설정:

| Variable | Value | Environment |
|----------|-------|-------------|
| NEXT_PUBLIC_SUPABASE_URL | Supabase Project URL | Production, Preview, Development |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Supabase anon key | Production, Preview, Development |
| NEXT_PUBLIC_SITE_URL | 배포된 도메인 URL | Production |

---

## 3. Supabase 설정

### 3.1 데이터베이스 스키마
```bash
# SQL Editor에서 실행
supabase/schema.sql
```

### 3.2 인증 설정
1. Authentication > Providers > Email 활성화
2. Authentication > URL Configuration:
   - Site URL: `https://your-domain.vercel.app`
   - Redirect URLs: `https://your-domain.vercel.app/**`

### 3.3 Storage 설정
1. Storage > Create new bucket > `files`
2. Public bucket 설정 비활성화 (RLS로 제어)

---

## 4. 배포 방법

### 4.1 Vercel 자동 배포
1. GitHub 저장소를 Vercel에 연결
2. 환경 변수 설정
3. Deploy 클릭

```bash
# 또는 CLI로 배포
npm i -g vercel
vercel --prod
```

### 4.2 수동 배포
```bash
# 빌드
npm run build

# 빌드 결과물 확인
npm run start
```

---

## 5. 배포 후 확인사항

### 기능 체크리스트
- [ ] 로그인/회원가입 동작
- [ ] 관리자 승인 프로세스
- [ ] Dashboard 통계 표시
- [ ] Members 목록/상세 페이지
- [ ] Research Articles CRUD
- [ ] Calendar 일정 관리
- [ ] Mentoring 기록/댓글/좋아요
- [ ] 알림 시스템

### 성능 체크
- [ ] Lighthouse 점수 확인 (목표: 90+)
- [ ] Core Web Vitals 확인

---

## 6. 문제 해결

### 일반적인 오류

**환경 변수 오류**
```
Error: supabaseUrl is required
```
→ 환경 변수가 제대로 설정되었는지 확인

**인증 오류**
```
AuthApiError: Invalid login credentials
```
→ Supabase Authentication 설정 확인

**RLS 오류**
```
new row violates row-level security policy
```
→ RLS 정책 확인 및 사용자 권한 검토

---

## 7. 관리자 계정 설정

1. 일반 사용자로 회원가입
2. Supabase Dashboard > Table Editor > members 테이블
3. 해당 사용자의 `position`을 `professor`로 변경
4. `status`를 `active`로 변경

이제 관리자 권한으로 다른 사용자 승인 가능
