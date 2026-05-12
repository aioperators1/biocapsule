import { readJsonFile, writeJsonFile } from './data';

export interface Settings {
  facebookPixelId?: string;
  facebookAccessToken?: string;
  snapchatPixelId?: string;
  tiktokPixelId?: string;
}

const DEFAULT_SETTINGS: Settings = {
  facebookPixelId: "",
  facebookAccessToken: "",
  snapchatPixelId: "",
  tiktokPixelId: ""
};

export function getSettings(): Settings {
  try {
    return readJsonFile<Settings>('settings.json', DEFAULT_SETTINGS);
  } catch (error) {
    console.error("Error reading settings:", error);
    return DEFAULT_SETTINGS;
  }
}

export function updateSettings(newSettings: Partial<Settings>): Settings {
  const currentSettings = getSettings();
  const updatedSettings = { ...currentSettings, ...newSettings };
  writeJsonFile('settings.json', updatedSettings);
  return updatedSettings;
}
