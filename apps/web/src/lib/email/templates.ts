export function verificationEmailTemplate(
  verificationUrl: string,
  userName: string,
  userEmail: string,
): string {
  const firstName = userName?.split(" ")[0] || "Usuario";

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verifica tu cuenta en Flip</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background-color: #f3f4f6;
    }
    .email-container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .email-card {
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid #e5e7eb;
    }
    .email-header {
      background: linear-gradient(135deg, #0052cc 0%, #0065ff 100%);
      padding: 32px 24px;
      text-align: center;
    }
    .email-logo {
      font-size: 28px;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: -0.5px;
    }
    .email-body { padding: 32px 24px; }
    .email-title {
      font-size: 24px;
      font-weight: 700;
      color: #111827;
      margin-bottom: 8px;
      text-align: center;
    }
    .email-subtitle {
      font-size: 14px;
      color: #6b7280;
      text-align: center;
      margin-bottom: 24px;
    }
    .email-content { font-size: 15px; color: #374151; margin-bottom: 24px; }
    .email-content p { margin-bottom: 16px; }
    .email-content ul { margin: 16px 0; padding-left: 24px; }
    .email-content li { margin-bottom: 8px; }
    .cta-button {
      display: inline-block;
      background-color: #0052cc;
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 15px;
      text-align: center;
      margin: 16px 0;
    }
    .cta-button:hover { background-color: #0043a8; }
    .warning-box {
      background-color: #fef3c7;
      border: 1px solid #fcd34d;
      border-radius: 6px;
      padding: 16px;
      margin: 16px 0;
      font-size: 13px;
      color: #92400e;
    }
    .warning-box strong { display: block; margin-bottom: 4px; }
    .link-fallback {
      font-size: 12px;
      color: #6b7280;
      word-break: break-all;
      margin-top: 16px;
      padding: 12px;
      background-color: #f3f4f6;
      border-radius: 4px;
    }
    .email-footer {
      background-color: #f9fafb;
      padding: 24px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
    }
    .email-footer p { font-size: 12px; color: #9ca3af; margin-bottom: 8px; }
    .email-footer a { color: #0052cc; text-decoration: none; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-card">
      <div class="email-header">
        <div class="email-logo">Flip</div>
      </div>
      
      <div class="email-body">
        <h1 class="email-title">¡Bienvenido a Flip!</h1>
        <p class="email-subtitle">Confirma tu dirección de correo electrónico para continuar</p>
        
        <div class="email-content">
          <p>Hola <strong>${firstName}</strong>,</p>
          <p>Gracias por registrarte en <strong>Flip</strong>, la plataforma de gestión de inventario educativo.</p>
          <p>Para completar tu registro y comenzar a usar la plataforma, necesitas verificar tu dirección de correo electrónico.</p>
          
          <div class="warning-box">
            <strong>Importante:</strong>
            Este enlace de verificación expira en 24 horas.
          </div>
          
          <p>Una vez verificado, podrás:</p>
          <ul>
            <li>Gestionar el inventario de tu institución</li>
            <li>Administrar préstamos de equipos</li>
            <li>Controlar el mantenimiento de recursos</li>
          </ul>
        </div>
        
        <div style="text-align: center;">
          <a href="${verificationUrl}" class="cta-button">Verificar mi cuenta</a>
        </div>
        
        <div class="link-fallback">
          Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
          <a href="${verificationUrl}">${verificationUrl}</a>
        </div>
      </div>
      
      <div class="email-footer">
        <p>Si no creaste una cuenta en Flip, puedes ignorar este correo.</p>
        <p>Este correo fue enviado a ${userEmail}</p>
        <p>&copy; ${new Date().getFullYear()} Flip. Todos los derechos reservados.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export function resetPasswordTemplate(
  resetUrl: string,
  userName: string,
  userEmail: string,
): string {
  const firstName = userName?.split(" ")[0] || "Usuario";

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Restablece tu contraseña en Flip</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background-color: #f3f4f6;
    }
    .email-container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .email-card {
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid #e5e7eb;
    }
    .email-header {
      background: linear-gradient(135deg, #0052cc 0%, #0065ff 100%);
      padding: 32px 24px;
      text-align: center;
    }
    .email-logo {
      font-size: 28px;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: -0.5px;
    }
    .email-body { padding: 32px 24px; }
    .email-title {
      font-size: 24px;
      font-weight: 700;
      color: #111827;
      margin-bottom: 8px;
      text-align: center;
    }
    .email-subtitle {
      font-size: 14px;
      color: #6b7280;
      text-align: center;
      margin-bottom: 24px;
    }
    .email-content { font-size: 15px; color: #374151; margin-bottom: 24px; }
    .email-content p { margin-bottom: 16px; }
    .cta-button {
      display: inline-block;
      background-color: #0052cc;
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 15px;
      text-align: center;
      margin: 16px 0;
    }
    .cta-button:hover { background-color: #0043a8; }
    .warning-box {
      background-color: #fef3c7;
      border: 1px solid #fcd34d;
      border-radius: 6px;
      padding: 16px;
      margin: 16px 0;
      font-size: 13px;
      color: #92400e;
    }
    .warning-box strong { display: block; margin-bottom: 4px; }
    .link-fallback {
      font-size: 12px;
      color: #6b7280;
      word-break: break-all;
      margin-top: 16px;
      padding: 12px;
      background-color: #f3f4f6;
      border-radius: 4px;
    }
    .email-footer {
      background-color: #f9fafb;
      padding: 24px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
    }
    .email-footer p { font-size: 12px; color: #9ca3af; margin-bottom: 8px; }
    .email-footer a { color: #0052cc; text-decoration: none; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-card">
      <div class="email-header">
        <div class="email-logo">Flip</div>
      </div>
      
      <div class="email-body">
        <h1 class="email-title">Restablecer contraseña</h1>
        <p class="email-subtitle">Solicitaste restablecer tu contraseña</p>
        
        <div class="email-content">
          <p>Hola <strong>${firstName}</strong>,</p>
          <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en <strong>Flip</strong>.</p>
          
          <div class="warning-box">
            <strong>Importante:</strong>
            Este enlace expira en <strong>1 hora</strong> por razones de seguridad.
          </div>
          
          <p>Si no solicitaste este cambio, puedes ignorar este correo. Tu contraseña actual seguirá siendo válida.</p>
          <p>Después de restablecer tu contraseña, podrás iniciar sesión con tu nueva credencial.</p>
        </div>
        
        <div style="text-align: center;">
          <a href="${resetUrl}" class="cta-button">Restablecer mi contraseña</a>
        </div>
        
        <div class="link-fallback">
          Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
          <a href="${resetUrl}">${resetUrl}</a>
        </div>
      </div>
      
      <div class="email-footer">
        <p>Nunca compartas tu contraseña con terceros.</p>
        <p>Este correo fue enviado a ${userEmail}</p>
        <p>&copy; ${new Date().getFullYear()} Flip. Todos los derechos reservados.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}
