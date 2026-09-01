import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    server: "src/server.ts",
    "migrate-sqlite": "src/scripts/migrate-sqlite.ts",
  },
  format: ["esm"],
  sourcemap: true,
  clean: true,
  noExternal: ["@bonjotan/content"]
});
