import type Gio from 'gi://Gio';
import type { PackageCheckResult } from '../../../@types/types.js';
import GLib from 'gi://GLib';

/**
 * Generates a random alphanumeric ID, with a length of 12 characters.
 *
 * @returns {string} Randomly generated 12-character ID
 */
export function generateId(): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let id = '';
    for (let i = 0; i < 12; i++) {
        const random = Math.floor(Math.random() * characters.length);
        id += characters[random];
    }
    return id;
}

/**
 * Checks the installation status and type of a given application package.
 *
 * Determines whether the application is a Flatpak, AppImage, or Native package
 * based on its executable, and verifies if it is installed on the system.
 *
 * - For Flatpak: Checks if the Flatpak binary exists in standard Flatpak export directories.
 * - For AppImage: Checks if the AppImage binary exists and is executable.
 * - For Native: Checks if the native binary exists and is executable.
 *
 * @param appInfo - The Gio.AppInfo object representing the application to check.
 * @returns An object containing the package type (`'Flatpak'`, `'AppImage'`, or `'Native'`)
 *          and a boolean indicating whether the package is installed.
 */
export function checkPackage(appInfo: Gio.AppInfo): PackageCheckResult {
    const appId = appInfo.get_id() ?? '';

    let type: 'Flatpak' | 'AppImage' | 'Native';
    let installed = false;

    const executable = appInfo.get_executable();
    if (executable.endsWith('flatpak')) {
        type = 'Flatpak';
        // Flatpak: check if flatpak app binary is exists
        const flatpakDirs: string[] = [
            GLib.build_filenamev([GLib.get_user_data_dir(), 'flatpak', 'exports', 'bin']),
            '/var/lib/flatpak/exports/bin',
        ];

        const binName = appId.replace('.desktop', '');

        for (const binDir of flatpakDirs) {
            const binPath = GLib.build_filenamev([binDir, binName]);
            if (GLib.file_test(binPath, GLib.FileTest.EXISTS)) {
                installed = true;
                break;
            }
        }
    }
    else if (executable.endsWith('.appimage')) {
        type = 'AppImage';
        // AppImage: check if appimage binary exists and is executable
        if (
            GLib.path_is_absolute(executable)
            && GLib.file_test(executable, GLib.FileTest.EXISTS | GLib.FileTest.IS_EXECUTABLE)
        ) {
            installed = true;
        }
    }
    else {
        type = 'Native';
        // Native: check if binary exists and is executable
        if (
            GLib.path_is_absolute(executable)
            && GLib.file_test(executable, GLib.FileTest.EXISTS | GLib.FileTest.IS_EXECUTABLE)
        ) {
            installed = true;
        }
        else {
            const binPath = GLib.find_program_in_path(executable);
            const exists = binPath && GLib.file_test(binPath, GLib.FileTest.EXISTS);
            const isExec = binPath && GLib.file_test(binPath, GLib.FileTest.IS_EXECUTABLE);
            if (binPath && exists && isExec) {
                installed = true;
            }
        }
    }

    return { type, installed };
}
