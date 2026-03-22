import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { sql } from 'drizzle-orm';

// Determine base URL dynamically
const getBaseURL = () => {
  // In production, use NEXT_PUBLIC_APP_URL or VERCEL_URL
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  
  // Vercel provides VERCEL_URL automatically
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  // Fallback to localhost for development
  return 'http://localhost:3000';
};

const baseURL = getBaseURL();

console.log('[Better Auth] Base URL:', baseURL);
console.log('[Better Auth] VERCEL_URL:', process.env.VERCEL_URL);
console.log('[Better Auth] NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL);

export const auth = betterAuth({
  baseURL,
  database: drizzleAdapter(db, {
    provider: 'pg',
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
    requireEmailVerification: false,
  },
  user: {
    additionalFields: {
      institutionId: { type: 'string', required: false },
      role: { type: 'string', required: false, defaultValue: 'docente' },
      isSuperAdmin: { type: 'boolean', required: false, defaultValue: false },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  // Don't validate origins - let all requests through
  trustedOrigins: [],
  plugins: [
    {
      id: 'lazy-registration',
      hooks: {
        before: [
          {
            matcher(context: any) {
              return context.path === '/sign-in/email';
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
                // 2. If no user, check if staff exists with this email and DNI (password)
                const [staff] = await db
                  .select()
                  .from(schema.staff)
                  .where(
                    sql`${schema.staff.email} = ${email} AND ${schema.staff.dni} = ${password}`
                  )
                  .limit(1);

                if (staff) {
                  // 3. Staff exists, so we create their Better Auth account seamlessly
                  try {
                    console.log(
                      `[Lazy Registration] Creating account for staff: ${email}`
                    );
                    // Use internal API to hash password and set up accounts perfectly
                    await auth.api.signUpEmail({
                      body: {
                        email: staff.email!,
                        password: password,
                        name: staff.name,
                        institutionId: staff.institutionId,
                        role: staff.role || 'docente',
                      } as any,
                    });
                    console.log(
                      `[Lazy Registration] Account created successfully for: ${email}`
                    );
                  } catch (err) {
                    console.error(
                      `[Lazy Registration] Error creating account for ${email}:`,
                      err
                    );
                    // Let it continue; the next step (actual sign-in) will fail normally
                  }
                } else {
                  console.log(`[Lazy Registration] No staff found for: ${email}`);
                }
              }

              // Let the normal sign-in proceed (which will succeed if we just created them!)
              return;
            },
          },
        ],
      },
    },
  ] as any[],
});

export type Auth = typeof auth;
