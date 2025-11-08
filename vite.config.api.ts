import { defineConfig } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// API serverless function build configuration
export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, "server/serverless.ts"),
      name: "api",
      fileName: "index",
      formats: ["cjs"],
    },
    outDir: "dist/api",
    target: "node22",
    ssr: true,
    rollupOptions: {
      external: [
        // Node.js built-ins
        "fs",
        "path",
        "url",
        "http",
        "https",
        "os",
        "crypto",
        "stream",
        "util",
        "events",
        "buffer",
        "querystring",
        "child_process",
        "zlib",
        "net",
        "tls",
        "dns",
        // External dependencies - let Vercel bundle these
        "express",
        "cors",
        "dotenv",
        "serverless-http",
      ],
      output: {
        format: "cjs",
        entryFileNames: "[name].cjs",
        exports: "default",
      },
    },
    minify: false,
    sourcemap: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
});
