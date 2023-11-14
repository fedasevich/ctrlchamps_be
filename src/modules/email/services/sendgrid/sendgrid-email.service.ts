import { Inject, Injectable } from '@nestjs/common';

import { ClientResponse, MailDataRequired, MailService } from '@sendgrid/mail';

import { IEmailService } from '../../interfaces/email-service.interface';

@Injectable()
export class SendGridEmailService
  implements
    IEmailService<MailDataRequired, [ClientResponse, Record<string, never>]>
{
  constructor(@Inject(MailService) private mailService: MailService) {}

  async sendEmail(
    mail: MailDataRequired,
  ): Promise<[ClientResponse, Record<string, never>]> {
    const transport = await this.mailService.send(mail);

    return transport;
  }
}
