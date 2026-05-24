import Link from "next/link";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { normalizeRole } from "@/lib/auth/rbac";
import { getI18n } from "@/lib/i18n/server";
import { PublicMobileMenu } from "@/components/shared/PublicMobileMenu";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

function getDashboardPath(role?: string | null) {
  const normalizedRole = normalizeRole(role);
  if (normalizedRole === "organizer") return "/organizer";
  if (normalizedRole === "admin" || normalizedRole === "super_admin")
    return "/admin";
  return "/member";
}

function getProfilePath(role?: string | null) {
  return `${getDashboardPath(role)}/profile`;
}

export async function PublicHeader() {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session?.user;
  const { t } = await getI18n();
  const dashboardPath = getDashboardPath(user?.role);

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-center gap-2.5">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
              <span className="text-lg text-primary-foreground">✦</span>
            </div>
            <span className="font-display text-lg font-semibold text-foreground sm:text-xl">
              EncuentroDeFe
            </span>
          </Link>
          <a
            href={process.env.NEXT_PUBLIC_DOCS_URL || "http://localhost:3001"}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-xs font-semibold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/25 hover:scale-105 active:scale-95 transition-all px-2.5 py-0.5 rounded-full select-none"
          >
            Docs
          </a>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <PublicMobileMenu
            browseLabel={t("common.browseEvents")}
            primaryHref={user ? dashboardPath : "/register"}
            primaryLabel={
              user ? t("common.goToDashboard") : t("common.getStarted")
            }
            secondaryHref={user ? undefined : "/login"}
            secondaryLabel={user ? undefined : t("common.signIn")}
          />
        </div>

        <div className="hidden items-center gap-6 md:flex">
          <ThemeToggle />

          <Link
            href="/events"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {t("common.browseEvents")}
          </Link>

          {user ? (
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-card/45 p-1 pl-1.5 pr-1.5  shadow-sm transition-all duration-300 hover:bg-card/90 hover:border-primary/20 hover:shadow-md backdrop-blur-sm">
              {/* User Avatar */}
              <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-xs select-none">
                {user.image ? (
                  <img
                    src={user.image}
                    alt={user.name ?? ""}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span>
                    {user.name
                      ? user.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()
                      : "U"}
                  </span>
                )}
              </div>

              {/* User Details */}
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-bold text-foreground leading-tight max-w-[140px] truncate">
                  {user.name}
                </span>
                <span className="text-[10px] text-muted-foreground leading-none max-w-[140px] truncate mt-0.5">
                  {user.email}
                </span>
              </div>

              {/* Go to Dashboard Button */}
              <Link
                href={dashboardPath}
                className="rounded-xl bg-primary px-3 py-2 text-xs font-bold text-primary-foreground transition-all duration-300 hover:bg-primary/95 shadow-sm hover:scale-101 shrink-0"
              >
                {t("common.goToDashboard")}
              </Link>
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {t("common.signIn")}
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                {t("common.getStarted")}
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
