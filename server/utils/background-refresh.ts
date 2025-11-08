import { Video, VideoFolder, VideosResponse } from "@shared/api";
import { setRedisCache } from "./redis-cache";

const UPNSHARE_API_BASE = "https://upnshare.com/api/v1";
const REFRESH_INTERVAL = 5 * 60 * 1000;

let refreshTimer: NodeJS.Timeout | null = null;
let isRefreshing = false;
let lastRefreshTime = 0;

interface CacheEntry {
  data: VideosResponse;
  timestamp: number;
}

export let sharedCache: CacheEntry | null = null;

async function fetchWithAuth(url: string, timeoutMs = 10000) {
  const API_TOKEN = process.env.UPNSHARE_API_TOKEN || "";
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      headers: {
        "api-token": API_TOKEN,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`UPNshare API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeoutMs}ms`);
    }
    throw error;
  }
}

function normalizeVideo(video: any, folderId: string): Video {
  let assetPath: string | undefined;
  let posterUrl: string | undefined;

  if (video.poster) {
    const assetUrl = video.assetUrl || "https://assets.upns.net";

    if (video.poster.startsWith("/")) {
      posterUrl = assetUrl + video.poster;
    } else {
      posterUrl = video.poster;
    }

    const pathMatch = posterUrl.match(
      /^(https?:\/\/[^/]+)?(\/.*)\/(poster|preview|[^/]+\.(png|jpg|jpeg|webp))$/i,
    );
    if (pathMatch) {
      assetPath = pathMatch[2];
    }
  }

  return {
    id: video.id,
    title: (video.title || video.name || `Video ${video.id}`).trim(),
    description: video.description?.trim() || undefined,
    duration: video.duration || 0,
    thumbnail: video.thumbnail || undefined,
    poster: posterUrl || video.thumbnail || undefined,
    assetUrl: video.assetUrl || "https://assets.upns.net",
    assetPath: assetPath,
    created_at: video.created_at || video.createdAt || undefined,
    updated_at: video.updated_at || video.updatedAt || undefined,
    views: video.views || video.play || 0,
    size: video.size || undefined,
    folder_id: folderId,
  };
}

export async function refreshVideoCache(): Promise<{ success: boolean; message: string; videosCount?: number }> {
  const API_TOKEN = process.env.UPNSHARE_API_TOKEN || "";
  
  if (!API_TOKEN) {
    return { success: false, message: "UPNSHARE_API_TOKEN not set" };
  }

  if (isRefreshing) {
    return { success: false, message: "Refresh already in progress" };
  }

  isRefreshing = true;
  const startTime = Date.now();

  try {
    console.log("🔄 Background refresh: Starting...");
    
    const allVideos: Video[] = [];
    const allFolders: VideoFolder[] = [];

    const foldersData = await fetchWithAuth(`${UPNSHARE_API_BASE}/video/folder`, 5000);
    const folders = Array.isArray(foldersData) ? foldersData : foldersData.data || [];

    for (const folder of folders) {
      allFolders.push({
        id: folder.id,
        name: folder.name?.trim() || "Unnamed Folder",
        description: folder.description?.trim() || undefined,
        video_count: folder.video_count,
        created_at: folder.created_at,
        updated_at: folder.updated_at,
      });
    }

    const MAX_VIDEOS_PER_FOLDER = 100;
    const folderPromises = folders.map(async (folder: any) => {
      try {
        const url = `${UPNSHARE_API_BASE}/video/folder/${folder.id}?page=1&perPage=${MAX_VIDEOS_PER_FOLDER}`;
        const response = await fetchWithAuth(url, 4000);
        const videos = Array.isArray(response) ? response : response.data || [];
        
        return videos.map((video: any) => normalizeVideo(video, folder.id));
      } catch (error) {
        console.error(`  ❌ Error fetching ${folder.name}:`, error);
        return [];
      }
    });

    const videoArrays = await Promise.all(folderPromises);
    
    for (const videos of videoArrays) {
      allVideos.push(...videos);
    }

    const response: VideosResponse = {
      videos: allVideos,
      folders: allFolders,
      total: allVideos.length,
    };

    sharedCache = {
      data: response,
      timestamp: Date.now(),
    };

    await setRedisCache(response);

    const duration = Date.now() - startTime;
    lastRefreshTime = Date.now();
    
    console.log(`✅ Background refresh: Completed in ${duration}ms (${allVideos.length} videos)`);
    
    return {
      success: true,
      message: `Refreshed ${allVideos.length} videos in ${duration}ms`,
      videosCount: allVideos.length,
    };
  } catch (error) {
    console.error("❌ Background refresh failed:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  } finally {
    isRefreshing = false;
  }
}

export function startBackgroundRefresh() {
  if (refreshTimer) {
    console.log("⚠️  Background refresh already running");
    return;
  }

  console.log(`🔄 Starting background refresh (interval: ${REFRESH_INTERVAL / 1000}s)`);
  
  refreshVideoCache();
  
  refreshTimer = setInterval(() => {
    refreshVideoCache();
  }, REFRESH_INTERVAL);
}

export function stopBackgroundRefresh() {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
    console.log("🛑 Stopped background refresh");
  }
}

export function getRefreshStatus() {
  return {
    isRunning: refreshTimer !== null,
    isRefreshing,
    lastRefreshTime,
    nextRefreshIn: refreshTimer ? REFRESH_INTERVAL - (Date.now() - lastRefreshTime) : null,
  };
}
