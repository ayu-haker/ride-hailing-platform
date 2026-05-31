import { FactoryProvider, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface MailTransport {
  sendMail(options: { to: string; subject: string; html: string; from?: string }): Promise<any>;
}

function createMailTransport(config: ConfigService): MailTransport {
  const logger = new Logger('MailProvider');

  const host = config.get<string>('SMTP_HOST');
  const port = config.get<number>('SMTP_PORT', 587);
  const user = config.get<string>('SMTP_USER');
  const pass = config.get<string>('SMTP_PASS');
  const from = config.get<string>('SMTP_FROM', 'noreply@ridehailing.com');

  if (host && user && pass) {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
    return {
      async sendMail(options) {
        return transporter.sendMail({ from: options.from || from, ...options });
      },
    };
  }

  logger.warn('SMTP not configured, using mock mail transport');
  return {
    async sendMail(options) {
      logger.log(`[Mail Mock] To: ${options.to}, Subject: ${options.subject}`);
      return { messageId: `mock-${Date.now()}`, accepted: [options.to] };
    },
  };
}

export const MAIL_TRANSPORT = 'MAIL_TRANSPORT';

export const mailProvider: FactoryProvider = {
  provide: MAIL_TRANSPORT,
  inject: [ConfigService],
  useFactory: (config: ConfigService): MailTransport => createMailTransport(config),
};
