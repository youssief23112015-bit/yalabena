import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
}

/**
 * Transactional email service (SMTP via nodemailer).
 *
 * NOTE: nodemailer is a new dependency. Run `npm install` after copying.
 * If nodemailer or SMTP_HOST is missing, emails are logged to the console
 * (dry-run) so the rest of the application keeps working.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: any = null;

  constructor(private readonly config: ConfigService) {
    let nodemailer: any = null;
    try {
      // Lazy require so the app still boots before `npm install` adds the package.
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      nodemailer = require('nodemailer');
    } catch {
      this.logger.warn('nodemailer is not installed. Emails will be logged only. Run: npm install nodemailer');
      return;
    }

    const host = this.config.get<string>('SMTP_HOST');
    if (!host) {
      this.logger.warn('SMTP_HOST is not configured. Emails will be logged only (dry-run).');
      return;
    }

    const port = Number(this.config.get<string>('SMTP_PORT', '587'));
    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: this.config.get<string>('SMTP_USER')
        ? {
            user: this.config.get<string>('SMTP_USER'),
            pass: this.config.get<string>('SMTP_PASS'),
          }
        : undefined,
    });
  }

  async send(options: SendEmailOptions): Promise<void> {
    const from = this.config.get<string>('SMTP_FROM', 'noreply@speakup-academy.com');
    const recipients = Array.isArray(options.to) ? options.to.join(', ') : options.to;

    if (this.transporter) {
      await this.transporter.sendMail({ from, ...options });
      this.logger.log(`Email sent to ${recipients}: ${options.subject}`);
      return;
    }

    this.logger.log(`[EMAIL-DRY-RUN] to=${recipients} subject=${options.subject}`);
  }
}
