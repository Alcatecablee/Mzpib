import "dotenv/config";

const UPNSHARE_API_BASE = "https://upnshare.com/api/v1";
const API_TOKEN = process.env.UPNSHARE_API_TOKEN;

if (!API_TOKEN) {
  console.error("❌ UPNSHARE_API_TOKEN not found in environment");
  process.exit(1);
}

async function createFolder(name: string, description?: string) {
  console.log(`📁 Creating folder: ${name}`);
  
  const response = await fetch(`${UPNSHARE_API_BASE}/video/folder`, {
    method: "POST",
    headers: {
      "api-token": API_TOKEN!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, description }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create folder: ${response.status} ${error}`);
  }

  const data = await response.json();
  console.log(`✅ Folder created with ID: ${data.id}`);
  return data;
}

async function moveVideosToFolder(videoIds: string[], folderId: string) {
  console.log(`📦 Moving ${videoIds.length} videos to folder ${folderId}`);
  
  let successCount = 0;
  let failCount = 0;
  
  for (const videoId of videoIds) {
    try {
      const response = await fetch(
        `${UPNSHARE_API_BASE}/video/folder/${folderId}/link`,
        {
          method: "POST",
          headers: {
            "api-token": API_TOKEN!,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ videoId }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        console.error(`  ❌ Failed to move ${videoId}: ${error}`);
        failCount++;
      } else {
        console.log(`  ✓ Moved video ${videoId}`);
        successCount++;
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`  ❌ Error moving ${videoId}:`, error);
      failCount++;
    }
  }

  console.log(`\n✅ Successfully moved ${successCount}/${videoIds.length} videos`);
  if (failCount > 0) {
    console.log(`⚠️  Failed to move ${failCount} videos`);
  }
}

async function main() {
  // Video IDs for Xoli Mfeka videos
  const xoliVideoIds = [
    "huofr", "biwzi", "8v8rj", "6pyfy", "n3k99", 
    "jtukl", "6pywz", "hkmxr", "tzjnx", "rc9l1", 
    "sugmt", "ilbyt", "ldi6b", "cwzqh", "qxmbt"
  ];

  console.log(`\n🎬 Found ${xoliVideoIds.length} videos by Xoli Mfeka\n`);

  // Create folder
  const folder = await createFolder(
    "Xoli Mfeka",
    "Videos featuring Xoli Mfeka"
  );

  // Move all videos to the folder
  await moveVideosToFolder(xoliVideoIds, folder.id);

  console.log(`\n✨ Done! All ${xoliVideoIds.length} Xoli Mfeka videos have been organized into the '${folder.name}' folder.\n`);
}

main().catch((error) => {
  console.error("❌ Error:", error.message);
  process.exit(1);
});
