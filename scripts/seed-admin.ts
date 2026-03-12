import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@faithevents.com";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "Admin1234!";
const ADMIN_NAME = process.env.SEED_ADMIN_NAME ?? "Super Admin";

async function main() {
    const [existing] = await db
        .select({ id: users.id, email: users.email, role: users.role })
        .from(users)
        .where(eq(users.role, "super_admin"))
        .limit(1);

    if (existing) {
        console.log(`✓ Super admin already exists: ${existing.email}`);
        process.exit(0);
    }

    const result = await auth.api.signUpEmail({
        body: {
            name: ADMIN_NAME,
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD,
        },
    });

    if (!result?.user) {
        throw new Error("Failed to create admin user — check credentials format");
    }

    // Guarantee super_admin role regardless of user count in DB
    await db
        .update(users)
        .set({ role: "super_admin" })
        .where(eq(users.id, result.user.id));

    console.log("✓ Super admin created:");
    console.log(`  Name    : ${ADMIN_NAME}`);
    console.log(`  Email   : ${ADMIN_EMAIL}`);
    console.log(`  Password: ${ADMIN_PASSWORD}`);
    console.log(`  Role    : super_admin`);
    console.log();
    console.log("⚠  Change the password after first login.");
}

main().catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
});
