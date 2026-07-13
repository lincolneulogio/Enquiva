import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { redirectIfAccountDisabled } from "@/lib/auth/redirect-if-disabled";
import { PublicHeader } from "@/components/shared/PublicHeader";

/** Historial de asistente para cualquier rol (staff incluida). */
export default async function AttendeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let session;
  try {
    session = await auth.api.getSession({ headers: await headers() });
  } catch {
    redirect("/login");
  }

  if (!session?.user) {
    redirect("/login");
  }
  await redirectIfAccountDisabled(session.user);

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
