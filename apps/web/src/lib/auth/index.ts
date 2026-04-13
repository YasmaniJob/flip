import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { sendResetPasswordEmail } from "@/lib/email/resend";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    async sendResetPassword({ user, url }) {
      await sendResetPasswordEmail(user.email, url, user.name);
    },
  },
  session: {
    cookieCache: {
      enabled: false,
    },
  },
  advanced: {
    cookiePrefix: "better-auth",
    useSecureCookies: process.env.NODE_ENV === "production",
  },
  plugins: [
    nextCookies(),
  ],
  user: {
    additionalFields: {
      institutionId: { type: "string", required: false },
      dni: { type: "string", required: false },
      role: { type: "string", required: false, defaultValue: "docente" },
      isSuperAdmin: { type: "boolean", required: false, defaultValue: false },
    },
  },
});

export type Auth = typeof auth;
