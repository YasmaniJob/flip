import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { sql } from "drizzle-orm";
import {
  sendVerificationEmail,
  sendResetPasswordEmail,
} from "@/lib/email/resend";

// Determine base URL dynamically
const getBaseURL = () => {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
};

const baseURL = getBaseURL();

const requireEmailVerification =
  process.env.NEXT_PUBLIC_REQUIRE_EMAIL_VERIFICATION === "true";

console.log("[Better Auth] Base URL:", baseURL);
console.log(
  "[Better Auth] NEXT_PUBLIC_REQUIRE_EMAIL_VERIFICATION:",
  requireEmailVerification,
);

export const auth = betterAuth({
  baseURL,
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
    minPasswordLength: 6,
    requireEmailVerification,
    async sendVerificationEmail({
      user,
      url,
    }: {
      user: { email: string; name?: string };
      url: string;
    }) {
      try {
        const result = await sendVerificationEmail(user.email, url, user.name);
        if (!result.success) {
          console.error(
            "[Better Auth] Failed to send verification email:",
            result.error,
          );
        }
      } catch (err) {
        console.error(
          "[Better Auth] Exception sending verification email:",
          err,
        );
      }
    },
    async sendResetPasswordEmail({
      user,
      url,
    }: {
      user: { email: string; name?: string };
      url: string;
    }) {
      try {
        const result = await sendResetPasswordEmail(user.email, url, user.name);
        if (!result.success) {
          console.error(
            "[Better Auth] Failed to send reset password email:",
            result.error,
          );
        }
      } catch (err) {
        console.error(
          "[Better Auth] Exception sending reset password email:",
          err,
        );
      }
    },
  },
  user: {
    additionalFields: {
      institutionId: { type: "string", required: false },
      role: { type: "string", required: false, defaultValue: "docente" },
      isSuperAdmin: { type: "boolean", required: false, defaultValue: false },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  plugins: [
    {
      id: "lazy-registration",
      hooks: {
        before: [
          {
            matcher(context: any) {
              return context.path === "/sign-in/email";
            },
            handler: async (c: any) => {
              const body = c.body as unknown as Record<string, any>;
              if (!body || !body.email || !body.password) return;

              const email = body.email.toString();
              const password = body.password.toString();

              // 1. Check if user already exists
              const [user] = await db
                .select()
                .from(schema.users)
                .where(sql`${schema.users.email} = ${email}`)
                .limit(1);

              if (!user) {
                // 2. Check if staff exists with this email and DNI
                const [staff] = await db
                  .select()
                  .from(schema.staff)
                  .where(
                    sql`${schema.staff.email} = ${email} AND ${schema.staff.dni} = ${password}`,
                  )
                  .limit(1);

                if (staff) {
                  try {
                    console.log(
                      `[Lazy Registration] Creating account for staff: ${email}`,
                    );
                    await auth.api.signUpEmail({
                      body: {
                        email: staff.email!,
                        password: password,
                        name: staff.name,
                        institutionId: staff.institutionId,
                        role: staff.role || "docente",
                      } as any,
                    });
                    console.log(
                      `[Lazy Registration] Account created successfully for: ${email}`,
                    );
                  } catch (err) {
                    console.error(
                      `[Lazy Registration] Error creating account for ${email}:`,
                      err,
                    );
                  }
                } else {
                  console.log(
                    `[Lazy Registration] No staff found for: ${email}`,
                  );
                }
              }
              return;
            },
          },
        ],
      },
    },
  ] as any[],
});

export type Auth = typeof auth;
