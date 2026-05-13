import { supabase } from './supabase';

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

export async function getSettings(): Promise<Settings> {
  try {
    const { data: doc } = await supabase
      .from('metadata')
      .select('data')
      .eq('id', 'settings')
      .single();
      
    if (!doc) return DEFAULT_SETTINGS;
    return doc.data as Settings;
  } catch (error) {
    console.error("Error reading settings:", error);
    return DEFAULT_SETTINGS;
  }
}

export async function updateSettings(newSettings: Partial<Settings>): Promise<Settings> {
  const currentSettings = await getSettings();
  const updatedSettings = { ...currentSettings, ...newSettings };
  await supabase
    .from('metadata')
    .upsert({ id: 'settings', data: updatedSettings });
  return updatedSettings;
}
