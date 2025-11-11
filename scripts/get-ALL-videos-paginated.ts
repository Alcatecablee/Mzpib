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

async function getAllVideosFromFolder(folderId: string, folderName: string) {
  const allVideos: any[] = [];
  let page = 1;
  const perPage = 100;
  
  while (true) {
    const url = `${UPNSHARE_API_BASE}/video/folder/${folderId}?page=${page}&perPage=${perPage}`;
    const response = await fetchWithAuth(url);
    const videos = Array.isArray(response) ? response : response.data || [];
    
    if (videos.length === 0) break;
    
    console.log(`    Page ${page}: ${videos.length} videos`);
    allVideos.push(...videos);
    
    if (videos.length < perPage) break; // Last page
    page++;
    
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  return allVideos;
}

async function main() {
  console.log("Fetching ALL videos with pagination...\n");
  
  // Get all folders
  const foldersData = await fetchWithAuth(`${UPNSHARE_API_BASE}/video/folder`);
  const folders = Array.isArray(foldersData) ? foldersData : foldersData.data || [];
  
  console.log(`Found ${folders.length} folders\n`);
  
  let totalVideos = 0;
  const allVideos: any[] = [];
  
  for (const folder of folders) {
    console.log(`Folder: "${folder.name}" (${folder.id})`);
    
    try {
      const videos = await getAllVideosFromFolder(folder.id, folder.name);
      console.log(`  ✓ Total: ${videos.length} videos\n`);
      
      for (const video of videos) {
        allVideos.push({
          id: video.id,
          title: video.title || video.name || '',
          folderId: folder.id,
          folderName: folder.name
        });
      }
      
      totalVideos += videos.length;
    } catch (error) {
      console.error(`  ✗ Error:`, error);
    }
  }
  
  console.log("\n" + "=".repeat(80));
  console.log(`TOTAL VIDEOS FOUND: ${totalVideos}`);
  console.log("=".repeat(80));
  
  // Save to file
  const fs = await import('fs');
  fs.writeFileSync('all-videos-complete.json', JSON.stringify({
    totalVideos,
    folders: folders.map(f => ({ id: f.id, name: f.name })),
    videos: allVideos
  }, null, 2));
  
  console.log("\n✓ Saved to: all-videos-complete.json");
}

main().catch(console.error);
