import cookieSession from "cookie-session";
import type { RequestHandler } from "express";

export const session: RequestHandler = cookieSession({
  name: "session",
  keys: [process.env.APP_SECRET_KEY ?? "default-secret"],
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  sameSite: "lax",
  secure: true,
  httpOnly: true,
});
