import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getEffectivePermissionsForRole } from "@/lib/auth/effective-permissions";
import { normalizeRole } from "@/lib/auth/rbac";
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
        },
        { headers: headersList },
      );
    }

    const role = normalizeRole(session.user.role);
    const userPermissions = await getEffectivePermissionsForRole(role);

    return NextResponse.json(
      {
        role: role,
        permissions: userPermissions,
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
