import { defineConfig } from "oxfmt";

export default defineConfig({
  printWidth: 100,
  sortImports: true,
  sortPackageJson: {
    sortScripts: true,
  },
  ignorePatterns: [
    ".agents",
    ".output",
    "build",
    "dist",
    "assets",
    "nautilus-extension",
    "po",
    "resources",
    "schemas",
    "pnpm-lock.yaml",
    "package-lock.json",
    "yarn.lock",
    "bun.lock",
    "pnpm-workspace.yaml",
  ],
});
