export interface SchemaType {
  settingsVersion: number;
  submenu: boolean;
  applications: string[];
}

export interface Application {
  id: string;
  appId: string;
  name: string;
  icon: string;
  pinned: boolean;
  multipleFiles: boolean;
  multipleFolders: boolean;
  packageType: "Flatpak" | "AppImage" | "Native";
  mimeTypes?: string[];
  enable: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  isDuplicate: boolean;
  isEmpty: boolean;
}

/**
 * The raw extension metadata from metadata.json.
 * This type matches the MetadataJson interface from GNOME Shell 49+
 * @see https://gitlab.gnome.org/GNOME/gnome-shell/-/blob/main/js/extensions/sharedInternals.js
 */
export interface MetadataJson extends Record<string, any> {
  readonly uuid: string;
  readonly name: string;
  readonly description: string;
  readonly "shell-version": readonly string[];
  readonly version?: string;
  readonly url?: string;
  readonly "settings-schema"?: string;
  readonly "gettext-domain"?: string;
}
