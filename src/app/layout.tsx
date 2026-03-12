import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "FaithEvents — Community Event Platform",
    template: "%s | FaithEvents",
  },
  description:
    "Manage and discover meaningful community and faith-based events. Register, connect, and grow together.",
  keywords: ["faith", "community", "events", "church", "worship", "retreat"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster
            position="bottom-right"
            richColors
            expand
            toastOptions={{
              style: {
                fontFamily: "'DM Sans', sans-serif",
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
