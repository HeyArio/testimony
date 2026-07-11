import crypto from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import type { User } from "@prisma/client";
import { db } from "@/lib/db";

// Hand-rolled sessions: opaque random ID in an httpOnly cookie, row in the
// Session table (see CLAUDE.md — no OAuth, email+password only).

const COOKIE_NAME = "gavah_session";
const SESSION_DAYS = 30;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string): Promise<void> {
  const id = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await db.session.create({ data: { id, userId, expiresAt } });
  cookies().set(COOKIE_NAME, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession(): Promise<void> {
  const id = cookies().get(COOKIE_NAME)?.value;
  if (id) {
    await db.session.deleteMany({ where: { id } });
  }
  cookies().delete(COOKIE_NAME);
}

export async function getSessionUser(): Promise<User | null> {
  const id = cookies().get(COOKIE_NAME)?.value;
  if (!id) return null;
  const session = await db.session.findUnique({ where: { id }, include: { user: true } });
  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await db.session.delete({ where: { id } }).catch(() => {});
    return null;
  }
  return session.user;
}

/** For pages/APIs that require auth; redirects to /login when signed out. */
export async function requireUser(): Promise<User> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}
