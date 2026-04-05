import path from "node:path";
import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const rootDir = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: "@alishoddiqien/fluent-report/builder",
        replacement: path.resolve(rootDir, "../src/builder-entry.ts"),
      },
      {
        find: "@alishoddiqien/fluent-report/react",
        replacement: path.resolve(rootDir, "../src/react-entry.ts"),
      },
      {
        find: "@alishoddiqien/fluent-report",
        replacement: path.resolve(rootDir, "../src/index.ts"),
      },
    ],
  },
  server: {
    port: 5174,
    open: true,
  },
});
