import "dotenv/config";
import serverless from "serverless-http";
import { createServer } from "./index";

console.log("[serverless] Loading serverless function");
console.log(
  "[serverless] UPNSHARE_API_TOKEN:",
  process.env.UPNSHARE_API_TOKEN
    ? process.env.UPNSHARE_API_TOKEN.substring(0, 5) + "..."
    : "NOT SET",
);

const app = createServer();
export default serverless(app);
