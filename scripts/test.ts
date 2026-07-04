import { rmSync } from "node:fs";
import { join } from "node:path";

import { pack } from "./build";
import { run, cpFile, findFiles, step, ok, info, extPath, ROOT, UUID, runAsMain } from "./utils";

/** Default: packs, deploys dist/ into the extension dir, opens the prefs window. */
async function testDefault(): Promise<void> {
  await pack();

  const extDir = extPath();
  step(`Deploying dist/ -> ${extDir}`);
  rmSync(extDir, { recursive: true, force: true });
  cpFile(join(ROOT, "dist"), extDir);
  ok("Deployed");

  step("Opening extension preferences");
  await run("gnome-extensions", ["prefs", UUID]);
}

/** Deploys the Nautilus (Python) side of the extension. */
async function testPy(): Promise<void> {
  const flickernautDir = extPath("Flickernaut");
  const entryFile = extPath("nautilus-flickernaut.py");

  step("Removing previous Nautilus extension files");
  rmSync(flickernautDir, { recursive: true, force: true });
  rmSync(entryFile, { force: true });

  step("Deploying Nautilus extension files");
  const files = await findFiles(["nautilus-extension/**/*"]);
  for (const file of files) {
    const rel = file.replace(/^nautilus-extension\//, "");
    cpFile(join(ROOT, file), extPath(rel));
    info(rel);
  }

  ok("Nautilus extension deployed. Restart Nautilus with: nautilus -q");
}

/** Launches a nested GNOME Shell (Wayland) session for interactive testing. */
async function testShell(): Promise<void> {
  step("Starting nested GNOME Shell session");
  await run("dbus-run-session", ["--", "gnome-shell", "--nested", "--wayland"], {
    env: {
      ...process.env,
      GNOME_SHELL_SLOWDOWN_FACTOR: "2",
      MUTTER_DEBUG_DUMMY_MODE_SPECS: "1500x1000",
      MUTTER_DEBUG_DUMMY_MONITOR_SCALES: "1",
    },
  });
}

const HANDLERS = {
  "--py": testPy,
  "--shell": testShell,
} as const;

async function main(): Promise<void> {
  const flag = process.argv.slice(2).find((arg): arg is keyof typeof HANDLERS => arg in HANDLERS);
  const handler = flag ? HANDLERS[flag] : testDefault;
  await handler();
}

await runAsMain(import.meta.url, main);
