import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
    private readonly logger = new Logger(MailService.name);
    private readonly transporter: nodemailer.Transporter;
    private readonly from: string;
    private readonly frontendUrl: string;

    constructor(private readonly config: ConfigService) {
        this.from = config.get<string>('MAIL_FROM', 'Grimório <noreply@grimorio.app>');
        this.frontendUrl = config.get<string>('FRONTEND_URL', 'http://localhost:5173');

        this.transporter = nodemailer.createTransport({
            host: config.get<string>('MAIL_HOST', 'smtp.gmail.com'),
            port: config.get<number>('MAIL_PORT', 587),
            secure: false,
            auth: {
                user: config.get<string>('MAIL_USER'),
                pass: config.get<string>('MAIL_PASS'),
            },
        });
    }

    // ─── Envio base ──────────────────────────────────────────────

    private async send(options: nodemailer.SendMailOptions): Promise<void> {
        try {
            await this.transporter.sendMail({ from: this.from, ...options });
            this.logger.log(`Email enviado para ${options.to}`);
        } catch (err) {
            this.logger.error(`Falha ao enviar email para ${options.to}`, err);
            throw err;
        }
    }

    // ─── Confirmação de email ─────────────────────────────────────

    async sendEmailConfirmation(
        to: string,
        name: string,
        token: string,
    ): Promise<void> {
        const link = `${this.frontendUrl}/confirm-email?token=${token}`;

        await this.send({
            to,
            subject: 'Confirme seu email — Grimório',
            html: this.templateEmailConfirmation(name, link),
        });
    }

    // ─── Reset de senha ───────────────────────────────────────────

    async sendPasswordReset(
        to: string,
        name: string,
        token: string,
    ): Promise<void> {
        const link = `${this.frontendUrl}/reset-password?token=${token}`;

        await this.send({
            to,
            subject: 'Redefinir senha — Grimório',
            html: this.templatePasswordReset(name, link),
        });
    }

    // ─── Templates ───────────────────────────────────────────────

    private templateBase(title: string, content: string): string {
        return `
<!DOCTYPE html>
<html lang="pt-br">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#171C24;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#171C24;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0"
          style="max-width:560px;background:#1E2430;border-radius:8px;
                 border:1px solid rgba(218,165,32,0.2);overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="padding:32px;text-align:center;
                       border-bottom:1px solid rgba(218,165,32,0.15);">
              <h1 style="margin:0;color:#DAA520;font-size:24px;
                         letter-spacing:0.05em;font-weight:600;">
                ✦ Grimório
              </h1>
              <p style="margin:8px 0 0;color:#7A7260;font-size:13px;">
                Dungeons &amp; Dragons 5.5e
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:40px 32px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 32px;text-align:center;
                       border-top:1px solid rgba(218,165,32,0.15);">
              <p style="margin:0;color:#7A7260;font-size:12px;line-height:1.6;">
                Você está recebendo este email porque realizou uma ação em sua conta Grimório.<br>
                Se não foi você, ignore este email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
    }

    private templateEmailConfirmation(name: string, link: string): string {
        const content = `
      <h2 style="margin:0 0 16px;color:#CEC4B2;font-size:20px;font-weight:600;">
        Confirme seu email
      </h2>
      <p style="margin:0 0 12px;color:#7A7260;font-size:15px;line-height:1.7;">
        Olá, <strong style="color:#CEC4B2;">${name}</strong>.
      </p>
      <p style="margin:0 0 32px;color:#7A7260;font-size:15px;line-height:1.7;">
        Clique no botão abaixo para confirmar seu email e ativar sua conta.
        Este link expira em <strong style="color:#CEC4B2;">24 horas</strong>.
      </p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center">
            <a href="${link}"
               style="display:inline-block;padding:14px 32px;
                      background:#DAA520;color:#171C24;
                      text-decoration:none;border-radius:6px;
                      font-size:15px;font-weight:600;
                      letter-spacing:0.02em;">
              Confirmar Email
            </a>
          </td>
        </tr>
      </table>
      <p style="margin:32px 0 0;color:#534A2E;font-size:12px;
                text-align:center;word-break:break-all;">
        Ou acesse: ${link}
      </p>`;

        return this.templateBase('Confirme seu email', content);
    }

    private templatePasswordReset(name: string, link: string): string {
        const content = `
      <h2 style="margin:0 0 16px;color:#CEC4B2;font-size:20px;font-weight:600;">
        Redefinir senha
      </h2>
      <p style="margin:0 0 12px;color:#7A7260;font-size:15px;line-height:1.7;">
        Olá, <strong style="color:#CEC4B2;">${name}</strong>.
      </p>
      <p style="margin:0 0 32px;color:#7A7260;font-size:15px;line-height:1.7;">
        Recebemos uma solicitação para redefinir a senha da sua conta.
        Este link expira em <strong style="color:#CEC4B2;">1 hora</strong>.
      </p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center">
            <a href="${link}"
               style="display:inline-block;padding:14px 32px;
                      background:#DAA520;color:#171C24;
                      text-decoration:none;border-radius:6px;
                      font-size:15px;font-weight:600;
                      letter-spacing:0.02em;">
              Redefinir Senha
            </a>
          </td>
        </tr>
      </table>
      <p style="margin:32px 0 0;color:#534A2E;font-size:12px;
                text-align:center;word-break:break-all;">
        Ou acesse: ${link}
      </p>`;

        return this.templateBase('Redefinir senha', content);
    }
}