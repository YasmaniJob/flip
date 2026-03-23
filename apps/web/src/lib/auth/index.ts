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
  if (process.env.BETTER_AUTH_URL) {
    return process.env.BETTER_AUTH_URL;
  }
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

// Build trusted origins list
const trustedOrigins = [baseURL];
// Add www variant if not already included
if (!baseURL.includes('www.')) {
  trustedOrigins.push(baseURL.replace('https://', 'https://www.'));
}

console.log("[Better Auth] Base URL:", baseURL);
console.log("[Better Auth] Trusted Origins:", trustedOrigins);
console.log(
  "[Better Auth] NEXT_PUBLIC_REQUIRE_EMAIL_VERIFICATION:",
  requireEmailVerification,
);

export const auth = betterAuth({
  baseURL,
  trustedOrigins,
  advanced: {
    cookieOptions: {
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      httpOnly: true,
    },
    crossSubDomainCookies: {
      enabled: false,
    },
    disableCSRFCheck: process.env.NODE_ENV === "production", // Disable CSRF in production (Vercel handles this)
  },
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
    async sendResetPassword({
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
              try {
                const body = c.body as unknown as Record<string, any>;
                if (!body || !body.email || !body.password) {
                  console.log("[Lazy Registration] Missing email or password in request");
                  return;
                }

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
                  } else {
                    console.log(
                      `[Lazy Registration] No staff found for: ${email}`,
                    );
                  }
                } else {
                  console.log(
                    `[Lazy Registration] User already exists: ${email}`,
                  );
                }
              } catch (err) {
                console.error(
                  `[Lazy Registration] Hook error:`,
                  err,
                );
                // Don't throw - let the normal login flow continue
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
