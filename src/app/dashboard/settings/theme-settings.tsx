import { SunIcon } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";

import { SettingsItem } from "./settings-items";

export function ThemeSettings() {
  return (
    <SettingsItem
      title="Theme"
      description="Configure your theme"
      icon={<SunIcon className="h-5 w-5 text-yellow-500" />}
      dialogContent={<ThemeToggle />}
    />
  );
}
