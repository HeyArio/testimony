import type { Testimonial } from "@prisma/client";
import { publicUrl } from "@/lib/r2";
import { brand, appUrl } from "@/config/brand";
import { fa } from "@/i18n/fa";

// Renders approved testimonials only. All user text goes through JSX text
// nodes — never innerHTML — because this markup ends up on other people's
// sites via the embed iframe.

type WallProps = {
  testimonials: Testimonial[];
  brandColor: string;
  showBadge: boolean;
  /** Public collect page URL; renders a "leave yours" CTA when set. */
  collectUrl?: string | null;
};

function WallCard({ testimonial: t, brandColor }: { testimonial: Testimonial; brandColor: string }) {
  return (
    <article className="card break-inside-avoid">
      {t.type === "video" && t.videoKey && (
        <video
          className="mb-3 w-full rounded-card bg-ink"
          controls
          poster={t.thumbKey ? publicUrl(t.thumbKey) : undefined}
          preload="none"
          src={publicUrl(t.videoKey)}
        />
      )}
      {t.text && <p className="whitespace-pre-wrap text-sm leading-fa">{t.text}</p>}
      <footer className="mt-3 flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-black">{t.authorName}</p>
          {t.authorRole && <p className="text-xs text-ink/60">{t.authorRole}</p>}
        </div>
        {t.rating != null && (
          <span className="text-sm" style={{ color: brandColor }}>
            {"★".repeat(t.rating)}
          </span>
        )}
      </footer>
    </article>
  );
}

function Badge({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <p className="text-center">
      <a
        className="text-xs font-bold text-ink/50 hover:text-primary"
        href={appUrl()}
        rel="noopener noreferrer"
        target="_blank"
      >
        {brand.badgeTextFa}
      </a>
    </p>
  );
}

/** CTA into the collect page + free-plan badge, under both layouts. */
function WallFooter({ collectUrl, brandColor, showBadge }: Pick<WallProps, "collectUrl" | "brandColor" | "showBadge">) {
  if (!collectUrl && !showBadge) return null;
  return (
    <div className="mt-4 flex flex-col items-center gap-2.5">
      {collectUrl && (
        <a
          className="rounded-full px-5 py-2 text-sm font-bold text-white transition-opacity hover:opacity-85"
          href={collectUrl}
          rel="noopener noreferrer"
          style={{ background: brandColor }}
          target="_blank"
        >
          {fa.wall.cta}
        </a>
      )}
      <Badge show={showBadge} />
    </div>
  );
}

function Empty() {
  // The embed background is transparent — keep the empty state on a card so
  // it stays readable on any host page.
  return <p className="card py-8 text-center text-ink/60">{fa.wall.empty}</p>;
}

/** Masonry layout — the default wall. */
export function WallGrid({ testimonials, brandColor, showBadge, collectUrl }: WallProps) {
  return (
    <div>
      {testimonials.length === 0 ? (
        <Empty />
      ) : (
        <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 [&>article]:mb-4">
          {testimonials.map((t) => (
            <WallCard brandColor={brandColor} key={t.id} testimonial={t} />
          ))}
        </div>
      )}
      <WallFooter brandColor={brandColor} collectUrl={collectUrl} showBadge={showBadge} />
    </div>
  );
}

/** Horizontal scroll-snap carousel — compact strip for landing pages. */
export function WallCarousel({ testimonials, brandColor, showBadge, collectUrl }: WallProps) {
  return (
    <div>
      {testimonials.length === 0 ? (
        <Empty />
      ) : (
        <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [&>article]:w-[300px] [&>article]:shrink-0 [&>article]:snap-start">
          {testimonials.map((t) => (
            <WallCard brandColor={brandColor} key={t.id} testimonial={t} />
          ))}
        </div>
      )}
      <WallFooter brandColor={brandColor} collectUrl={collectUrl} showBadge={showBadge} />
    </div>
  );
}
