#!/usr/bin/env node
// Seed a demo project with Persian testimonials so there's something to show
// before real customers exist. Run on the VPS (or locally) after a deploy:
//
//   node scripts/seed-demo.mjs                    # demo user/project + text testimonials
//   node scripts/seed-demo.mjs --videos ~/demo-videos   # + ingest mock videos
//   node scripts/seed-demo.mjs --reset            # wipe the demo project's testimonials first
//
// Video files (mp4/mov/webm) are normalized to browser-safe H.264 MP4 with
// ffmpeg, stored like real uploads, and a transcribe job is queued — the
// worker then produces the transcript, thumbnail, and rendered clip.
// Uses the app's own Prisma client + bcryptjs (run after `npm ci` in app/).

import { createRequire } from "module";
import { spawnSync } from "child_process";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const APP_DIR = path.join(ROOT, "app");
const require = createRequire(path.join(APP_DIR, "package.json"));

// ---- env (PrismaClient needs DATABASE_URL; plain node doesn't load .env) ----
const envFile = path.join(APP_DIR, ".env");
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, "utf8").split("\n")) {
    if (line.trim().startsWith("#")) continue;
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!m) continue;
    let v = m[2];
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (!(m[1] in process.env)) process.env[m[1]] = v;
  }
}

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const db = new PrismaClient();

const MEDIA_DIR = process.env.GAVAH_MEDIA_DIR || "/var/lib/gavah/media";
const LOCAL_STORAGE = !process.env.R2_ACCOUNT_ID;

const DEMO_EMAIL = "demo@gavah.local";
const DEMO_PASSWORD = "demo1234";
const DEMO_SLUG = "cafe-gandom"; // keep in sync with app/src/lib/demo.ts
// Roasted-coffee brown, deliberately NOT Gavah's crimson: the live demo on
// the marketing site should show the widget wearing the *customer's* brand.
const DEMO_BRAND_COLOR = "#7A4E2D";
const CONSENT = "نمونه‌ی دمو — توسط مالک پروژه اضافه شده است.";

// Fictional café + fictional people. All content is invented demo copy.
const TEXTS = [
  { name: "سارا محمدی", role: "مشتری ثابت", rating: 5, status: "approved",
    text: "قهوه‌شون فوق‌العاده‌ست و فضای کافه برای کار و قرارهای کاری عالیه. تقریباً هر هفته اینجام و هر بار حس خونه رو دارم." },
  { name: "امیر رضایی", role: "طراح گرافیک", rating: 5, status: "approved",
    text: "بهترین لاته‌ای که تو این محله خوردم. پرسنل واقعاً حرفه‌ای و خوش‌برخوردن؛ جای دنجی هم برای کار پیدا می‌شه." },
  { name: "نگار کریمی", role: "دانشجو", rating: 4, status: "approved",
    text: "قیمت‌ها منصفانه‌ست و کیک هویجش معرکه‌ست! فقط آخر هفته‌ها یه کم شلوغ می‌شه." },
  { name: "حمید توکلی", role: "مدیر استارتاپ", rating: 5, status: "approved",
    text: "جلسه‌های تیم‌مون رو همیشه اینجا برگزار می‌کنیم. اینترنت پرسرعت، قهوه‌ی خوب و محیط آروم — دیگه چی می‌خوایم؟" },
  { name: "مریم احدی", role: "نویسنده", rating: 5, status: "approved",
    text: "صبح‌هام با یه فنجون قهوه‌ی گندم شروع می‌شه. عطر قهوه‌ی تازه‌شون از سر کوچه معلومه!" },
  { name: "علی شفیعی", role: "عکاس", rating: 4, status: "approved",
    text: "نور طبیعی و دکور کافه برای عکاسی عالیه. چند بار از منو و فضا عکاسی کردم و نتیجه همیشه درخشان بوده." },
  { name: "رویا جعفری", role: "مشتری", rating: 5, status: "pending",
    text: "با معرفی یکی از دوستام اومدم و الان دیگه پام گیر شده! چای ماسالاش رو حتماً امتحان کنید." },
];

const VIDEO_AUTHORS = [
  { name: "نرگس موسوی", role: "مشتری" },
  { name: "کیان صادقی", role: "مشتری ثابت" },
  { name: "پریسا نادری", role: "مدیر محصول" },
  { name: "بهنام علوی", role: "فریلنسر" },
  { name: "لیلا رستمی", role: "معلم" },
];

function arg(flag) {
  const i = process.argv.indexOf(flag);
  return i === -1 ? null : process.argv[i + 1] || null;
}

function ffmpeg(args) {
  const proc = spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", ...args], {
    stdio: ["ignore", "inherit", "inherit"],
  });
  if (proc.status !== 0) throw new Error(`ffmpeg failed (exit ${proc.status})`);
}

async function main() {
  // ---- demo user + project -------------------------------------------------
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const user = await db.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {},
    create: { email: DEMO_EMAIL, passwordHash, name: "دمو گواه" },
  });
  const project = await db.project.upsert({
    where: { slug: DEMO_SLUG },
    // pro: no badge on the wall, HD clip renders
    update: { plan: "pro", brandColor: DEMO_BRAND_COLOR },
    create: { userId: user.id, name: "کافه گندم", slug: DEMO_SLUG, plan: "pro", brandColor: DEMO_BRAND_COLOR },
  });

  if (process.argv.includes("--reset")) {
    const old = await db.testimonial.findMany({ where: { projectId: project.id } });
    if (LOCAL_STORAGE) {
      for (const t of old) {
        for (const key of [t.videoKey, t.thumbKey, t.clipKey]) {
          if (key) fs.rmSync(path.join(MEDIA_DIR, key), { force: true });
        }
      }
    }
    await db.testimonial.deleteMany({ where: { projectId: project.id } });
    console.log(`reset: removed ${old.length} testimonial(s)`);
  }

  // ---- text testimonials (skip if the project already has some) ------------
  const existing = await db.testimonial.count({ where: { projectId: project.id } });
  if (existing === 0) {
    for (const t of TEXTS) {
      await db.testimonial.create({
        data: {
          projectId: project.id,
          type: "text",
          status: t.status,
          authorName: t.name,
          authorRole: t.role,
          rating: t.rating,
          text: t.text,
          consentText: CONSENT,
          consentAt: new Date(),
        },
      });
    }
    console.log(`seeded ${TEXTS.length} text testimonials`);
  } else {
    console.log(`project already has ${existing} testimonial(s) — skipping text seed (use --reset to start over)`);
  }

  // ---- mock videos ----------------------------------------------------------
  const videosDir = arg("--videos");
  if (videosDir) {
    if (!LOCAL_STORAGE) {
      console.error("R2 is configured — record/upload through the app instead of ingesting from disk.");
      process.exit(1);
    }
    const files = fs
      .readdirSync(videosDir)
      .filter((f) => /\.(mp4|mov|m4v|webm)$/i.test(f))
      .sort();
    if (files.length === 0) {
      console.log(`no video files found in ${videosDir}`);
    }
    let i = (await db.testimonial.count({ where: { projectId: project.id, type: "video" } })) % VIDEO_AUTHORS.length;
    for (const f of files) {
      const src = path.join(videosDir, f);
      const isWebm = /\.webm$/i.test(f);
      const key = `videos/${crypto.randomUUID()}.${isWebm ? "webm" : "mp4"}`;
      const dest = path.join(MEDIA_DIR, key);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      if (isWebm) {
        fs.copyFileSync(src, dest);
      } else {
        // Normalize to H.264/AAC MP4 — phone videos are often HEVC, which
        // browsers won't play; this guarantees the wall can play the raw video.
        console.log(`transcoding ${f} -> h264 mp4 ...`);
        ffmpeg(["-i", src, "-c:v", "libx264", "-preset", "veryfast", "-crf", "21",
                "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", "-y", dest]);
      }
      const author = VIDEO_AUTHORS[i++ % VIDEO_AUTHORS.length];
      await db.testimonial.create({
        data: {
          projectId: project.id,
          type: "video",
          status: "approved",
          authorName: author.name,
          authorRole: author.role,
          rating: 5,
          videoKey: key,
          consentText: CONSENT,
          consentAt: new Date(),
          jobs: { create: { kind: "transcribe" } },
        },
      });
      console.log(`ingested ${f} as ${author.name} (transcribe job queued)`);
    }
    if (files.length > 0) {
      console.log("\nthe worker will transcribe + render clips in the background;");
      console.log("watch progress with: pm2 logs gavah-worker");
    }
  }

  console.log(`
────────────────────────────────────────────
 demo ready:
   wall (public):    /wall/${DEMO_SLUG}
   collect (public): /r/${DEMO_SLUG}
   dashboard login:  ${DEMO_EMAIL} / ${DEMO_PASSWORD}
────────────────────────────────────────────`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
