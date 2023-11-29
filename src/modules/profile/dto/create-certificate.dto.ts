import { IsArray, IsNotEmpty } from 'class-validator';

import { CertificateItem } from './certificate.dto';

export class CreateCertificatesDto {
  @IsArray()
  @IsNotEmpty()
  certificates: CertificateItem[];
}
