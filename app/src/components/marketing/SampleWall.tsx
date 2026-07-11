import { fa } from "@/i18n/fa";

// Static sample "wall of love" used on the home page and /demo — CSS-drawn
// video cards (person silhouette + play button) so no media assets needed.

const t = fa.marketing.sampleWall;
const TINTS = ["#6E4A55", "#755059", "#61414C"];
const GLOWS = ["rgba(176,58,72,.2)", "rgba(217,142,79,.16)", "rgba(176,58,72,.2)"];
const AVATARS = ["#D98E4F", "#B03A48", "#6E4A55"];

function VideoCard({ i }: { i: number }) {
  const v = t.videos[i];
  return (
    <div className="mb-4 break-inside-avoid overflow-hidden rounded-card bg-ink">
      <div
        className="relative"
        style={{
          aspectRatio: "4/4.2",
          background: `radial-gradient(ellipse 90% 55% at 50% 80%, ${GLOWS[i]}, transparent 70%)`,
        }}
      >
        <div className="absolute bottom-[-6%] left-1/2 w-[64%] -translate-x-1/2">
          <div className="mx-auto aspect-square w-[36%] rounded-full" style={{ background: TINTS[i] }} />
          <div
            className="mx-auto mt-[5%] w-[88%]"
            style={{ aspectRatio: "2/1.1", borderRadius: "48% 48% 0 0 / 80% 80% 0 0", background: TINTS[i] }}
          />
        </div>
        <span className="absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-lg">
          <span className="ml-1 h-0 w-0 border-y-8 border-y-transparent border-r-[12px] border-r-ink" />
        </span>
        <span className="absolute bottom-2.5 left-3 font-mono text-[11px] text-white/65">{v.duration}</span>
      </div>
      <div className="px-4 pb-4 pt-3.5">
        <div className="text-sm font-bold text-white">{v.quote}</div>
        <div className="mt-2 text-[12.5px] text-[#C2A3A9]">
          {v.name} · {v.role}
        </div>
      </div>
    </div>
  );
}

function TextCard({ i }: { i: number }) {
  const c = t.texts[i];
  return (
    <div className="mb-4 break-inside-avoid rounded-card border border-hairline bg-card p-5">
      <div className="text-[13.5px] tracking-[2px] text-accent">★★★★★</div>
      <p className="my-3 text-[14.5px] leading-fa">{c.body}</p>
      <div className="flex items-center gap-2.5">
        <span
          className="flex h-[34px] w-[34px] items-center justify-center rounded-full text-sm font-extrabold text-white"
          style={{ background: AVATARS[i] }}
        >
          {c.name[0]}
        </span>
        <div>
          <div className="text-[13.5px] font-bold">{c.name}</div>
          <div className="text-xs text-[#9B8288]">{c.role}</div>
        </div>
      </div>
    </div>
  );
}

export function SampleWall({ wide = false }: { wide?: boolean }) {
  return (
    <div className={wide ? "columns-1 gap-4 sm:columns-2 lg:columns-4" : "columns-1 gap-4 sm:columns-2 lg:columns-3"}>
      <VideoCard i={0} />
      <TextCard i={0} />
      <TextCard i={1} />
      <VideoCard i={1} />
      <TextCard i={2} />
      <VideoCard i={2} />
    </div>
  );
}
