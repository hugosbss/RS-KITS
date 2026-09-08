import { RequireAuth } from "@/components/providers/require-auth";
import { SettingsShell } from "@/components/settings/settings";

export default function SettingsPage() {
  return (
    <RequireAuth>
      <SettingsShell />
    </RequireAuth>
  );
}
