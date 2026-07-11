// Single source of truth for branding. "Gavah" is a working name — renaming
// the product must only require changes to this file.

export const brand = {
  nameFa: "گواه",
  nameEn: "Gavah",
  taglineFa: "گواهی مشتری‌های راضی‌ات را جمع کن",
  badgeTextFa: "ساخته‌شده با گواه",
  colors: {
    ink: "#3A2028",
    primary: "#B03A48",
    primaryDark: "#8E2E3A",
    accent: "#D98E4F",
    bg: "#FAF0ED",
    card: "#FFFFFF",
    hairline: "#F0DBD4",
  },
  defaultBrandColor: "#B03A48",
} as const;

export function appUrl(): string {
  return process.env.APP_URL || "http://localhost:3000";
}
