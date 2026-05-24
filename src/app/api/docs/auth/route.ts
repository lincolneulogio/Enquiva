import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { PERMISSIONS, getDefaultPermissionMatrix, normalizeRole, type Permission } from "@/lib/auth/rbac";

export async function GET(req: Request) {
    try {
        const origin = req.headers.get("origin");
        const headersList = new Headers();
        
        // Permitir CORS para localhost (Astro)
        if (origin && (origin.includes("localhost") || origin.includes("127.0.0.1"))) {
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
        const defaults = getDefaultPermissionMatrix();
        
        let userPermissions = Object.keys(defaults[role]).filter(p => defaults[role][p as Permission]);

        // Obtenemos overrides de la DB
        if (role !== "super_admin") {
            const overrides = await db.query.rolePermissions.findMany({
                where: (table, { eq }) => eq(table.roleName, role)
            });
            
            for (const row of overrides) {
                const p = row.permission as Permission;
                if (PERMISSIONS.includes(p)) {
                    if (row.allowed && !userPermissions.includes(p)) {
                        userPermissions.push(p);
                    } else if (!row.allowed && userPermissions.includes(p)) {
                        userPermissions = userPermissions.filter(up => up !== p);
                    }
                }
            }
        } else {
             userPermissions = [...PERMISSIONS];
        }

        return NextResponse.json({
            role: role,
            permissions: userPermissions
        }, { headers: headersList });

    } catch (error) {
        console.error("Docs Auth API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function OPTIONS(req: Request) {
    const origin = req.headers.get("origin");
    const headersList = new Headers();
    if (origin && (origin.includes("localhost") || origin.includes("127.0.0.1"))) {
        headersList.set("Access-Control-Allow-Origin", origin);
        headersList.set("Access-Control-Allow-Credentials", "true");
        headersList.set("Access-Control-Allow-Methods", "GET, OPTIONS");
        headersList.set("Access-Control-Allow-Headers", "Content-Type, Authorization, Cookie");
    }
    return new NextResponse(null, { status: 204, headers: headersList });
}
