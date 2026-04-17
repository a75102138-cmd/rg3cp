import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Resend } from 'resend';

type SendInvitationEmailParams = {
  email: string;
  firstName: string;
  invitationLink: string;
};

@Injectable()
export class InvitationMailService {
  private readonly logger = new Logger(InvitationMailService.name);
  private readonly resend: Resend | null;
  private readonly smtpTransporter: nodemailer.Transporter | null;
  private readonly fromEmail: string;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('RESEND_API_KEY');
    this.fromEmail =
      this.config.get<string>('MAIL_FROM_EMAIL') ??
      this.config.get<string>('RESEND_FROM_EMAIL') ??
      'noreply@example.com';
    this.resend = apiKey ? new Resend(apiKey) : null;

    const smtpHost = this.config.get<string>('SMTP_HOST');
    const smtpPort = Number(this.config.get<string>('SMTP_PORT') ?? '587');
    const smtpUser = this.config.get<string>('SMTP_USER');
    const smtpPass = this.config.get<string>('SMTP_PASS');
    const smtpSecure = (this.config.get<string>('SMTP_SECURE') ?? 'false').toLowerCase() === 'true';
    this.smtpTransporter =
      smtpHost && smtpUser && smtpPass
        ? nodemailer.createTransport({
            host: smtpHost,
            port: Number.isFinite(smtpPort) ? smtpPort : 587,
            secure: smtpSecure,
            auth: { user: smtpUser, pass: smtpPass },
          })
        : null;
  }

  async sendInvitationEmail(params: SendInvitationEmailParams) {
    const { email, firstName, invitationLink } = params;
    const subject = 'Invitation - Activez votre compte';
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111;">
        <h2>Bonjour ${firstName},</h2>
        <p>Votre compte a été créé. Cliquez sur le lien ci-dessous pour définir votre mot de passe et activer votre compte.</p>
        <p><a href="${invitationLink}">Activer mon compte</a></p>
        <p>Ce lien expire automatiquement dans 7 jours.</p>
      </div>
    `;

    if (this.smtpTransporter) {
      await this.smtpTransporter.sendMail({
        from: this.fromEmail,
        to: email,
        subject,
        html,
      });
      this.logger.log(`Invitation email sent via SMTP to ${email}`);
      return;
    }

    if (this.resend) {
      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject,
        html,
      });

      if (error) {
        this.logger.error(`Resend invitation failed: ${error.message}`);
        throw new InternalServerErrorException(
          `Envoi email invitation échoué: ${error.message}`,
        );
      }

      this.logger.log(`Invitation email queued via Resend for ${email} (id: ${data?.id ?? 'n/a'})`);
      return;
    }

    this.logger.error('No email provider configured (SMTP or Resend).');
    throw new InternalServerErrorException('Service email non configuré');
  }
}
