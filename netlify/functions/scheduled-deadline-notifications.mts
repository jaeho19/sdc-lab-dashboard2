import type { Config, Context } from "@netlify/functions";

// 매일 오전 9시 (KST) = UTC 0시에 실행
export default async (req: Request, context: Context) => {
  const siteUrl = process.env.URL || process.env.DEPLOY_PRIME_URL || "https://sdclab-dashboard.netlify.app";
  const cronSecret = process.env.CRON_SECRET || "";

  console.log(`[Cron] Starting deadline notification check at ${new Date().toISOString()}`);

  try {
    const response = await fetch(`${siteUrl}/api/cron/deadline-notifications`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${cronSecret}`,
        "Content-Type": "application/json",
      },
    });

    const result = await response.json();

    console.log(`[Cron] Result:`, JSON.stringify(result, null, 2));

    return new Response(JSON.stringify({
      success: true,
      message: "Deadline notifications processed",
      result,
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(`[Cron] Error:`, error);

    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

// Netlify Scheduled Function 설정
// 매일 오전 9시 KST (UTC 0시)에 실행
export const config: Config = {
  schedule: "0 0 * * *", // 매일 UTC 0시 = KST 9시
};
