import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "TariffMapper — China ↔ Indonesia Customs Classification",
  description:
    "AI-powered tariff code mapping between China (CCC) and Indonesia (BTKI/AHTN). Search by product description, HS code, or local code to find top matches with confidence scores and explanations.",
  keywords: [
    "tariff code",
    "HS code",
    "customs classification",
    "China Indonesia trade",
    "BTKI",
    "CCC",
    "AHTN",
    "import export",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={jetbrainsMono.variable}>
      <body className={inter.className} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
