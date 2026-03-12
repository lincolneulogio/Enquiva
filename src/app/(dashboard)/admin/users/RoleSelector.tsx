"use client";

import { updateUserRole } from "@/actions/admin";
import { useTransition } from "react";
import { toast } from "sonner";

type Role = "member" | "organizer" | "super_admin";

interface RoleSelectorProps {
    userId: string;
    currentRole: Role;
    currentUserId: string;
}

const roleLabels: Record<Role, string> = {
    member: "Member",
    organizer: "Organizer",
    super_admin: "Super Admin",
};

export function RoleSelector({ userId, currentRole, currentUserId }: RoleSelectorProps) {
    const [isPending, startTransition] = useTransition();
    const isSelf = userId === currentUserId;

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newRole = e.target.value as Role;
        if (newRole === currentRole) return;

        startTransition(async () => {
            try {
                await updateUserRole(userId, newRole);
                toast.success(`Role updated to ${roleLabels[newRole]}`);
            } catch {
                toast.error("Failed to update role");
            }
        });
    };

    return (
        <select
            defaultValue={currentRole}
            onChange={handleChange}
            disabled={isPending || isSelf}
            title={isSelf ? "Cannot change your own role" : undefined}
            className="rounded-lg border border-border bg-background px-2 py-1 text-xs font-medium text-foreground transition-colors hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50"
        >
            <option value="member">Member</option>
            <option value="organizer">Organizer</option>
            <option value="super_admin">Super Admin</option>
        </select>
    );
}
