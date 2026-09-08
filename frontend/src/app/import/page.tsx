import { RequireAuth } from "@/components/providers/require-auth";
import { ImportShell } from "@/components/import/import";

export default function ImportPage() {
  return (
    <RequireAuth>
      <ImportShell />
    </RequireAuth>
  );
}
