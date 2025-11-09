import { Request, Response } from "express";

const UPNSHARE_API_BASE = "https://upnshare.com/api/v1";

export async function getUploadCredentials(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const API_TOKEN = process.env.UPNSHARE_API_TOKEN;
    if (!API_TOKEN) {
      res.status(500).json({ error: "API token not configured" });
      return;
    }

    console.log("[getUploadCredentials] Fetching TUS upload credentials");

    const response = await fetch(`${UPNSHARE_API_BASE}/video/upload`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[getUploadCredentials] Error:`, errorText);
      res.status(response.status).json({
        error: `Failed to get upload credentials: ${response.statusText}`,
      });
      return;
    }

    const data = await response.json();
    console.log(`[getUploadCredentials] Successfully retrieved credentials`);
    
    res.json(data);
  } catch (error) {
    console.error("[getUploadCredentials] Error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
}
