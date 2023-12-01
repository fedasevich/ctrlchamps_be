type Certificate = {
  name: string;
  certificateId: string;
  link: string;
  dateIssued: string;
  expirationDate: string;
};

type WorkExperience = {
  workplace: string;
  qualifications: string;
  startDate: string;
  endDate: string;
};

export type DetailedCaregiverInfo = {
  id: string;
  hourlyRate: number;
  firstName: string;
  lastName: string;
  isOpenToSeekerHomeLiving: boolean;
  numberOfAppointments: number;
  description: string;
  videoLink: string;
  services: string[];
  certificates: Certificate[];
  workExperiences: WorkExperience[];
};
