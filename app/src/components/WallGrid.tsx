import type { Testimonial } from "@prisma/client";
import { publicUrl } from "@/lib/r2";
import { brand, appUrl } from "@/config/brand";
import { fa } from "@/i18n/fa";

// Renders approved testimonials only. All user text goes through JSX text
// nodes — never innerHTML — because this markup ends up on other people's
// sites via the embed iframe.

type Props = {
  testimonials: Testimonial[];
  brandColor: string;
  showBadge: boolean;
};

export function WallGrid({ testimonials, brandColor, showBadge }: Props) {
  return (
    <div>
      {testimonials.length === 0 ? (
        <p className="py-10 text-center text-ink/60">{fa.wall.empty}</p>
      ) : (
        <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
          {testimonials.map((t) => (
            <article className="card mb-4 break-inside-avoid" key={t.id}>
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
          ))}
        </div>
      )}
      {showBadge && (
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
      )}
    </div>
  );
}
