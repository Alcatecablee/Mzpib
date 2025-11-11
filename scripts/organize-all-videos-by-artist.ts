import "dotenv/config";

const UPNSHARE_API_BASE = "https://upnshare.com/api/v1";
const API_TOKEN = process.env.UPNSHARE_API_TOKEN;

if (!API_TOKEN) {
  console.error("❌ UPNSHARE_API_TOKEN not found in environment");
  process.exit(1);
}

interface Video {
  id: string;
  title: string;
  folder_id?: string;
}

interface Folder {
  id: string;
  name: string;
}

// Common artist name patterns and aliases
const ARTIST_ALIASES: Record<string, string> = {
  "xolisile": "Xoli Mfeka",
  "xoli m": "Xoli Mfeka",
  "xoli": "Xoli Mfeka",
  "simplypiper": "Simplypiiper",
  "pipipiper13": "Pipipiper",
  "pipipiper": "Pipipiper",
};

async function fetchWithAuth(url: string) {
  const response = await fetch(url, {
    headers: {
      "api-token": API_TOKEN!,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API error: ${response.status} ${error}`);
  }

  return response.json();
}

async function getAllFolders(): Promise<Folder[]> {
  console.log("📂 Fetching all folders...");
  const data = await fetchWithAuth(`${UPNSHARE_API_BASE}/video/folder`);
  const folders = Array.isArray(data) ? data : data.data || [];
  console.log(`  Found ${folders.length} existing folders`);
  return folders;
}

async function getAllVideos(): Promise<Video[]> {
  console.log("🎬 Fetching all videos...");
  const folders = await getAllFolders();
  const allVideos: Video[] = [];

  for (const folder of folders) {
    try {
      const url = `${UPNSHARE_API_BASE}/video/folder/${folder.id}?page=1&perPage=1000`;
      const response = await fetchWithAuth(url);
      const videos = Array.isArray(response) ? response : response.data || [];
      
      for (const video of videos) {
        allVideos.push({
          id: video.id,
          title: video.title || video.name || `Video ${video.id}`,
          folder_id: folder.id,
        });
      }
      
      console.log(`  ✓ Fetched ${videos.length} videos from "${folder.name}"`);
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.error(`  ✗ Error fetching videos from folder ${folder.id}:`, error);
    }
  }

  console.log(`\n✅ Total videos found: ${allVideos.length}\n`);
  return allVideos;
}

function extractArtistName(title: string): string | null {
  // Normalize title
  const normalized = title.trim();
  
  // Pattern 1: "Artist Name - Title" or "Artist Name: Title"
  const dashPattern = /^([^-:]+?)[\s]*[-:]/;
  const dashMatch = normalized.match(dashPattern);
  if (dashMatch) {
    const candidate = dashMatch[1].trim();
    if (candidate.length > 2 && candidate.length < 50) {
      return normalizeArtistName(candidate);
    }
  }

  // Pattern 2: "Artist1 & Artist2" or "Artist1 and Artist2"
  const andPattern = /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:&|and)\s+/i;
  const andMatch = normalized.match(andPattern);
  if (andMatch) {
    return normalizeArtistName(andMatch[1].trim());
  }

  // Pattern 3: "Artist1 Vs Artist2" or "Artist1 x Artist2"
  const vsPattern = /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:Vs|vs|VS|x|X)\s+/i;
  const vsMatch = normalized.match(vsPattern);
  if (vsMatch) {
    return normalizeArtistName(vsMatch[1].trim());
  }

  // Pattern 4: "Artist1/Artist2" 
  const slashPattern = /^([^/]+)\/([^/]+)/;
  const slashMatch = normalized.match(slashPattern);
  if (slashMatch) {
    // Take the first artist name
    const candidate = slashMatch[1].trim();
    if (candidate.length > 2 && candidate.length < 50) {
      return normalizeArtistName(candidate);
    }
  }

  // Pattern 5: Leading capitalized words (likely artist name)
  const leadingCapsPattern = /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3})/;
  const capsMatch = normalized.match(leadingCapsPattern);
  if (capsMatch) {
    const candidate = capsMatch[1].trim();
    // Only accept if it's between 3-40 characters and doesn't look like a generic title
    const genericWords = /^(watch|new|hot|sexy|leaked|exclusive|best|top)/i;
    if (candidate.length >= 3 && candidate.length <= 40 && !genericWords.test(candidate)) {
      return normalizeArtistName(candidate);
    }
  }

  return null;
}

function normalizeArtistName(name: string): string {
  const normalized = name.trim().toLowerCase();
  
  // Check if we have an alias mapping
  if (ARTIST_ALIASES[normalized]) {
    return ARTIST_ALIASES[normalized];
  }

  // Otherwise, return title-cased version
  return name
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

async function createFolder(name: string): Promise<Folder> {
  console.log(`  📁 Creating folder: "${name}"`);
  
  const response = await fetch(`${UPNSHARE_API_BASE}/video/folder`, {
    method: "POST",
    headers: {
      "api-token": API_TOKEN!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create folder: ${response.status} ${error}`);
  }

  const data = await response.json();
  await new Promise(resolve => setTimeout(resolve, 200));
  return data;
}

async function moveVideoToFolder(videoId: string, folderId: string): Promise<boolean> {
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

    await new Promise(resolve => setTimeout(resolve, 100));
    return response.ok;
  } catch (error) {
    return false;
  }
}

async function main() {
  console.log("🎯 Starting video organization by artist...\n");

  // Fetch all videos
  const allVideos = await getAllVideos();

  // Group videos by artist
  const videosByArtist = new Map<string, Video[]>();
  const uncategorizedVideos: Video[] = [];

  console.log("🔍 Analyzing video titles to identify artists...\n");
  
  for (const video of allVideos) {
    const artistName = extractArtistName(video.title);
    
    if (artistName) {
      if (!videosByArtist.has(artistName)) {
        videosByArtist.set(artistName, []);
      }
      videosByArtist.get(artistName)!.push(video);
    } else {
      uncategorizedVideos.push(video);
    }
  }

  // Display summary
  console.log("📊 Analysis Summary:");
  console.log(`  Total videos: ${allVideos.length}`);
  console.log(`  Unique artists identified: ${videosByArtist.size}`);
  console.log(`  Uncategorized videos: ${uncategorizedVideos.length}\n`);

  console.log("👥 Artists identified:");
  const sortedArtists = Array.from(videosByArtist.entries()).sort((a, b) => b[1].length - a[1].length);
  for (const [artist, videos] of sortedArtists) {
    console.log(`  - ${artist}: ${videos.length} videos`);
  }
  console.log();

  // Get existing folders
  const existingFolders = await getAllFolders();
  const folderMap = new Map<string, string>();
  for (const folder of existingFolders) {
    folderMap.set(folder.name.toLowerCase(), folder.id);
  }

  // Create folders for artists and organize videos
  console.log("📁 Creating folders and organizing videos...\n");
  
  let foldersCreated = 0;
  let videosMovedSuccess = 0;
  let videosMovedFailed = 0;

  for (const [artistName, videos] of videosByArtist) {
    const folderKey = artistName.toLowerCase();
    let folderId: string;

    if (folderMap.has(folderKey)) {
      folderId = folderMap.get(folderKey)!;
      console.log(`✓ Using existing folder: "${artistName}" (${videos.length} videos)`);
    } else {
      const newFolder = await createFolder(artistName);
      folderId = newFolder.id;
      folderMap.set(folderKey, folderId);
      foldersCreated++;
      console.log(`  ✓ Created folder: "${artistName}"`);
    }

    // Move videos to this folder
    for (const video of videos) {
      const success = await moveVideoToFolder(video.id, folderId);
      if (success) {
        videosMovedSuccess++;
      } else {
        videosMovedFailed++;
      }
    }
    console.log(`  ✓ Moved ${videos.length} videos to "${artistName}"`);
  }

  // Handle uncategorized videos
  if (uncategorizedVideos.length > 0) {
    console.log(`\n📦 Handling ${uncategorizedVideos.length} uncategorized videos...`);
    
    const uncategorizedFolderName = "Needs Manual Review";
    let uncategorizedFolderId: string;

    if (folderMap.has(uncategorizedFolderName.toLowerCase())) {
      uncategorizedFolderId = folderMap.get(uncategorizedFolderName.toLowerCase())!;
      console.log(`✓ Using existing folder: "${uncategorizedFolderName}"`);
    } else {
      const newFolder = await createFolder(uncategorizedFolderName);
      uncategorizedFolderId = newFolder.id;
      foldersCreated++;
      console.log(`  ✓ Created folder: "${uncategorizedFolderName}"`);
    }

    for (const video of uncategorizedVideos) {
      const success = await moveVideoToFolder(video.id, uncategorizedFolderId);
      if (success) {
        videosMovedSuccess++;
      } else {
        videosMovedFailed++;
      }
    }
    console.log(`  ✓ Moved ${uncategorizedVideos.length} videos to "${uncategorizedFolderName}"`);
  }

  // Final summary
  console.log("\n" + "=".repeat(60));
  console.log("✨ Organization Complete!\n");
  console.log(`📊 Final Summary:`);
  console.log(`  - Total videos processed: ${allVideos.length}`);
  console.log(`  - Artists identified: ${videosByArtist.size}`);
  console.log(`  - Folders created: ${foldersCreated}`);
  console.log(`  - Videos moved successfully: ${videosMovedSuccess}`);
  console.log(`  - Videos failed to move: ${videosMovedFailed}`);
  console.log(`  - Videos needing manual review: ${uncategorizedVideos.length}`);
  console.log("=".repeat(60) + "\n");
}

main().catch((error) => {
  console.error("❌ Error:", error.message);
  process.exit(1);
});
