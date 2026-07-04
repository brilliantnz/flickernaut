import { pack } from "./build";
import { run, step, ok, UUID, runAsMain } from "./utils";

/** Builds a shell-extension.zip and installs it via `gnome-extensions install`. */
export async function install(): Promise<void> {
  await pack();

  step(`Installing ${UUID}`);
  await run("gnome-extensions", ["install", "-f", `${UUID}.shell-extension.zip`]);
  ok(`Installed ${UUID}. Restart GNOME Shell (Alt+F2, r) or log out/in to load it.`);
}

await runAsMain(import.meta.url, install);
