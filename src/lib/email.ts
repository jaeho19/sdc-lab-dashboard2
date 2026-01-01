import { Resend } from "resend";

// 발신자 이메일 (Resend에서 인증된 도메인 필요, 테스트는 onboarding@resend.dev 사용)
const FROM_EMAIL =
  process.env.FROM_EMAIL || "SDC Lab <onboarding@resend.dev>";

// Resend 클라이언트를 런타임에 생성 (빌드 타임 에러 방지)
function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new Resend(apiKey);
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions) {
  const resend = getResendClient();

  if (!resend) {
    console.log("Email skipped: RESEND_API_KEY not configured");
    return { success: false, error: "RESEND_API_KEY not configured" };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    if (error) {
      console.error("Email send error:", error);
      return { success: false, error: error.message };
    }

    console.log("Email sent successfully:", data?.id);
    return { success: true, id: data?.id };
  } catch (err) {
    console.error("Email send exception:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

// 마감일 알림 이메일 템플릿
export function getDeadlineEmailTemplate(params: {
  memberName: string;
  projectTitle: string;
  daysUntilDeadline: number;
  projectUrl: string;
}) {
  const { memberName, projectTitle, daysUntilDeadline, projectUrl } = params;

  const deadlineText =
    daysUntilDeadline === 0
      ? "오늘"
      : daysUntilDeadline === 1
      ? "내일"
      : `${daysUntilDeadline}일 후`;

  const urgencyColor =
    daysUntilDeadline === 0
      ? "#ef4444"
      : daysUntilDeadline === 1
      ? "#f97316"
      : daysUntilDeadline === 3
      ? "#eab308"
      : "#3b82f6";

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>마감일 알림</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: #1e293b; padding: 30px; text-align: center;">
              <div style="width: 60px; height: 60px; background-color: #10b981; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 15px;">
                <span style="color: white; font-size: 20px; font-weight: bold;">SDC</span>
              </div>
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">SDC Lab Dashboard</h1>
              <p style="color: #94a3b8; margin: 8px 0 0; font-size: 14px;">서울시립대학교 Spatial Data & Community Lab</p>
            </td>
          </tr>

          <!-- Urgency Badge -->
          <tr>
            <td style="padding: 30px 30px 0; text-align: center;">
              <span style="display: inline-block; background-color: ${urgencyColor}; color: white; padding: 8px 20px; border-radius: 20px; font-size: 14px; font-weight: 600;">
                마감 ${deadlineText}
              </span>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 30px;">
              <p style="color: #374151; font-size: 16px; margin: 0 0 20px;">
                안녕하세요, <strong>${memberName}</strong>님!
              </p>
              <p style="color: #374151; font-size: 16px; margin: 0 0 25px; line-height: 1.6;">
                담당하고 계신 연구 프로젝트의 마감일이 <strong style="color: ${urgencyColor};">${deadlineText}</strong>입니다.
              </p>

              <!-- Project Card -->
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
                <p style="color: #64748b; font-size: 12px; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 0.5px;">프로젝트</p>
                <p style="color: #1e293b; font-size: 18px; font-weight: 600; margin: 0;">
                  ${projectTitle}
                </p>
              </div>

              <!-- CTA Button -->
              <a href="${projectUrl}" style="display: inline-block; background-color: #10b981; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                프로젝트 확인하기
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 20px 30px; border-top: 1px solid #e2e8f0;">
              <p style="color: #64748b; font-size: 12px; margin: 0; text-align: center;">
                이 이메일은 SDC Lab Dashboard에서 자동으로 발송되었습니다.<br>
                문의사항이 있으시면 연구실로 연락해주세요.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `
[SDC Lab Dashboard] 마감일 알림

안녕하세요, ${memberName}님!

담당하고 계신 연구 프로젝트의 마감일이 ${deadlineText}입니다.

프로젝트: ${projectTitle}

프로젝트 확인: ${projectUrl}

---
이 이메일은 SDC Lab Dashboard에서 자동으로 발송되었습니다.
  `.trim();

  return { html, text };
}

// 댓글 알림 이메일 템플릿
export function getCommentEmailTemplate(params: {
  memberName: string;
  commenterName: string;
  postTitle: string;
  commentPreview: string;
  postUrl: string;
}) {
  const { memberName, commenterName, postTitle, commentPreview, postUrl } =
    params;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="background-color: #1e293b; padding: 25px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 20px;">SDC Lab Dashboard</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px;">
              <p style="color: #374151; font-size: 16px; margin: 0 0 15px;">
                안녕하세요, <strong>${memberName}</strong>님!
              </p>
              <p style="color: #374151; font-size: 16px; margin: 0 0 20px;">
                <strong>${commenterName}</strong>님이 회원님의 게시물에 댓글을 남겼습니다.
              </p>
              <div style="background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 15px; margin-bottom: 20px;">
                <p style="color: #64748b; font-size: 12px; margin: 0 0 5px;">게시물</p>
                <p style="color: #1e293b; font-size: 16px; font-weight: 600; margin: 0 0 10px;">${postTitle}</p>
                <p style="color: #64748b; font-size: 14px; margin: 0;">"${commentPreview}"</p>
              </div>
              <a href="${postUrl}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                댓글 확인하기
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `
[SDC Lab Dashboard] 새 댓글 알림

안녕하세요, ${memberName}님!

${commenterName}님이 회원님의 게시물에 댓글을 남겼습니다.

게시물: ${postTitle}
댓글: "${commentPreview}"

확인하기: ${postUrl}
  `.trim();

  return { html, text };
}

// 좋아요 알림 이메일 템플릿
export function getLikeEmailTemplate(params: {
  memberName: string;
  likerName: string;
  postTitle: string;
  postUrl: string;
}) {
  const { memberName, likerName, postTitle, postUrl } = params;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="background-color: #1e293b; padding: 25px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 20px;">SDC Lab Dashboard</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 20px;">❤️</div>
              <p style="color: #374151; font-size: 16px; margin: 0 0 15px;">
                안녕하세요, <strong>${memberName}</strong>님!
              </p>
              <p style="color: #374151; font-size: 16px; margin: 0 0 20px;">
                <strong>${likerName}</strong>님이 회원님의 게시물을 좋아합니다.
              </p>
              <div style="background-color: #fdf2f8; border: 1px solid #fbcfe8; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
                <p style="color: #64748b; font-size: 12px; margin: 0 0 5px;">게시물</p>
                <p style="color: #1e293b; font-size: 16px; font-weight: 600; margin: 0;">${postTitle}</p>
              </div>
              <a href="${postUrl}" style="display: inline-block; background-color: #ec4899; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                게시물 확인하기
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `
[SDC Lab Dashboard] 좋아요 알림

안녕하세요, ${memberName}님!

${likerName}님이 회원님의 게시물을 좋아합니다.

게시물: ${postTitle}

확인하기: ${postUrl}
  `.trim();

  return { html, text };
}
