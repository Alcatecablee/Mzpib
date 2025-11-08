import { RequestHandler } from "express";
import { refreshVideoCache, getRefreshStatus } from "../utils/background-refresh";

export const handleRefreshNow: RequestHandler = async (req, res) => {
  try {
    const result = await refreshVideoCache();
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        videosCount: result.videosCount,
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.message,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to refresh cache",
    });
  }
};

export const handleRefreshStatus: RequestHandler = async (req, res) => {
  try {
    const status = getRefreshStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to get refresh status",
    });
  }
};
