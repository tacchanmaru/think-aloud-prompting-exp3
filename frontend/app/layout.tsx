import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import { AuthProvider } from "./contexts/AuthContext";
import { TimerProvider } from "./contexts/TimerContext";

const inter = Inter({ subsets: ['latin'] });

// eslint-disable-next-line react-refresh/only-export-components
export const metadata: Metadata = {
    title: "Memos App",
    description: "A simple note-taking app with voice transcription.",
    manifest: "/manifest.json",
    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "Memos App",
    },
};

// eslint-disable-next-line react-refresh/only-export-components
export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    themeColor: "#121212",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="ja">
            <head>
                <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
                <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192x192.png" />
                <link rel="apple-touch-icon" sizes="512x512" href="/icons/icon-512x512.png" />
            </head>
            <body className={inter.className}>
                <AuthProvider>
                    <TimerProvider>
                        <main>{children}</main>
                    </TimerProvider>
                </AuthProvider>
            </body>
        </html>
    );
} 