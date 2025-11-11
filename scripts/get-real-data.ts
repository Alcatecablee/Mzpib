import "dotenv/config";

const API_TOKEN = process.env.UPNSHARE_API_TOKEN;
const UPNSHARE_API_BASE = "https://upnshare.com/api/v1";

async function fetchWithAuth(url: string) {
  const response = await fetch(url, {
    headers: { 'api-token': API_TOKEN! }
  });
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  return response.json();
}

async function main() {
  console.log("Fetching ALL real data from upnshare...\n");
  
  // Get all folders
  const foldersData = await fetchWithAuth(`${UPNSHARE_API_BASE}/video/folder`);
  const folders = Array.isArray(foldersData) ? foldersData : foldersData.data || [];
  
  console.log(`Found ${folders.length} folders\n`);
  
  let totalVideos = 0;
  const allVideos: any[] = [];
  
  // Fetch ACTUAL videos from each folder
  for (const folder of folders) {
    try {
      console.log(`Checking folder: "${folder.name}" (${folder.id})...`);
      
      // Fetch with high limit to get all videos
      const url = `${UPNSHARE_API_BASE}/video/folder/${folder.id}?page=1&perPage=1000`;
      const response = await fetchWithAuth(url);
      const videos = Array.isArray(response) ? response : response.data || [];
      
      console.log(`  ✓ Found ${videos.length} actual videos`);
      
      for (const video of videos) {
        allVideos.push({
          id: video.id,
          title: video.title || video.name || '',
          folderId: folder.id,
          folderName: folder.name
        });
      }
      
      totalVideos += videos.length;
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (error) {
      console.error(`  ✗ Error checking folder ${folder.name}:`, error);
    }
  }
  
  console.log("\n" + "=".repeat(80));
  console.log(`TOTAL VIDEOS FOUND: ${totalVideos}`);
  console.log("=".repeat(80));
  
  // Save to file for analysis
  const fs = await import('fs');
  fs.writeFileSync('all-videos-real-data.json', JSON.stringify({
    totalVideos,
    folders: folders.map(f => ({ id: f.id, name: f.name })),
    videos: allVideos
  }, null, 2));
  
  console.log("\n✓ Saved all real data to: all-videos-real-data.json");
  console.log("\nSample videos:");
  allVideos.slice(0, 20).forEach((v, i) => {
    console.log(`  ${i + 1}. [${v.folderName}] ${v.title}`);
  });
}

main().catch(console.error);
