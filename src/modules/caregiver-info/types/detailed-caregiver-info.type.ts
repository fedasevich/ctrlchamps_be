import { Certificate } from 'src/common/entities/certificate.entity';
import { WorkExperience } from 'src/common/entities/work-experience.entity';
import { Qualification } from 'src/common/enums/qualification.enum';

export type DetailedCaregiverInfo = {
  id: string;
  firstName: string;
  lastName: string;
  isOpenToSeekerHomeLiving: boolean;
  numberOfAppointments: number;
  caregiverInfo: {
    description: string;
    hourlyRate: number;
    videoLink: string;
    services: Qualification[];
  };
  qualifications: Certificate[];
  workExperiences: WorkExperience[];
};
