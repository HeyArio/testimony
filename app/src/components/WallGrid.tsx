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
    <p className="mt-4 text-center">
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

function Empty() {
  return <p className="py-10 text-center text-ink/60">{fa.wall.empty}</p>;
}

/** Masonry layout — the default wall. */
export function WallGrid({ testimonials, brandColor, showBadge }: WallProps) {
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
      <Badge show={showBadge} />
    </div>
  );
}

/** Horizontal scroll-snap carousel — compact strip for landing pages. */
export function WallCarousel({ testimonials, brandColor, showBadge }: WallProps) {
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
      <Badge show={showBadge} />
    </div>
  );
}
