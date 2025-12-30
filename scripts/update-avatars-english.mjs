import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

function loadEnv() {
  const envPath = resolve(process.cwd(), ".env.local");
  const envContent = readFileSync(envPath, "utf-8");
  const lines = envContent.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const [key, ...valueParts] = trimmed.split("=");
      if (key && valueParts.length > 0) {
        process.env[key.trim()] = valueParts.join("=").trim();
      }
    }
  }
}

loadEnv();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const avatarMap = {
  "이재호": "/images/lee-jaeho.png",
  "강성익": "/images/kang-seongik.png",
  "오재인": "/images/oh-jaein.png",
  "권기덕": "/images/kwon-gideok.png",
  "김은솔": "/images/kim-eunsol.png",
  "배성훈": "/images/bae-seonghun.png",
  "이다연": "/images/lee-dayeon.png",
  "이은진": "/images/lee-eunjin.png",
  "이지윤": "/images/lee-jiyoon.png",
  "지인섭": "/images/ji-inseob.png",
  "최희진": "/images/choi-heejin.png",
};

async function updateAvatars() {
  const { data: members, error } = await supabase
    .from("members")
    .select("id, name");
  
  if (error) {
    console.error("Error:", error);
    return;
  }
  
  for (const member of members) {
    const avatarUrl = avatarMap[member.name];
    if (avatarUrl) {
      const { error: updateError } = await supabase
        .from("members")
        .update({ avatar_url: avatarUrl })
        .eq("id", member.id);
      
      if (!updateError) {
        console.log(`Updated ${member.name} -> ${avatarUrl}`);
      }
    }
  }
  console.log("Done!");
}

updateAvatars();
