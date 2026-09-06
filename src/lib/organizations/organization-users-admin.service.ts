import { db } from "@/lib/db";
import {
  organizationMembers,
  users,
} from "@/lib/db/schema";
import { and, eq, count, inArray, or, ilike, desc } from "drizzle-orm";

export class OrganizationUsersAdminService {
  private static buildOrgUsersAdminWhere(
    organizationId: string,
    filters: { search?: string; role?: string },
  ) {
    const orgMemberUserIds = db
      .select({ userId: organizationMembers.userId })
      .from(organizationMembers)
      .where(eq(organizationMembers.organizationId, organizationId));

    const conditions = [
      or(eq(users.organizationId, organizationId), inArray(users.id, orgMemberUserIds)),
    ];

    if (filters.role) {
      conditions.push(
        eq(users.role, filters.role as "member" | "organizer" | "admin" | "super_admin"),
      );
    }

    const search = filters.search?.trim();
    if (search) {
      const pattern = `%${search}%`;
      conditions.push(
        or(
          ilike(users.name, pattern),
          ilike(users.email, pattern),
          ilike(users.phone, pattern),
        )!,
      );
    }

    return and(...conditions);
  }

  private static orgUsersAdminMemberJoin(organizationId: string) {
    return and(
      eq(organizationMembers.userId, users.id),
      eq(organizationMembers.organizationId, organizationId),
    );
  }

  static async countOrganizationUsersForAdmin(
    organizationId: string,
    filters: { search?: string; role?: string } = {},
  ) {
    const where = this.buildOrgUsersAdminWhere(organizationId, filters);
    const [{ total }] = await db
      .select({ total: count() })
      .from(users)
      .leftJoin(organizationMembers, this.orgUsersAdminMemberJoin(organizationId))
      .where(where);

    return total ?? 0;
  }

  static async listOrganizationUsersForAdmin(input: {
    organizationId: string;
    search?: string;
    role?: string;
    limit: number;
    offset: number;
  }) {
    const where = this.buildOrgUsersAdminWhere(input.organizationId, input);
    return db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        emailVerified: users.emailVerified,
        isActive: users.isActive,
        lastSeenAt: users.lastSeenAt,
        role: users.role,
        createdAt: users.createdAt,
        memberStatus: organizationMembers.status,
        memberRole: organizationMembers.role,
      })
      .from(users)
      .leftJoin(organizationMembers, this.orgUsersAdminMemberJoin(input.organizationId))
      .where(where)
      .orderBy(desc(users.createdAt))
      .limit(input.limit)
      .offset(input.offset);
  }
}
