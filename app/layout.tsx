import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "AI Security Engineer",
    description: "Learn about public WiFi security through interactive gameplay",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
