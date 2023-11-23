import { MailDataRequired } from '@sendgrid/mail';

export interface SendGridEmail extends Omit<MailDataRequired, 'from'> {
  to: string;
  templateId: string;
}
