"use client";

import { DeveloperSettings } from "./developer-settings";
import { OpenAISettings } from "./openai-settings";
import { ThemeSettings } from "./theme-settings";

export default function SettingsPage() {
  return (
    <>
      <h1 className="text-4xl font-bold">Settings</h1>

      <div className="grid grid-cols-3 gap-4">
        <OpenAISettings />
        <DeveloperSettings />
        <ThemeSettings />
      </div>
    </>
  );
}
