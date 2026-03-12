import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Trip PWA",
    template: "%s · Trip PWA"
  },
  description: "Mobile-first trip tracking prototype (PWA-ready).",
  applicationName: "Trip PWA",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Trip PWA"
  },
  formatDetection: {
    telephone: false
  },
  manifest: "/manifest.webmanifest"
};

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full">
        <div className="min-h-dvh px-4 py-5">
          <div className="mx-auto w-full max-w-[420px]">
            <div className="rounded-3xl bg-zinc-900/60 ring-1 ring-white/10 shadow-card backdrop-blur">
              <div className="px-4 py-5">{children}</div>
            </div>
            <p className="mt-4 text-center text-xs text-zinc-400">
              Prototype UI · optimized for mobile
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}

