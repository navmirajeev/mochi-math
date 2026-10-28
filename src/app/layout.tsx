
import type { Metadata } from "next";
import "@fontsource/press-start-2p/400.css";
import "@fontsource/space-mono/400.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mochi Math | A Tiny Universe of Numbers",
  description:
    "A cozy retro math desktop with a working scientific calculator, handy formulas and more little tools for curious minds.",
  applicationName: "Mochi Math",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
