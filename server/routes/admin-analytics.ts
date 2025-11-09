import { Request, Response } from "express";
import { query } from "../utils/database";
import { sharedCache } from "../utils/background-refresh";

interface TopVideo {
  videoId: string;
  videoName: string;
  totalViews: number;
  totalWatchTime: number;
  averageWatchTime: number;
  completionRate: number;
}

interface AnalyticsTrend {
  date: string;
  views: number;
  watchTime: number;
  uniqueViewers: number;
}

interface AdminAnalyticsOverview {
  totalSessions: number;
  totalWatchTime: number;
  uniqueViewers: number;
  averageCompletionRate: number;
  topVideos: TopVideo[];
  viewTrends: AnalyticsTrend[];
  engagementMetrics: {
    averagePauseCount: number;
    averageSeekCount: number;
    averageSessionDuration: number;
  };
}

/**
 * Get comprehensive analytics overview for admin dashboard
 * GET /api/admin/analytics/overview
 */
export async function getAnalyticsOverview(
  req: Request,
  res: Response
): Promise<void> {
  try {
    console.log("[getAnalyticsOverview] Fetching analytics data...");

    // Get total sessions count
    const totalSessionsResult = await query(
      `SELECT COUNT(*) as count FROM analytics_sessions`
    );
    const totalSessions = parseInt(totalSessionsResult.rows[0]?.count || "0");

    // Get total watch time and unique viewers
    const aggregateResult = await query(`
      SELECT 
        COALESCE(SUM(watch_time), 0) as total_watch_time,
        COUNT(DISTINCT user_id) as unique_viewers,
        COALESCE(AVG(CASE WHEN completed THEN 100 ELSE 0 END), 0) as avg_completion_rate
      FROM analytics_sessions
    `);

    const totalWatchTime = parseInt(aggregateResult.rows[0]?.total_watch_time || "0");
    const uniqueViewers = parseInt(aggregateResult.rows[0]?.unique_viewers || "0");
    const averageCompletionRate = parseFloat(aggregateResult.rows[0]?.avg_completion_rate || "0");

    // Get engagement metrics
    const engagementResult = await query(`
      SELECT 
        COALESCE(AVG(pause_count), 0) as avg_pause_count,
        COALESCE(AVG(seek_count), 0) as avg_seek_count,
        COALESCE(AVG(watch_time), 0) as avg_session_duration
      FROM analytics_sessions
    `);

    const engagementMetrics = {
      averagePauseCount: parseFloat(engagementResult.rows[0]?.avg_pause_count || "0"),
      averageSeekCount: parseFloat(engagementResult.rows[0]?.avg_seek_count || "0"),
      averageSessionDuration: parseFloat(engagementResult.rows[0]?.avg_session_duration || "0"),
    };

    // Get top videos by views
    const topVideosResult = await query(`
      SELECT 
        video_id,
        COUNT(*) as total_views,
        SUM(watch_time) as total_watch_time,
        AVG(watch_time) as avg_watch_time,
        AVG(CASE WHEN completed THEN 100 ELSE 0 END) as completion_rate
      FROM analytics_sessions
      GROUP BY video_id
      ORDER BY total_views DESC
      LIMIT 10
    `);

    // Map video IDs to names from cached video data
    const cachedVideos = sharedCache?.data?.videos || [];
    const videoMap = new Map();
    if (Array.isArray(cachedVideos)) {
      cachedVideos.forEach((video: any) => {
        videoMap.set(video.id, video.name || video.id);
      });
    }

    const topVideos: TopVideo[] = topVideosResult.rows.map((row: any) => ({
      videoId: row.video_id,
      videoName: videoMap.get(row.video_id) || `Video ${row.video_id.slice(0, 8)}`,
      totalViews: parseInt(row.total_views),
      totalWatchTime: parseInt(row.total_watch_time || "0"),
      averageWatchTime: parseFloat(row.avg_watch_time || "0"),
      completionRate: parseFloat(row.completion_rate || "0"),
    }));

    // Get view trends for the last 7 days
    const trendsResult = await query(`
      SELECT 
        DATE(start_time) as date,
        COUNT(*) as views,
        SUM(watch_time) as watch_time,
        COUNT(DISTINCT user_id) as unique_viewers
      FROM analytics_sessions
      WHERE start_time >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(start_time)
      ORDER BY date ASC
    `);

    const viewTrends: AnalyticsTrend[] = trendsResult.rows.map((row: any) => ({
      date: row.date.toISOString().split("T")[0],
      views: parseInt(row.views),
      watchTime: parseInt(row.watch_time || "0"),
      uniqueViewers: parseInt(row.unique_viewers),
    }));

    const overview: AdminAnalyticsOverview = {
      totalSessions,
      totalWatchTime,
      uniqueViewers,
      averageCompletionRate,
      topVideos,
      viewTrends,
      engagementMetrics,
    };

    console.log("[getAnalyticsOverview] Analytics data fetched successfully");
    res.json(overview);
  } catch (error) {
    console.error("[getAnalyticsOverview] Error:", error);
    
    // Return empty data instead of error if no analytics data exists yet
    const emptyOverview: AdminAnalyticsOverview = {
      totalSessions: 0,
      totalWatchTime: 0,
      uniqueViewers: 0,
      averageCompletionRate: 0,
      topVideos: [],
      viewTrends: [],
      engagementMetrics: {
        averagePauseCount: 0,
        averageSeekCount: 0,
        averageSessionDuration: 0,
      },
    };

    res.json(emptyOverview);
  }
}

/**
 * Get storage analytics
 * GET /api/admin/analytics/storage
 */
export async function getStorageAnalytics(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const cachedVideos = sharedCache?.data?.videos || [];
    
    if (!Array.isArray(cachedVideos) || cachedVideos.length === 0) {
      res.json({
        totalStorage: 0,
        videoCount: 0,
        sizeDistribution: [],
        folderBreakdown: [],
      });
      return;
    }

    // Calculate total storage
    const totalStorage = cachedVideos.reduce((sum: number, video: any) => sum + (video.size || 0), 0);
    const videoCount = cachedVideos.length;

    // Size distribution (Small: <100MB, Medium: 100MB-500MB, Large: 500MB-1GB, XLarge: >1GB)
    const sizeRanges = {
      'Small (<100MB)': { min: 0, max: 100 * 1024 * 1024, count: 0 },
      'Medium (100-500MB)': { min: 100 * 1024 * 1024, max: 500 * 1024 * 1024, count: 0 },
      'Large (500MB-1GB)': { min: 500 * 1024 * 1024, max: 1024 * 1024 * 1024, count: 0 },
      'XLarge (>1GB)': { min: 1024 * 1024 * 1024, max: Infinity, count: 0 },
    };

    cachedVideos.forEach((video: any) => {
      const size = video.size || 0;
      for (const [label, range] of Object.entries(sizeRanges)) {
        if (size >= range.min && size < range.max) {
          range.count++;
          break;
        }
      }
    });

    const sizeDistribution = Object.entries(sizeRanges).map(([name, data]) => ({
      name,
      count: data.count,
      percentage: videoCount > 0 ? Math.round((data.count / videoCount) * 100) : 0,
    }));

    // Folder breakdown
    const folderMap = new Map<string, { name: string; size: number; count: number }>();
    
    cachedVideos.forEach((video: any) => {
      const folderId = video.folderId || 'root';
      const folderName = video.folderName || 'Root';
      
      if (!folderMap.has(folderId)) {
        folderMap.set(folderId, { name: folderName, size: 0, count: 0 });
      }
      
      const folder = folderMap.get(folderId)!;
      folder.size += video.size || 0;
      folder.count++;
    });

    const folderBreakdown = Array.from(folderMap.values()).map(folder => ({
      ...folder,
      sizeGB: folder.size / (1024 * 1024 * 1024),
    })).sort((a, b) => b.size - a.size);

    res.json({
      totalStorage,
      videoCount,
      sizeDistribution,
      folderBreakdown,
    });
  } catch (error) {
    console.error("[getStorageAnalytics] Error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
}
