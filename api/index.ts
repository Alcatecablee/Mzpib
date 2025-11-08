import "dotenv/config";
import serverless from "serverless-http";
import { createServer } from "../server/index";

console.log("[api/index.ts] Loading serverless function");
console.log(
  "[api/index.ts] UPNSHARE_API_TOKEN:",
  process.env.UPNSHARE_API_TOKEN
    ? process.env.UPNSHARE_API_TOKEN.substring(0, 5) + "..."
    : "NOT SET",
);

const app = createServer();
export default serverless(app);
