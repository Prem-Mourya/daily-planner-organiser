"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, makeSessionToken, authSecret } from "@/lib/session";

export type LoginState = { error: string | null };

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const configured = process.env.APP_PASSWORD;
  if (!configured) redirect("/"); // auth disabled — nothing to check

  const password = String(formData.get("password") ?? "");
  if (password !== configured) return { error: "Incorrect password." };

  const token = await makeSessionToken(authSecret()!);
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  redirect("/");
}

export async function logout() {
  cookies().delete(SESSION_COOKIE);
  redirect("/login");
}
