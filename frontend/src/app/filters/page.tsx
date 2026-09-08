import { RequireAuth } from "@/components/providers/require-auth";
import { Filters } from "@/components/filters/filters";

export default function FiltersPage() {
  return (
    <RequireAuth>
      <Filters />
    </RequireAuth>
  );
}
