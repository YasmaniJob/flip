import { Resend } from "resend";

// Lazy initialization - only create Resend client when actually needed
let resendInstance: Resend | null = null;

function getResendClient(): Resend {
  if (!resendInstance) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY is not configured. Please add it to your environment variables.");
    }
    resendInstance = new Resend(apiKey);
  }
  return resendInstance;
}

const FROM_EMAIL = process.env.EMAIL_FROM || "onboarding@resend.dev";
const IS_DEV = process.env.NODE_ENV === "development";

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: SendEmailOptions): Promise<{ success: boolean; error?: string }> {
  try {
    if (IS_DEV) {
      console.log("\n📧 [Resend] Email Sent (DEV MODE)");
      console.log("─".repeat(50));
      console.log(`To:     ${to}`);
      console.log(`From:   ${FROM_EMAIL}`);
      console.log(`Subject: ${subject}`);
      console.log("─".repeat(50));
      console.log("HTML Preview (first 500 chars):");
      console.log(html.substring(0, 500) + "...\n");
      return { success: true };
    }

    const { data, error } = await getResendClient().emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
      text,
    });

    if (error) {
      console.error("[Resend] Error sending email:", error);
      return { success: false, error: error.message };
    }

    console.log("[Resend] Email sent successfully:", data?.id);
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[Resend] Exception sending email:", message);
    return { success: false, error: message };
  }
}

export async function sendVerificationEmail(
  to: string,
  url: string,
  userName?: string,
  userEmail?: string,
): Promise<{ success: boolean; error?: string }> {
  const { verificationEmailTemplate } = await import("./templates");

  const emailTo = userEmail || to;
  const html = verificationEmailTemplate(url, userName || "Usuario", emailTo);

  return sendEmail({
    to: emailTo,
    subject: "Verifica tu cuenta en Flip",
    html,
    text: `Hola${userName ? ` ${userName}` : ""},

Gracias por registrarte en Flip. Por favor verifica tu cuenta haciendo clic en el siguiente enlace:

${url}

Si no solicitaste este correo, puedes ignorarlo.

Saludos,
El equipo de Flip`,
  });
}

export async function sendResetPasswordEmail(
  to: string,
  url: string,
  userName?: string,
  userEmail?: string,
): Promise<{ success: boolean; error?: string }> {
  const { resetPasswordTemplate } = await import("./templates");

  const emailTo = userEmail || to;
  const html = resetPasswordTemplate(url, userName || "Usuario", emailTo);

  return sendEmail({
    to: emailTo,
    subject: "Restablece tu contraseña en Flip",
    html,
    text: `Hola${userName ? ` ${userName}` : ""},

Solicitaste restablecer tu contraseña. Haz clic en el siguiente enlace:

${url}

Si no solicitaste este correo, puedes ignorarlo. El enlace expira en 1 hora.

Saludos,
El equipo de Flip`,
  });
}
