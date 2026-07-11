import type { Metadata } from "next";
import "vazirmatn/Vazirmatn-font-face.css";
import "./globals.css";
import { brand } from "@/config/brand";
import { fa } from "@/i18n/fa";

export const metadata: Metadata = {
  title: brand.nameFa,
  description: fa.landing.heroBody,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html dir="rtl" lang="fa">
      <body>{children}</body>
    </html>
  );
}
