import { cpSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { execa, type Options } from "execa";
import { glob } from "tinyglobby";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const ROOT = resolve(__dirname, "..");
export const DIST = join(ROOT, "dist");

const metadata = JSON.parse(readFileSync(join(ROOT, "metadata.json"), "utf-8"));
export const UUID: string = metadata.uuid;

const EXT_DIR = join(process.env.HOME!, ".local/share/gnome-shell/extensions", UUID);

export function extPath(...segments: string[]): string {
  return join(EXT_DIR, ...segments);
}

// ---------------------------------------------------------------------------
// Logging
// ---------------------------------------------------------------------------

const paint = (code: number, s: string): string => `\x1b[${code}m${s}\x1b[0m`;

/** Announces the start of a build step, e.g. "→ Compiling TypeScript". */
export function step(msg: string): void {
  console.log(`\n${paint(36, "→")} ${msg}`);
}

/** Confirms a step finished, e.g. "✓ Compiled 12 files". */
export function ok(msg: string): void {
  console.log(`${paint(32, "✓")} ${msg}`);
}

/** An indented detail line under the current step (e.g. per-file progress). */
export function info(msg: string): void {
  console.log(`  ${paint(2, msg)}`);
}

/** Reports a failure. */
export function fail(msg: string): void {
  console.error(`${paint(31, "✗")} ${msg}`);
}

// ---------------------------------------------------------------------------
// Process / filesystem helpers
// ---------------------------------------------------------------------------

export async function run(
  cmd: string,
  args: string[] = [],
  opts?: Options & { cwd?: string },
): Promise<void> {
  await execa(cmd, args, {
    cwd: opts?.cwd ?? ROOT,
    stdio: "inherit",
    ...opts,
  });
}

export async function findFiles(patterns: string[], cwd?: string): Promise<string[]> {
  return glob(patterns, { cwd: cwd ?? ROOT });
}

export function cpFile(src: string, dest: string): void {
  mkdirSync(dirname(dest), { recursive: true });
  cpSync(src, dest, { recursive: true });
}

export function ensureDir(dir: string): void {
  mkdirSync(dir, { recursive: true });
}

// ---------------------------------------------------------------------------
// Entry-point helper
// ---------------------------------------------------------------------------

function isMain(metaUrl: string): boolean {
  const script = process.argv[1];
  if (!script) return false;
  return fileURLToPath(metaUrl) === resolve(script);
}

/**
 * Runs `fn` only when this file was invoked directly (`node scripts/foo.ts`),
 * not when another script merely imports it. Centralises the isMain/try-catch/
 * exit-code boilerplate that used to be duplicated in every script.
 */
export async function runAsMain(metaUrl: string, fn: () => Promise<void>): Promise<void> {
  if (!isMain(metaUrl)) return;
  try {
    await fn();
  } catch (err) {
    fail(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}
