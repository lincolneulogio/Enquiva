import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getEffectivePermissionsForRole } from "@/lib/auth/effective-permissions";
import { normalizeRole } from "@/lib/auth/rbac";

export async function GET(req: Request) {
    try {
        const origin = req.headers.get("origin");
        const headersList = new Headers();
        
        // Permitir CORS para localhost (Astro) y dominios autorizados de Eventia
        if (origin && (
            origin.includes("localhost") || 
            origin.includes("127.0.0.1") || 
            origin.includes("eventia.app") ||
            origin.includes("eventia.site") ||
            origin.includes("encuentrodefe.site") ||
            origin.includes("encuentrodefe.org")
        )) {
            headersList.set("Access-Control-Allow-Origin", origin);
            headersList.set("Access-Control-Allow-Credentials", "true");
        }

        const session = await auth.api.getSession({ headers: await headers() });
        
        if (!session?.user) {
            return NextResponse.json({ 
                role: "guest", 
                permissions: [] 
            }, { headers: headersList });
        }

        const role = normalizeRole(session.user.role);
        const userPermissions = await getEffectivePermissionsForRole(role);

        return NextResponse.json({
            role: role,
            permissions: userPermissions,
            user: {
                name: session.user.name,
                email: session.user.email,
                image: session.user.image,
                role: session.user.role // original role for display
            }
        }, { headers: headersList });

    } catch (error) {
        console.error("Docs Auth API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function OPTIONS(req: Request) {
    const origin = req.headers.get("origin");
    const headersList = new Headers();
    if (origin && (
        origin.includes("localhost") || 
        origin.includes("127.0.0.1") || 
        origin.includes("eventia.app") ||
        origin.includes("eventia.site") ||
        origin.includes("encuentrodefe.site") ||
        origin.includes("encuentrodefe.org")
    )) {
        headersList.set("Access-Control-Allow-Origin", origin);
        headersList.set("Access-Control-Allow-Credentials", "true");
        headersList.set("Access-Control-Allow-Methods", "GET, OPTIONS");
        headersList.set("Access-Control-Allow-Headers", "Content-Type, Authorization, Cookie");
    }
    return new NextResponse(null, { status: 204, headers: headersList });
}
