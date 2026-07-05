import { revalidatePath } from "next/cache";

/** Invalida rutas de panel admin y superadmin (mismas páginas compartidas). */
export function revalidateStaffDashboardPaths(...segments: string[]) {
  for (const segment of segments) {
    const suffix = segment ? (segment.startsWith("/") ? segment : `/${segment}`) : "";
    revalidatePath(`/admin${suffix}`);
    revalidatePath(`/superadmin${suffix}`);
  }
}
