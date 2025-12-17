export interface ConvertedImage {
  id: string;
  originalName: string;
  url: string; // Blob URL
  blob: Blob;
  size: number;
  originalSize: number;
}

export enum SaveMethod {
  BROWSER_DOWNLOAD = 'browser',
  DEVICE_FS = 'device'
}

export interface ThemeSettings {
  primaryColor: string;
  backgroundColor: string;
  surfaceColor: string;
}

export interface AppSettings {
  defaultQuality: number; // 1-100
  saveMethod: SaveMethod;
  theme: ThemeSettings;
}

export interface ConversionStatus {
  total: number;
  processed: number;
  isConverting: boolean;
  currentFile?: string;
}