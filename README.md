# GNOME Shell Extension - Flickernaut

[<img src="assets/get_it_on_gnome_extensions.png" height="65" align="center">](https://extensions.gnome.org/extension/8101/flickernaut/)
![GitHub](https://img.shields.io/github/license/brilliantnz/flickernaut)
[![Weblate project translated](https://hosted.weblate.org/widgets/flickernaut/-/flickernaut/svg-badge.svg)](https://hosted.weblate.org/engage/flickernaut/)
![GitHub issues](https://img.shields.io/github/issues/brilliantnz/flickernaut)
![GitHub last commit](https://img.shields.io/github/last-commit/brilliantnz/flickernaut)
![GitHub stars](https://img.shields.io/github/stars/brilliantnz/flickernaut)

A GNOME extension that adds custom entries to the Nautilus context menu for your installed dev tools, IDEs, and custom apps.

## Screenshots

<p align="center">
    <img src="assets/preview2.png" alt="Flickernaut Preview" style="width: 55%;" />
</p>

<p align="center">
    <img src="assets/preview1.png" alt="Flickernaut Preview" style="width: 30%;" />
    <img src="assets/preview3.png" alt="Flickernaut Preview" style="width: 30%;" />
    <img src="assets/preview4.png" alt="Flickernaut Preview" style="width: 30%;" />
</p>

## Requirements

To use this extension, you need the `nautilus-python` package. This provides Python bindings for Nautilus extensions.

### Fedora

```bash
sudo dnf install nautilus-python
```

### Ubuntu / Debian

```bash
sudo apt install python3-nautilus gir1.2-nautilus-3.0
```

### Arch Linux

```bash
sudo pacman -S nautilus-python
```

> [!NOTE]
> After changing extension preferences, restart Nautilus with `nautilus -q` for changes to take effect.

## Development

### Prerequisites

Install the following system dependencies before building:

| Tool                   | Fedora                                                              | Ubuntu / Debian      | Arch Linux           |
| ---------------------- | ------------------------------------------------------------------- | -------------------- | -------------------- |
| `blueprint-compiler`   | `blueprint-compiler`                                                | `blueprint-compiler` | `blueprint-compiler` |
| `gettext`              | `gettext`                                                           | `gettext`            | `gettext`            |
| `glib-compile-schemas` | `glib2-devel`                                                       | `libglib2.0-bin`     | `glib2-devel`        |
| Node.js (>= 24)        | `nodejs`                                                            | `nodejs`             | `nodejs`             |
| pnpm                   | [corepack](https://nodejs.org/api/corepack.html) or `npm i -g pnpm` |                      |                      |

#### Fedora

```bash
sudo dnf install blueprint-compiler gettext glib2-devel nodejs
```

#### Ubuntu / Debian

```bash
sudo apt install blueprint-compiler gettext libglib2.0-bin nodejs
```

#### Arch Linux

```bash
sudo pacman -S blueprint-compiler gettext glib2-devel nodejs
```

Enable corepack to use pnpm:

```bash
corepack enable pnpm
```

### Building

```bash
git clone https://github.com/brilliantnz/flickernaut
cd flickernaut
pnpm install
pnpm build:ui       # compile .blp Blueprint files → .ui
pnpm build          # full build → .shell-extension.zip
```

The build uses the `--ci` flag in CI environments (GitHub Actions), which skips the Blueprint compilation step since `.ui` files are pre-compiled and committed. For local development you must run `pnpm build:ui` after editing `.blp` files.

### Available Scripts

| Script                   | Description                                                                       |
| ------------------------ | --------------------------------------------------------------------------------- |
| `pnpm build`             | Full build: clean, compile TypeScript, copy assets, create `.shell-extension.zip` |
| `pnpm build:ui`          | Compile Blueprint (`.blp`) files to `.ui` only                                    |
| `pnpm build:dry-run`     | Build without creating the zip (used in CI)                                       |
| `pnpm test`              | Build and deploy the extension, then open preferences                             |
| `pnpm test:py`           | Deploy Nautilus extension files                                                   |
| `pnpm test:shell`        | Start a nested GNOME Shell (Wayland) session for testing                          |
| `pnpm install:extension` | Build and install the extension via `gnome-extensions install`                    |
| `pnpm format`            | Format source code                                                                |
| `pnpm lint`              | Lint source code                                                                  |
| `pnpm typecheck`         | Run TypeScript type checking                                                      |
| `pnpm i18n:generate`     | Extract translatable strings                                                      |
| `pnpm i18n:merge`        | Merge translations                                                                |
| `pnpm i18n:compile`      | Compile translations to `.mo` files                                               |

### UI Development

UI files are written in [Blueprint](https://gitlab.gnome.org/jwestman/blueprint-compiler), a markup language for GTK user interfaces. Edit `.blp` files in `resources/ui/`, then compile them:

```bash
pnpm build:ui
```

The compiled `.ui` files are output to `src/ui/` and committed to the repository so CI builds can skip the Blueprint step.

### Testing

After building, deploy and test the extension:

```bash
pnpm test             # build + deploy + open preferences
pnpm test:py          # deploy nautilus extension only
pnpm test:shell       # nested GNOME Shell (Wayland) session
```

Reload GNOME Shell after installing (Alt+F2, `r` — X11 only).

### Viewing Logs

```bash
# extension preferences
journalctl -o cat -f /usr/bin/gjs

# nautilus extension
journalctl -o cat -f /usr/bin/nautilus
```

## Translations

Help translate the extension on [Weblate](https://hosted.weblate.org/engage/flickernaut) or by opening a pull request.

[![Translation status](https://hosted.weblate.org/widget/flickernaut/multi-auto.svg)](https://hosted.weblate.org/engage/flickernaut/)

## License

GPL-3.0-or-later
