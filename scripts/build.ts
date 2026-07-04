import { createWriteStream, mkdirSync, readdirSync, rmSync } from "node:fs";
import { join, basename, relative, dirname } from "node:path";

import { ZipArchive } from "archiver";

import { compileMo } from "./i18n";
import {
  run,
  cpFile,
  findFiles,
  ensureDir,
  step,
  ok,
  info,
  DIST,
  ROOT,
  UUID,
  runAsMain,
} from "./utils";

// ---------------------------------------------------------------------------
// UI helpers
// ---------------------------------------------------------------------------

/** Compiles every resources/ui/**\/*.blp Blueprint file into src/ui/**\/*.ui. */
export async function buildUi(): Promise<void> {
  const blpFiles = await findFiles(["resources/ui/**/*.blp"]);
  if (blpFiles.length === 0) return;
  step(`Compiling ${blpFiles.length} Blueprint file(s) -> src/ui`);

  const rels = blpFiles.map((blp) => relative(join(ROOT, "resources/ui"), blp));
  for (const rel of rels) {
    const out = join(ROOT, "src/ui", rel.replace(/\.blp$/, ".ui"));
    mkdirSync(dirname(out), { recursive: true });
  }

  await run("blueprint-compiler", [
    "batch-compile",
    join(ROOT, "src/ui"),
    join(ROOT, "resources/ui"),
    ...blpFiles,
  ]);

  for (const blp of blpFiles) {
    const rel = relative(join(ROOT, "resources/ui"), blp);
    info(`${blp} -> src/ui/${rel.replace(/\.blp$/, ".ui")}`);
  }

  ok(`Blueprint compiled (${blpFiles.length} file(s))`);
}

/** Copies compiled src/ui/**\/*.ui files into dist/ui, preserving structure. */
export async function copyUi(): Promise<void> {
  const uiFiles = await findFiles(["src/ui/**/*.ui"]);
  step(`Copying ${uiFiles.length} UI file(s) -> dist/ui`);

  for (const ui of uiFiles) {
    const rel = relative(join(ROOT, "src/ui"), join(ROOT, ui));
    const dest = join(DIST, "ui", rel);
    ensureDir(dirname(dest));
    cpFile(ui, dest);
    info(`${ui} -> ${relative(ROOT, dest)}`);
  }

  ok(`UI files copied (${uiFiles.length} file(s))`);
}

// ---------------------------------------------------------------------------
// Build helpers
// ---------------------------------------------------------------------------

async function compileSchemas(): Promise<void> {
  step("Compiling GSettings schemas");
  await run("glib-compile-schemas", ["schemas"]);
  ok("Schemas compiled");
}

async function copyAssets(): Promise<void> {
  step("Copying static assets -> dist");

  cpFile(join(ROOT, "metadata.json"), join(DIST, "metadata.json"));
  info("metadata.json");

  cpFile(join(ROOT, "schemas"), join(DIST, "schemas"));
  info("schemas/");

  const nautilusEntries = readdirSync(join(ROOT, "nautilus-extension"));
  for (const entry of nautilusEntries) {
    cpFile(join(ROOT, "nautilus-extension", entry), join(DIST, entry));
    info(`nautilus-extension/${entry}`);
  }

  cpFile(join(ROOT, "resources/ui/icons"), join(DIST, "ui", "icons"));
  info("resources/ui/icons/");

  ok("Assets copied");
}

async function zipDist(): Promise<void> {
  const zipPath = join(ROOT, `${UUID}.shell-extension.zip`);
  step(`Packing dist/ -> ${basename(zipPath)}`);

  const output = createWriteStream(zipPath);
  const archive = new ZipArchive({ zlib: { level: 9 } });

  // Wait for the write stream to actually close, not just for archiver to
  // finish reading — finalize() alone can resolve before bytes hit disk.
  const closed = new Promise<void>((resolvePromise, reject) => {
    output.on("close", resolvePromise);
    archive.on("error", reject);
  });

  archive.pipe(output);
  archive.directory(DIST, false);
  await archive.finalize();
  await closed;

  ok(`Created ${basename(zipPath)} (${(archive.pointer() / 1024).toFixed(1)} KiB)`);
}

async function clear(): Promise<void> {
  step("Clearing previous build artifacts");
  rmSync(DIST, { recursive: true, force: true });
  const zipFiles = await findFiles(["*.shell-extension.zip"]);
  for (const zip of zipFiles) {
    rmSync(zip);
  }
  ok("Build artifacts cleared");
}

/** Full build: clean, compile Blueprint + TypeScript, copy UI, compile MO,
 *  compile schemas, copy assets, and package into a shell-extension.zip.
 *
 *  When `ci` is true, skips `buildUi()` — the `.ui` files are pre-compiled
 *  and committed, so blueprint-compiler is not needed in CI. */
export async function pack(ci = false): Promise<void> {
  await clear();
  if (!ci) {
    await buildUi();
  }
  step("Compiling TypeScript (src -> dist)");
  await run("tsc", ["-p", "tsconfig.json"]);
  ok("TypeScript compiled");
  await copyUi();
  await compileMo();
  await compileSchemas();
  await copyAssets();
  await zipDist();
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const uiOnly = args.includes("--ui");
  const dryRun = args.includes("--dry-run");
  const ci = args.includes("--ci");

  if (uiOnly) {
    await buildUi();
  } else if (dryRun) {
    await clear();
    if (!ci) {
      await buildUi();
    }
    step("Compiling TypeScript (src -> dist)");
    await run("tsc", ["-p", "tsconfig.json"]);
    ok("TypeScript compiled");
    await copyUi();
    await compileMo();
    await compileSchemas();
    await copyAssets();
  } else {
    await pack(ci);
  }
}

await runAsMain(import.meta.url, main);
