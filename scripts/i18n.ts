import { basename, join } from "node:path";

import { run, findFiles, ensureDir, step, ok, info, ROOT, DIST, UUID, runAsMain } from "./utils";

interface Source {
  label: string;
  patterns: string[];
  extra: string[];
}

const SOURCES: Source[] = [
  { label: "UI", patterns: ["src/ui/**/*.ui"], extra: [] },
  { label: "Python", patterns: ["nautilus-extension/**/*.py"], extra: ["--join-existing"] },
  {
    label: "TypeScript",
    patterns: ["src/**/*.ts"],
    extra: ["--language=JavaScript", "--join-existing"],
  },
];

/** Extracts translatable strings from sources into a POT template file. */
async function generate(): Promise<void> {
  const potFile = join(ROOT, "po", `${UUID}.pot`);
  step(`Extracting translatable strings -> po/${UUID}.pot`);

  for (const { label, patterns, extra } of SOURCES) {
    const files = await findFiles(patterns);
    if (files.length === 0) continue;

    await run("xgettext", [
      "--from-code=UTF-8",
      `--package-name=${UUID}`,
      `--output=${potFile}`,
      ...extra,
      ...files,
    ]);
    info(`${label}: ${files.length} file(s)`);
  }

  ok(`POT file generated: po/${UUID}.pot`);
}

/** Merges the POT template into every po/*.po translation file. */
async function merge(): Promise<void> {
  const poFiles = await findFiles(["po/*.po"]);
  const potFile = join(ROOT, "po", `${UUID}.pot`);
  step(`Merging translations into ${poFiles.length} PO file(s)`);

  for (const po of poFiles) {
    await run("msgmerge", ["-q", "-U", "--backup=off", po, potFile]);
    info(po);
  }

  ok("Translations merged");
}

/** Compiles every po/*.po translation file into dist/locale/<lang>/LC_MESSAGES/<uuid>.mo. */
export async function compileMo(): Promise<void> {
  const poFiles = await findFiles(["po/*.po"]);
  step(`Compiling ${poFiles.length} translation file(s) -> dist/locale`);

  for (const po of poFiles) {
    const locale = basename(po, ".po");
    const dir = join(DIST, "locale", locale, "LC_MESSAGES");
    ensureDir(dir);
    const out = join(dir, `${UUID}.mo`);
    await run("msgfmt", ["-o", out, po]);
    info(`${po} -> dist/locale/${locale}/LC_MESSAGES/${UUID}.mo`);
  }

  ok(`Translations compiled (${poFiles.length} locale(s))`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const hasGenerate = args.includes("--generate");
  const hasMerge = args.includes("--merge");
  const hasCompile = args.includes("--compile");

  if (hasCompile) {
    await compileMo();
  } else if (hasGenerate && hasMerge) {
    await generate();
    await merge();
  } else if (hasGenerate) {
    await generate();
  } else if (hasMerge) {
    throw new Error("--merge can only be used together with --generate");
  } else {
    throw new Error("No valid flag provided. Use --generate, --generate --merge, or --compile");
  }
}

await runAsMain(import.meta.url, main);
