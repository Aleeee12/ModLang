import type { Metadata } from "next";
import "./globals.css";
import BetaBanner from "@/app/components/modlang/BetaBanner";

export const metadata: Metadata = {
  title: "ModLang Free (BETA)",
  description:
    "Automatic Minecraft mod translator (BETA). It may contain errors. A human translation will always be more accurate.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <BetaBanner />
        {children}
      </body>
    </html>
  );
}