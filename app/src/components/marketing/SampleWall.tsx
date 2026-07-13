import { fa } from "@/i18n/fa";
import { brand } from "@/config/brand";

// Static sample testimonial cards used on the home page and inside the /demo
// browser frame. CSS-drawn video "posters" (silhouette + karaoke subtitle
// line + play button) so no media assets are needed. Themeable: the demo
// frame passes the fictional customer's brand color to show that the widget
// adopts *their* brand, not ours.

export type SampleVideo = {
  quote: string;
  karaoke: readonly string[];
  name: string;
  role: string;
  duration: string;
  rating?: number;
};
export type SampleText = { body: string; name: string; role: string; rating?: number };

export type SampleTheme = {
  brandName: string;
  brandColor: string; // stars on light cards, avatar chips
  highlight: string; // karaoke highlight + stars on dark video cards
  glow: string; // rgba() radial glow behind the person
  tints: readonly string[]; // person silhouette colors, cycled
};

const GAVAH_THEME: SampleTheme = {
  brandName: fa.common.appName,
  brandColor: "#B03A48",
  highlight: "#D98E4F",
  glow: "rgba(176,58,72,.22)",
  tints: ["#6E4A55", "#755059", "#61414C"],
};

function Stars({ n = 5, color }: { n?: number; color: string }) {
  return (
    <span className="text-[13px] tracking-[2px]" style={{ color }}>
      {"★".repeat(n)}
    </span>
  );
}

export function SampleVideoCard({ video: v, theme, i }: { video: SampleVideo; theme: SampleTheme; i: number }) {
  const tint = theme.tints[i % theme.tints.length];
  return (
    <article className="break-inside-avoid overflow-hidden rounded-card bg-ink shadow-[0_10px_28px_rgba(58,32,40,.16)]">
      {/* video poster */}
      <div className="relative aspect-[3/4] overflow-hidden">
        <div
          className="absolute inset-0"
          style={{ background: `radial-gradient(ellipse 95% 60% at 50% 72%, ${theme.glow}, transparent 72%)` }}
        />
        {/* person silhouette, clipped to the poster */}
        <div className="absolute inset-x-0 bottom-0 flex h-[58%] flex-col items-center">
          <div className="aspect-square w-[34%] rounded-full" style={{ background: tint }} />
          <div
            className="mt-[4%] w-[74%] flex-1"
            style={{ borderRadius: "48% 48% 0 0 / 90% 90% 0 0", background: tint }}
          />
        </div>
        {/* brand chip — the business's brand, like on real rendered clips */}
        <span className="absolute start-3 top-3 flex items-center gap-1.5 rounded-full bg-black/35 px-2.5 py-1 backdrop-blur-[2px]">
          <span className="h-2 w-2 rounded-[3px]" style={{ background: theme.highlight }} />
          <span className="text-[10.5px] font-bold text-white/90">{theme.brandName}</span>
        </span>
        {/* play button */}
        <span className="absolute inset-0 m-auto flex h-11 w-11 items-center justify-center rounded-full bg-white/95 shadow-[0_6px_18px_rgba(0,0,0,.35)]">
          <span className="h-0 w-0 translate-x-[1px] border-y-[7px] border-y-transparent border-l-[11px] border-l-ink" />
        </span>
        {/* bottom scrim + karaoke subtitle line */}
        <div className="absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute inset-x-0 bottom-8 flex flex-wrap items-baseline justify-center gap-x-1.5 px-3">
          {v.karaoke.map((w, wi) => (
            <span
              className="text-[13.5px] font-extrabold"
              key={w + wi}
              style={{
                color: wi === 1 ? theme.highlight : "#FFFFFF",
                textShadow: "0 1px 6px rgba(0,0,0,.5)",
                animation: "gvWord 3.4s linear infinite",
                animationDelay: `${wi * 0.35}s`,
              }}
            >
              {w}
            </span>
          ))}
        </div>
        <span className="absolute bottom-2.5 end-3 rounded-md bg-black/45 px-1.5 py-0.5 font-mono text-[10.5px] text-white/85">
          {v.duration}
        </span>
      </div>
      {/* caption */}
      <div className="px-4 pb-4 pt-3">
        <p className="text-sm font-bold leading-fa text-white">{v.quote}</p>
        <div className="mt-2.5 flex items-center justify-between gap-2">
          <div className="text-[12px] text-white/60">
            <span className="font-bold text-white/85">{v.name}</span> · {v.role}
          </div>
          <Stars color={theme.highlight} n={v.rating ?? 5} />
        </div>
      </div>
    </article>
  );
}

export function SampleTextCard({ text: c, theme }: { text: SampleText; theme: SampleTheme }) {
  return (
    <article className="break-inside-avoid rounded-card border border-hairline bg-card p-5">
      <Stars color={theme.brandColor} n={c.rating ?? 5} />
      <p className="my-3 text-[14px] leading-fa">{c.body}</p>
      <div className="flex items-center gap-2.5">
        <span
          className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full text-sm font-extrabold text-white"
          style={{ background: theme.brandColor }}
        >
          {c.name[0]}
        </span>
        <div className="leading-tight">
          <div className="text-[13px] font-bold">{c.name}</div>
          <div className="mt-0.5 text-[11.5px] text-ink/50">{c.role}</div>
        </div>
      </div>
    </article>
  );
}

function GavahBadge() {
  return <p className="mt-5 text-center text-xs font-bold text-ink/45">{brand.badgeTextFa}</p>;
}

type CardsProps = {
  videos: readonly SampleVideo[];
  texts: readonly SampleText[];
  theme: SampleTheme;
  withBadge?: boolean;
};

/** Masonry layout — mirrors the real /w/[slug] widget. */
export function SampleCardsWall({ videos, texts, theme, withBadge = false }: CardsProps) {
  return (
    <div>
      <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 [&>article]:mb-4">
        <SampleVideoCard i={0} theme={theme} video={videos[0]} />
        <SampleTextCard text={texts[0]} theme={theme} />
        <SampleTextCard text={texts[1]} theme={theme} />
        <SampleVideoCard i={1} theme={theme} video={videos[1]} />
        <SampleTextCard text={texts[2]} theme={theme} />
        <SampleVideoCard i={2} theme={theme} video={videos[2]} />
      </div>
      {withBadge && <GavahBadge />}
    </div>
  );
}

/** Horizontal scroll-snap strip — mirrors the real /w/[slug]/carousel widget. */
export function SampleCardsCarousel({ videos, texts, theme, withBadge = false }: CardsProps) {
  return (
    <div>
      <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [&>article]:w-[240px] [&>article]:shrink-0 [&>article]:snap-start">
        <SampleVideoCard i={0} theme={theme} video={videos[0]} />
        <SampleTextCard text={texts[0]} theme={theme} />
        <SampleVideoCard i={1} theme={theme} video={videos[1]} />
        <SampleTextCard text={texts[1]} theme={theme} />
        <SampleVideoCard i={2} theme={theme} video={videos[2]} />
        <SampleTextCard text={texts[2]} theme={theme} />
      </div>
      {withBadge && <GavahBadge />}
    </div>
  );
}

/** The home-page sample: Gavah's own wall, in Gavah's brand. */
export function SampleWall() {
  const t = fa.marketing.sampleWall;
  return <SampleCardsWall texts={t.texts} theme={GAVAH_THEME} videos={t.videos} />;
}
