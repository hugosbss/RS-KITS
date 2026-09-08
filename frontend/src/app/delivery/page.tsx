import { RequireAuth } from "@/components/providers/require-auth";
import { DeliveryShell } from "@/components/delivery/delivery";

export default function DeliveryPage() {
  return (
    <RequireAuth>
      <DeliveryShell />
    </RequireAuth>
  );
}
