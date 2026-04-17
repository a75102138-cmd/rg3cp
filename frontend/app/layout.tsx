import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/providers/auth-provider";
import { QueryProvider } from "@/providers/query-provider";
import { ProjectProvider } from "@/providers/project-context";
import { AppToaster } from "@/components/providers/app-toaster";
import { TooltipProvider } from "@/providers/tooltip-provider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: {
    default: "G3C — Pilotage patrimoine",
    template: "%s · G3C",
  },
  description:
    "Plateforme de pilotage documentaire et opérationnel pour la restauration du patrimoine (G3C).",
  icons: {
    icon: "/branding/g3c.jpg",
    apple: "/branding/g3c.jpg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      {/* suppressHydrationWarning: extensions (password managers, etc.) inject attrs on body/divs — not app bugs */}
      <body
        className={`${inter.variable} ${mono.variable} min-h-screen font-sans antialiased`}
        suppressHydrationWarning
      >
        <QueryProvider>
          <AuthProvider>
            <ProjectProvider>
              <TooltipProvider>
                {children}
                <AppToaster />
              </TooltipProvider>
            </ProjectProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
