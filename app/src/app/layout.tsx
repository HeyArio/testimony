import type { Metadata } from "next";
import Script from "next/script";
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
      <body>
        {children}
        {/* Scroll-reveal driver for [data-reveal] (see globals.css). Adds
            .gv-motion only when JS runs and the user allows motion, so the
            hidden initial state can never eat content. MutationObserver
            keeps it working across client-side navigations. */}
        <Script id="gv-reveal" strategy="afterInteractive">
          {`(function () {
            if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
            document.documentElement.classList.add("gv-motion");
            var io = new IntersectionObserver(
              function (entries) {
                entries.forEach(function (e) {
                  if (e.isIntersecting) {
                    e.target.classList.add("gv-in");
                    io.unobserve(e.target);
                  }
                });
              },
              { rootMargin: "0px 0px -8% 0px" }
            );
            function scan() {
              document.querySelectorAll("[data-reveal]:not([data-gv-obs])").forEach(function (el) {
                el.setAttribute("data-gv-obs", "1");
                io.observe(el);
              });
            }
            scan();
            new MutationObserver(scan).observe(document.documentElement, { childList: true, subtree: true });
          })();`}
        </Script>
      </body>
    </html>
  );
}
