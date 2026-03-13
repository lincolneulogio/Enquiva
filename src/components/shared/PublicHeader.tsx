import Link from "next/link";

export function PublicHeader() {
    return (
        <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
                <Link href="/" className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
                        <span className="text-lg text-primary-foreground">✦</span>
                    </div>
                    <span className="font-display text-xl font-semibold text-foreground">
                        FaithEvents
                    </span>
                </Link>
                <div className="hidden items-center gap-6 md:flex">
                    <Link href="/events" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                        Browse Events
                    </Link>
                    <Link href="/login" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                        Sign In
                    </Link>
                    <Link
                        href="/register"
                        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                        Get Started
                    </Link>
                </div>
            </div>
        </nav>
    );
}
