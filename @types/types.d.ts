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
    packageType: 'Flatpak' | 'AppImage' | 'Native';
    installed: boolean;
    mimeTypes?: string[];
    enable: boolean;
}

export interface ValidationResult {
    isValid: boolean;
    isDuplicate: boolean;
    isEmpty: boolean;
}

export interface PackageCheckResult {
    type: 'Flatpak' | 'AppImage' | 'Native';
    installed: boolean;
}
