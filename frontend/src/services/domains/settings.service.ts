import { fetchSettings, updateSettings } from "../api";

export const settingsService = {
  get: fetchSettings,
  update: updateSettings
};
