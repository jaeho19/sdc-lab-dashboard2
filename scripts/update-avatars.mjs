// Update avatar URLs for members
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

// Load environment variables
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

// Map member names to their image files
const avatarMap = {
  "이재호": "/images/이재호.png",
  "강성익": "/images/강성익.png",
  "오재인": "/images/오재인.png",
  "권기덕": "/images/권기덕.png",
  "김은솔": "/images/김은솔.png",
  "배성훈": "/images/배성훈.png",
  "이다연": "/images/이다연.png",
  "이은진": "/images/이은진.png",
  "이지윤": "/images/이지윤.png",
  "지인섭": "/images/지인섭.png",
  "최희진": "/images/최희진.png",
};

async function updateAvatars() {
  console.log("Fetching members...");
  
  const { data: members, error } = await supabase
    .from("members")
    .select("id, name, avatar_url");
  
  if (error) {
    console.error("Error fetching members:", error);
    return;
  }
  
  console.log(`Found ${members.length} members`);
  
  for (const member of members) {
    const avatarUrl = avatarMap[member.name];
    if (avatarUrl) {
      console.log(`Updating ${member.name}: ${avatarUrl}`);
      
      const { error: updateError } = await supabase
        .from("members")
        .update({ avatar_url: avatarUrl })
        .eq("id", member.id);
      
      if (updateError) {
        console.error(`Error updating ${member.name}:`, updateError);
      } else {
        console.log(`  ✓ Updated ${member.name}`);
      }
    } else {
      console.log(`  - No avatar found for ${member.name}`);
    }
  }
  
  console.log("\nDone!");
}

updateAvatars();
