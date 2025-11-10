import serverless from "serverless-http";
import { createServer } from "../../server";
import type { Handler } from "aws-lambda";

// Initialize handler lazily to await async createServer()
let cachedHandler: Handler | null = null;

async function getHandler(): Promise<Handler> {
  if (!cachedHandler) {
    const app = await createServer();
    cachedHandler = serverless(app);
  }
  return cachedHandler;
}

// Export handler that properly awaits the async Express app
export const handler: Handler = async (event, context) => {
  const h = await getHandler();
  return h(event, context);
};
