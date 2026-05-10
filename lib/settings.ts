import fs from 'fs';
import path from 'path';

export interface Settings {
  facebookPixelId?: string;
  facebookAccessToken?: string;
  snapchatPixelId?: string;
  tiktokPixelId?: string;
}

const settingsFilePath = path.join(process.cwd(), 'data', 'settings.json');

export function getSettings(): Settings {
  try {
    if (!fs.existsSync(settingsFilePath)) {
      const defaultSettings: Settings = {
        facebookPixelId: "",
        facebookAccessToken: "",
        snapchatPixelId: "",
        tiktokPixelId: ""
      };
      fs.mkdirSync(path.join(process.cwd(), 'data'), { recursive: true });
      fs.writeFileSync(settingsFilePath, JSON.stringify(defaultSettings, null, 2));
      return defaultSettings;
    }
    const data = fs.readFileSync(settingsFilePath, 'utf-8');
    return JSON.parse(data || '{}');
  } catch (error) {
    console.error("Error reading settings:", error);
    return {};
  }
}

export function updateSettings(newSettings: Partial<Settings>): Settings {
  const currentSettings = getSettings();
  const updatedSettings = { ...currentSettings, ...newSettings };
  fs.writeFileSync(settingsFilePath, JSON.stringify(updatedSettings, null, 2));
  return updatedSettings;
}
