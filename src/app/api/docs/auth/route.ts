import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getEffectivePermissionsForRole } from "@/lib/auth/effective-permissions";
import {
  DOCS_VIEW_PERMISSIONS,
  getDocsViewPermissionsForRole,
  normalizeRole,
  type Permission,
} from "@/lib/auth/rbac";
import { isDocsCorsOriginAllowed } from "@/lib/docs/cors";

function corsHeaders(origin: string | null): Headers {
  const headersList = new Headers();
  if (origin && isDocsCorsOriginAllowed(origin)) {
    headersList.set("Access-Control-Allow-Origin", origin);
    headersList.set("Access-Control-Allow-Credentials", "true");
    headersList.set("Vary", "Origin");
  }
  return headersList;
}

/**
 * Visibilidad del portal /docs ligada a la página Permisos:
 * 1) Matriz efectiva (defaults + overrides BD) — mismos toggles docs:view:*
 * 2) Tope por rol: cada rol solo puede recibir las docs de su guía
 *    (salvo super_admin, que ve todas). Así un override viejo no abre
 *    Guías de Miembro/Organizador/Dev a un Admin.
 */
function resolveDocsPortalPermissions(
  role: ReturnType<typeof normalizeRole>,
  effective: Permission[],
): Permission[] {
  const roleCap = new Set(getDocsViewPermissionsForRole(role));
  return effective.filter(
    (permission) =>
      DOCS_VIEW_PERMISSIONS.includes(
        permission as (typeof DOCS_VIEW_PERMISSIONS)[number],
      ) && roleCap.has(permission),
  );
}

export async function GET(req: Request) {
  try {
    const origin = req.headers.get("origin");
    const headersList = corsHeaders(origin);

    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return NextResponse.json(
        {
          role: "guest",
          permissions: [],
          user: null,
        },
        { status: 401, headers: headersList },
      );
    }

    const role = normalizeRole(session.user.role);
    const effective = await getEffectivePermissionsForRole(role);
    const permissions = resolveDocsPortalPermissions(role, effective);

    return NextResponse.json(
      {
        role,
        permissions,
        user: {
          name: session.user.name,
          email: session.user.email,
          image: session.user.image,
          role: session.user.role,
        },
      },
      { headers: headersList },
    );
  } catch (error) {
    console.error("Docs Auth API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function OPTIONS(req: Request) {
  const origin = req.headers.get("origin");
  const headersList = corsHeaders(origin);
  if (origin && isDocsCorsOriginAllowed(origin)) {
    headersList.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    headersList.set("Access-Control-Allow-Headers", "Content-Type, Authorization, Cookie");
  }
  return new NextResponse(null, { status: 204, headers: headersList });
}
